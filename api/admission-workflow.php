<?php
/** Reglas comunes de evaluación de admisión y validación del DNI hondureño. */
declare(strict_types=1);

const CEEVS_RESULTADOS_ADMISION = array('PENDIENTE', 'APROBADO', 'REPROBADO');
const CEEVS_DECISION_ADMISION = array('PENDIENTE', 'APROBADA', 'RECHAZADA');

function ceevs_admision_identidad_normalizar($value): ?string {
  if (!is_scalar($value)) return null;
  $digits = preg_replace('/[\\s-]+/', '', trim((string) $value));
  return is_string($digits) && preg_match('/^\\d{13}$/', $digits) === 1 ? $digits : null;
}

function ceevs_admision_identidad_formatear(string $digits): string {
  $digits = ceevs_admision_identidad_normalizar($digits) ?? '';
  return $digits === '' ? '' : substr($digits, 0, 4) . '-' . substr($digits, 4, 4) . '-' . substr($digits, 8, 5);
}

function ceevs_admision_ciclo_incluye_anio(string $cycle, int $year): bool {
  preg_match_all('/(?<!\\d)(20\\d{2})(?!\\d)/', $cycle, $matches);
  return in_array((string) $year, $matches[1] ?? array(), true);
}

function ceevs_admision_ciclo_anio_actual(string $cycle): int {
  preg_match_all('/(?<!\\d)(20\\d{2})(?!\\d)/', $cycle, $matches);
  return (int) (end($matches[1]) ?: 0);
}

function ceevs_admision_firma_valida(string $timestamp, string $path, string $raw,
    string $signature, string $secret): bool {
  if (preg_match('/^[a-f0-9]{64}$/', $signature) !== 1 || $secret === '') return false;
  $expected = hash_hmac('sha256', $timestamp . "\n" . $path . "\n" . $raw, $secret);
  return hash_equals($expected, $signature);
}

function ceevs_admision_timestamp_valido(string $timestamp, ?int $now = null): bool {
  if ($timestamp === '' || !ctype_digit($timestamp) || strlen($timestamp) > 12) return false;
  $now = $now ?? time();
  return abs($now - (int) $timestamp) <= 60;
}

/** Claims a signed request ID once; concurrent copies serialize on a private lock. */
function ceevs_admision_replay_claim(string $requestId, string $cachePath, ?int $now = null): ?bool {
  if (preg_match('/^[a-f0-9]{32}$/', $requestId) !== 1) return null;
  $now = $now ?? time();
  $lock = @fopen($cachePath . '.lock', 'c');
  if ($lock === false) return null;
  @chmod($cachePath . '.lock', 0600);
  if (!flock($lock, LOCK_EX)) {
    fclose($lock);
    return null;
  }
  try {
    $cache = array();
    if (is_file($cachePath)) {
      $cache = ceevs_read_guarded($cachePath);
      if (!is_array($cache)) return null;
    }
    foreach ($cache as $key => $seenAt) {
      if (!is_int($seenAt) || $seenAt < $now - 120 || $seenAt > $now + 60) unset($cache[$key]);
    }
    if (array_key_exists($requestId, $cache) || count($cache) >= 10000) return false;
    $cache[$requestId] = $now;
    if (!ceevs_write_guarded($cachePath, $cache)) return null;
    @chmod($cachePath, 0600);
    return true;
  } finally {
    flock($lock, LOCK_UN);
    fclose($lock);
  }
}

function ceevs_admision_contacto_corresponde(array $record, string $email): ?array {
  $email = strtolower(trim($email));
  if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) return null;
  foreach (array('padre', 'madre') as $key) {
    $guardian = is_array($record[$key] ?? null) ? $record[$key] : array();
    if (!empty($guardian['aplica']) && strtolower(trim((string) ($guardian['correo'] ?? ''))) === $email) {
      return $guardian;
    }
  }
  return null;
}

/** Evalúa todos los requisitos sin inferirlos del estado general de lectura/contacto. */
function ceevs_admision_elegibilidad(array $record, string $parentEmail, int $year): array {
  $pending = array();
  $admissions = is_array($record['admisiones'] ?? null) ? $record['admisiones'] : array();
  $student = is_array($record['alumno'] ?? null) ? $record['alumno'] : array();
  $contact = ceevs_admision_contacto_corresponde($record, $parentEmail);

  if ($contact === null) $pending[] = 'La solicitud no corresponde a la cuenta Padre autenticada.';
  if (!ceevs_admision_ciclo_incluye_anio((string) ($record['ciclo'] ?? ''), $year)) {
    $pending[] = 'La solicitud de admisión no corresponde al año lectivo activo.';
  }
  $identity = ceevs_admision_identidad_normalizar($student['identidad'] ?? '');
  $birth = (string) ($student['fechaNac'] ?? '');
  $birthParts = explode('-', $birth);
  $validBirth = count($birthParts) === 3 && checkdate((int) $birthParts[1], (int) $birthParts[2], (int) $birthParts[0]);
  if (trim((string) ($student['nombre'] ?? '')) === '' || !$validBirth || $identity === null || trim((string) ($student['grado'] ?? '')) === '') {
    $pending[] = 'La solicitud tiene datos obligatorios del aspirante incompletos.';
  }
  if (($admissions['decision'] ?? 'PENDIENTE') !== 'APROBADA') {
    $pending[] = 'La solicitud de admisión aún no está aprobada.';
  }
  foreach (array('examen' => 'Examen', 'entrevista' => 'Entrevista') as $key => $label) {
    $result = is_array($admissions[$key] ?? null) ? ($admissions[$key]['resultado'] ?? 'PENDIENTE') : 'PENDIENTE';
    if ($result !== 'APROBADO') $pending[] = $label . ' de admisión no está aprobado.';
  }
  if (empty($admissions['matricula_autorizada'])) {
    $pending[] = 'Falta la autorización institucional explícita para matricular.';
  }
  return array(
    'elegible' => count($pending) === 0,
    'pendientes' => $pending,
    'contacto' => $contact,
    'identidad' => $identity,
  );
}

function ceevs_admision_fecha_valida($value): bool {
  if (!is_string($value) || preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $value) !== 1) return false;
  $parts = explode('-', $value);
  return checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0]);
}

function ceevs_admision_horario_valido($value): bool {
  return is_string($value) && preg_match('/^(?:[01]\\d|2[0-3]):[0-5]\\d$/', $value) === 1;
}

function ceevs_admision_cita_valida($appointment): bool {
  if (!is_array($appointment)) return false;
  $placeOrMode = trim((string) ($appointment['lugar'] ?? '')) !== ''
    || trim((string) ($appointment['modalidad'] ?? '')) !== '';
  return ceevs_admision_fecha_valida($appointment['fecha'] ?? null)
    && ceevs_admision_horario_valido($appointment['hora'] ?? null)
    && $placeOrMode
    && trim((string) ($appointment['instrucciones'] ?? '')) !== '';
}
