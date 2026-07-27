<?php
/**
 * preinscripcion.php — Recepción pública del formulario de pre-inscripción.
 *
 * GET  ?action=estado  → { ok, abierto, ciclo }   (para que la página sepa si recibe)
 * POST { ... }         → guarda la solicitud y devuelve { ok, num }
 *
 * Único endpoint SIN sesión de la API: lo usa el padre de familia desde
 * preinscripcion.html. Por eso lleva freno por IP, campo trampa anti-robots,
 * topes de tamaño y saneado de todos los campos. Lo guardado solo se puede
 * leer con sesión de administrador (preinscripciones.php).
 */

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/preinscripciones-lib.php';

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
$action = isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : '';

/* ─── Copia PDF generada por el navegador ───
 *
 * La solicitud debe guardarse primero para asignarle el correlativo que aparece
 * en la hoja. Después, el mismo PDF que recibe la familia llega aquí como binario.
 * Un token temporal, distinto para cada solicitud, impide adjuntar archivos a
 * registros ajenos y evita que esta ruta pública permita sobrescrituras.
 */
if ($metodo === 'POST' && $action === 'pdf') {
  ceevs_require_same_origin();

  $id = isset($_SERVER['HTTP_X_CEEVS_PDF_ID'])
    ? strtolower(trim((string) $_SERVER['HTTP_X_CEEVS_PDF_ID']))
    : '';
  $token = isset($_SERVER['HTTP_X_CEEVS_PDF_TOKEN'])
    ? trim((string) $_SERVER['HTTP_X_CEEVS_PDF_TOKEN'])
    : '';
  $tipo = strtolower(trim((string) ($_SERVER['CONTENT_TYPE'] ?? '')));
  $largo = max(0, (int) ($_SERVER['CONTENT_LENGTH'] ?? 0));

  if (!ceevs_preins_valid_id($id) || strlen($token) < 32) {
    json_fail('No se pudo asociar el PDF con la solicitud.', 403);
  }
  if (strpos($tipo, 'application/pdf') !== 0) {
    json_fail('El archivo recibido no es un PDF.', 415);
  }
  if ($largo > CEEVS_PREINS_MAX_PDF_BYTES) {
    json_fail('El PDF supera el tamaño permitido.', 413);
  }

  $pdf = @file_get_contents('php://input', false, null, 0, CEEVS_PREINS_MAX_PDF_BYTES + 1);
  if (!is_string($pdf) || $pdf === '' || strlen($pdf) > CEEVS_PREINS_MAX_PDF_BYTES) {
    json_fail('No se recibió un PDF válido.', 400);
  }

  $motivo = '';
  $guardado = ceevs_preins_save_pdf($id, $token, $pdf, false, $motivo);
  if ($guardado === null) {
    // Se anota el motivo: sin esto, una solicitud sin PDF es indistinguible de
    // una que nunca intentó subirlo y no hay nada que revisar en la bitácora.
    ceevs_audit(
      'preins_pdf_fallo',
      'Solicitud ' . $id . ' — ' . ($motivo !== '' ? $motivo : 'desconocido') . ' (' . strlen($pdf) . ' bytes)',
      false,
      'formulario público'
    );
    json_fail('No se pudo guardar el PDF. El enlace pudo vencer; vuelve a intentarlo desde la confirmación.', 422);
  }
  ceevs_audit(
    'preins_pdf_guardado',
    'PDF de solicitud guardado: ' . (string) $guardado['archivo'],
    true,
    'formulario público'
  );
  json_out(array(
    'ok' => true,
    'archivo' => $guardado['archivo'],
    'bytes' => $guardado['bytes'],
  ));
}

/* ─── Estado del formulario ─── */

if ($metodo === 'GET') {
  // Vía barata a propósito: lee una copia diminuta, no el índice completo.
  // Esto corre en cada visita a la página.
  $e = ceevs_preins_estado_publico();
  json_out(array('ok' => true, 'abierto' => $e['abierto'], 'ciclo' => $e['ciclo']));
}

