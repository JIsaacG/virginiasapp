<?php
/**
 * bootstrap.php — Núcleo compartido de la mini-API del panel CEEVS.
 *
 * Estado general del servidor (en ../server-data/, gitignored, protegido con
 * .htaccess y además con guardas <?php exit; ?> en los archivos sensibles):
 *  - site-config.json  → configuración publicada del sitio (pública, la sirve config.php)
 *  - admin-user.php    → cuenta del administrador (correo + hashes, nunca texto plano)
 *  - login-guard.php   → contador de intentos fallidos (bloqueo por IP y global)
 *  - audit-log.php     → bitácora de movimientos del panel
 *  - correo-config.php → credenciales SMTP privadas (se crea desde la plantilla)
 *
 * Las solicitudes de admisión son la excepción: preinscripciones-lib.php las
 * guarda fuera de public_html, en el directorio privado asignado en Hostinger.
 *
 * OJO: la carpeta data/ del repo es OTRA cosa (JSON públicos del sitio:
 * comunicados, juegos, etc.) — no usarla aquí.
 *
 * Seguridad aplicada:
 *  - Login con correo + contraseña (hash bcrypt, comparación a tiempo constante).
 *  - Bloqueo progresivo por IP y bloqueo global tras muchos fallos (persistente,
 *    no depende de la cookie de sesión del atacante).
 *  - Sesión endurecida: strict mode, cookie HttpOnly/SameSite, regeneración de ID,
 *    huella del navegador, expiración por inactividad y absoluta.
 *  - Token CSRF obligatorio en toda escritura autenticada (header X-CEEVS-CSRF).
 *  - Verificación de origen (Sec-Fetch-Site + header Origin).
 *  - Recuperación de contraseña: código por correo (15 min) o clave maestra.
 */

declare(strict_types=1);

/* La API solo debe responder JSON. Un aviso de PHP impreso en medio (por
   ejemplo, un POST que se pasa de post_max_size) rompe la respuesta, filtra
   rutas del servidor y —al haber salida antes de tiempo— impide fijar el código
   HTTP correcto. Los errores se registran, no se muestran. */
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
@ini_set('log_errors', '1');

/** Claves de configuración que el panel puede publicar (espejo de localStorage). */
const CEEVS_CONFIG_KEYS = array(
  'ceevs_images',
  'ceevs_image_settings',
  'ceevs_gallery',
  'ceevs_video_settings',
  'ceevs_hub_video',
  'ceevs_theme',
  'ceevs_inventory',
  'ceevs_mision_aula',
  'ceevs_comunicado'
);

define('CEEVS_DATA_DIR', dirname(__DIR__) . '/server-data');
define('CEEVS_UPLOADS_DIR', dirname(__DIR__) . '/uploads');
define('CEEVS_CONFIG_FILE', CEEVS_DATA_DIR . '/site-config.json');
define('CEEVS_USER_FILE', CEEVS_DATA_DIR . '/admin-user.php');
define('CEEVS_GUARD_FILE', CEEVS_DATA_DIR . '/login-guard.php');
define('CEEVS_AUDIT_FILE', CEEVS_DATA_DIR . '/audit-log.php');
define('CEEVS_MAIL_CONFIG_FILE', CEEVS_DATA_DIR . '/correo-config.php');

const CEEVS_MAX_VALUE_BYTES = 2000000;   // 2 MB por apartado de configuración
const CEEVS_MAX_UPLOAD_BYTES = 60000000; // 60 MB por archivo subido

/* Cuenta inicial del administrador. Solo se usa la PRIMERA vez (cuando aún no
   existe admin-user.php en el servidor). Aquí no hay contraseñas en texto
   plano: únicamente hashes bcrypt. */
const CEEVS_SEED_EMAIL = 'adminwebvs@gmail.com';
const CEEVS_SEED_PASS_HASH = '$2y$10$O6hiA/RhC.0ZLhY.RUYphueVdHtIZ5a8nlV0apCbpjHQGjWpPfksW';
const CEEVS_SEED_RECOVERY_HASH = '$2y$10$CgaP7TDOkX23y0UUCwN5HOTsgbnCRgSfH880cSzQJ8GSb97FUXohm';

const CEEVS_SESSION_IDLE_SECS = 7200;   // cierre por inactividad: 2 horas
const CEEVS_SESSION_MAX_SECS  = 43200;  // duración máxima de la sesión: 12 horas
const CEEVS_RESET_CODE_TTL    = 900;    // el código enviado por correo vale 15 min
const CEEVS_RESET_MAX_TRIES   = 5;      // intentos por código antes de invalidarlo

