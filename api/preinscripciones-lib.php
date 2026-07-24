<?php
/**
 * preinscripciones-lib.php — Almacén de las solicitudes de pre-inscripción.
 *
 * Se carga DESPUÉS de bootstrap.php (usa CEEVS_DATA_DIR y sus utilidades).
 *
 * En Hostinger todo vive fuera de public_html, en la carpeta privada:
 *   /home/<cuenta>/VIRGINIASAPP/SOLICITUDES DE ADMISIÓN/
 *
 * En desarrollo local se conserva server-data/preinscripciones/. La variable de
 * entorno CEEVS_PREINS_DIR permite indicar otra ruta absoluta si el hosting
 * cambia su estructura. Cada archivo lleva además la guarda "<?php exit;":
 *   - index.php      → índice liviano de la bandeja + ajustes + correlativo
 *   - rec-<id>.php   → la solicitud completa (un archivo por solicitud)
 *   - foto-<id>.<ext>→ foto del alumno (se sirve solo con sesión iniciada)
 *   - guard.php      → freno anti-spam del formulario público (por IP)
 *
 * Son datos personales de menores: NUNCA se exponen sin sesión de administrador.
 */

declare(strict_types=1);

define('CEEVS_PREINS_LEGACY_DIR', CEEVS_DATA_DIR . '/preinscripciones');

/**
 * Ubicación privada de las solicitudes.
 *
 * Hostinger publica el sitio desde una de estas rutas:
 *   /home/u12345678/public_html
 *   /home/u12345678/domains/dominio/public_html
 * En ambos casos se extrae /home/u12345678 y se usa la carpeta que el cliente
 * creó junto a public_html. No se guarda la URL del Administrador de archivos:
 * esa URL es solo la interfaz web de Hostinger, no una ruta escribible por PHP.
 */
function ceevs_preins_storage_dir(): string {
  $configured = getenv('CEEVS_PREINS_DIR');
  if (is_string($configured) && trim($configured) !== '') {
    return rtrim(trim($configured), "/\\");
  }

  $roots = array(
    dirname(__DIR__),
    isset($_SERVER['DOCUMENT_ROOT']) ? (string) $_SERVER['DOCUMENT_ROOT'] : '',
  );
  foreach ($roots as $root) {
    $normal = str_replace('\\', '/', $root);
    if (preg_match('#^(/home/[^/]+)(?:/|$)#', $normal, $m) === 1) {
      return $m[1] . '/VIRGINIASAPP/SOLICITUDES DE ADMISIÓN';
    }
  }

  return CEEVS_PREINS_LEGACY_DIR;
}

define('CEEVS_PREINS_DIR', ceevs_preins_storage_dir());
define('CEEVS_PREINS_INDEX', CEEVS_PREINS_DIR . '/index.php');
define('CEEVS_PREINS_GUARD', CEEVS_PREINS_DIR . '/guard.php');
define('CEEVS_PREINS_ESTADO', CEEVS_PREINS_DIR . '/estado.php');
define('CEEVS_PREINS_LOCK', CEEVS_PREINS_DIR . '/lock.php');

const CEEVS_PREINS_MAX_FOTO_BYTES = 2200000;  // 2 MB de foto ya redimensionada
const CEEVS_PREINS_MAX_POR_IP     = 4;        // solicitudes GUARDADAS por IP cada hora
const CEEVS_PREINS_VENTANA_IP     = 3600;     // ventana del freno, en segundos
const CEEVS_PREINS_MAX_HERMANOS   = 12;
const CEEVS_PREINS_CORREO_DEFECTO = 'administracion.general@virginiasapp.edu.hn';
const CEEVS_PREINS_NUM_INICIAL    = 111;      // la hoja de papel iba en la 110

/* ─── Topes contra sobrecarga (ver ceevs_preins_intento y siguientes) ───
   Están calculados para un centro que recibe ~300 solicitudes al año: son
   holgados para el uso real y estrechos para una carga malintencionada.
   Si algún día una jornada de matrícula los roza, súbelos aquí. */