if ($metodo !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_same_origin();

/**
 * Freno de intentos: lo PRIMERO, antes de leer el cuerpo y de validar nada.
 *
 * El cupo de solicitudes guardadas (más abajo) no basta por sí solo: quien manda
 * payloads que no pasan la validación nunca lo gasta y podría martillar sin
 * límite. Aquí paga todo el que toca la puerta, y pasado el tope la respuesta
 * cuesta una lectura de archivo pequeño y nada más.
 */
if (!ceevs_preins_intento()) {
  header('Retry-After: 3600');
  json_fail('Demasiados envíos desde esta conexión. Espera una hora o comunícate directamente con admisiones al 9221-5752.', 429);
}

$body = read_json_body(CEEVS_PREINS_MAX_BODY_BYTES);

// Campo trampa: los robots rellenan todo, una persona nunca lo ve.
if (ceevs_preins_txt($body['sitio_web'] ?? '', 40) !== '') {
  json_out(array('ok' => true, 'num' => 0)); // se descarta en silencio
}

$settings = ceevs_preins_settings();
if (empty($settings['abierto'])) {
  json_fail('El período de pre-inscripción está cerrado por el momento. Comunícate con el centro educativo.', 403);
}

if (ceevs_preins_rate_bloqueado()) {
  header('Retry-After: 3600');
  json_fail('Ya se enviaron varias solicitudes desde esta conexión. Espera una hora o comunícate directamente con admisiones.', 429);
}

/* ─── Alumno ─── */

$a = is_array($body['alumno'] ?? null) ? $body['alumno'] : array();

$nombre = ceevs_preins_txt($a['nombre'] ?? '', 120);
$grado  = ceevs_preins_txt($a['grado'] ?? '', 80);
$fechaNac = ceevs_preins_txt($a['fechaNac'] ?? '', 10);

$largoNombre = function_exists('mb_strlen') ? mb_strlen($nombre) : strlen($nombre);
if ($nombre === '' || $largoNombre < 5) {
  json_fail('Escribe el nombre completo del alumno.');
}
if ($grado === '') {
  json_fail('Indica el grado que va a cursar.');
}
if ($fechaNac !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaNac) !== 1) {
  json_fail('La fecha de nacimiento no tiene un formato válido.');
}

$edad = (int) ($a['edad'] ?? 0);
if ($edad < 0 || $edad > 30) {
  $edad = 0;
}

$alumno = array(
  'nombre'       => $nombre,
  'fechaNac'     => $fechaNac,
  'edad'         => $edad,
  'sexo'         => ceevs_preins_enum($a['sexo'] ?? '', array('Femenino', 'Masculino')),
  'identidad'    => ceevs_preins_txt($a['identidad'] ?? '', 25),
  'nacionalidad' => ceevs_preins_txt($a['nacionalidad'] ?? '', 40),
  'pais'         => ceevs_preins_txt($a['pais'] ?? '', 40),
  'departamento' => ceevs_preins_txt($a['departamento'] ?? '', 60),
  'ciudad'       => ceevs_preins_txt($a['ciudad'] ?? '', 60),
  'viveCon'      => ceevs_preins_enum($a['viveCon'] ?? '', array('ambos', 'madre', 'padre', 'otro')),
  'viveConOtro'  => ceevs_preins_txt($a['viveConOtro'] ?? '', 80),
  'escuela'      => ceevs_preins_txt($a['escuela'] ?? '', 120),
  'escuelaLugar' => ceevs_preins_txt($a['escuelaLugar'] ?? '', 80),
  'escuelaTel'   => ceevs_preins_txt($a['escuelaTel'] ?? '', 30),
  'grado'        => $grado,
);

/* ─── Padre y madre ─── */

