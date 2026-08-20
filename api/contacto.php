<?php
/**
 * contacto.php — Formularios abiertos del sitio que terminan en un correo.
 *
 * POST JSON { tipo: 'sugerencia' | 'suscripcion', ... } → { ok: true }
 *
 * Sustituye al servicio externo Web3Forms que usaban sugerencias.html y
 * mision-evangelistica.html. Ahora el aviso sale del propio dominio por SMTP
 * autenticado (la cuenta configurada en correo-config.php), y la clave del
 * servicio deja de viajar dentro del JavaScript público.
 *
 * Junto con preinscripcion.php, es el otro endpoint SIN sesión de la API. Por
 * eso repite sus mismos cercos: verificación de origen, campo trampa, tope de
 * tamaño del cuerpo, saneado de todos los campos y freno por IP + global. Lo
 * que entra aquí no se guarda en disco: se manda por correo y se anota en la
 * bitácora.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

/* Destinatario por omisión: el mismo buzón al que Web3Forms venía entregando,
   para que el cambio no mueva el correo de sitio sin avisar. Se cambia con la
   clave forms_to de correo-config.php o con la variable CEEVS_FORMS_TO. */
const CEEVS_CONTACTO_DESTINO_DEFECTO = 'administracion.general@virginiasapp.edu.hn';

const CEEVS_CONTACTO_MAX_BODY_BYTES  = 16384; // el mensaje más largo cabe de sobra
const CEEVS_CONTACTO_MAX_INTENTOS_IP = 20;    // POSTs por IP cada hora, se envíen o no
const CEEVS_CONTACTO_MAX_POR_IP      = 5;     // correos ENVIADOS por IP cada hora
const CEEVS_CONTACTO_MAX_GLOBAL_HORA = 40;    // correos enviados por todo el sitio cada hora
const CEEVS_CONTACTO_VENTANA         = 3600;
const CEEVS_CONTACTO_MAX_IPS         = 400;   // entradas vivas en el archivo del freno

define('CEEVS_CONTACTO_GUARD', CEEVS_DATA_DIR . '/contacto-guard.php');

/* ─── Freno anti-spam ───
 *
 * Mismo esquema que el de pre-inscripción y por las mismas razones: los intentos
 * se cobran antes de validar nada (si no, quien manda basura martillea gratis) y
 * los envíos se cobran solo cuando el correo salió de verdad. El tope global
 * existe porque una botnet reparte el abuso entre muchas IPs, y porque pasarse
 * de la cuota SMTP del hosting deja sin correo a TODO el dominio.
 */

function ceevs_contacto_guard_load(): array {
  ceevs_ensure_data_dir();
  $g = ceevs_read_guarded(CEEVS_CONTACTO_GUARD);
  if (!is_array($g) || !isset($g['ips']) || !is_array($g['ips'])) {
    $g = array('ips' => array(), 'global' => array('n' => 0, 't' => 0));
  }
  if (!is_array($g['global'] ?? null)) {
    $g['global'] = array('n' => 0, 't' => 0);
  }

  $now = time();
  foreach ($g['ips'] as $k => $rec) {
    if (($now - (int) ($rec['t'] ?? 0)) > CEEVS_CONTACTO_VENTANA) {
      unset($g['ips'][$k]);
    }
  }
  if (($now - (int) ($g['global']['t'] ?? 0)) > CEEVS_CONTACTO_VENTANA) {
    $g['global'] = array('n' => 0, 't' => $now);
  }
  // El archivo no puede crecer sin freno: con muchísimas IPs distintas, leerlo y
  // decodificarlo en cada petición se volvería el propio cuello de botella.
  if (count($g['ips']) > CEEVS_CONTACTO_MAX_IPS) {
    $g['ips'] = array_slice($g['ips'], -CEEVS_CONTACTO_MAX_IPS, null, true);
  }
  return $g;
}

/** Cobra un intento. false = esta IP ya se pasó (y entonces no se escribe nada). */
function ceevs_contacto_intento(): bool {
  $g = ceevs_contacto_guard_load();
  $ip = ceevs_client_ip();
  $rec = $g['ips'][$ip] ?? array('n' => 0, 'i' => 0, 't' => time());
  if ((int) ($rec['i'] ?? 0) >= CEEVS_CONTACTO_MAX_INTENTOS_IP) {
    return false;
  }
  $g['ips'][$ip] = array(
    'n' => (int) ($rec['n'] ?? 0),
    'i' => (int) ($rec['i'] ?? 0) + 1,
    't' => (int) ($rec['t'] ?? time()),
  );
  ceevs_write_guarded(CEEVS_CONTACTO_GUARD, $g);
  return true;
}

/** ¿Esta IP —o el sitio entero— ya agotó su cupo de correos? Solo consulta. */
function ceevs_contacto_bloqueado(): bool {
  $g = ceevs_contacto_guard_load();
  $rec = $g['ips'][ceevs_client_ip()] ?? array('n' => 0);
  if ((int) ($rec['n'] ?? 0) >= CEEVS_CONTACTO_MAX_POR_IP) {
    return true;
  }
  return (int) ($g['global']['n'] ?? 0) >= CEEVS_CONTACTO_MAX_GLOBAL_HORA;
}

/** Suma un correo al freno (IP y global). Solo cuando de verdad salió. */
function ceevs_contacto_contar(): void {
  $g = ceevs_contacto_guard_load();
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
  ceevs_write_guarded(CEEVS_CONTACTO_GUARD, $g);
}

