<?php
/**
 * auth.php — Autenticación del panel de administración (correo + contraseña).
 *
 * POST JSON { action: ..., ... }
 *  - status       : indica si hay sesión activa (y entrega el token CSRF).
 *  - login        : { email, password } inicia sesión.
 *  - logout       : cierra la sesión.
 *  - change       : { password, newPassword } cambia la contraseña (sesión + CSRF).
 *  - change_email : { password, newEmail } cambia el correo (sesión + CSRF).
 *  - forgot       : { email } envía un código de recuperación al correo (15 min).
 *  - reset        : { email, code, newPassword } restablece la contraseña con el
 *                   código del correo o con la clave maestra de recuperación.
 *  - recovery_key : { password } genera una clave maestra nueva (sesión + CSRF).
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_same_origin();
ceevs_session_start();

// Endpoint abierto (aquí todavía no hay sesión): el cuerpo más grande que maneja
// son un correo y una contraseña, así que 64 KB sobran de largo.
$body = read_json_body(65536);
$action = isset($body['action']) && is_string($body['action']) ? $body['action'] : '';

function body_str(array $body, string $key): string {
  return isset($body[$key]) && is_string($body[$key]) ? $body[$key] : '';
}

function norm_email(string $email): string {
  return strtolower(trim($email));
}

/** Normaliza un código escrito por el usuario (quita espacios/guiones, mayúsculas). */
function norm_code(string $code): string {
  return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $code));
}