function ceevs_preins_limpia_padre($p): array {
  if (!is_array($p) || empty($p['aplica'])) {
    return array('aplica' => false);
  }
  return array(
    'aplica'        => true,
    'nombre'        => ceevs_preins_txt($p['nombre'] ?? '', 120),
    'profesion'     => ceevs_preins_txt($p['profesion'] ?? '', 60),
    'ocupacion'     => ceevs_preins_txt($p['ocupacion'] ?? '', 60),
    'direccion'     => ceevs_preins_txt($p['direccion'] ?? '', 200),
    'telFijo'       => ceevs_preins_txt($p['telFijo'] ?? '', 30),
    'celular'       => ceevs_preins_txt($p['celular'] ?? '', 30),
    'correo'        => ceevs_preins_txt($p['correo'] ?? '', 100),
    'centroTrabajo' => ceevs_preins_txt($p['centroTrabajo'] ?? '', 120),
    'iglesia'       => ceevs_preins_txt($p['iglesia'] ?? '', 120),
    'lider'         => ceevs_preins_txt($p['lider'] ?? '', 100),
    'ingreso'       => ceevs_preins_txt($p['ingreso'] ?? '', 40),
  );
}

$padre = ceevs_preins_limpia_padre($body['padre'] ?? null);
$madre = ceevs_preins_limpia_padre($body['madre'] ?? null);

// Debe quedar al menos una forma de contactar a la familia.
$contacto = '';
foreach (array($madre, $padre) as $p) {
  if (empty($p['aplica'])) {
    continue;
  }
  if ($contacto === '' && (string) $p['celular'] !== '') { $contacto = $p['celular']; }
  if ($contacto === '' && (string) $p['telFijo'] !== '') { $contacto = $p['telFijo']; }
  if ($contacto === '' && (string) $p['correo'] !== '')  { $contacto = $p['correo']; }
}
if ($contacto === '') {
  json_fail('Necesitamos al menos un teléfono o correo del padre o de la madre para poder contactarlos.');
}

/* ─── Hermanos ─── */

$hermanos = array();
$hs = is_array($body['hermanos'] ?? null) ? $body['hermanos'] : array();
foreach (array_slice($hs, 0, CEEVS_PREINS_MAX_HERMANOS) as $h) {
  if (!is_array($h)) {
    continue;
  }
  $hn = ceevs_preins_txt($h['nombre'] ?? '', 120);
  if ($hn === '') {
    continue;
  }
  $hermanos[] = array(
    'nombre'  => $hn,
    'edad'    => ceevs_preins_txt($h['edad'] ?? '', 4),
    'estudia' => !empty($h['estudia']),
    'trabaja' => !empty($h['trabaja']),
  );
}

/* ─── Cómo nos conoció ─── */

$motivosOk = array('cristiana', 'academico', 'instalaciones', 'todas');
$motivo = array();
foreach (is_array($body['motivo'] ?? null) ? $body['motivo'] : array() as $m) {
  $m = ceevs_preins_enum($m, $motivosOk);
  if ($m !== '' && !in_array($m, $motivo, true)) {
    $motivo[] = $m;
  }
}

/* ─── Ensamblado y guardado ─── */

// Cerrojo: desde aquí hasta guardar el índice, un solo proceso a la vez. Sin
// esto, dos envíos simultáneos leen el mismo índice y el segundo pisa al primero
// (se pierde una solicitud y el correlativo repite número).
$lock = ceevs_preins_lock();

$ix = ceevs_preins_index();

// Tope de almacenamiento: cada solicitud es un archivo más (y su foto). Agotar
// la cuota de disco o de inodos del hosting no tumbaría solo el formulario,
// sino el sitio entero, así que aquí se corta antes.
if (ceevs_preins_lleno($ix)) {
  ceevs_preins_unlock($lock);
  // Una sola anotación por ventana: si no, la propia bitácora se vuelve carga.
  if (ceevs_preins_primera_vez('lleno')) {
    ceevs_audit('preinscripcion_tope', 'Almacén lleno: ' . count($ix['items']) . ' solicitudes', false, 'formulario público');
  }
  json_fail('En este momento no podemos recibir más solicitudes en línea. Comunícate con admisiones al 9221-5752.', 503);
}