/* ─── Respuestas JSON ─── */

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function json_fail(string $msg, int $code = 400, array $extra = array()): void {
  json_out(array_merge(array('ok' => false, 'error' => $msg), $extra), $code);
}

/**
 * Cuerpo JSON de la petición.
 *
 * @param int $maxBytes Tope del cuerpo. 0 = sin tope (lo que necesita save.php,
 *   que publica la configuración entera con imágenes en base64). En los endpoints
 *   abiertos SIEMPRE hay que pasar un tope: sin él, un POST de decenas de MB se
 *   buffea y se decodifica, y eso basta para tumbar un hosting compartido.
 */
function read_json_body(int $maxBytes = 0): array {
  if ($maxBytes > 0) {
    // Corte barato antes de leer nada: si el cliente ya declaró que viene grande.
    $declarado = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($declarado > $maxBytes) {
      json_fail('La solicitud es demasiado grande.', 413);
    }
    $fh = fopen('php://input', 'rb');
    if ($fh === false) {
      return array();
    }
    // Se lee un byte de más: si llega, es que el cuerpo pasa del tope aunque
    // Content-Length dijera otra cosa.
    $raw = stream_get_contents($fh, $maxBytes + 1);
    fclose($fh);
    if ($raw !== false && strlen($raw) > $maxBytes) {
      json_fail('La solicitud es demasiado grande.', 413);
    }
  } else {
    $raw = file_get_contents('php://input');
  }

  $data = json_decode($raw === false ? '' : $raw, true);
  return is_array($data) ? $data : array();
}

/* ─── Carpetas protegidas ─── */

function ceevs_ensure_data_dir(): void {
  if (!is_dir(CEEVS_DATA_DIR)) {
    @mkdir(CEEVS_DATA_DIR, 0755, true);
  }
  $ht = CEEVS_DATA_DIR . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht, "Require all denied\n");
  }
}

function ceevs_ensure_uploads_dir(): void {
  if (!is_dir(CEEVS_UPLOADS_DIR)) {
    @mkdir(CEEVS_UPLOADS_DIR, 0755, true);
  }
  $ht = CEEVS_UPLOADS_DIR . '/.htaccess';
  if (!file_exists($ht)) {
    $rules = "Options -Indexes\n"
      . "<FilesMatch \"\\.(?i:php|phtml|php[0-9]|phps|cgi|pl|py|sh)$\">\n"
      . "  Require all denied\n"
      . "</FilesMatch>\n";
    @file_put_contents($ht, $rules);
  }
}

/* Archivos sensibles guardados como PHP: si el servidor los sirviera por error,
   el "<?php exit;" impide ver el contenido (defensa extra al .htaccess). */

function ceevs_read_guarded(string $file): ?array {
  if (!file_exists($file)) {
    return null;
  }
  $raw = @file_get_contents($file);
  if ($raw === false) {
    return null;
  }
  $pos = strpos($raw, "\n");
  $data = json_decode($pos === false ? '' : substr($raw, $pos + 1), true);
  return is_array($data) ? $data : null;
}

function ceevs_write_guarded(string $file, array $data): bool {
  ceevs_ensure_data_dir();
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    return false;
  }
  return @file_put_contents($file, "<?php exit; // CEEVS ?>\n" . $json, LOCK_EX) !== false;
}

/* ─── Cuenta del administrador ─── */

/** Devuelve la cuenta del administrador; la crea desde la semilla la primera vez. */
function ceevs_user(): array {
  $u = ceevs_read_guarded(CEEVS_USER_FILE);
  if (is_array($u) && !empty($u['email']) && !empty($u['hash'])) {
    return $u;
  }
  $u = array(
    'email'    => CEEVS_SEED_EMAIL,
    'hash'     => CEEVS_SEED_PASS_HASH,
    'recovery' => CEEVS_SEED_RECOVERY_HASH,
    'reset'    => null,
  );
  ceevs_write_guarded(CEEVS_USER_FILE, $u);
  return $u;
}

function ceevs_save_user(array $u): bool {
  return ceevs_write_guarded(CEEVS_USER_FILE, $u);
}

