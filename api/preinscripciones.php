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
  $guardado = ceevs_preins_save_pdf($id, '', $pdf, true);
  if ($guardado === null) {
    json_fail('No se pudo guardar el PDF de la solicitud.', 422);
  }
  ceevs_audit('preins_pdf_guardado', 'PDF recreado desde el panel: ' . $guardado['archivo']);
  json_out(array('ok' => true, 'archivo' => $guardado['archivo'], 'bytes' => $guardado['bytes']));
}

/* ─── Lecturas ─── */

if ($metodo === 'GET') {
  $action = isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : 'list';

  if ($action === 'list') {
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

  $id = isset($_GET['id']) && is_string($_GET['id']) ? $_GET['id'] : '';
  if (!ceevs_preins_valid_id($id)) {
    json_fail('Solicitud no encontrada.', 404);
  }

  if ($action === 'foto') {
    $path = ceevs_preins_foto_path($id);
    if ($path === null) {
      json_fail('Esta solicitud no tiene foto.', 404);
    }
    $tipos = array('jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp');
    $ext = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($tipos[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . (string) filesize($path));
    header('Cache-Control: private, max-age=300');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: inline; filename="foto-solicitud.' . $ext . '"');
    readfile($path);
    exit;
  }

  if ($action === 'pdf') {
    $rec = ceevs_preins_read($id);
    $path = is_array($rec) ? ceevs_preins_pdf_path($rec) : null;
    if ($path === null) {
      json_fail('Esta solicitud todavía no tiene una copia PDF guardada.', 404);
    }
    $name = basename($path);
    header('Content-Type: application/pdf');
    header('Content-Length: ' . (string) filesize($path));
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: attachment; filename="' . $name . '"');
    readfile($path);
    exit;
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
