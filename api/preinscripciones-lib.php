<?php
/**
 * preinscripciones-lib.php — Almacén de las solicitudes de pre-inscripción.
 *
 * Se carga DESPUÉS de bootstrap.php (usa CEEVS_DATA_DIR y sus utilidades).
 *
 * Todo vive en server-data/preinscripciones/ (gitignored, .htaccess "deny" y
 * además guarda "<?php exit;" en cada archivo, igual que el resto del panel):
 *   - index.php      → índice liviano de la bandeja + ajustes + correlativo
 *   - rec-<id>.php   → la solicitud completa (un archivo por solicitud)
 *   - foto-<id>.<ext>→ foto del alumno (se sirve solo con sesión iniciada)
 *   - guard.php      → freno anti-spam del formulario público (por IP)
 *
 * Son datos personales de menores: NUNCA se exponen sin sesión de administrador.
 */

declare(strict_types=1);

define('CEEVS_PREINS_DIR', CEEVS_DATA_DIR . '/preinscripciones');
define('CEEVS_PREINS_INDEX', CEEVS_PREINS_DIR . '/index.php');
define('CEEVS_PREINS_GUARD', CEEVS_PREINS_DIR . '/guard.php');

const CEEVS_PREINS_MAX_FOTO_BYTES = 2200000;  // 2 MB de foto ya redimensionada
const CEEVS_PREINS_MAX_POR_IP     = 4;        // solicitudes por IP cada hora
const CEEVS_PREINS_VENTANA_IP     = 3600;     // ventana del freno, en segundos
const CEEVS_PREINS_MAX_HERMANOS   = 12;
const CEEVS_PREINS_CORREO_DEFECTO = 'administracion.general@virginiasapp.edu.hn';
const CEEVS_PREINS_NUM_INICIAL    = 111;      // la hoja de papel iba en la 110

/** Estados por los que pasa una solicitud dentro del panel. */
const CEEVS_PREINS_ESTADOS = array('nueva', 'leida', 'contactada', 'archivada');

/* ─── Carpeta ─── */

function ceevs_preins_ensure_dir(): void {
  ceevs_ensure_data_dir();
  if (!is_dir(CEEVS_PREINS_DIR)) {
    @mkdir(CEEVS_PREINS_DIR, 0755, true);
  }
  $ht = CEEVS_PREINS_DIR . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht, "Require all denied\n");
  }
}

/* ─── Índice de la bandeja ─── */

/** Índice completo: ajustes + correlativo + fichas resumidas (más reciente primero). */
function ceevs_preins_index(): array {
  $ix = ceevs_read_guarded(CEEVS_PREINS_INDEX);
  if (!is_array($ix)) {
    $ix = array();
  }
  $ix += array('next' => CEEVS_PREINS_NUM_INICIAL, 'items' => array(), 'settings' => array());
  if (!is_array($ix['items'])) {
    $ix['items'] = array();
  }
  if (!is_array($ix['settings'])) {
    $ix['settings'] = array();
  }
  $ix['settings'] += array(
    'correo'    => CEEVS_PREINS_CORREO_DEFECTO,
    'notificar' => true,
    'abierto'   => true,   // false = el formulario deja de recibir solicitudes
    'ciclo'     => '',     // texto libre: "2026-2027"
  );
  $ix['next'] = max(1, (int) $ix['next']);
  return $ix;
}

function ceevs_preins_save_index(array $ix): bool {
  ceevs_preins_ensure_dir();
  return ceevs_write_guarded(CEEVS_PREINS_INDEX, $ix);
}

function ceevs_preins_settings(): array {
  $ix = ceevs_preins_index();
  return $ix['settings'];
}

/* ─── Identificadores y rutas ─── */

function ceevs_preins_new_id(): string {
  return bin2hex(random_bytes(8));
}

function ceevs_preins_valid_id($id): bool {
  return is_string($id) && preg_match('/^[a-f0-9]{16}$/', $id) === 1;
}

function ceevs_preins_file(string $id): string {
  return CEEVS_PREINS_DIR . '/rec-' . $id . '.php';
}

/** Ruta de la foto del alumno, o null si esa solicitud no trae foto. */
function ceevs_preins_foto_path(string $id): ?string {
  foreach (array('jpg', 'png', 'webp') as $ext) {
    $p = CEEVS_PREINS_DIR . '/foto-' . $id . '.' . $ext;
    if (file_exists($p)) {
      return $p;
    }
  }
  return null;
}