/** Clave legible sin caracteres ambiguos (sin 0/O, 1/I). */
function ceevs_random_code(int $chars, int $group = 4): string {
  $alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $out = '';
  for ($i = 0; $i < $chars; $i++) {
    if ($i > 0 && $group > 0 && $i % $group === 0) {
      $out .= '-';
    }
    $out .= $alpha[random_int(0, strlen($alpha) - 1)];
  }
  return $out;
}

/* ─── Cliente / origen ─── */

function ceevs_client_ip(): string {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  return is_string($ip) && $ip !== '' ? substr($ip, 0, 64) : 'desconocida';
}

/** Rechaza peticiones originadas en otros sitios (refuerzo del SameSite y del token CSRF). */
function ceevs_require_same_origin(): void {
  $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
  if ($site !== '' && $site !== 'same-origin' && $site !== 'none') {
    json_fail('Petición rechazada (origen no permitido).', 403);
  }
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin !== '' && strtolower($origin) !== 'null') {
    $oHost = parse_url($origin, PHP_URL_HOST);
    $hHost = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
    if (!is_string($oHost) || strcasecmp($oHost, $hHost) !== 0) {
      json_fail('Petición rechazada (origen no permitido).', 403);
    }
  }
}

/* ─── Sesión endurecida ─── */

function ceevs_session_start(): void {
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }
  @ini_set('session.use_strict_mode', '1');
  @ini_set('session.use_only_cookies', '1');
  session_name('CEEVSSESSID');
  session_set_cookie_params(array(
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  ));
  session_start();
}

function ceevs_browser_fp(): string {
  return hash('sha256', (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
}

/** Marca la sesión como autenticada y emite un token CSRF nuevo. */
function ceevs_session_login(string $email): void {
  session_regenerate_id(true);
  $_SESSION['ceevs_admin'] = true;
  $_SESSION['ceevs_email'] = $email;
  $_SESSION['ceevs_fp']    = ceevs_browser_fp();
  $_SESSION['ceevs_start'] = time();
  $_SESSION['ceevs_seen']  = time();
  $_SESSION['ceevs_csrf']  = bin2hex(random_bytes(32));
}

function ceevs_session_destroy(): void {
  $_SESSION = array();
  if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
  }
  if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
  }
}

function is_authed(): bool {
  ceevs_session_start();
  if (empty($_SESSION['ceevs_admin'])) {
    return false;
  }
  $now = time();
  $fp    = (string) ($_SESSION['ceevs_fp'] ?? '');
  $start = (int) ($_SESSION['ceevs_start'] ?? 0);
  $seen  = (int) ($_SESSION['ceevs_seen'] ?? 0);
  if (
    !hash_equals($fp, ceevs_browser_fp()) ||
    ($now - $start) > CEEVS_SESSION_MAX_SECS ||
    ($now - $seen) > CEEVS_SESSION_IDLE_SECS
  ) {
    ceevs_session_destroy();
    return false;
  }
  $_SESSION['ceevs_seen'] = $now;
  return true;
}

function require_auth(): void {
  ceevs_require_same_origin();
  if (!is_authed()) {
    json_fail('No autorizado. Inicia sesión en el panel.', 401);
  }
}

function ceevs_csrf_token(): string {
  return (string) ($_SESSION['ceevs_csrf'] ?? '');
}

/** Toda escritura autenticada debe traer el header X-CEEVS-CSRF de la sesión. */
function ceevs_require_csrf(): void {
  $sent = (string) ($_SERVER['HTTP_X_CEEVS_CSRF'] ?? '');
  $mine = ceevs_csrf_token();
  if ($mine === '' || $sent === '' || !hash_equals($mine, $sent)) {
    json_fail('Sesión inválida (token de seguridad). Recarga la página y entra de nuevo.', 403);
  }
}

/* ─── Freno anti fuerza bruta (persistente, por IP y global) ─── */

function ceevs_guard_load(): array {
  $g = ceevs_read_guarded(CEEVS_GUARD_FILE);
  if (!is_array($g)) {
    $g = array();
  }
  $g += array('ips' => array(), 'global' => array('f' => 0, 't' => 0), 'forgot' => array());
  // Limpieza: entradas sin actividad en 24 h.
  $now = time();
  foreach (array('ips', 'forgot') as $bucket) {
    foreach ($g[$bucket] as $ip => $rec) {
      if (($now - (int) ($rec['t'] ?? 0)) > 86400) {
        unset($g[$bucket][$ip]);
      }
    }
  }
  if (($now - (int) $g['global']['t']) > 86400) {
    $g['global'] = array('f' => 0, 't' => 0);
  }
  return $g;
}