const CEEVS_PREINS_MAX_BODY_BYTES  = 4000000; // cuerpo del POST (foto de 2.2 MB en base64 ≈ 3 MB)
const CEEVS_PREINS_MAX_INTENTOS_IP = 20;      // POSTs por IP cada hora, se guarden o no
const CEEVS_PREINS_MAX_GLOBAL_HORA = 60;      // solicitudes guardadas en TODO el sitio por hora
const CEEVS_PREINS_MAX_CORREOS_HORA = 30;     // avisos por correo (Hostinger corta el SMTP si se abusa)
const CEEVS_PREINS_MAX_IPS_GUARD   = 400;     // entradas vivas en guard.php
const CEEVS_PREINS_MAX_TOTAL       = 2000;    // solicitudes almacenadas (tope de inodos)
const CEEVS_PREINS_MAX_FOTOS_BYTES = 400000000; // 400 MB de fotos en total (cuota de disco)

/** Estados por los que pasa una solicitud dentro del panel. */
const CEEVS_PREINS_ESTADOS = array('nueva', 'leida', 'contactada', 'archivada');

/* ─── Carpeta ─── */

/**
 * Copia una sola vez las solicitudes de la ubicación antigua.
 *
 * Se copia (no se mueve) para que una publicación nunca destruya los originales.
 * El índice se copia al final: así el panel no ve una migración incompleta.
 */
function ceevs_preins_migrate_legacy(): void {
  if (
    CEEVS_PREINS_DIR === CEEVS_PREINS_LEGACY_DIR ||
    !@is_dir(CEEVS_PREINS_LEGACY_DIR) ||
    @file_exists(CEEVS_PREINS_INDEX)
  ) {
    return;
  }

  $oldIndex = CEEVS_PREINS_LEGACY_DIR . '/index.php';
  if (!@is_file($oldIndex)) {
    return;
  }

  $names = @scandir(CEEVS_PREINS_LEGACY_DIR);
  if (!is_array($names)) {
    return;
  }

  $copy = array();
  foreach ($names as $name) {
    if (
      preg_match('/^rec-[a-f0-9]{16}\.php$/', $name) === 1 ||
      preg_match('/^foto-[a-f0-9]{16}\.(?:jpg|png|webp)$/', $name) === 1 ||
      in_array($name, array('guard.php', 'estado.php'), true)
    ) {
      $copy[] = $name;
    }
  }
  $copy[] = 'index.php';

  foreach ($copy as $name) {
    $source = CEEVS_PREINS_LEGACY_DIR . '/' . $name;
    $dest = CEEVS_PREINS_DIR . '/' . $name;
    if (@file_exists($dest)) {
      continue;
    }
    $tmp = CEEVS_PREINS_DIR . '/.migrando-' . hash('sha256', $name) . '.tmp';
    if (!@copy($source, $tmp) || !@rename($tmp, $dest)) {
      @unlink($tmp);
      return;
    }
    @chmod($dest, preg_match('/\.(?:jpg|png|webp)$/', $name) === 1 ? 0644 : 0600);
  }
}

function ceevs_preins_ensure_dir(): void {
  ceevs_ensure_data_dir();
  if (!@is_dir(CEEVS_PREINS_DIR)) {
    @mkdir(CEEVS_PREINS_DIR, 0755, true);
  }
  if (!@is_dir(CEEVS_PREINS_DIR)) {
    return;
  }
  $ht = CEEVS_PREINS_DIR . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht, "Require all denied\n");
  }
  ceevs_preins_migrate_legacy();
}

/* ─── Índice de la bandeja ─── */