$id = ceevs_preins_new_id();
$num = (int) $ix['next'];
$pdfToken = bin2hex(random_bytes(32));

$rec = array(
  'id'         => $id,
  'num'        => $num,
  't'          => gmdate('c'),
  'estado'     => 'nueva',
  'ip'         => ceevs_client_ip(),
  'ciclo'      => (string) $settings['ciclo'],
  'alumno'     => $alumno,
  'padre'      => $padre,
  'madre'      => $madre,
  'hermanos'   => $hermanos,
  'medio'      => ceevs_preins_enum($body['medio'] ?? '', array('pariente', 'amigo', 'redes', 'otro')),
  'medioOtro'  => ceevs_preins_txt($body['medioOtro'] ?? '', 80),
  'motivo'     => $motivo,
  'familiares' => ceevs_preins_txt($body['familiares'] ?? '', 120),
  'parentesco' => ceevs_preins_txt($body['parentesco'] ?? '', 80),
  'nivel'      => ceevs_preins_txt($body['nivel'] ?? '', 80),
  'firma'      => ceevs_preins_txt($body['firma'] ?? '', 120),
  'notas'      => '',
  'foto'       => false,
  'pdf'        => false,
  'pdfTokenHash' => hash('sha256', $pdfToken),
  'pdfTokenExpires' => time() + 1800,
);

// La foto solo entra si queda presupuesto de disco. Si no, la solicitud se
// guarda igual sin ella: vale mucho más el dato de la familia que la fotografía.
$fotoBytes = 0;
if (!empty($body['foto']) && ceevs_preins_cabe_foto($ix)) {
  $fotoBytes = ceevs_preins_save_foto($id, $body['foto']);
  $rec['foto'] = $fotoBytes > 0;
}

if (!ceevs_preins_write($id, $rec)) {
  ceevs_preins_unlock($lock);
  json_fail('No pudimos guardar la solicitud en el servidor. Intenta de nuevo en unos minutos.', 500);
}

$ix['next'] = $num + 1;
$ix['bytes'] = (int) $ix['bytes'] + $fotoBytes;
array_unshift($ix['items'], ceevs_preins_row($rec));
ceevs_preins_save_index($ix);

ceevs_preins_unlock($lock);

// El cupo se descuenta hasta aquí: solo cuentan las solicitudes realmente guardadas.
ceevs_preins_rate_contar();

ceevs_audit(
  'preinscripcion_recibida',
  'Solicitud #' . $num . ' — ' . $nombre . ' (' . $grado . ')',
  true,
  'formulario público'
);

/* ─── Aviso al área de admisiones ─── */

$destinoAdmisiones = ceevs_admissions_recipient((string) $settings['correo']);
if (
  !empty($settings['notificar']) &&
  filter_var($destinoAdmisiones, FILTER_VALIDATE_EMAIL) &&
  ceevs_preins_correo_permitido()
) {
  $host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
  $texto = ceevs_preins_texto($rec)
    . "\n\n────────────────────────────────────────\n"
    . "Esta solicitud también quedó guardada en el archivo privado de admisiones.\n"
    . "Entra al panel para gestionarla, ver la fotografía y descargar el PDF:\n"
    . 'https://' . ($host !== '' ? $host : 'www.virginiasapp.edu.hn') . "/admin.html\n\n"
    . "— Aviso automático del sitio del Centro Educativo Evangélico Virginia Sapp.";
  $correoEnviado = ceevs_send_mail(
    $destinoAdmisiones,
    'Solicitud de admisión #' . $num . ' — ' . $nombre,
    $texto
  );
  ceevs_audit(
    $correoEnviado ? 'preins_correo_enviado' : 'preins_correo_fallo',
    'Solicitud #' . $num . ' — entrega al correo institucional',
    $correoEnviado,
    'sistema'
  );
}

json_out(array(
  'ok' => true,
  'num' => $num,
  'id' => $id,
  't' => $rec['t'],
  'pdfToken' => $pdfToken,
));