function ceevs_guard_save(array $g): void {
  ceevs_write_guarded(CEEVS_GUARD_FILE, $g);
}

/** Segundos de bloqueo restantes para esta IP (0 = puede intentar). */
function ceevs_guard_locked(): int {
  $g = ceevs_guard_load();
  $now = time();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('f' => 0, 't' => 0);
  $f = (int) ($rec['f'] ?? 0);
  $t = (int) ($rec['t'] ?? 0);
  if ($f >= 5) {
    // Progresivo: 5º fallo = 1 min, se duplica en cada fallo, tope 1 hora.
    $lock = min(60 * (2 ** min($f - 5, 10)), 3600);
    if (($t + $lock) > $now) {
      return ($t + $lock) - $now;
    }
  }
  $gf = (int) $g['global']['f'];
  $gt = (int) $g['global']['t'];
  if ($gf >= 20 && ($gt + 900) > $now) {
    return ($gt + 900) - $now;
  }
  return 0;
}

function ceevs_guard_fail(): void {
  $g = ceevs_guard_load();
  $now = time();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('f' => 0, 't' => 0);
  // Racha nueva si el último fallo fue hace más de 30 min y no había bloqueo activo.
  if ((int) ($rec['f'] ?? 0) < 5 && ($now - (int) ($rec['t'] ?? 0)) > 1800) {
    $rec = array('f' => 0, 't' => 0);
  }
  $g['ips'][$ip] = array('f' => (int) $rec['f'] + 1, 't' => $now);
  if (($now - (int) $g['global']['t']) > 1800 && (int) $g['global']['f'] < 20) {
    $g['global'] = array('f' => 0, 't' => 0);
  }
  $g['global'] = array('f' => (int) $g['global']['f'] + 1, 't' => $now);
  ceevs_guard_save($g);
}

function ceevs_guard_clear(): void {
  $g = ceevs_guard_load();
  unset($g['ips'][ceevs_client_ip()]);
  ceevs_guard_save($g);
}

/** Límite de solicitudes de recuperación: 3 por IP cada 15 min. */
function ceevs_guard_forgot_allowed(): bool {
  $g = ceevs_guard_load();
  $now = time();
  $ip = ceevs_client_ip();
  $rec = $g['forgot'][$ip] ?? array('f' => 0, 't' => 0);
  if (($now - (int) ($rec['t'] ?? 0)) > 900) {
    $rec = array('f' => 0, 't' => 0);
  }
  if ((int) $rec['f'] >= 3) {
    return false;
  }
  $g['forgot'][$ip] = array('f' => (int) $rec['f'] + 1, 't' => $now);
  ceevs_guard_save($g);
  return true;
}

/* ─── Bitácora de movimientos ─── */

/**
 * Registra un movimiento en la bitácora del panel.
 * $action: clave corta (login_ok, config_saved, file_uploaded, …).
 * $detail: texto libre con el detalle del movimiento.
 */
function ceevs_audit(string $action, string $detail = '', bool $ok = true, ?string $who = null): void {
  ceevs_ensure_data_dir();
  if ($who === null && session_status() === PHP_SESSION_ACTIVE) {
    $who = (string) ($_SESSION['ceevs_email'] ?? '');
  }
  $entry = array(
    't'  => gmdate('c'),
    'a'  => $action,
    'ok' => $ok,
    'u'  => (string) $who,
    'ip' => ceevs_client_ip(),
    'ua' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 120),
    'd'  => substr($detail, 0, 500),
  );
  $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($line === false) {
    return;
  }
  // La bitácora es un .php con guarda en la primera línea (una entrada JSON por línea).
  if (!file_exists(CEEVS_AUDIT_FILE)) {
    @file_put_contents(CEEVS_AUDIT_FILE, "<?php exit; // CEEVS ?>\n", LOCK_EX);
  }
  @file_put_contents(CEEVS_AUDIT_FILE, $line . "\n", FILE_APPEND | LOCK_EX);
  // Rotación: si pasa de ~400 KB se conservan las últimas 1000 entradas.
  clearstatcache(true, CEEVS_AUDIT_FILE);
  $size = @filesize(CEEVS_AUDIT_FILE);
  if ($size !== false && $size > 400000) {
    $lines = ceevs_audit_lines();
    if (count($lines) > 1000) {
      $keep = array_slice($lines, -1000);
      @file_put_contents(CEEVS_AUDIT_FILE, "<?php exit; // CEEVS ?>\n" . implode("\n", $keep) . "\n", LOCK_EX);
    }
  }
}