/** Índice completo: ajustes + correlativo + fichas resumidas (más reciente primero). */
function ceevs_preins_index(): array {
  ceevs_preins_ensure_dir();
  $ix = ceevs_read_guarded(CEEVS_PREINS_INDEX);
  if (!is_array($ix)) {
    $ix = array();
  }
  $ix += array('next' => CEEVS_PREINS_NUM_INICIAL, 'items' => array(), 'settings' => array(), 'bytes' => 0);
  if (!is_array($ix['items'])) {
    $ix['items'] = array();
  }
  $ix['bytes'] = max(0, (int) $ix['bytes']);   // fotos guardadas, en bytes
  if (!is_array($ix['settings'])) {
    $ix['settings'] = array();
  }
  $ix['settings'] += array(
    'correo'    => CEEVS_PREINS_CORREO_DEFECTO,
    'notificar' => true,
    'abierto'   => true,   // false = el formulario deja de recibir solicitudes
    'ciclo'     => '',     // texto libre: "2026-2027"
  );
  $ix['next'] = max(1, (int) $ix['next']);
  return $ix;
}

function ceevs_preins_save_index(array $ix): bool {
  ceevs_preins_ensure_dir();
  $ok = ceevs_write_guarded(CEEVS_PREINS_INDEX, $ix);
  ceevs_preins_cache_estado($ix['settings']);
  return $ok;
}

function ceevs_preins_settings(): array {
  $ix = ceevs_preins_index();
  return $ix['settings'];
}

/**
 * Copia diminuta de lo único que la página pública necesita saber (si el
 * formulario está abierto y de qué ciclo es).
 *
 * Existe para que `GET ?action=estado` —que corre en CADA visita a
 * preinscripcion.html— no tenga que leer y decodificar el índice completo, que
 * crece con cada solicitud recibida. Sin esto, mientras más solicitudes hay,
 * más caro sale cada visita: justo lo que busca una carga malintencionada.
 */
function ceevs_preins_cache_estado(array $settings): void {
  ceevs_preins_ensure_dir();
  ceevs_write_guarded(CEEVS_PREINS_ESTADO, array(
    'abierto' => !empty($settings['abierto']),
    'ciclo'   => (string) ($settings['ciclo'] ?? ''),
  ));
}

/** Estado público del formulario, por la vía barata; si falta la copia, la crea. */
function ceevs_preins_estado_publico(): array {
  $e = ceevs_read_guarded(CEEVS_PREINS_ESTADO);
  if (is_array($e) && isset($e['abierto'])) {
    return array('abierto' => !empty($e['abierto']), 'ciclo' => (string) ($e['ciclo'] ?? ''));
  }
  $s = ceevs_preins_settings();
  ceevs_preins_cache_estado($s);
  return array('abierto' => !empty($s['abierto']), 'ciclo' => (string) $s['ciclo']);
}

/* ─── Identificadores y rutas ─── */

function ceevs_preins_new_id(): string {
  return bin2hex(random_bytes(8));
}

function ceevs_preins_valid_id($id): bool {
  return is_string($id) && preg_match('/^[a-f0-9]{16}$/', $id) === 1;
}

function ceevs_preins_file(string $id): string {
  return CEEVS_PREINS_DIR . '/rec-' . $id . '.php';
}

/** Ruta de la foto del alumno, o null si esa solicitud no trae foto. */
function ceevs_preins_foto_path(string $id): ?string {
  foreach (array('jpg', 'png', 'webp') as $ext) {
    $p = CEEVS_PREINS_DIR . '/foto-' . $id . '.' . $ext;
    if (file_exists($p)) {
      return $p;
    }
  }
  return null;
}

/* ─── Lectura y escritura de solicitudes ─── */

function ceevs_preins_read(string $id): ?array {
  if (!ceevs_preins_valid_id($id)) {
    return null;
  }
  ceevs_preins_ensure_dir();
  return ceevs_read_guarded(ceevs_preins_file($id));
}

function ceevs_preins_write(string $id, array $rec): bool {
  ceevs_preins_ensure_dir();
  return ceevs_write_guarded(ceevs_preins_file($id), $rec);
}