switch ($action) {
  case 'status': {
    $authed = is_authed();
    $out = array('ok' => true, 'authenticated' => $authed);
    if ($authed) {
      $out['email'] = (string) ($_SESSION['ceevs_email'] ?? '');
      $out['csrf'] = ceevs_csrf_token();
    }
    json_out($out);
    break;
  }

  case 'login': {
    $email = norm_email(body_str($body, 'email'));
    $pass = body_str($body, 'password');
    $wait = ceevs_guard_locked();
    if ($wait > 0) {
      $min = (int) ceil($wait / 60);
      json_fail('Demasiados intentos fallidos. Espera ' . ($wait < 90 ? $wait . ' segundos' : $min . ' minutos') . ' e inténtalo de nuevo.', 429);
    }
    usleep(random_int(200000, 400000));
    $u = ceevs_user();
    $emailOk = hash_equals(strtolower($u['email']), $email);
    $passOk = password_verify($pass, $u['hash']); // se verifica siempre (tiempo constante)
    if (!$emailOk || !$passOk) {
      ceevs_guard_fail();
      ceevs_audit('login_fail', 'Intento de acceso con correo: ' . ($email !== '' ? $email : '(vacío)'), false, $email);
      json_fail('Correo o contraseña incorrectos.', 401);
    }
    ceevs_guard_clear();
    ceevs_session_login($u['email']);
    ceevs_audit('login_ok', 'Inicio de sesión en el panel');
    json_out(array('ok' => true, 'email' => $u['email'], 'csrf' => ceevs_csrf_token()));
    break;
  }

  case 'logout': {
    if (is_authed()) {
      ceevs_audit('logout', 'Cierre de sesión');
    }
    ceevs_session_destroy();
    json_out(array('ok' => true));
    break;
  }

  case 'change': {
    if (!is_authed()) {
      json_fail('No autorizado. Inicia sesión en el panel.', 401);
    }
    ceevs_require_csrf();
    $u = ceevs_user();
    $current = body_str($body, 'password');
    $next = body_str($body, 'newPassword');
    usleep(random_int(200000, 400000));
    if (!password_verify($current, $u['hash'])) {
      ceevs_audit('password_change_fail', 'Cambio de contraseña rechazado: contraseña actual incorrecta', false);
      json_fail('La contraseña actual no es correcta.', 401);
    }
    if (strlen($next) < 8) {
      json_fail('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    $u['hash'] = password_hash($next, PASSWORD_DEFAULT);
    $u['reset'] = null;
    if (!ceevs_save_user($u)) {
      json_fail('No se pudo guardar la nueva contraseña.', 500);
    }
    ceevs_audit('password_changed', 'La contraseña del panel fue cambiada');
    json_out(array('ok' => true));
    break;
  }

  case 'change_email': {
    if (!is_authed()) {
      json_fail('No autorizado. Inicia sesión en el panel.', 401);
    }
    ceevs_require_csrf();
    $u = ceevs_user();
    $pass = body_str($body, 'password');
    $newEmail = norm_email(body_str($body, 'newEmail'));
    usleep(random_int(200000, 400000));
    if (!password_verify($pass, $u['hash'])) {
      ceevs_audit('email_change_fail', 'Cambio de correo rechazado: contraseña incorrecta', false);
      json_fail('La contraseña no es correcta.', 401);
    }
    if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
      json_fail('El correo no es válido.');
    }
    $old = $u['email'];
    $u['email'] = $newEmail;
    $u['reset'] = null;
    if (!ceevs_save_user($u)) {
      json_fail('No se pudo guardar el nuevo correo.', 500);
    }
    $_SESSION['ceevs_email'] = $newEmail;
    ceevs_audit('email_changed', 'Correo del administrador cambiado de ' . $old . ' a ' . $newEmail);
    json_out(array('ok' => true, 'email' => $newEmail));
    break;
  }

  case 'forgot': {
    $email = norm_email(body_str($body, 'email'));
    usleep(random_int(200000, 400000));
    if (!ceevs_guard_forgot_allowed()) {
      json_fail('Demasiadas solicitudes de recuperación. Espera 15 minutos.', 429);
    }
    $u = ceevs_user();
    if ($email !== '' && hash_equals(strtolower($u['email']), $email)) {
      $code = ceevs_random_code(8, 0);
      $u['reset'] = array('h' => password_hash($code, PASSWORD_DEFAULT), 'e' => time() + CEEVS_RESET_CODE_TTL, 'n' => 0);
      if (ceevs_save_user($u)) {
        $sent = ceevs_send_mail(
          $u['email'],
          'Código de recuperación — Panel CEEVS',
          "Hola,\n\nSe solicitó restablecer la contraseña del panel de administración CEEVS.\n\n"
          . "Tu código de recuperación es: " . $code . "\n\n"
          . "Vence en 15 minutos. Si tú no lo solicitaste, ignora este correo: tu contraseña no cambia sin este código.\n\n"
          . "— Panel de administración CEEVS"
        );
        ceevs_audit('recovery_requested', $sent
          ? 'Se envió un código de recuperación al correo del administrador'
          : 'Se generó un código de recuperación pero NO se pudo enviar el correo (revisa mail() del servidor); puede usarse la clave maestra', $sent);
      }
    } else {
      ceevs_audit('recovery_requested', 'Solicitud de recuperación con correo no registrado: ' . ($email !== '' ? $email : '(vacío)'), false, $email);
    }
    // Respuesta idéntica exista o no el correo (evita adivinar cuentas).
    json_out(array('ok' => true, 'message' => 'Si el correo es el del administrador, recibirás un código en unos minutos. También puedes usar tu clave maestra de recuperación.'));
    break;
  }

  case 'reset': {
    $email = norm_email(body_str($body, 'email'));
    $code = norm_code(body_str($body, 'code'));
    $next = body_str($body, 'newPassword');
    $wait = ceevs_guard_locked();
    if ($wait > 0) {
      $min = (int) ceil($wait / 60);
      json_fail('Demasiados intentos fallidos. Espera ' . ($wait < 90 ? $wait . ' segundos' : $min . ' minutos') . ' e inténtalo de nuevo.', 429);
    }
    usleep(random_int(200000, 400000));
    if (strlen($next) < 8) {
      json_fail('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    $u = ceevs_user();
    $emailOk = $email !== '' && hash_equals(strtolower($u['email']), $email);
    $masterCode = implode('-', str_split($code, 4)); // la clave maestra se guarda con guiones
    $valid = false;
    $usedMaster = false;
    $reset = isset($u['reset']) && is_array($u['reset']) ? $u['reset'] : null;
    if (
      $emailOk && $reset !== null
      && time() < (int) ($reset['e'] ?? 0)
      && (int) ($reset['n'] ?? 0) < CEEVS_RESET_MAX_TRIES
      && password_verify($code, (string) ($reset['h'] ?? ''))
    ) {
      $valid = true;
    } elseif ($emailOk && password_verify($masterCode, (string) ($u['recovery'] ?? ''))) {
      $valid = true;
      $usedMaster = true;
    }
    if (!$valid) {
      if ($reset !== null) {
        $u['reset']['n'] = (int) ($reset['n'] ?? 0) + 1;
        ceevs_save_user($u);
      }
      ceevs_guard_fail();
      ceevs_audit('recovery_fail', 'Intento de restablecer contraseña con código inválido (correo: ' . ($email !== '' ? $email : '(vacío)') . ')', false, $email);
      json_fail('Correo o código incorrecto.', 401);
    }
    $u['hash'] = password_hash($next, PASSWORD_DEFAULT);
    $u['reset'] = null;
    $out = array('ok' => true);
    if ($usedMaster) {
      $newKey = ceevs_random_code(16, 4);
      $u['recovery'] = password_hash($newKey, PASSWORD_DEFAULT);
      $out['newRecoveryKey'] = $newKey;
    }
    if (!ceevs_save_user($u)) {
      json_fail('No se pudo guardar la nueva contraseña.', 500);
    }
    ceevs_guard_clear();
    ceevs_audit('recovery_ok', $usedMaster
      ? 'Contraseña restablecida con la clave maestra (se generó una clave maestra nueva)'
      : 'Contraseña restablecida con el código enviado por correo', true, $u['email']);
    json_out($out);
    break;
  }

  case 'recovery_key': {
    if (!is_authed()) {
      json_fail('No autorizado. Inicia sesión en el panel.', 401);
    }
    ceevs_require_csrf();
    $u = ceevs_user();
    $pass = body_str($body, 'password');
    usleep(random_int(200000, 400000));
    if (!password_verify($pass, $u['hash'])) {
      ceevs_audit('recovery_key_fail', 'Generación de clave maestra rechazada: contraseña incorrecta', false);
      json_fail('La contraseña no es correcta.', 401);
    }
    $newKey = ceevs_random_code(16, 4);
    $u['recovery'] = password_hash($newKey, PASSWORD_DEFAULT);
    if (!ceevs_save_user($u)) {
      json_fail('No se pudo guardar la clave de recuperación.', 500);
    }
    ceevs_audit('recovery_key_new', 'Se generó una clave maestra de recuperación nueva');
    json_out(array('ok' => true, 'key' => $newKey));
    break;
  }

  default:
    json_fail('Acción no reconocida.');
}