/** Líneas JSON de la bitácora (sin la guarda PHP). */
function ceevs_audit_lines(): array {
  if (!file_exists(CEEVS_AUDIT_FILE)) {
    return array();
  }
  $lines = @file(CEEVS_AUDIT_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  if (!is_array($lines)) {
    return array();
  }
  return array_values(array_filter($lines, function ($l) {
    return strncmp($l, '<?php', 5) !== 0;
  }));
}

/** Últimas $limit entradas de la bitácora, la más reciente primero. */
function ceevs_audit_read(int $limit): array {
  $lines = ceevs_audit_lines();
  $out = array();
  foreach (array_reverse(array_slice($lines, -$limit)) as $line) {
    $e = json_decode($line, true);
    if (is_array($e)) {
      $out[] = $e;
    }
  }
  return $out;
}

/* ─── Correo ─── */

/**
 * Configuración privada del correo.
 *
 * Se carga desde server-data/correo-config.php (fuera del repositorio y
 * protegido por .htaccess). Cada valor también puede suministrarse como variable
 * de entorno, algo útil si más adelante se migra a otro tipo de servidor.
 */
function ceevs_mail_config(): array {
  static $config = null;
  if (is_array($config)) {
    return $config;
  }

  $config = array(
    'smtp_host'     => '',
    'smtp_port'     => 587,
    'smtp_security' => 'tls', // tls (STARTTLS), ssl (TLS directo) o none
    'smtp_user'     => '',
    'smtp_password' => '',
    'from_email'    => '',
    'from_name'     => 'Centro Educativo Evangélico Virginia Sapp',
    'admissions_to' => '',
    'forms_to'      => '',
    'timeout'       => 15,
  );

  if (@is_file(CEEVS_MAIL_CONFIG_FILE)) {
    $loaded = @include CEEVS_MAIL_CONFIG_FILE;
    if (is_array($loaded)) {
      foreach ($config as $key => $unused) {
        if (array_key_exists($key, $loaded)) {
          $config[$key] = $loaded[$key];
        }
      }
    }
  }

  $env = array(
    'smtp_host'     => 'CEEVS_SMTP_HOST',
    'smtp_port'     => 'CEEVS_SMTP_PORT',
    'smtp_security' => 'CEEVS_SMTP_SECURITY',
    'smtp_user'     => 'CEEVS_SMTP_USER',
    'smtp_password' => 'CEEVS_SMTP_PASSWORD',
    'from_email'    => 'CEEVS_SMTP_FROM_EMAIL',
    'from_name'     => 'CEEVS_SMTP_FROM_NAME',
    'admissions_to' => 'CEEVS_ADMISSIONS_TO',
    'forms_to'      => 'CEEVS_FORMS_TO',
    'timeout'       => 'CEEVS_SMTP_TIMEOUT',
  );
  foreach ($env as $key => $name) {
    $value = getenv($name);
    if (is_string($value) && $value !== '') {
      $config[$key] = $value;
    }
  }

  $config['smtp_host'] = trim((string) $config['smtp_host']);
  $config['smtp_port'] = max(1, min(65535, (int) $config['smtp_port']));
  $config['smtp_security'] = strtolower(trim((string) $config['smtp_security']));
  if (!in_array($config['smtp_security'], array('tls', 'ssl', 'none'), true)) {
    $config['smtp_security'] = 'tls';
  }
  $config['smtp_user'] = trim((string) $config['smtp_user']);
  $config['smtp_password'] = (string) $config['smtp_password'];
  $config['from_email'] = trim((string) $config['from_email']);
  $config['from_name'] = trim(str_replace(array("\r", "\n"), ' ', (string) $config['from_name']));
  $config['admissions_to'] = trim((string) $config['admissions_to']);
  $config['forms_to'] = trim((string) $config['forms_to']);
  $config['timeout'] = max(5, min(60, (int) $config['timeout']));
  return $config;
}

/** Destinatario institucional configurado por SMTP, o el del panel como respaldo. */
function ceevs_admissions_recipient(string $fallback): string {
  $configured = (string) ceevs_mail_config()['admissions_to'];
  return filter_var($configured, FILTER_VALIDATE_EMAIL) ? $configured : $fallback;
}

/** Destinatario de los formularios abiertos (sugerencias, suscripciones). */
function ceevs_forms_recipient(string $fallback): string {
  $configured = (string) ceevs_mail_config()['forms_to'];
  return filter_var($configured, FILTER_VALIDATE_EMAIL) ? $configured : $fallback;
}

/** Lista validada de destinatarios separados por coma o punto y coma. */
function ceevs_mail_addresses(string $to): array {
  $out = array();
  foreach (preg_split('/[;,]+/', $to) ?: array() as $candidate) {
    $candidate = trim($candidate);
    if ($candidate !== '' && filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
      $out[] = $candidate;
    }
  }
  return array_values(array_unique($out));
}

/** Lee una respuesta SMTP completa (incluidas las respuestas multilínea). */
function ceevs_smtp_response($socket, array $expected): bool {
  for ($i = 0; $i < 80; $i++) {
    $line = @fgets($socket, 8192);
    if (!is_string($line) || $line === '') {
      return false;
    }
    if (preg_match('/^(\d{3})([ -])/', $line, $m) === 1 && $m[2] === ' ') {
      return in_array((int) $m[1], $expected, true);
    }
  }
  return false;
}

function ceevs_smtp_command($socket, string $command, array $expected): bool {
  if (@fwrite($socket, $command . "\r\n") === false) {
    return false;
  }
  return ceevs_smtp_response($socket, $expected);
}

/** Construye un mensaje de texto UTF-8 listo para transmitir por SMTP. */
function ceevs_smtp_message(array $to, string $subject, string $text, array $config, string $replyTo = ''): string {
  $fromName = (string) $config['from_name'];
  $fromEmail = (string) $config['from_email'];
  $host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
  $messageHost = is_string($host) && preg_match('/^[A-Za-z0-9.-]+$/', $host) === 1 ? $host : 'localhost';
  $encodedName = '=?UTF-8?B?' . base64_encode($fromName !== '' ? $fromName : 'CEEVS') . '?=';
  $encodedSubject = '=?UTF-8?B?' . base64_encode(str_replace(array("\r", "\n"), ' ', $subject)) . '?=';
  $normalized = str_replace(array("\r\n", "\r"), "\n", $text);

  $headers = array(
    'Date: ' . date(DATE_RFC2822),
    'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $messageHost . '>',
    'From: ' . $encodedName . ' <' . $fromEmail . '>',
  );

  /* Responder escribe a quien llenó el formulario, no al buzón que autentica el
     envío. Solo entra una dirección válida: filter_var descarta de paso
     cualquier intento de colar saltos de línea para inyectar más cabeceras. */
  if (filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $replyTo;
  }

  $headers = array_merge($headers, array(
    'To: ' . implode(', ', $to),
    'Subject: ' . $encodedSubject,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ));
  return implode("\r\n", $headers) . "\r\n\r\n"
    . rtrim(chunk_split(base64_encode($normalized), 76, "\r\n")) . "\r\n";
}

/**
 * Entrega por SMTP autenticado con TLS.
 *
 * La contraseña solo sale del archivo privado/variables de entorno y nunca se
 * devuelve al navegador, se registra en la bitácora ni se incorpora al mensaje.
 */
function ceevs_send_smtp(array $to, string $subject, string $text, array $config, string $replyTo = ''): bool {
  $host = (string) $config['smtp_host'];
  $port = (int) $config['smtp_port'];
  $security = (string) $config['smtp_security'];
  $from = (string) $config['from_email'];
  if (
    $host === '' ||
    !filter_var($from, FILTER_VALIDATE_EMAIL) ||
    preg_match('/^[A-Za-z0-9.-]+$/', $host) !== 1
  ) {
    return false;
  }

  $context = stream_context_create(array(
    'ssl' => array(
      'verify_peer'      => true,
      'verify_peer_name' => true,
      'peer_name'        => $host,
      'SNI_enabled'      => true,
    ),
  ));
  $remote = ($security === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
  $errno = 0;
  $errstr = '';
  $socket = @stream_socket_client(
    $remote,
    $errno,
    $errstr,
    (int) $config['timeout'],
    STREAM_CLIENT_CONNECT,
    $context
  );
  if (!is_resource($socket)) {
    return false;
  }
  @stream_set_timeout($socket, (int) $config['timeout']);

  $httpHost = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
  $hello = is_string($httpHost) && preg_match('/^[A-Za-z0-9.-]+$/', $httpHost) === 1
    ? $httpHost
    : 'localhost';

  $ok = ceevs_smtp_response($socket, array(220))
    && ceevs_smtp_command($socket, 'EHLO ' . $hello, array(250));

  if ($ok && $security === 'tls') {
    $ok = ceevs_smtp_command($socket, 'STARTTLS', array(220))
      && @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)
      && ceevs_smtp_command($socket, 'EHLO ' . $hello, array(250));
  }

  $user = (string) $config['smtp_user'];
  if ($ok && $user !== '') {
    $ok = ceevs_smtp_command($socket, 'AUTH LOGIN', array(334))
      && ceevs_smtp_command($socket, base64_encode($user), array(334))
      && ceevs_smtp_command($socket, base64_encode((string) $config['smtp_password']), array(235));
  }

  if ($ok) {
    $ok = ceevs_smtp_command($socket, 'MAIL FROM:<' . $from . '>', array(250));
  }
  foreach ($to as $address) {
    if ($ok) {
      $ok = ceevs_smtp_command($socket, 'RCPT TO:<' . $address . '>', array(250, 251));
    }
  }
  if ($ok) {
    $ok = ceevs_smtp_command($socket, 'DATA', array(354));
  }
  if ($ok) {
    $message = ceevs_smtp_message($to, $subject, $text, $config, $replyTo);
    // SMTP termina el cuerpo con una línea que contiene solo un punto.
    $message = preg_replace('/(?m)^\./', '..', $message);
    $ok = is_string($message)
      && @fwrite($socket, $message . ".\r\n") !== false
      && ceevs_smtp_response($socket, array(250));
  }

  @fwrite($socket, "QUIT\r\n");
  @fclose($socket);
  return $ok;
}

function ceevs_send_mail(string $to, string $subject, string $text, string $replyTo = ''): bool {
  $addresses = ceevs_mail_addresses($to);
  if (!$addresses) {
    return false;
  }

  $config = ceevs_mail_config();
  if ((string) $config['smtp_host'] !== '') {
    return ceevs_send_smtp($addresses, $subject, $text, $config, $replyTo);
  }

  // Respaldo para instalaciones que todavía usan mail() nativo.
  $host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
  if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
    $host = 'localhost';
  }
  $from = filter_var((string) $config['from_email'], FILTER_VALIDATE_EMAIL)
    ? (string) $config['from_email']
    : 'no-reply@' . $host;
  $fromName = (string) $config['from_name'] !== '' ? (string) $config['from_name'] : 'Panel CEEVS';
  $headers = 'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $from . ">\r\n";
  if (filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    $headers .= 'Reply-To: ' . $replyTo . "\r\n";
  }
  $headers .= "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n";
  $encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  return @mail(implode(', ', $addresses), $encSubject, $text, $headers);
}