/* ─── Lectura y escritura de solicitudes ─── */

function ceevs_preins_read(string $id): ?array {
  if (!ceevs_preins_valid_id($id)) {
    return null;
  }
  return ceevs_read_guarded(ceevs_preins_file($id));
}

function ceevs_preins_write(string $id, array $rec): bool {
  ceevs_preins_ensure_dir();
  return ceevs_write_guarded(ceevs_preins_file($id), $rec);
}

function ceevs_preins_delete(string $id): bool {
  if (!ceevs_preins_valid_id($id)) {
    return false;
  }
  $foto = ceevs_preins_foto_path($id);
  if ($foto !== null) {
    @unlink($foto);
  }
  @unlink(ceevs_preins_file($id));

  $ix = ceevs_preins_index();
  $ix['items'] = array_values(array_filter($ix['items'], function ($it) use ($id) {
    return (string) ($it['id'] ?? '') !== $id;
  }));
  return ceevs_preins_save_index($ix);
}

/** Ficha resumida que alimenta la lista del panel (sin datos sensibles de más). */
function ceevs_preins_row(array $rec): array {
  $al = is_array($rec['alumno'] ?? null) ? $rec['alumno'] : array();
  $pa = is_array($rec['padre'] ?? null) ? $rec['padre'] : array();
  $ma = is_array($rec['madre'] ?? null) ? $rec['madre'] : array();
  $tel = '';
  $correo = '';
  foreach (array($ma, $pa) as $p) {
    if ($tel === '') {
      $tel = (string) ($p['celular'] ?? '') !== '' ? (string) $p['celular'] : (string) ($p['telFijo'] ?? '');
    }
    if ($correo === '') {
      $correo = (string) ($p['correo'] ?? '');
    }
  }
  return array(
    'id'      => (string) ($rec['id'] ?? ''),
    'num'     => (int) ($rec['num'] ?? 0),
    't'       => (string) ($rec['t'] ?? ''),
    'estado'  => (string) ($rec['estado'] ?? 'nueva'),
    'alumno'  => (string) ($al['nombre'] ?? ''),
    'grado'   => (string) ($al['grado'] ?? ''),
    'encargado' => (string) ($rec['firma'] ?? ''),
    'tel'     => $tel,
    'correo'  => $correo,
    'foto'    => !empty($rec['foto']),
  );
}

/** Reescribe la ficha resumida de una solicitud dentro del índice. */
function ceevs_preins_touch_row(array $rec): bool {
  $ix = ceevs_preins_index();
  $id = (string) ($rec['id'] ?? '');
  $row = ceevs_preins_row($rec);
  $found = false;
  foreach ($ix['items'] as $i => $it) {
    if ((string) ($it['id'] ?? '') === $id) {
      $ix['items'][$i] = $row;
      $found = true;
      break;
    }
  }
  if (!$found) {
    array_unshift($ix['items'], $row);
  }
  return ceevs_preins_save_index($ix);
}

/* ─── Freno anti-spam del formulario público ─── */

/** Lee el registro del freno ya limpio de ventanas vencidas. */
function ceevs_preins_rate_load(): array {
  ceevs_preins_ensure_dir();
  $g = ceevs_read_guarded(CEEVS_PREINS_GUARD);
  if (!is_array($g)) {
    return array();
  }
  $now = time();
  foreach ($g as $k => $rec) {
    if (($now - (int) ($rec['t'] ?? 0)) > CEEVS_PREINS_VENTANA_IP) {
      unset($g[$k]);
    }
  }
  return $g;
}

/**
 * ¿Esta IP ya llegó al tope de solicitudes de la última hora?
 * Solo consulta: no gasta cupo. Así, si a la familia le rebota una validación,
 * no pierde intentos por un dato mal escrito.
 */
function ceevs_preins_rate_bloqueado(): bool {
  $g = ceevs_preins_rate_load();
  $rec = $g[ceevs_client_ip()] ?? array('n' => 0);
  return (int) $rec['n'] >= CEEVS_PREINS_MAX_POR_IP;
}