/* ─── Saneado ─── */

/** Una línea: sin saltos ni caracteres de control, con tope de largo. */
function ceevs_contacto_txt($v, int $max = 120): string {
  if (!is_string($v)) {
    $v = is_scalar($v) ? (string) $v : '';
  }
  $v = str_replace(array("\r", "\n", "\t"), ' ', $v);
  $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
  $v = trim((string) preg_replace('/\s+/u', ' ', (string) $v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Varias líneas (el cuerpo de la sugerencia), sin caracteres de control. */
function ceevs_contacto_multi($v, int $max = 2000): string {
  if (!is_string($v)) {
    return '';
  }
  $v = str_replace(array("\r\n", "\r"), "\n", $v);
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  $v = trim((string) $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function ceevs_contacto_dato(string $v): string {
  return $v !== '' ? $v : '(no indicado)';
}

/* ─── Petición ─── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_same_origin();

// Lo PRIMERO, antes de leer el cuerpo: así el rechazo cuesta casi nada.
if (!ceevs_contacto_intento()) {
  header('Retry-After: 3600');
  json_fail('Se enviaron demasiados mensajes desde esta conexión. Espera una hora.', 429);
}

$body = read_json_body(CEEVS_CONTACTO_MAX_BODY_BYTES);

// Campo trampa: los robots rellenan todo, una persona nunca lo ve.
if (ceevs_contacto_txt($body['sitio_web'] ?? '', 40) !== '') {
  json_out(array('ok' => true)); // se descarta en silencio
}

$tipo = ceevs_contacto_txt($body['tipo'] ?? '', 20);
if (!in_array($tipo, array('sugerencia', 'suscripcion'), true)) {
  json_fail('No se reconoce el tipo de mensaje.');
}

if (ceevs_contacto_bloqueado()) {
  header('Retry-After: 3600');
  json_fail('Ya se enviaron varios mensajes desde esta conexión. Espera una hora.', 429);
}

$replyTo = '';

if ($tipo === 'sugerencia') {
  $nivel   = ceevs_contacto_txt($body['nivel'] ?? '', 60);
  $mensaje = ceevs_contacto_multi($body['mensaje'] ?? '', 2000);
  if ($nivel === '') {
    json_fail('Indica en qué nivel está inscrito su hijo/a.');
  }
  if ($mensaje === '') {
    json_fail('Escribe tu sugerencia en el campo Mensaje.');
  }

  $nombre   = ceevs_contacto_txt($body['nombre'] ?? '', 120);
  $contacto = ceevs_contacto_txt($body['contacto'] ?? '', 120);

  // El asunto se mantiene igual al que llegaba por Web3Forms: si hay una regla
  // de bandeja armada sobre él, sigue funcionando después del cambio.
  $asunto = 'OPORTUNIDAD DE MEJORA CEEVS';
  $texto = implode("\n", array(
    'Nombre:    ' . ceevs_contacto_dato($nombre),
    'Nivel:     ' . $nivel,
    'Grado:     ' . ceevs_contacto_dato(ceevs_contacto_txt($body['grado'] ?? '', 60)),
    'Sección:   ' . ceevs_contacto_dato(ceevs_contacto_txt($body['seccion'] ?? '', 60)),
    'Área:      ' . ceevs_contacto_dato(ceevs_contacto_txt($body['area'] ?? '', 80)),
    '',
    'Mensaje:',
    $mensaje,
    '',
    'Contacto:  ' . ceevs_contacto_dato($contacto),
  ));
  if (filter_var($contacto, FILTER_VALIDATE_EMAIL)) {
    $replyTo = $contacto;
  }
  $resumen = 'Sugerencia — nivel ' . $nivel;
} else {
  $correo = ceevs_contacto_txt($body['correo'] ?? '', 100);
  if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    json_fail('Escribe un correo electrónico válido.');
  }

  $nombre = ceevs_contacto_txt($body['nombre'] ?? '', 120);
  $asunto = 'SUSCRIPCION MISION EVANGELISTICA CEEVS';
  $texto = implode("\n", array(
    'Nueva suscripción a Misión Evangelística CEEVS',
    '',
    'Nombre: ' . ceevs_contacto_dato($nombre),
    'Correo: ' . $correo,
    'Perfil: ' . ceevs_contacto_dato(ceevs_contacto_txt($body['perfil'] ?? '', 60)),
    '',
    'Origen: mision-evangelistica.html',
  ));
  $replyTo = $correo;
  $resumen = 'Suscripción a Misión Evangelística';
}

$texto .= "\n\n────────────────────────────────────────\n"
  . "Enviado desde el formulario del sitio del Centro Educativo Evangélico Virginia Sapp.";

$destino = ceevs_forms_recipient(CEEVS_CONTACTO_DESTINO_DEFECTO);
$enviado = ceevs_send_mail($destino, $asunto, $texto, $replyTo);

if ($enviado) {
  ceevs_contacto_contar();
}

ceevs_audit(
  $enviado ? 'contacto_enviado' : 'contacto_fallo',
  $resumen,
  $enviado,
  'formulario público'
);

if (!$enviado) {
  json_fail('No pudimos enviar el mensaje en este momento. Intenta de nuevo en unos minutos.', 502);
}

json_out(array('ok' => true));