function ceevs_preins_delete(string $id): bool {
  if (!ceevs_preins_valid_id($id)) {
    return false;
  }
  $liberados = 0;
  $foto = ceevs_preins_foto_path($id);
  if ($foto !== null) {
    $liberados = (int) @filesize($foto);
    @unlink($foto);
  }
  @unlink(ceevs_preins_file($id));

  $ix = ceevs_preins_index();
  $ix['items'] = array_values(array_filter($ix['items'], function ($it) use ($id) {
    return (string) ($it['id'] ?? '') !== $id;
  }));
  // Al borrar se devuelve el espacio al presupuesto de fotos.
  $ix['bytes'] = max(0, (int) $ix['bytes'] - $liberados);
  return ceevs_preins_save_index($ix);
}

/** Ficha resumida que alimenta la lista del panel (sin datos sensibles de más). */
function ceevs_preins_row(array $rec): array {
  $al = is_array($rec['alumno'] ?? null) ? $rec['alumno'] : array();
  $pa = is_array($rec['padre'] ?? null) ? $rec['padre'] : array();
  $ma = is_array($rec['madre'] ?? null) ? $rec['madre'] : array();
  $tel = '';
  $correo = '';
  foreach (array($ma, $pa) as $p) {
    if ($tel === '') {
      $tel = (string) ($p['celular'] ?? '') !== '' ? (string) $p['celular'] : (string) ($p['telFijo'] ?? '');
    }
    if ($correo === '') {
      $correo = (string) ($p['correo'] ?? '');
    }
  }
  return array(
    'id'      => (string) ($rec['id'] ?? ''),
    'num'     => (int) ($rec['num'] ?? 0),
    't'       => (string) ($rec['t'] ?? ''),
    'estado'  => (string) ($rec['estado'] ?? 'nueva'),
    'alumno'  => (string) ($al['nombre'] ?? ''),
    'grado'   => (string) ($al['grado'] ?? ''),
    'encargado' => (string) ($rec['firma'] ?? ''),
    'tel'     => $tel,
    'correo'  => $correo,
    'foto'    => !empty($rec['foto']),
  );
}

/** Reescribe la ficha resumida de una solicitud dentro del índice. */
function ceevs_preins_touch_row(array $rec): bool {
  $ix = ceevs_preins_index();
  $id = (string) ($rec['id'] ?? '');
  $row = ceevs_preins_row($rec);
  $found = false;
  foreach ($ix['items'] as $i => $it) {
    if ((string) ($it['id'] ?? '') === $id) {
      $ix['items'][$i] = $row;
      $found = true;
      break;
    }
  }
  if (!$found) {
    array_unshift($ix['items'], $row);
  }
  return ceevs_preins_save_index($ix);
}

/* ─── Freno anti-spam y anti-sobrecarga del formulario público ───
 *
 * Tres cercos, porque cada uno tapa lo que el anterior deja pasar:
 *   1. intentos por IP   → frena el martilleo desde una conexión,
 *   2. guardadas por IP  → frena el spam de solicitudes reales,
 *   3. topes globales    → frenan lo que una botnet reparte entre muchas IPs.
 *
 * Estructura de guard.php:
 *   { ips: { <ip>: {n: guardadas, i: intentos, t: ts} },
 *     global: {n: guardadas, c: correos, t: ts} }
 */

