<?php
/**
 * preinscripciones-db.php — Las solicitudes de admisión guardadas en MySQL.
 *
 * Es la implementación "de verdad" del almacén cuando hay base de datos
 * configurada (ver db.php). preinscripciones-lib.php mantiene las mismas
 * funciones de siempre y decide en cada llamada si atiende aquí o contra
 * archivos, así que el resto de la API no cambió.
 *
 * Reparto de tablas:
 *   ceevs_preinscripciones        → una fila por solicitud. Las columnas sueltas
 *                                   (num, alumno, estado…) son las que necesita
 *                                   la lista del panel; `datos` guarda el
 *                                   expediente completo en JSON.
 *   ceevs_preinscripcion_archivos → foto del alumno y copia PDF, como binarios.
 *   ceevs_ajustes                 → ajustes del formulario y correlativo.
 *
 * La foto y el PDF van dentro de la base a propósito: si se dejaran en disco
 * volveríamos al problema original, porque el disco del sitio se reemplaza en
 * cada publicación y la base de datos no.
 */

declare(strict_types=1);

/* ─── Conversión de fechas ─── */

/** ISO 8601 (como se guarda en el expediente) → DATETIME UTC de MySQL. */
function ceevs_preins_db_fecha(string $iso): string {
  $ts = strtotime($iso);
  if ($ts === false) {
    $ts = time();
  }
  return gmdate('Y-m-d H:i:s', $ts);
}

/** DATETIME UTC de MySQL → ISO 8601, que es lo que espera el panel. */
function ceevs_preins_db_iso(string $sql): string {
  $ts = strtotime($sql . ' UTC');
  return $ts === false ? gmdate('c') : gmdate('c', $ts);
}

/** Recorta al ancho de la columna: con sql_mode estricto, pasarse es un error. */
function ceevs_preins_db_corta($v, int $max): string {
  $v = is_scalar($v) ? (string) $v : '';
  return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

/* ─── Ajustes y correlativo ─── */

function ceevs_preins_db_ajuste(string $clave, $porDefecto) {
  $st = ceevs_db_run('SELECT valor FROM ' . CEEVS_DB_TABLA_AJUSTES . ' WHERE clave = ?', array($clave));
  if ($st === null) {
    return $porDefecto;
  }
  $raw = $st->fetchColumn();
  if (!is_string($raw)) {
    return $porDefecto;
  }
  $v = json_decode($raw, true);
  return $v === null && strtolower(trim($raw)) !== 'null' ? $porDefecto : $v;
}

function ceevs_preins_db_set_ajuste(string $clave, $valor): bool {
  $json = json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    return false;
  }
  return ceevs_db_run(
    'INSERT INTO ' . CEEVS_DB_TABLA_AJUSTES . ' (clave, valor) VALUES (?, ?) '
    . 'ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
    array($clave, $json)
  ) !== null;
}

/* ─── Índice de la bandeja ─── */

/**
 * Mismo array que devolvía la versión de archivos: ajustes + correlativo +
 * fichas resumidas, de la más reciente a la más antigua.
 */
