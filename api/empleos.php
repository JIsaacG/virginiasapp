<?php
/**
 * empleos.php — Formulario "Forma parte de nuestro equipo" (contáctenos).
 *
 * POST multipart/form-data con los datos del aspirante y el campo de archivo
 * "cv" (PDF) → { ok: true }. Sustituye al enlace mailto de antes: ahora el
 * correo con la hoja de vida adjunta sale del propio dominio por SMTP
 * autenticado, igual que contacto.php.
 *
 * Mismo patrón anti-abuso que contacto.php (endpoint SIN sesión): verificación
 * de origen, campo trampa, freno por IP + global. El PDF no se guarda en el
 * servidor: se adjunta al correo desde el temporal que crea PHP al recibir el
 * POST y se descarta solo al terminar la petición.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// Buzón al que llegaba el mailto anterior; se mantiene igual para que el
// cambio no mueva el correo de sitio sin avisar. Se cambia con la clave
// empleos_to de correo-config.php o con la variable CEEVS_EMPLEOS_TO.
const CEEVS_EMPLEOS_DESTINO_DEFECTO = 'empleosadieeds@gmail.com';

const CEEVS_EMPLEOS_MAX_CV_BYTES     = 5000000; // 5 MB: de sobra para un PDF de hoja de vida
const CEEVS_EMPLEOS_MAX_INTENTOS_IP  = 20;      // POSTs por IP cada hora, se envíen o no
const CEEVS_EMPLEOS_MAX_POR_IP       = 5;       // correos ENVIADOS por IP cada hora
const CEEVS_EMPLEOS_MAX_GLOBAL_HORA  = 40;      // correos enviados por todo el sitio cada hora
const CEEVS_EMPLEOS_VENTANA          = 3600;
const CEEVS_EMPLEOS_MAX_IPS          = 400;     // entradas vivas en el archivo del freno

define('CEEVS_EMPLEOS_GUARD', CEEVS_DATA_DIR . '/empleos-guard.php');

/* ─── Freno anti-spam (mismo esquema que contacto.php) ─── */

function ceevs_empleos_guard_load(): array {
  ceevs_ensure_data_dir();
  $g = ceevs_read_guarded(CEEVS_EMPLEOS_GUARD);
  if (!is_array($g) || !isset($g['ips']) || !is_array($g['ips'])) {
    $g = array('ips' => array(), 'global' => array('n' => 0, 't' => 0));
  }
  if (!is_array($g['global'] ?? null)) {
    $g['global'] = array('n' => 0, 't' => 0);
  }

  $now = time();
  foreach ($g['ips'] as $k => $rec) {
    if (($now - (int) ($rec['t'] ?? 0)) > CEEVS_EMPLEOS_VENTANA) {
      unset($g['ips'][$k]);
    }
  }
  if (($now - (int) ($g['global']['t'] ?? 0)) > CEEVS_EMPLEOS_VENTANA) {
    $g['global'] = array('n' => 0, 't' => $now);
  }
  if (count($g['ips']) > CEEVS_EMPLEOS_MAX_IPS) {
    $g['ips'] = array_slice($g['ips'], -CEEVS_EMPLEOS_MAX_IPS, null, true);
  }
  return $g;
}

/** Cobra un intento. false = esta IP ya se pasó (y entonces no se escribe nada). */
function ceevs_empleos_intento(): bool {
  $g = ceevs_empleos_guard_load();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('n' => 0, 'i' => 0, 't' => time());
  if ((int) ($rec['i'] ?? 0) >= CEEVS_EMPLEOS_MAX_INTENTOS_IP) {
    return false;
  }
  $g['ips'][$ip] = array(
    'n' => (int) ($rec['n'] ?? 0),
    'i' => (int) ($rec['i'] ?? 0) + 1,
    't' => (int) ($rec['t'] ?? time()),
  );
  ceevs_write_guarded(CEEVS_EMPLEOS_GUARD, $g);
  return true;
}

/** ¿Esta IP —o el sitio entero— ya agotó su cupo de correos? Solo consulta. */
function ceevs_empleos_bloqueado(): bool {
  $g = ceevs_empleos_guard_load();
  $rec = $g['ips'][ceevs_client_ip()] ?? array('n' => 0);
  if ((int) ($rec['n'] ?? 0) >= CEEVS_EMPLEOS_MAX_POR_IP) {
    return true;
  }
  return (int) ($g['global']['n'] ?? 0) >= CEEVS_EMPLEOS_MAX_GLOBAL_HORA;
}

/** Suma un correo al freno (IP y global). Solo cuando de verdad salió. */
function ceevs_empleos_contar(): void {
  $g = ceevs_empleos_guard_load();
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
  ceevs_write_guarded(CEEVS_EMPLEOS_GUARD, $g);
}

/* ─── Saneado ─── */

