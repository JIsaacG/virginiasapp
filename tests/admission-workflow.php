<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/db.php';
require_once __DIR__ . '/../api/admission-workflow.php';

function check(bool $condition, string $message): void {
  if (!$condition) {
    fwrite(STDERR, "FAIL: {$message}\n");
    exit(1);
  }
}

$record = array(
  'ciclo' => '2026-2027',
  'alumno' => array('nombre' => 'Andrea Zuniga', 'fechaNac' => '2015-04-03',
    'identidad' => '0801-2015-01234', 'grado' => 'Pre-Kinder'),
  'padre' => array('aplica' => true, 'correo' => 'parent@example.test', 'nombre' => 'Tutor'),
  'admisiones' => array(
    'decision' => 'APROBADA',
    'examen' => array('resultado' => 'APROBADO'),
    'entrevista' => array('resultado' => 'APROBADO'),
    'matricula_autorizada' => true,
  ),
);

$secret = bin2hex(random_bytes(24));
$timestamp = '1800000000';
$path = '/api/matricula-admisiones.php';
$rawBody = '{"parent_email":"parent@example.test","year":2027,"request_id":"0123456789abcdef0123456789abcdef"}';
$signature = hash_hmac('sha256', $timestamp . "\n" . $path . "\n" . $rawBody, $secret);
$requestValidation = ceevs_admision_consulta_validar('POST', true, $timestamp,
  $signature, $rawBody, $secret, 1800000000);
check($requestValidation['status'] === 200
  && $requestValidation['request']['parent_email'] === 'parent@example.test',
  'el contrato HTTP firmado y sus campos tipados se aceptan');
check(ceevs_admision_consulta_validar('GET', true, $timestamp, $signature,
  $rawBody, $secret, 1800000000)['status'] === 405, 'método distinto de POST se rechaza');
check(ceevs_admision_consulta_validar('POST', false, $timestamp, $signature,
  $rawBody, $secret, 1800000000)['status'] === 403, 'HTTP sin TLS se rechaza');
check(ceevs_admision_consulta_validar('POST', true, $timestamp, $signature,
  $rawBody, 'short', 1800000000)['status'] === 503, 'secreto ausente o corto falla cerrado');
check(ceevs_admision_consulta_validar('POST', true, $timestamp, str_repeat('0', 64),
  $rawBody, $secret, 1800000000)['status'] === 401, 'firma inválida se rechaza');
check(ceevs_admision_consulta_validar('POST', true, '1799999939', $signature,
  $rawBody, $secret, 1800000000)['status'] === 401, 'timestamp vencido se rechaza en el contrato');
check(ceevs_admision_consulta_validar('POST', true, $timestamp, $signature,
  str_repeat('x', 8193), $secret, 1800000000)['status'] === 413, 'cuerpo sobre el límite se rechaza');
$malformedBody = '{"parent_email":';
$malformedSignature = hash_hmac('sha256', $timestamp . "\n" . $path . "\n" . $malformedBody, $secret);
check(ceevs_admision_consulta_validar('POST', true, $timestamp, $malformedSignature,
  $malformedBody, $secret, 1800000000)['status'] === 400, 'JSON malformado se rechaza');
$extraBody = '{"parent_email":"parent@example.test","year":2027,"request_id":"0123456789abcdef0123456789abcdef","role":"admin"}';
$extraSignature = hash_hmac('sha256', $timestamp . "\n" . $path . "\n" . $extraBody, $secret);
check(ceevs_admision_consulta_validar('POST', true, $timestamp, $extraSignature,
  $extraBody, $secret, 1800000000)['status'] === 400, 'campos fuera del contrato se rechazan');
check(ceevs_admision_firma_valida($timestamp, $path, $rawBody, $signature, $secret),
  'la firma HMAC del cliente se acepta con el contrato compartido');
check(!ceevs_admision_firma_valida($timestamp, $path, $rawBody . ' ', $signature, $secret),
  'el cuerpo alterado invalida la firma HMAC');
check(!ceevs_admision_firma_valida($timestamp, '/otro-endpoint', $rawBody, $signature, $secret),
  'la ruta alterada invalida la firma HMAC');