function ceevs_preins_db_index(): array {
  $ix = array(
    'next'     => CEEVS_PREINS_NUM_INICIAL,
    'items'    => array(),
    'settings' => array(),
    'bytes'    => 0,
    'pdfBytes' => 0,
  );

  $st = ceevs_db_run(
    'SELECT id, num, creado, estado, alumno, grado, encargado, tel, correo, tiene_foto, tiene_pdf '
    . 'FROM ' . CEEVS_DB_TABLA_PREINS . ' ORDER BY creado DESC, num DESC'
  );
  if ($st !== null) {
    foreach ($st->fetchAll() as $r) {
      $ix['items'][] = array(
        'id'        => (string) $r['id'],
        'num'       => (int) $r['num'],
        't'         => ceevs_preins_db_iso((string) $r['creado']),
        'estado'    => (string) $r['estado'],
        'alumno'    => (string) $r['alumno'],
        'grado'     => (string) $r['grado'],
        'encargado' => (string) $r['encargado'],
        'tel'       => (string) $r['tel'],
        'correo'    => (string) $r['correo'],
        'foto'      => (int) $r['tiene_foto'] === 1,
        'pdf'       => (int) $r['tiene_pdf'] === 1,
      );
    }
  }

  // Espacio ocupado: la columna `bytes` está indexada junto a `tipo`, así que
  // esta suma no toca los binarios.
  $st = ceevs_db_run(
    'SELECT tipo, COALESCE(SUM(bytes), 0) AS total FROM ' . CEEVS_DB_TABLA_ARCHIVOS . ' GROUP BY tipo'
  );
  if ($st !== null) {
    foreach ($st->fetchAll() as $r) {
      if ((string) $r['tipo'] === 'foto') {
        $ix['bytes'] = (int) $r['total'];
      } elseif ((string) $r['tipo'] === 'pdf') {
        $ix['pdfBytes'] = (int) $r['total'];
      }
    }
  }

  $settings = ceevs_preins_db_ajuste('settings', array());
  $ix['settings'] = is_array($settings) ? $settings : array();
  $ix['settings'] += array(
    'correo'    => CEEVS_PREINS_CORREO_DEFECTO,
    'notificar' => true,
    'abierto'   => true,
    'ciclo'     => '',
  );

  $next = (int) ceevs_preins_db_ajuste('next', CEEVS_PREINS_NUM_INICIAL);
  // Red de seguridad: el correlativo nunca puede quedar por debajo de un número
  // ya entregado a una familia, pase lo que pase con el ajuste guardado.
  $st = ceevs_db_run('SELECT COALESCE(MAX(num), 0) FROM ' . CEEVS_DB_TABLA_PREINS);
  $maxNum = $st === null ? 0 : (int) $st->fetchColumn();
  $ix['next'] = max(1, $next, $maxNum + 1);

  return $ix;
}

/** Solo persiste ajustes y correlativo: las fichas ya viven en su tabla. */
function ceevs_preins_db_save_index(array $ix): bool {
  $ok = ceevs_preins_db_set_ajuste('settings', $ix['settings']);
  $ok = ceevs_preins_db_set_ajuste('next', max(1, (int) $ix['next'])) && $ok;
  return $ok;
}

/* ─── Lectura y escritura de solicitudes ─── */

function ceevs_preins_db_read(string $id): ?array {
  $st = ceevs_db_run('SELECT datos FROM ' . CEEVS_DB_TABLA_PREINS . ' WHERE id = ?', array($id));
  if ($st === null) {
    return null;
  }
  $raw = $st->fetchColumn();
  if (!is_string($raw) || $raw === '') {
    return null;
  }
  $rec = json_decode($raw, true);
  return is_array($rec) ? $rec : null;
}

function ceevs_preins_db_write(string $id, array $rec): bool {
  $datos = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($datos === false) {
    return false;
  }
  $row = ceevs_preins_row($rec);

  return ceevs_db_run(
    'INSERT INTO ' . CEEVS_DB_TABLA_PREINS
    . ' (id, num, creado, estado, ciclo, alumno, grado, encargado, tel, correo, tiene_foto, tiene_pdf, datos)'
    . ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    . ' ON DUPLICATE KEY UPDATE num = VALUES(num), creado = VALUES(creado), estado = VALUES(estado),'
    . ' ciclo = VALUES(ciclo), alumno = VALUES(alumno), grado = VALUES(grado), encargado = VALUES(encargado),'
    . ' tel = VALUES(tel), correo = VALUES(correo), tiene_foto = VALUES(tiene_foto),'
    . ' tiene_pdf = VALUES(tiene_pdf), datos = VALUES(datos)',
    array(
      $id,
      (int) ($rec['num'] ?? 0),
      ceevs_preins_db_fecha((string) ($rec['t'] ?? '')),
      ceevs_preins_db_corta($row['estado'] ?: 'nueva', 16),
      ceevs_preins_db_corta($rec['ciclo'] ?? '', 40),
      ceevs_preins_db_corta($row['alumno'], 160),
      ceevs_preins_db_corta($row['grado'], 120),
      ceevs_preins_db_corta($row['encargado'], 160),
      ceevs_preins_db_corta($row['tel'], 60),
      ceevs_preins_db_corta($row['correo'], 160),
      !empty($rec['foto']) ? 1 : 0,
      !empty($rec['pdf']) ? 1 : 0,
      $datos,
    )
  ) !== null;
}

