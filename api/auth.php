<?php
/**
 * auth.php — Sesión del panel de administración.
 *
 * POST JSON { action: 'status' | 'setup' | 'login' | 'logout' | 'change', ... }
 *  - status : indica si hay sesión activa y si falta crear la contraseña.
 *  - setup  : crea la contraseña del panel (solo la primera vez).
 *  - login  : inicia sesión con la contraseña del panel.
 *  - logout : cierra la sesión.
 *  - change : cambia la contraseña (requiere sesión y contraseña actual).
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_same_origin();
ceevs_session_start();

$body = read_json_body();
$action = isset($body['action']) && is_string($body['action']) ? $body['action'] : '';

switch ($action) {
  case 'status':
    json_out(array(
      'ok'            => true,
      'authenticated' => !empty($_SESSION['ceevs_admin']),
      'needsSetup'    => ceevs_pass_hash() === null,
    ));
    break;

  case 'setup':
    if (ceevs_pass_hash() !== null) {
      json_fail('La contraseña ya fue configurada. Usa "Iniciar sesión".', 403);
    }
    $pass = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
    if (strlen($pass) < 8) {
      json_fail('La contraseña debe tener al menos 8 caracteres.');
    }
    if (!ceevs_save_pass($pass)) {
      json_fail('No se pudo guardar la contraseña en el servidor.', 500);
    }
    session_regenerate_id(true);
    $_SESSION['ceevs_admin'] = true;
    json_out(array('ok' => true));
    break;

  case 'login':
    $hash = ceevs_pass_hash();
    if ($hash === null) {
      json_fail('Aún no hay contraseña configurada.', 409, array('needsSetup' => true));
    }
    // Freno básico contra fuerza bruta: tras 5 fallos, espera de 30 segundos.
    $fails = $_SESSION['ceevs_login_fails'] ?? 0;
    $lastFail = $_SESSION['ceevs_login_last_fail'] ?? 0;
    if ($fails >= 5 && (time() - $lastFail) < 30) {
      json_fail('Demasiados intentos. Espera 30 segundos e inténtalo de nuevo.', 429);
    }
    $pass = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
    usleep(300000);
    if (!password_verify($pass, $hash)) {
      $_SESSION['ceevs_login_fails'] = $fails + 1;
      $_SESSION['ceevs_login_last_fail'] = time();
      json_fail('Contraseña incorrecta.', 401);
    }
    session_regenerate_id(true);
    $_SESSION['ceevs_admin'] = true;
    unset($_SESSION['ceevs_login_fails'], $_SESSION['ceevs_login_last_fail']);
    json_out(array('ok' => true));
    break;

  case 'logout':
    $_SESSION = array();
    if (ini_get('session.use_cookies')) {
      $p = session_get_cookie_params();
      setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    json_out(array('ok' => true));
    break;

  case 'change':
    if (empty($_SESSION['ceevs_admin'])) {
      json_fail('No autorizado. Inicia sesión en el panel.', 401);
    }
    $hash = ceevs_pass_hash();
    $current = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
    $next = isset($body['newPassword']) && is_string($body['newPassword']) ? $body['newPassword'] : '';
    if ($hash === null || !password_verify($current, $hash)) {
      json_fail('La contraseña actual no es correcta.', 401);
    }
    if (strlen($next) < 8) {
      json_fail('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (!ceevs_save_pass($next)) {
      json_fail('No se pudo guardar la nueva contraseña.', 500);
    }
    json_out(array('ok' => true));
    break;

  default:
    json_fail('Acción no reconocida.');
}