/** Lee el registro del freno ya limpio de ventanas vencidas. */
function ceevs_preins_rate_load(): array {
  ceevs_preins_ensure_dir();
  $g = ceevs_read_guarded(CEEVS_PREINS_GUARD);
  // Formato viejo (plano, una entrada por IP) o archivo nuevo: se empieza limpio.
  // Es un registro efímero anti-spam; perderlo no tiene consecuencia.
  if (!is_array($g) || !isset($g['ips']) || !is_array($g['ips'])) {
    $g = array('ips' => array(), 'global' => array('n' => 0, 'c' => 0, 't' => 0));
  }
  if (!is_array($g['global'] ?? null)) {
    $g['global'] = array('n' => 0, 'c' => 0, 't' => 0);
  }

  $now = time();
  foreach ($g['ips'] as $k => $rec) {
    if (($now - (int) ($rec['t'] ?? 0)) > CEEVS_PREINS_VENTANA_IP) {
      unset($g['ips'][$k]);
    }
  }
  if (($now - (int) ($g['global']['t'] ?? 0)) > CEEVS_PREINS_VENTANA_IP) {
    $g['global'] = array('n' => 0, 'c' => 0, 't' => $now);
  }

  // El archivo no puede crecer sin freno: con muchísimas IPs distintas, leerlo y
  // decodificarlo en cada petición se volvería el propio cuello de botella.
  if (count($g['ips']) > CEEVS_PREINS_MAX_IPS_GUARD) {
    $g['ips'] = array_slice($g['ips'], -CEEVS_PREINS_MAX_IPS_GUARD, null, true);
  }
  return $g;
}

function ceevs_preins_rate_save(array $g): void {
  ceevs_write_guarded(CEEVS_PREINS_GUARD, $g);
}

/**
 * Registra un intento de envío y dice si se puede seguir.
 *
 * Se llama al PRINCIPIO del POST, antes de leer el cuerpo y antes de validar
 * nada. Esa es la diferencia clave con el cupo de solicitudes guardadas: quien
 * manda basura que no pasa la validación también gasta intentos, y por eso no
 * puede martillar gratis. Al superarse el tope ya ni se escribe el archivo, así
 * la petición rechazada sale lo más barata posible.
 */
function ceevs_preins_intento(): bool {
  $g = ceevs_preins_rate_load();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('n' => 0, 'i' => 0, 't' => time());

  if ((int) ($rec['i'] ?? 0) >= CEEVS_PREINS_MAX_INTENTOS_IP) {
    return false;   // sin escritura: rechazar tiene que costar casi nada
  }

  $g['ips'][$ip] = array(
    'n' => (int) ($rec['n'] ?? 0),
    'i' => (int) ($rec['i'] ?? 0) + 1,
    't' => (int) ($rec['t'] ?? time()),
  );
  ceevs_preins_rate_save($g);
  return true;
}

/**
 * ¿Esta IP ya llegó al tope de solicitudes guardadas de la última hora, o el
 * sitio entero llegó al suyo? Solo consulta: no gasta cupo. Así, si a la familia
 * le rebota una validación, no pierde solicitudes por un dato mal escrito.
 */
function ceevs_preins_rate_bloqueado(): bool {
  $g = ceevs_preins_rate_load();
  $rec = $g['ips'][ceevs_client_ip()] ?? array('n' => 0);
  if ((int) ($rec['n'] ?? 0) >= CEEVS_PREINS_MAX_POR_IP) {
    return true;
  }
  return (int) ($g['global']['n'] ?? 0) >= CEEVS_PREINS_MAX_GLOBAL_HORA;
}

/** Suma una solicitud al freno (IP y global). Solo cuando de verdad se guardó. */
function ceevs_preins_rate_contar(): void {
  $g = ceevs_preins_rate_load();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('n' => 0, 'i' => 0, 't' => time());
  $g['ips'][$ip] = array(
    'n' => (int) ($rec['n'] ?? 0) + 1,
    'i' => (int) ($rec['i'] ?? 0),
    't' => (int) ($rec['t'] ?? time()),
  );
  $g['global']['n'] = (int) ($g['global']['n'] ?? 0) + 1;
  if ((int) ($g['global']['t'] ?? 0) === 0) {
    $g['global']['t'] = time();
  }
  ceevs_preins_rate_save($g);
}