/* ─── Configuración publicada ─── */

function ceevs_read_config(): array {
  $default = array('app' => 'ceevs-admin', 'updatedAt' => null, 'data' => new stdClass());
  if (!file_exists(CEEVS_CONFIG_FILE)) {
    return $default;
  }
  $raw = @file_get_contents(CEEVS_CONFIG_FILE);
  $cfg = json_decode($raw === false ? '' : $raw, true);
  if (!is_array($cfg) || !isset($cfg['data']) || !is_array($cfg['data'])) {
    return $default;
  }
  return array(
    'app'       => 'ceevs-admin',
    'updatedAt' => isset($cfg['updatedAt']) && is_string($cfg['updatedAt']) ? $cfg['updatedAt'] : null,
    'data'      => empty($cfg['data']) ? new stdClass() : $cfg['data'],
  );
}

function ceevs_write_config(array $data): bool {
  ceevs_ensure_data_dir();
  $payload = array(
    'app'       => 'ceevs-admin',
    'updatedAt' => gmdate('c'),
    'data'      => empty($data) ? new stdClass() : $data,
  );
  $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if ($json === false) {
    return false;
  }
  $tmp = CEEVS_CONFIG_FILE . '.tmp';
  if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
    return false;
  }
  if (@rename($tmp, CEEVS_CONFIG_FILE)) {
    return true;
  }
  @unlink($tmp);
  return @file_put_contents(CEEVS_CONFIG_FILE, $json, LOCK_EX) !== false;
}