/**
 * Borra la solicitud de la base y también los restos que hubiera en disco.
 *
 * Lo segundo importa: el importador vuelve a subir a la base todo expediente
 * que encuentre en archivos, así que dejar el archivo haría reaparecer una
 * solicitud que el administrador acaba de eliminar.
 */
function ceevs_preins_db_delete(string $id): bool {
  $ok = ceevs_db_run('DELETE FROM ' . CEEVS_DB_TABLA_ARCHIVOS . ' WHERE id = ?', array($id)) !== null;
  $ok = ceevs_db_run('DELETE FROM ' . CEEVS_DB_TABLA_PREINS . ' WHERE id = ?', array($id)) !== null && $ok;
  ceevs_preins_db_borrar_restos_disco($id);
  return $ok;
}

/** Quita de las carpetas de legado el expediente, su foto y su PDF. */
function ceevs_preins_db_borrar_restos_disco(string $id): void {
  foreach (ceevs_preins_db_dirs_legado() as $dir) {
    $rec = ceevs_read_guarded($dir . '/rec-' . $id . '.php');
    if (is_array($rec)) {
      $pdf = (string) ($rec['pdfArchivo'] ?? '');
      if ($pdf !== '' && basename($pdf) === $pdf) {
        @unlink($dir . '/' . $pdf);
      }
    }
    @unlink($dir . '/rec-' . $id . '.php');
    foreach (array('jpg', 'png', 'webp') as $ext) {
      @unlink($dir . '/foto-' . $id . '.' . $ext);
    }
  }
}

/* ─── Foto y copia PDF ─── */

/**
 * Guarda un binario de la solicitud.
 *
 * Devuelve false, sin romper nada, si el servidor MySQL rechaza el paquete por
 * tamaño (max_allowed_packet bajo en hosting compartido). El expediente ya está
 * guardado: lo único que se pierde es el adjunto, y el panel puede regenerarlo.
 */
function ceevs_preins_db_guardar_archivo(string $id, string $tipo, string $bin, string $mime, string $nombre): bool {
  $st = ceevs_db_run(
    'INSERT INTO ' . CEEVS_DB_TABLA_ARCHIVOS . ' (id, tipo, nombre, mime, bytes, contenido) VALUES (?,?,?,?,?,?)'
    . ' ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), mime = VALUES(mime),'
    . ' bytes = VALUES(bytes), contenido = VALUES(contenido)',
    array($id, $tipo, ceevs_preins_db_corta($nombre, 200), ceevs_preins_db_corta($mime, 80), strlen($bin), $bin)
  );
  return $st !== null;
}

/**
 * Datos de un adjunto. Con $conContenido = false no se trae el binario, que es
 * lo que conviene cuando solo hace falta saber si existe o cuánto ocupa.
 */
function ceevs_preins_db_archivo(string $id, string $tipo, bool $conContenido = true): ?array {
  $cols = $conContenido ? 'nombre, mime, bytes, contenido' : 'nombre, mime, bytes';
  $st = ceevs_db_run(
    'SELECT ' . $cols . ' FROM ' . CEEVS_DB_TABLA_ARCHIVOS . ' WHERE id = ? AND tipo = ?',
    array($id, $tipo)
  );
  if ($st === null) {
    return null;
  }
  $r = $st->fetch();
  if (!is_array($r)) {
    return null;
  }
  $contenido = null;
  if ($conContenido) {
    $contenido = $r['contenido'];
    // Según la configuración de PDO, un blob puede llegar como recurso.
    if (is_resource($contenido)) {
      $contenido = stream_get_contents($contenido);
    }
    $contenido = is_string($contenido) ? $contenido : '';
  }
  return array(
    'nombre'    => (string) $r['nombre'],
    'mime'      => (string) $r['mime'],
    'bytes'     => (int) $r['bytes'],
    'contenido' => $contenido,
    'ruta'      => null,
  );
}