/**
 * Presupuesto de avisos por correo de la última hora.
 *
 * El hosting compartido corta el envío SMTP al pasarse de su cuota, y ese corte
 * afecta a TODO el dominio (recuperación de contraseña incluida). Las solicitudes
 * se siguen guardando: solo se deja de avisar, y quedan visibles en el panel.
 */
function ceevs_preins_correo_permitido(): bool {
  $g = ceevs_preins_rate_load();
  if ((int) ($g['global']['c'] ?? 0) >= CEEVS_PREINS_MAX_CORREOS_HORA) {
    return false;
  }
  $g['global']['c'] = (int) ($g['global']['c'] ?? 0) + 1;
  if ((int) ($g['global']['t'] ?? 0) === 0) {
    $g['global']['t'] = time();
  }
  ceevs_preins_rate_save($g);
  return true;
}

/**
 * ¿Es la primera vez que pasa esto en la ventana actual?
 *
 * Sirve para anotar un incidente en la bitácora sin inflarla: bajo una carga
 * malintencionada, un aviso por petición obligaría a reescribir la bitácora una
 * y otra vez, y el propio registro se volvería parte del problema.
 */
function ceevs_preins_primera_vez(string $clave): bool {
  $g = ceevs_preins_rate_load();
  if (!empty($g['global']['avisos'][$clave])) {
    return false;
  }
  if (!isset($g['global']['avisos']) || !is_array($g['global']['avisos'])) {
    $g['global']['avisos'] = array();
  }
  $g['global']['avisos'][$clave] = time();
  ceevs_preins_rate_save($g);
  return true;
}

/* ─── Cerrojo entre procesos ─── */

/**
 * Toma el cerrojo del almacén para que dos envíos simultáneos no se pisen al
 * leer-modificar-escribir el índice (se perdería una solicitud o el correlativo
 * daría dos veces el mismo número).
 *
 * Si en ~1 s no lo consigue, sigue sin él: es preferible arriesgar una carrera
 * rarísima que rechazarle la solicitud a una familia.
 */
function ceevs_preins_lock() {
  ceevs_preins_ensure_dir();
  $fh = @fopen(CEEVS_PREINS_LOCK, 'c');
  if ($fh === false) {
    return null;
  }
  for ($i = 0; $i < 20; $i++) {
    if (@flock($fh, LOCK_EX | LOCK_NB)) {
      return $fh;
    }
    usleep(50000);
  }
  @fclose($fh);
  return null;
}

function ceevs_preins_unlock($fh): void {
  if ($fh) {
    @flock($fh, LOCK_UN);
    @fclose($fh);
  }
}

/* ─── Topes de almacenamiento ─── */

/**
 * ¿Se llegó al tope de solicitudes almacenadas?
 * Cada una es un archivo (más la foto): sin tope, una carga malintencionada
 * agota la cuota de disco o de inodos del hosting y con eso cae el sitio entero,
 * no solo el formulario.
 */
function ceevs_preins_lleno(array $ix): bool {
  return count($ix['items']) >= CEEVS_PREINS_MAX_TOTAL;
}

/** ¿Queda presupuesto de disco para otra foto? (contador acumulado en el índice) */
function ceevs_preins_cabe_foto(array $ix): bool {
  return (int) ($ix['bytes'] ?? 0) < CEEVS_PREINS_MAX_FOTOS_BYTES;
}

/* ─── Saneado de los campos que llegan del formulario ─── */