/** Suma una solicitud al freno. Se llama solo cuando de verdad se guardó. */
function ceevs_preins_rate_contar(): void {
  $g = ceevs_preins_rate_load();
  $ip = ceevs_client_ip();
  $rec = $g[$ip] ?? array('n' => 0, 't' => time());
  $g[$ip] = array('n' => (int) $rec['n'] + 1, 't' => (int) ($rec['t'] ?? time()));
  ceevs_write_guarded(CEEVS_PREINS_GUARD, $g);
}

/* ─── Saneado de los campos que llegan del formulario ─── */

/** Texto de una línea: sin caracteres de control, recortado y con tope de largo. */
function ceevs_preins_txt($v, int $max = 120): string {
  if (!is_string($v)) {
    $v = is_scalar($v) ? (string) $v : '';
  }
  $v = str_replace(array("\r", "\n", "\t"), ' ', $v);
  $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
  $v = trim(preg_replace('/\s+/u', ' ', (string) $v));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Texto de varias líneas (notas internas del panel). */
function ceevs_preins_multi($v, int $max = 1500): string {
  if (!is_string($v)) {
    return '';
  }
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  $v = trim((string) $v);
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/** Valor obligado a pertenecer a una lista cerrada. */
function ceevs_preins_enum($v, array $allowed, string $fallback = ''): string {
  $v = is_string($v) ? $v : '';
  return in_array($v, $allowed, true) ? $v : $fallback;
}

/**
 * Guarda la foto del alumno recibida como data URL.
 * Devuelve true si quedó guardada. El tipo real se verifica con finfo:
 * no se confía en lo que declare el navegador.
 */
function ceevs_preins_save_foto(string $id, $dataUrl): bool {
  if (!is_string($dataUrl) || strncmp($dataUrl, 'data:image/', 11) !== 0) {
    return false;
  }
  $coma = strpos($dataUrl, ',');
  if ($coma === false || strpos(substr($dataUrl, 0, $coma), ';base64') === false) {
    return false;
  }
  $b64 = substr($dataUrl, $coma + 1);
  if (strlen($b64) > CEEVS_PREINS_MAX_FOTO_BYTES * 1.4) {
    return false;
  }
  $bin = base64_decode($b64, true);
  if ($bin === false || $bin === '' || strlen($bin) > CEEVS_PREINS_MAX_FOTO_BYTES) {
    return false;
  }

  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->buffer($bin);
  $exts = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp');
  if (!isset($exts[$mime])) {
    return false;
  }
  // Confirmación extra: que sea una imagen que PHP pueda medir.
  $size = @getimagesizefromstring($bin);
  if ($size === false || (int) $size[0] < 40 || (int) $size[1] < 40) {
    return false;
  }

  ceevs_preins_ensure_dir();
  $dest = CEEVS_PREINS_DIR . '/foto-' . $id . '.' . $exts[$mime];
  if (@file_put_contents($dest, $bin, LOCK_EX) === false) {
    return false;
  }
  @chmod($dest, 0644);
  return true;
}

/* ─── Texto plano de una solicitud (correo y exportación) ─── */

function ceevs_preins_bloque_padre(array $p, string $titulo): string {
  if (empty($p['aplica'])) {
    return $titulo . ": no proporcionado\n";
  }
  $l = array($titulo . ':');
  $campos = array(
    'nombre' => 'Nombre completo', 'profesion' => 'Profesión', 'ocupacion' => 'Ocupación',
    'direccion' => 'Dirección', 'telFijo' => 'Teléfono fijo', 'celular' => 'Celular',
    'correo' => 'Correo electrónico', 'centroTrabajo' => 'Centro de trabajo',
    'iglesia' => 'Iglesia que asiste', 'lider' => 'Líder espiritual', 'ingreso' => 'Ingreso mensual',
  );
  foreach ($campos as $k => $etq) {
    $v = (string) ($p[$k] ?? '');
    if ($v !== '') {
      $l[] = '  ' . $etq . ': ' . $v;
    }
  }
  return implode("\n", $l) . "\n";
}

/** Volcado legible de la solicitud, para el correo y para copiar/pegar. */
function ceevs_preins_texto(array $rec): string {
  $al = is_array($rec['alumno'] ?? null) ? $rec['alumno'] : array();
  $viveCon = array(
    'ambos' => 'Ambos padres', 'madre' => 'La madre', 'padre' => 'El padre', 'otro' => 'Otro',
  );
  $medios = array(
    'pariente' => 'Un pariente', 'amigo' => 'Un amigo', 'redes' => 'Redes sociales', 'otro' => 'Otro',
  );
  $motivos = array(
    'cristiana'     => 'Por su impacto en educación cristiana',
    'academico'     => 'Por su enfoque académico',
    'instalaciones' => 'Por sus instalaciones',
    'todas'         => 'Todas las anteriores',
  );

  $t = array();
  $t[] = 'SOLICITUD DE ADMISIÓN PARA PRIMER INGRESO — CEEVS';
  $t[] = 'Número de solicitud: ' . (int) ($rec['num'] ?? 0);
  $t[] = 'Recibida: ' . (string) ($rec['t'] ?? '');
  $t[] = '';
  $t[] = 'DATOS DEL ALUMNO';
  $t[] = '  Nombre completo: ' . (string) ($al['nombre'] ?? '');
  $t[] = '  Edad: ' . (string) ($al['edad'] ?? '') . '   Fecha de nacimiento: ' . (string) ($al['fechaNac'] ?? '');
  $t[] = '  Sexo: ' . (string) ($al['sexo'] ?? '') . '   N° de identidad: ' . (string) ($al['identidad'] ?? '');
  $t[] = '  Nacionalidad: ' . (string) ($al['nacionalidad'] ?? '');
  $t[] = '  País: ' . (string) ($al['pais'] ?? '') . '   Departamento: ' . (string) ($al['departamento'] ?? '') . '   Ciudad: ' . (string) ($al['ciudad'] ?? '');
  $vc = (string) ($al['viveCon'] ?? '');
  $t[] = '  Vive con: ' . ($viveCon[$vc] ?? $vc) . ((string) ($al['viveConOtro'] ?? '') !== '' ? ' — ' . $al['viveConOtro'] : '');
  $t[] = '  Escuela de procedencia: ' . (string) ($al['escuela'] ?? '');
  $t[] = '  Lugar: ' . (string) ($al['escuelaLugar'] ?? '') . '   Teléfono: ' . (string) ($al['escuelaTel'] ?? '');
  $t[] = '  Grado que va a cursar: ' . (string) ($al['grado'] ?? '');
  $t[] = '';
  $t[] = rtrim(ceevs_preins_bloque_padre(is_array($rec['padre'] ?? null) ? $rec['padre'] : array(), 'DATOS DEL PADRE'));
  $t[] = '';
  $t[] = rtrim(ceevs_preins_bloque_padre(is_array($rec['madre'] ?? null) ? $rec['madre'] : array(), 'DATOS DE LA MADRE'));
  $t[] = '';

  $herm = is_array($rec['hermanos'] ?? null) ? $rec['hermanos'] : array();
  $t[] = 'DATOS DE LOS HERMANOS';
  if (!$herm) {
    $t[] = '  (sin hermanos registrados)';
  }
  foreach ($herm as $h) {
    $t[] = '  - ' . (string) ($h['nombre'] ?? '')
      . '   Edad: ' . (string) ($h['edad'] ?? '')
      . '   Estudia: ' . (!empty($h['estudia']) ? 'Sí' : 'No')
      . '   Trabaja: ' . (!empty($h['trabaja']) ? 'Sí' : 'No');
  }
  $t[] = '';

  $medio = (string) ($rec['medio'] ?? '');
  $t[] = '¿Por qué medio se enteró del centro educativo?';
  $t[] = '  ' . ($medios[$medio] ?? $medio) . ((string) ($rec['medioOtro'] ?? '') !== '' ? ' — ' . $rec['medioOtro'] : '');
  $t[] = '¿Por qué eligió la institución?';
  $sel = is_array($rec['motivo'] ?? null) ? $rec['motivo'] : array();
  if (!$sel) {
    $t[] = '  (sin respuesta)';
  }
  foreach ($sel as $m) {
    $t[] = '  ' . ($motivos[$m] ?? $m);
  }
  $t[] = '';
  $t[] = 'Tiene familiares en la institución: ' . ((string) ($rec['familiares'] ?? '') !== '' ? $rec['familiares'] : 'No indicado');
  $t[] = 'Parentesco: ' . (string) ($rec['parentesco'] ?? '') . '   Nivel: ' . (string) ($rec['nivel'] ?? '');
  $t[] = '';
  $t[] = 'Esta solicitud no significa reservación de cupo.';
  $t[] = 'Declarada por: ' . (string) ($rec['firma'] ?? '');

  return implode("\n", $t);
}
