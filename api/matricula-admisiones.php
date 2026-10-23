<?php
/** Endpoint privado de consulta para Matrícula Digital. */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/preinscripciones-lib.php';
require_once __DIR__ . '/admission-workflow.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function matricula_admisiones_fail(string $message, int $status): void {
  http_response_code($status);
  echo json_encode(array('ok' => false, 'error' => $message), JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') matricula_admisiones_fail('Método no permitido.', 405);
$isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
  || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
if (!$isHttps) matricula_admisiones_fail('La integración requiere HTTPS.', 403);
$secret = getenv('CEEVS_MATRICULA_SHARED_SECRET');
if (!is_string($secret) || strlen($secret) < 32) matricula_admisiones_fail('Integración no configurada.', 503);
$timestamp = (string) ($_SERVER['HTTP_X_CEEVS_TIMESTAMP'] ?? '');
$signature = (string) ($_SERVER['HTTP_X_CEEVS_SIGNATURE'] ?? '');
$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 8192 || !ceevs_admision_timestamp_valido($timestamp)
    || preg_match('/^[a-f0-9]{64}$/', $signature) !== 1) {
  matricula_admisiones_fail('Solicitud de integración inválida o vencida.', 401);
}
$path = '/api/matricula-admisiones.php';
if (!ceevs_admision_firma_valida($timestamp, $path, $raw, $signature, $secret)) {
  matricula_admisiones_fail('Firma de integración no válida.', 401);
}
$request = json_decode($raw, true);
$requestId = is_array($request) ? ($request['request_id'] ?? '') : '';
if (!is_string($requestId) || preg_match('/^[a-f0-9]{32}$/', $requestId) !== 1) {
  matricula_admisiones_fail('Identificador de solicitud inválido.', 400);
}
ceevs_ensure_data_dir();
$claimed = ceevs_admision_replay_claim($requestId,
  CEEVS_DATA_DIR . '/admissions-replay.php');
if ($claimed === false) matricula_admisiones_fail('Solicitud repetida.', 409);
if ($claimed !== true) matricula_admisiones_fail('No se pudo asegurar la unicidad de la solicitud.', 503);
$email = is_array($request) ? strtolower(trim((string) ($request['parent_email'] ?? ''))) : '';
$year = is_array($request) ? filter_var($request['year'] ?? null, FILTER_VALIDATE_INT) : false;
if (!is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false || !$year || $year < 2020 || $year > 2100) {
  matricula_admisiones_fail('Parámetros inválidos.', 400);
}

$index = ceevs_preins_index();
$candidates = array();
$pendingApplications = array();
foreach (($index['items'] ?? array()) as $item) {
  $id = (string) ($item['id'] ?? '');
  if (!ceevs_preins_valid_id($id)) continue;
  $record = ceevs_preins_read($id);
  if (!is_array($record)) continue;
  if (ceevs_admision_contacto_corresponde($record, $email) === null
      || !ceevs_admision_ciclo_incluye_anio((string) ($record['ciclo'] ?? ''), (int) $year)) continue;
  $eligibility = ceevs_admision_elegibilidad($record, $email, (int) $year);
  $student = is_array($record['alumno'] ?? null) ? $record['alumno'] : array();
  if (!$eligibility['elegible']) {
    $pendingApplications[] = array('name' => trim((string) ($student['nombre'] ?? '')),
      'requirements' => $eligibility['pendientes']);
    continue;
  }
  $candidates[] = array(
    'application_id' => $id,
    'name' => trim((string) ($student['nombre'] ?? '')),
    'birth_date' => (string) ($student['fechaNac'] ?? ''),
    'identity' => $eligibility['identidad'],
    'grade' => trim((string) ($student['grado'] ?? '')),
    'cycle' => (string) ($record['ciclo'] ?? ''),
    'guardian_name' => trim((string) ($eligibility['contacto']['nombre'] ?? '')),
    'guardian_phone' => trim((string) (($eligibility['contacto']['celular'] ?? '') ?: ($eligibility['contacto']['telFijo'] ?? ''))),
  );
}
echo json_encode(array('ok' => true, 'candidates' => $candidates,
  'pending_applications' => $pendingApplications), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