/** Borra un adjunto y devuelve los bytes liberados. */
function ceevs_preins_db_borrar_archivo(string $id, string $tipo): int {
  $info = ceevs_preins_db_archivo($id, $tipo, false);
  $bytes = $info === null ? 0 : (int) $info['bytes'];
  ceevs_db_run('DELETE FROM ' . CEEVS_DB_TABLA_ARCHIVOS . ' WHERE id = ? AND tipo = ?', array($id, $tipo));
  return $bytes;
}

/* ─── Importación de lo que ya estaba en archivos ─── */

/** Carpetas donde pudo quedar guardada una solicitud antes de haber base de datos. */
function ceevs_preins_db_dirs_legado(): array {
  $dirs = array(CEEVS_PREINS_DIR, CEEVS_PREINS_LEGACY_DIR);
  $previa = ceevs_preins_previous_hostinger_dir();
  if ($previa !== '') {
    $dirs[] = $previa;
  }
  $out = array();
  foreach (array_unique($dirs) as $dir) {
    if ($dir !== '' && @is_dir($dir)) {
      $out[] = $dir;
    }
  }
  return $out;
}

/** Identificadores de expediente presentes en disco, sin repetir. */
function ceevs_preins_db_ids_en_disco(): array {
  $ids = array();
  foreach (ceevs_preins_db_dirs_legado() as $dir) {
    $names = @scandir($dir);
    if (!is_array($names)) {
      continue;
    }
    foreach ($names as $name) {
      if (preg_match('/^rec-([a-f0-9]{16})\.php$/', $name, $m) === 1) {
        $ids[$m[1]] = $dir;
      }
    }
  }
  return $ids;
}

/**
 * Sube a la base de datos las solicitudes que solo estén en archivos.
 *
 * Se ejecuta sola al abrir la bandeja del panel, en tandas cortas para no
 * agotar el tiempo de ejecución de PHP con expedientes que llevan PDF de varios
 * megas. Es repetible: lo ya importado se reconoce por su identificador.
 *
 * @return array{importadas:int, pendientes:int, total:int}
 */
function ceevs_preins_db_importar(int $max = 25): array {
  $resultado = array('importadas' => 0, 'pendientes' => 0, 'total' => 0);
  if (!ceevs_db_ready()) {
    return $resultado;
  }

  $enDisco = ceevs_preins_db_ids_en_disco();
  $resultado['total'] = count($enDisco);
  if (!$enDisco) {
    ceevs_preins_db_importar_ajustes();
    return $resultado;
  }

  $st = ceevs_db_run('SELECT id FROM ' . CEEVS_DB_TABLA_PREINS);
  if ($st === null) {
    return $resultado;
  }
  $enBase = array();
  foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $id) {
    $enBase[(string) $id] = true;
  }

  $pendientes = array();
  foreach ($enDisco as $id => $dir) {
    if (!isset($enBase[$id])) {
      $pendientes[$id] = $dir;
    }
  }
  $resultado['pendientes'] = count($pendientes);
  if (!$pendientes) {
    ceevs_preins_db_importar_ajustes();
    return $resultado;
  }

  foreach (array_slice($pendientes, 0, max(1, $max), true) as $id => $dir) {
    if (ceevs_preins_db_importar_una((string) $id, (string) $dir)) {
      $resultado['importadas']++;
      $resultado['pendientes']--;
    } else {
      // Un expediente ilegible no debe frenar a los demás; se salta y se
      // reintentará en la siguiente tanda.
      $resultado['pendientes']--;
    }
  }

  ceevs_preins_db_importar_ajustes();
  return $resultado;
}

