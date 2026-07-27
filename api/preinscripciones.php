<?php
/**
 * preinscripciones.php — Bandeja de pre-inscripciones del panel (requiere sesión).
 *
 * GET  ?action=list              → { ok, items, settings, next, stats }
 * GET  ?action=get&id=…          → { ok, rec, texto }
 * GET  ?action=foto&id=…         → la foto del alumno (binaria, nunca pública)
 * GET  ?action=pdf&id=…          → el PDF ya guardado (descarga autenticada)
 * POST { action: 'estado',   id, estado }
 * POST { action: 'notas',    id, notas }
 * POST { action: 'eliminar', id }
 * POST { action: 'ajustes',  correo, notificar, abierto, ciclo, proximo }
 *
 * Son datos personales de menores de edad: cada lectura exige sesión activa y
 * cada escritura además el token CSRF, igual que el resto del panel.
 */

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/preinscripciones-lib.php';

require_auth();

/**
 * Ficha de la base de datos para el panel.
 *
 * Nunca incluye la contraseña: solo si hay una guardada. El administrador no
 * necesita volver a verla y así no viaja al navegador ni queda en la caché.
 */
function ceevs_preins_bd_estado(): array {
  $c = ceevs_db_config();
  $configurada = ceevs_db_configurada();
  $conectada = $configurada && ceevs_db_ready();

  $pendientes = 0;
  if ($conectada) {
    $enDisco = ceevs_preins_db_ids_en_disco();
    if ($enDisco) {
      $st = ceevs_db_run('SELECT id FROM ' . CEEVS_DB_TABLA_PREINS);
      $enBase = $st === null ? array() : $st->fetchAll(PDO::FETCH_COLUMN);
      $pendientes = count(array_diff(array_keys($enDisco), array_map('strval', $enBase)));
    }
  }

  $origen = ceevs_db_origen();

  return array(
    'soportada'   => ceevs_db_soportada(),
    'configurada' => $configurada,
    'conectada'   => $conectada,
    'error'       => $conectada ? '' : ceevs_db_error(),
    'host'        => $c['host'],
    'puerto'      => $c['puerto'],
    'nombre'      => $c['nombre'],
    'usuario'     => $c['usuario'],
    'tieneClave'  => $c['clave'] !== '',
    // Dónde quedaron las credenciales y si ese sitio aguanta una publicación:
    // es lo que responde "¿tengo que volver a hacer esto cada vez?".
    'origen'      => $origen['ruta'],
    'permanente'  => $origen['permanente'],
    'pendientes'  => $pendientes,
  );
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
$requestAction = isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : '';

/* El panel puede crear la copia que falte en solicitudes anteriores. Recibe el
   Blob directo para no inflarlo un 33 % convirtiéndolo a base64. */
if ($metodo === 'POST' && $requestAction === 'pdf') {
  ceevs_require_csrf();
  $id = isset($_GET['id']) && is_string($_GET['id']) ? strtolower(trim($_GET['id'])) : '';
  $tipo = strtolower(trim((string) ($_SERVER['CONTENT_TYPE'] ?? '')));
  $largo = max(0, (int) ($_SERVER['CONTENT_LENGTH'] ?? 0));
  if (!ceevs_preins_valid_id($id)) {
    json_fail('Solicitud no encontrada.', 404);
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
  $guardado = ceevs_preins_save_pdf($id, '', $pdf, true, $motivo);
  if ($guardado === null) {
    ceevs_audit(
      'preins_pdf_fallo',
      'Solicitud ' . $id . ' — ' . ($motivo !== '' ? $motivo : 'desconocido') . ' (' . strlen($pdf) . ' bytes, desde el panel)',
      false
    );
    json_fail('No se pudo guardar el PDF de la solicitud.', 422);
  }
  ceevs_audit('preins_pdf_guardado', 'PDF recreado desde el panel: ' . $guardado['archivo']);
  json_out(array('ok' => true, 'archivo' => $guardado['archivo'], 'bytes' => $guardado['bytes']));
}

/* ─── Lecturas ─── */

if ($metodo === 'GET') {
  $action = isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : 'list';

  if ($action === 'list') {
    // Al abrir la bandeja se suben a la base, en tandas cortas, las solicitudes
    // que aún estuvieran solo en archivos (las anteriores a la base de datos, o
    // las recibidas mientras la conexión estuvo caída).
    if (ceevs_preins_usa_db()) {
      ceevs_preins_db_importar(25);
    }
    $ix = ceevs_preins_index();
    $stats = array('total' => count($ix['items']), 'nueva' => 0, 'leida' => 0, 'contactada' => 0, 'archivada' => 0);
    foreach ($ix['items'] as $it) {
      $e = (string) ($it['estado'] ?? 'nueva');
      if (isset($stats[$e])) {
        $stats[$e]++;
      }
    }
    json_out(array(
      'ok'       => true,
      'items'    => $ix['items'],
      'settings' => $ix['settings'],
      'next'     => $ix['next'],
      'stats'    => $stats,
    ));
  }

  /* Dónde están de verdad las solicitudes.
     Con base de datos informa de la conexión y de cuánto hay guardado; sin
     ella, de la carpeta de admisiones y su ruta absoluta, para poder
     contrastarla con la del Administrador de archivos del hosting. */
  if ($action === 'salud') {
    $dir = CEEVS_PREINS_DIR;
    $existe = @is_dir($dir);
    $recs = 0;
    $pdfs = 0;
    $pdfBytes = 0;
    if ($existe) {
      $names = @scandir($dir);
      if (is_array($names)) {
        foreach ($names as $name) {
          if (preg_match('/^rec-[a-f0-9]{16}\.php$/', $name) === 1) {
            $recs++;
          } elseif (substr($name, -4) === '.pdf') {
            $pdfs++;
            $pdfBytes += max(0, (int) @filesize($dir . '/' . $name));
          }
        }
      }
    }

    $enDb = ceevs_preins_usa_db();
    if ($enDb) {
      $db = ceevs_preins_db_stats();
      $recs = $db['total'];
      $pdfs = $db['pdfs'];
      $pdfBytes = $db['bytes'];
    }

    $ix = ceevs_preins_index();
    $sinPdf = 0;
    foreach ($ix['items'] as $it) {
      if (empty($it['pdf'])) {
        $sinPdf++;
      }
    }
    json_out(array(
      'ok'         => true,
      'bd'         => ceevs_preins_bd_estado(),
      'ruta'       => $dir,
      'existe'     => $existe,
      'escribible' => $existe && @is_writable($dir),
      'recs'       => $recs,
      'pdfs'       => $pdfs,
      'pdfBytes'   => $pdfBytes,
      'sinPdf'     => $sinPdf,
      'total'      => count($ix['items']),
    ));
  }

  /* Ficha de la base de datos para la tarjeta del panel. La contraseña jamás
     sale de aquí: solo se dice si hay una guardada. */
  if ($action === 'bd') {
    json_out(array('ok' => true, 'bd' => ceevs_preins_bd_estado()));
  }

  $id = isset($_GET['id']) && is_string($_GET['id']) ? $_GET['id'] : '';
  if (!ceevs_preins_valid_id($id)) {
    json_fail('Solicitud no encontrada.', 404);
  }

  if ($action === 'foto') {
    $archivo = ceevs_preins_archivo($id, 'foto');
    if ($archivo === null) {
      json_fail('Esta solicitud no tiene foto.', 404);
    }
    $ext = strtolower((string) pathinfo($archivo['nombre'], PATHINFO_EXTENSION));
    header('Cache-Control: private, max-age=300');
    ceevs_preins_enviar_archivo($archivo, 'inline', 'foto-solicitud.' . ($ext !== '' ? $ext : 'jpg'));
  }

  if ($action === 'pdf') {
    $archivo = ceevs_preins_archivo($id, 'pdf');
    if ($archivo === null) {
      json_fail('Esta solicitud todavía no tiene una copia PDF guardada.', 404);
    }
    header('Cache-Control: private, no-store');
    ceevs_preins_enviar_archivo($archivo, 'attachment', basename($archivo['nombre']));
  }

  if ($action === 'get') {
    $rec = ceevs_preins_read($id);
    if ($rec === null) {
      json_fail('Solicitud no encontrada.', 404);
    }
    unset($rec['pdfTokenHash'], $rec['pdfTokenExpires']);
    json_out(array('ok' => true, 'rec' => $rec, 'texto' => ceevs_preins_texto($rec)));
  }

  json_fail('Acción no reconocida.');
}

/* ─── Escrituras ─── */

if ($metodo !== 'POST') {
  json_fail('Método no permitido.', 405);
}

ceevs_require_csrf();

// Lo más grande que manda el panel son las notas internas (1500 caracteres).
$body = read_json_body(262144);
$action = isset($body['action']) && is_string($body['action']) ? $body['action'] : '';

/* ─── Configuración de la base de datos ───
   Se prueba la conexión ANTES de guardar nada y, si funciona, se aprovecha la
   misma petición para crear las tablas e importar lo que hubiera en archivos. */
if ($action === 'bd') {
  $actual = ceevs_db_config();
  $clave = isset($body['clave']) && is_string($body['clave']) ? $body['clave'] : '';
  $nueva = array(
    'host'    => ceevs_preins_txt($body['host'] ?? '', 120),
    'puerto'  => (int) ($body['puerto'] ?? 3306),
    'nombre'  => ceevs_preins_txt($body['nombre'] ?? '', 64),
    'usuario' => ceevs_preins_txt($body['usuario'] ?? '', 64),
    // Dejar la contraseña en blanco significa "conservar la que ya está
    // guardada": es lo que permite corregir el host sin volver a escribirla.
    'clave'   => $clave !== '' ? $clave : (string) $actual['clave'],
  );

  $error = '';
  if (!ceevs_db_probar($nueva, $error)) {
    ceevs_audit('bd_config_fallo', 'Prueba de conexión fallida: ' . $error, false);
    json_fail($error, 400, array('bd' => ceevs_preins_bd_estado()));
  }
  if (!ceevs_db_save_config($nueva, $error)) {
    json_fail($error !== '' ? $error : 'No se pudo guardar la configuración.', 500);
  }

  // Reconectar con lo recién guardado y subir lo que estuviera en archivos.
  ceevs_db_reset();
  ceevs_preins_usa_db(true);
  $importado = ceevs_preins_db_importar(25);

  ceevs_audit('bd_config', 'Base de datos conectada: ' . $nueva['usuario'] . '@' . $nueva['host'] . '/' . $nueva['nombre']);
  json_out(array(
    'ok' => true,
    'bd' => ceevs_preins_bd_estado(),
    'importado' => $importado,
  ));
}

/* Traslado manual de lo que quedó en archivos. Va por tandas: el navegador
   vuelve a pedirlo mientras queden pendientes. */
if ($action === 'importar') {
  if (!ceevs_preins_usa_db()) {
    json_fail('Primero hay que conectar la base de datos.', 400);
  }
  $importado = ceevs_preins_db_importar(25);
  if ($importado['importadas'] > 0) {
    ceevs_audit('bd_importacion', $importado['importadas'] . ' solicitud(es) trasladada(s) de archivos a la base de datos');
  }
  json_out(array('ok' => true, 'importado' => $importado, 'bd' => ceevs_preins_bd_estado()));
}

if ($action === 'ajustes') {
  $ix = ceevs_preins_index();
  $correo = ceevs_preins_txt($body['correo'] ?? '', 100);
  if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    json_fail('El correo de admisiones no es válido.');
  }
  $ix['settings']['correo']    = $correo;
  $ix['settings']['notificar'] = !empty($body['notificar']);
  $ix['settings']['abierto']   = !empty($body['abierto']);
  $ix['settings']['ciclo']     = ceevs_preins_txt($body['ciclo'] ?? '', 30);

  // El correlativo solo puede moverse hacia adelante: nunca se repite un número.
  $proximo = (int) ($body['proximo'] ?? 0);
  if ($proximo > 0 && $proximo >= (int) $ix['next']) {
    $ix['next'] = $proximo;
  }

  if (!ceevs_preins_save_index($ix)) {
    json_fail('No se pudieron guardar los ajustes.', 500);
  }
  ceevs_audit('preins_ajustes', 'Ajustes de pre-inscripciones — correo: ' . ($correo !== '' ? $correo : '(vacío)')
    . ', formulario: ' . (!empty($ix['settings']['abierto']) ? 'abierto' : 'cerrado')
    . ', próximo número: ' . $ix['next']);
  json_out(array('ok' => true, 'settings' => $ix['settings'], 'next' => $ix['next']));
}

$id = isset($body['id']) && is_string($body['id']) ? $body['id'] : '';
if (!ceevs_preins_valid_id($id)) {
  json_fail('Solicitud no encontrada.', 404);
}

if ($action === 'eliminar') {
  $rec = ceevs_preins_read($id);
  $nom = $rec !== null ? (string) ($rec['alumno']['nombre'] ?? '') : '';
  $num = $rec !== null ? (int) ($rec['num'] ?? 0) : 0;
  if (!ceevs_preins_delete($id)) {
    json_fail('No se pudo eliminar la solicitud.', 500);
  }
  ceevs_audit('preins_eliminada', 'Eliminó la solicitud #' . $num . ' — ' . $nom);
  json_out(array('ok' => true));
}

$rec = ceevs_preins_read($id);
if ($rec === null) {
  json_fail('Solicitud no encontrada.', 404);
}

if ($action === 'estado') {
  $estado = ceevs_preins_enum($body['estado'] ?? '', CEEVS_PREINS_ESTADOS);
  if ($estado === '') {
    json_fail('Estado no válido.');
  }
  $rec['estado'] = $estado;
} elseif ($action === 'notas') {
  $rec['notas'] = ceevs_preins_multi($body['notas'] ?? '', 1500);
} else {
  json_fail('Acción no reconocida.');
}

if (!ceevs_preins_write($id, $rec) || !ceevs_preins_touch_row($rec)) {
  json_fail('No se pudo guardar el cambio.', 500);
}

if ($action === 'estado') {
  ceevs_audit('preins_estado', 'Solicitud #' . (int) $rec['num'] . ' marcada como "' . $rec['estado'] . '"');
}

json_out(array('ok' => true, 'rec' => $rec));