check(!ceevs_admision_firma_valida($timestamp, $path, $rawBody, str_repeat('0', 64), $secret),
  'una firma incorrecta deniega la consulta');
check(ceevs_admision_timestamp_valido('1800000000', 1800000060),
  'una marca con desviación máxima de 60 segundos es válida');
check(!ceevs_admision_timestamp_valido('1799999939', 1800000000),
  'una marca vencida se rechaza');
check(!ceevs_admision_timestamp_valido('1800000061', 1800000000),
  'una marca futura fuera de ventana se rechaza');

$privateEnvSecret = bin2hex(random_bytes(24));
$privateEnv = "# isolated fixture\nCEEVS_MATRICULA_SHARED_SECRET='" . $privateEnvSecret
  . "'\nCEEVS_PARENT_PORTAL_URL=https://portal.example.test # comment\nUNRELATED_SECRET=must-not-load\n";
$parsedConfig = ceevs_db_env_parse($privateEnv);
check(($parsedConfig['CEEVS_MATRICULA_SHARED_SECRET'] ?? '') === $privateEnvSecret,
  'el .env privado permite cargar la clave de integración');
check(($parsedConfig['CEEVS_PARENT_PORTAL_URL'] ?? '') === 'https://portal.example.test',
  'el .env privado permite cargar el portal institucional');
check(!array_key_exists('UNRELATED_SECRET', $parsedConfig),
  'el cargador ignora variables no permitidas');

$replayCache = sys_get_temp_dir() . '/ceevs-admission-replay-' . bin2hex(random_bytes(8)) . '.php';
check(ceevs_admision_replay_claim('0123456789abcdef0123456789abcdef', $replayCache, 1800000000) === true,
  'la primera solicitud con un ID nuevo se registra');
check(ceevs_admision_replay_claim('0123456789abcdef0123456789abcdef', $replayCache, 1800000001) === false,
  'el mismo ID firmado se rechaza como replay');
check(ceevs_admision_replay_claim('fedcba9876543210fedcba9876543210', $replayCache, 1800000001) === true,
  'un ID nuevo se acepta');
check(ceevs_admision_replay_claim('invalid', $replayCache, 1800000001) === null,
  'un ID inválido no se reclama');
@unlink($replayCache);
@unlink($replayCache . '.lock');

$eligible = ceevs_admision_elegibilidad($record, 'parent@example.test', 2027);
check($eligible['elegible'] === true, 'todos los requisitos aprobados habilitan matrícula');
check($eligible['identidad'] === '0801201501234', 'DNI se normaliza a 13 dígitos');
check(ceevs_admision_ciclo_anio_actual('2026-2027') === 2027, 'se usa el año final del ciclo');

foreach (array(
  array('decision', 'PENDIENTE'),
  array('decision', 'RECHAZADA'),
  array('examen', 'PENDIENTE'),
  array('examen', 'REPROBADO'),
  array('entrevista', 'PENDIENTE'),
  array('entrevista', 'REPROBADO'),
) as $case) {
  $pending = $record;
  if ($case[0] === 'decision') $pending['admisiones']['decision'] = $case[1];
  else $pending['admisiones'][$case[0]]['resultado'] = $case[1];
  check(!ceevs_admision_elegibilidad($pending, 'parent@example.test', 2027)['elegible'],
    $case[0] . ' ' . $case[1] . ' debe denegar matrícula');
}

$unauthorized = $record;
$unauthorized['admisiones']['matricula_autorizada'] = false;
check(!ceevs_admision_elegibilidad($unauthorized, 'parent@example.test', 2027)['elegible'],
  'la autorización explícita es obligatoria');
check(!ceevs_admision_elegibilidad($record, 'other@example.test', 2027)['elegible'],
  'una cuenta encargada distinta no puede consultar al aspirante');
check(!ceevs_admision_elegibilidad($record, 'parent@example.test', 2025)['elegible'],
  'una solicitud de otro año no se autoriza');

$badIdentity = $record;
$badIdentity['alumno']['identidad'] = '123';
check(!ceevs_admision_elegibilidad($badIdentity, 'parent@example.test', 2027)['elegible'],
  'una identidad incompleta deniega matrícula');

echo "OK: reglas de admisión, año, DNI, encargado y autorización.\n";