/** Texto de una línea: sin caracteres de control, recortado y con tope de largo. */
function ceevs_preins_txt($v, int $max = 120): string {
  if (!is_string($v)) {
    $v = is_scalar($v) ? (string) $v : '';
  }
  $v = str_replace(array("\r", "\n", "\t"), ' ', $v);
  $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
  $v = trim(preg_replace('/\s+/u', ' ', (string) $v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Texto de varias líneas (notas internas del panel). */
function ceevs_preins_multi($v, int $max = 1500): string {
  if (!is_string($v)) {
    return '';
  }
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  $v = trim((string) $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Valor obligado a pertenecer a una lista cerrada. */
function ceevs_preins_enum($v, array $allowed, string $fallback = ''): string {
  $v = is_string($v) ? $v : '';
  return in_array($v, $allowed, true) ? $v : $fallback;
}

/**
 * Guarda la foto del alumno recibida como data URL.
 * Devuelve los bytes escritos (0 = no se guardó). El tipo real se verifica con
 * finfo: no se confía en lo que declare el navegador.
 */
function ceevs_preins_save_foto(string $id, $dataUrl): int {
  if (!is_string($dataUrl) || strncmp($dataUrl, 'data:image/', 11) !== 0) {
    return 0;
  }
  $coma = strpos($dataUrl, ',');
  if ($coma === false || strpos(substr($dataUrl, 0, $coma), ';base64') === false) {
    return 0;
  }
  $b64 = substr($dataUrl, $coma + 1);
  if (strlen($b64) > CEEVS_PREINS_MAX_FOTO_BYTES * 1.4) {
    return 0;
  }
  $bin = base64_decode($b64, true);
  if ($bin === false || $bin === '' || strlen($bin) > CEEVS_PREINS_MAX_FOTO_BYTES) {
    return 0;
  }

  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->buffer($bin);
  $exts = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp');
  if (!isset($exts[$mime])) {
    return 0;
  }
  // Confirmación extra: que sea una imagen que PHP pueda medir.
  $size = @getimagesizefromstring($bin);
  if ($size === false || (int) $size[0] < 40 || (int) $size[1] < 40) {
    return 0;
  }

  ceevs_preins_ensure_dir();
  $dest = CEEVS_PREINS_DIR . '/foto-' . $id . '.' . $exts[$mime];
  if (@file_put_contents($dest, $bin, LOCK_EX) === false) {
    return 0;
  }
  @chmod($dest, 0644);
  return strlen($bin);
}

/* ─── Texto plano de una solicitud (correo y exportación) ─── */

function ceevs_preins_bloque_padre(array $p, string $titulo): string {
  if (empty($p['aplica'])) {
    return $titulo . ": no proporcionado\n";
  }
  $l = array($titulo . ':');
  $campos = array(
    'nombre' => 'Nombre completo', 'profesion' => 'Profesión', 'ocupacion' => 'Ocupación',
    'direccion' => 'Dirección', 'telFijo' => 'Teléfono fijo', 'celular' => 'Celular',
    'correo' => 'Correo electrónico', 'centroTrabajo' => 'Centro de trabajo',
    'iglesia' => 'Iglesia que asiste', 'lider' => 'Líder espiritual', 'ingreso' => 'Ingreso mensual',
  );
  foreach ($campos as $k => $etq) {
    $v = (string) ($p[$k] ?? '');
    if ($v !== '') {
      $l[] = '  ' . $etq . ': ' . $v;
    }
  }
  return implode("\n", $l) . "\n";
}

/** Volcado legible de la solicitud, para el correo y para copiar/pegar. */
function ceevs_preins_texto(array $rec): string {
  $al = is_array($rec['alumno'] ?? null) ? $rec['alumno'] : array();
  $viveCon = array(
    'ambos' => 'Ambos padres', 'madre' => 'La madre', 'padre' => 'El padre', 'otro' => 'Otro',
  );
  $medios = array(
    'pariente' => 'Un pariente', 'amigo' => 'Un amigo', 'redes' => 'Redes sociales', 'otro' => 'Otro',
  );
  $motivos = array(
    'cristiana'     => 'Por su impacto en educación cristiana',
    'academico'     => 'Por su enfoque académico',
    'instalaciones' => 'Por sus instalaciones',
    'todas'         => 'Todas las anteriores',
  );

  $t = array();
  $t[] = 'SOLICITUD DE ADMISIÓN PARA PRIMER INGRESO — CEEVS';
  $t[] = 'Número de solicitud: ' . (int) ($rec['num'] ?? 0);
  $t[] = 'Recibida: ' . (string) ($rec['t'] ?? '');
  $t[] = '';
  $t[] = 'DATOS DEL ALUMNO';
  $t[] = '  Nombre completo: ' . (string) ($al['nombre'] ?? '');
  $t[] = '  Edad: ' . (string) ($al['edad'] ?? '') . '   Fecha de nacimiento: ' . (string) ($al['fechaNac'] ?? '');
  $t[] = '  Sexo: ' . (string) ($al['sexo'] ?? '') . '   N° de identidad: ' . (string) ($al['identidad'] ?? '');
  $t[] = '  Nacionalidad: ' . (string) ($al['nacionalidad'] ?? '');
  $t[] = '  País: ' . (string) ($al['pais'] ?? '') . '   Departamento: ' . (string) ($al['departamento'] ?? '') . '   Ciudad: ' . (string) ($al['ciudad'] ?? '');
  $vc = (string) ($al['viveCon'] ?? '');
  $t[] = '  Vive con: ' . ($viveCon[$vc] ?? $vc) . ((string) ($al['viveConOtro'] ?? '') !== '' ? ' — ' . $al['viveConOtro'] : '');
  $t[] = '  Escuela de procedencia: ' . (string) ($al['escuela'] ?? '');
  $t[] = '  Lugar: ' . (string) ($al['escuelaLugar'] ?? '') . '   Teléfono: ' . (string) ($al['escuelaTel'] ?? '');
  $t[] = '  Grado que va a cursar: ' . (string) ($al['grado'] ?? '');
  $t[] = '';
  $t[] = rtrim(ceevs_preins_bloque_padre(is_array($rec['padre'] ?? null) ? $rec['padre'] : array(), 'DATOS DEL PADRE'));
  $t[] = '';
  $t[] = rtrim(ceevs_preins_bloque_padre(is_array($rec['madre'] ?? null) ? $rec['madre'] : array(), 'DATOS DE LA MADRE'));
  $t[] = '';

  $herm = is_array($rec['hermanos'] ?? null) ? $rec['hermanos'] : array();
  $t[] = 'DATOS DE LOS HERMANOS';
  if (!$herm) {
    $t[] = '  (sin hermanos registrados)';
  }
  foreach ($herm as $h) {
    $t[] = '  - ' . (string) ($h['nombre'] ?? '')
      . '   Edad: ' . (string) ($h['edad'] ?? '')
      . '   Estudia: ' . (!empty($h['estudia']) ? 'Sí' : 'No')
      . '   Trabaja: ' . (!empty($h['trabaja']) ? 'Sí' : 'No');
  }
  $t[] = '';

  $medio = (string) ($rec['medio'] ?? '');
  $t[] = '¿Por qué medio se enteró del centro educativo?';
  $t[] = '  ' . ($medios[$medio] ?? $medio) . ((string) ($rec['medioOtro'] ?? '') !== '' ? ' — ' . $rec['medioOtro'] : '');
  $t[] = '¿Por qué eligió la institución?';
  $sel = is_array($rec['motivo'] ?? null) ? $rec['motivo'] : array();
  if (!$sel) {
    $t[] = '  (sin respuesta)';
  }
  foreach ($sel as $m) {
    $t[] = '  ' . ($motivos[$m] ?? $m);
  }
  $t[] = '';
  $t[] = 'Tiene familiares en la institución: ' . ((string) ($rec['familiares'] ?? '') !== '' ? $rec['familiares'] : 'No indicado');
  $t[] = 'Parentesco: ' . (string) ($rec['parentesco'] ?? '') . '   Nivel: ' . (string) ($rec['nivel'] ?? '');
  $t[] = '';
  $t[] = 'Esta solicitud no significa reservación de cupo.';
  $t[] = 'Declarada por: ' . (string) ($rec['firma'] ?? '');

  return implode("\n", $t);
}
