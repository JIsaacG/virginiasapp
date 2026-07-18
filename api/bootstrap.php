<?php
/**
 * bootstrap.php — Núcleo compartido de la mini-API del panel CEEVS.
 *
 * La configuración del sitio vive en ../server-data/site-config.json y la
 * contraseña del panel (solo el hash) en ../server-data/admin-pass.php.
 * OJO: la carpeta data/ del repo es OTRA cosa (JSON públicos del sitio:
 * comunicados, juegos, etc.) — no usarla aquí. server-data/ y uploads/ se
 * crean en el servidor en tiempo de ejecución, están fuera del repositorio
 * (.gitignore) y protegidas con .htaccess.
 */

declare(strict_types=1);

/** Claves de configuración que el panel puede publicar (espejo de localStorage). */
const CEEVS_CONFIG_KEYS = array(
  'ceevs_images',
  'ceevs_image_settings',
  'ceevs_gallery',
  'ceevs_video_settings',
  'ceevs_hub_video',
  'ceevs_theme',
  'ceevs_inventory'
);

define('CEEVS_DATA_DIR', dirname(__DIR__) . '/server-data');
define('CEEVS_UPLOADS_DIR', dirname(__DIR__) . '/uploads');
define('CEEVS_CONFIG_FILE', CEEVS_DATA_DIR . '/site-config.json');
define('CEEVS_PASS_FILE', CEEVS_DATA_DIR . '/admin-pass.php');

const CEEVS_MAX_VALUE_BYTES = 2000000;   // 2 MB por apartado de configuración
const CEEVS_MAX_UPLOAD_BYTES = 60000000; // 60 MB por archivo subido

function ceevs_session_start(): void {
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }
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

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function json_fail(string $msg, int $code = 400, array $extra = array()): void {
  json_out(array_merge(array('ok' => false, 'error' => $msg), $extra), $code);
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw === false ? '' : $raw, true);
  return is_array($data) ? $data : array();
}

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

/** Hash de la contraseña del panel, o null si aún no se ha configurado. */
function ceevs_pass_hash(): ?string {
  if (!file_exists(CEEVS_PASS_FILE)) {
    return null;
  }
  $CEEVS_PASS_HASH = null;
  include CEEVS_PASS_FILE;
  return (is_string($CEEVS_PASS_HASH) && $CEEVS_PASS_HASH !== '') ? $CEEVS_PASS_HASH : null;
}

function ceevs_save_pass(string $password): bool {
  ceevs_ensure_data_dir();
  $hash = password_hash($password, PASSWORD_DEFAULT);
  $php = "<?php\n// Autogenerado por api/auth.php — hash de la contraseña del panel.\n"
    . "\$CEEVS_PASS_HASH = " . var_export($hash, true) . ";\n";
  return @file_put_contents(CEEVS_PASS_FILE, $php, LOCK_EX) !== false;
}

function is_authed(): bool {
  ceevs_session_start();
  return !empty($_SESSION['ceevs_admin']);
}

function require_auth(): void {
  ceevs_require_same_origin();
  if (!is_authed()) {
    json_fail('No autorizado. Inicia sesión en el panel.', 401);
  }
}

/** Rechaza peticiones de escritura originadas en otros sitios (refuerzo del SameSite de la cookie). */
function ceevs_require_same_origin(): void {
  $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
  if ($site !== '' && $site !== 'same-origin' && $site !== 'none') {
    json_fail('Petición rechazada (origen no permitido).', 403);
  }
}

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