/** Una línea: sin saltos ni caracteres de control, con tope de largo. */
function ceevs_empleos_txt($v, int $max = 120): string {
  if (!is_string($v)) {
    $v = is_scalar($v) ? (string) $v : '';
  }
  $v = str_replace(array("\r", "\n", "\t"), ' ', $v);
  $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
  $v = trim((string) preg_replace('/\s+/u', ' ', (string) $v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Varias líneas (el mensaje adicional), sin caracteres de control. */
function ceevs_empleos_multi($v, int $max = 1500): string {
  if (!is_string($v)) {
    return '';
  }
  $v = str_replace(array("\r\n", "\r"), "\n", $v);
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  $v = trim((string) $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function ceevs_empleos_dato(string $v): string {
  return $v !== '' ? $v : '(no indicado)';
}

/* ─── Petición ─── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_same_origin();

// Lo PRIMERO, antes de tocar nada más: así el rechazo cuesta casi nada.
if (!ceevs_empleos_intento()) {
  header('Retry-After: 3600');
  json_fail('Se enviaron demasiadas solicitudes desde esta conexión. Espera una hora.', 429);
}

// Campo trampa: los robots rellenan todo, una persona nunca lo ve.
if (ceevs_empleos_txt($_POST['sitio_web'] ?? '', 40) !== '') {
  json_out(array('ok' => true)); // se descarta en silencio
}

$nombre    = ceevs_empleos_txt($_POST['nombre'] ?? '', 120);
$correo    = ceevs_empleos_txt($_POST['correo'] ?? '', 100);
$telefono  = ceevs_empleos_txt($_POST['telefono'] ?? '', 40);
$puesto    = ceevs_empleos_txt($_POST['puesto'] ?? '', 100);
$nivelArea = ceevs_empleos_txt($_POST['nivel_area'] ?? '', 80);
$mensaje   = ceevs_empleos_multi($_POST['mensaje'] ?? '', 1500);

if ($nombre === '') {
  json_fail('Escribe tu nombre completo.');
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  json_fail('Escribe un correo electrónico válido.');
}
if ($puesto === '') {
  json_fail('Indica el puesto de tu interés.');
}

if (empty($_FILES['cv']) || !is_array($_FILES['cv'])) {
  json_fail('Adjunta tu hoja de vida en PDF.');
}
$cv = $_FILES['cv'];
$cvError = (int) ($cv['error'] ?? UPLOAD_ERR_NO_FILE);
if ($cvError !== UPLOAD_ERR_OK) {
  $msg = 'No se pudo recibir el archivo (código ' . $cvError . ').';
  if ($cvError === UPLOAD_ERR_INI_SIZE || $cvError === UPLOAD_ERR_FORM_SIZE) {
    $msg = 'El archivo supera el tamaño máximo permitido por el servidor.';
  }
  json_fail($msg);
}
if ((int) ($cv['size'] ?? 0) <= 0 || (int) $cv['size'] > CEEVS_EMPLEOS_MAX_CV_BYTES) {
  json_fail('El archivo debe pesar menos de 5 MB.');
}
// upload.php se protege de esto mismo al llamar a move_uploaded_file(); aquí no
// se mueve el archivo (se lee directo del temporal), así que la comprobación
// hay que hacerla a mano.
if (!is_uploaded_file((string) $cv['tmp_name'])) {
  json_fail('No se pudo procesar el archivo adjunto.', 500);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file((string) $cv['tmp_name']);
if ($mime !== 'application/pdf') {
  json_fail('Adjunta tu hoja de vida en formato PDF.');
}

if (ceevs_empleos_bloqueado()) {
  header('Retry-After: 3600');
  json_fail('Ya se enviaron varias solicitudes desde esta conexión. Espera una hora.', 429);
}

$contenido = @file_get_contents((string) $cv['tmp_name']);
if ($contenido === false) {
  json_fail('No se pudo leer el archivo adjunto.', 500);
}

// Nombre de archivo seguro para el adjunto (sin tildes, espacios ni símbolos).
$nombreArchivo = pathinfo((string) $cv['name'], PATHINFO_FILENAME);
$nombreArchivo = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombreArchivo) ?: 'cv';
$nombreArchivo = strtolower((string) preg_replace('/[^A-Za-z0-9]+/', '-', $nombreArchivo));
$nombreArchivo = trim(substr($nombreArchivo, 0, 60), '-') ?: 'cv';
$nombreArchivo .= '.pdf';

$asunto = 'Aplicación de empleo - ' . $puesto . ' - ' . $nombre;
$texto = implode("\n", array(
  'Estimado equipo,',
  '',
  'Se recibió una aplicación de empleo a través del sitio web, con la hoja de',
  'vida adjunta en PDF.',
  '',
  'Nombre:              ' . $nombre,
  'Puesto de interés:   ' . $puesto,
  'Nivel/área:          ' . ceevs_empleos_dato($nivelArea),
  'Teléfono:            ' . ceevs_empleos_dato($telefono),
  'Correo:              ' . $correo,
  '',
  'Mensaje adicional:',
  $mensaje !== '' ? $mensaje : '(sin mensaje adicional)',
  '',
  '────────────────────────────────────────',
  'Enviado desde el formulario "Forma parte de nuestro equipo" del sitio del',
  'Centro Educativo Evangélico Virginia Sapp.',
));

$destino = ceevs_empleos_recipient(CEEVS_EMPLEOS_DESTINO_DEFECTO);
$enviado = ceevs_send_mail($destino, $asunto, $texto, $correo, array(
  'name'    => $nombreArchivo,
  'mime'    => 'application/pdf',
  'content' => $contenido,
));

if ($enviado) {
  ceevs_empleos_contar();
}

ceevs_audit(
  $enviado ? 'empleo_enviado' : 'empleo_fallo',
  'Aplicación de empleo — ' . $puesto . ' (' . $nombre . ')',
  $enviado,
  'formulario público'
);

if (!$enviado) {
  json_fail('No pudimos enviar tu aplicación en este momento. Intenta de nuevo en unos minutos.', 502);
}

json_out(array('ok' => true));