/** Trae un expediente concreto con su foto y su PDF. */
function ceevs_preins_db_importar_una(string $id, string $dir): bool {
  $rec = ceevs_read_guarded($dir . '/rec-' . $id . '.php');
  if (!is_array($rec)) {
    return false;
  }
  $rec['id'] = $id;
  if (!isset($rec['t']) || !is_string($rec['t']) || $rec['t'] === '') {
    $rec['t'] = gmdate('c');
  }

  $mimes = array('jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp');
  $tieneFoto = false;
  foreach ($mimes as $ext => $mime) {
    $ruta = $dir . '/foto-' . $id . '.' . $ext;
    if (@is_file($ruta)) {
      $bin = @file_get_contents($ruta);
      if (is_string($bin) && $bin !== '' && ceevs_preins_db_guardar_archivo($id, 'foto', $bin, $mime, 'foto-' . $id . '.' . $ext)) {
        $tieneFoto = true;
      }
      break;
    }
  }
  $rec['foto'] = $tieneFoto;

  $tienePdf = false;
  $nombrePdf = (string) ($rec['pdfArchivo'] ?? '');
  if ($nombrePdf !== '' && basename($nombrePdf) === $nombrePdf && @is_file($dir . '/' . $nombrePdf)) {
    $bin = @file_get_contents($dir . '/' . $nombrePdf);
    if (
      is_string($bin) && $bin !== '' && strlen($bin) <= CEEVS_PREINS_MAX_PDF_BYTES &&
      ceevs_preins_db_guardar_archivo($id, 'pdf', $bin, 'application/pdf', $nombrePdf)
    ) {
      $tienePdf = true;
    }
  }
  $rec['pdf'] = $tienePdf;
  if (!$tienePdf) {
    unset($rec['pdfArchivo'], $rec['pdfBytes'], $rec['pdfGuardado']);
  }

  return ceevs_preins_db_write($id, $rec);
}

/**
 * Copia los ajustes del formulario (correo, ciclo, abierto/cerrado) desde el
 * índice en archivos, pero solo si en la base todavía no hay ninguno: lo que el
 * administrador configure desde el panel manda siempre.
 */
function ceevs_preins_db_importar_ajustes(): void {
  if (ceevs_preins_db_ajuste('settings', null) !== null) {
    return;
  }
  foreach (ceevs_preins_db_dirs_legado() as $dir) {
    $ix = ceevs_read_guarded($dir . '/index.php');
    if (!is_array($ix) || !is_array($ix['settings'] ?? null)) {
      continue;
    }
    ceevs_preins_db_set_ajuste('settings', $ix['settings']);
    if (isset($ix['next'])) {
      ceevs_preins_db_set_ajuste('next', max(1, (int) $ix['next']));
    }
    return;
  }
}

/* ─── Estado para el panel ─── */

/** Resumen de lo que hay en la base, para la tarjeta de salud del panel. */
function ceevs_preins_db_stats(): array {
  $out = array('total' => 0, 'fotos' => 0, 'pdfs' => 0, 'bytes' => 0);
  $st = ceevs_db_run('SELECT COUNT(*) FROM ' . CEEVS_DB_TABLA_PREINS);
  if ($st !== null) {
    $out['total'] = (int) $st->fetchColumn();
  }
  $st = ceevs_db_run(
    'SELECT tipo, COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS b FROM ' . CEEVS_DB_TABLA_ARCHIVOS . ' GROUP BY tipo'
  );
  if ($st !== null) {
    foreach ($st->fetchAll() as $r) {
      $out['bytes'] += (int) $r['b'];
      if ((string) $r['tipo'] === 'foto') {
        $out['fotos'] = (int) $r['n'];
      } elseif ((string) $r['tipo'] === 'pdf') {
        $out['pdfs'] = (int) $r['n'];
      }
    }
  }
  return $out;
}
