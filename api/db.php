<?php
/**
 * db.php — Base de datos MySQL de la mini-API CEEVS (pensada para Hostinger).
 *
 * POR QUÉ EXISTE
 * Las solicitudes de admisión se guardaban únicamente como archivos dentro del
 * espacio del sitio. Cada vez que se publica una versión nueva del código y se
 * reemplaza la carpeta del sitio, esos archivos se van con ella: por eso la
 * bandeja aparecía vacía después de cada actualización. Lo que vive en la base
 * de datos no forma parte de los archivos que se suben, así que sobrevive a
 * cualquier publicación, por completa que sea.
 *
 * CÓMO SE CONFIGURA (Hostinger)
 *  1. hPanel → Bases de datos → MySQL: crear base y usuario (anotar la clave).
 *  2. Panel del sitio → pestaña 📋 → tarjeta "Base de datos": escribir host
 *     (localhost), nombre, usuario y contraseña, y pulsar "Probar y conectar".
 *  Alternativas sin panel: variables de entorno CEEVS_DB_* o copiar
 *  db-config.example.php a alguna de las rutas de ceevs_db_config_paths().
 *
 * DÓNDE QUEDAN LAS CREDENCIALES
 * En un archivo PHP que devuelve un array. Se prefiere SIEMPRE una ruta fuera
 * de public_html (hermana del sitio, igual que la carpeta VIRGINIASAPP): así el
 * archivo tampoco se pierde al publicar. Si esa ruta no se puede escribir, se
 * usa server-data/, que está protegida con .htaccess y con la guarda de PHP.
 *
 * SI LA BASE DE DATOS NO ESTÁ CONFIGURADA O NO RESPONDE
 * Todo sigue funcionando exactamente como antes contra archivos. Nunca se
 * rechaza la solicitud de una familia por un problema de base de datos; cuando
 * la conexión vuelve, el importador sube a la base lo que se haya guardado
 * mientras tanto.
 */

declare(strict_types=1);

const CEEVS_DB_TABLA_PREINS   = 'ceevs_preinscripciones';
const CEEVS_DB_TABLA_ARCHIVOS = 'ceevs_preinscripcion_archivos';
const CEEVS_DB_TABLA_AJUSTES  = 'ceevs_ajustes';

/** Segundos de espera al conectar. Corto a propósito: si el servidor de base de
 *  datos no responde, es preferible caer al respaldo de archivos que dejar
 *  colgado el formulario de una familia. */
const CEEVS_DB_TIMEOUT = 5;

/* ─── Dónde viven las credenciales ─── */

/**
 * Carpeta que contiene a public_html, a partir de una ruta del sitio. '' si la
 * ruta no tiene la forma de un hosting tipo Hostinger.
 *
 * Se busca la ÚLTIMA aparición de `/public_html` y NO se exige que la ruta
 * termine ahí. El motivo es concreto: un subdominio suele colgar por dentro
 * (…/public_html/prueba). Si solo se aceptara el final, en un subdominio no se
 * detectaría nada y las credenciales acabarían guardadas dentro del propio
 * sitio, que es exactamente donde las borra cada publicación.
 */
function ceevs_hosting_padre_public_html(string $path): string {
  $normal = rtrim(str_replace('\\', '/', $path), '/');
  if ($normal === '' || preg_match('#^/home/[^/]+/#', $normal . '/') !== 1) {
    return '';
  }
  $pos = strrpos($normal, '/public_html');
  if ($pos === false) {
    return '';
  }
  // Tiene que ser un tramo completo de la ruta, no un /public_html_viejo.
  $resto = substr($normal, $pos + strlen('/public_html'));
  if ($resto !== '' && $resto[0] !== '/') {
    return '';
  }
  return substr($normal, 0, $pos);
}

/**
 * Carpeta privada del hosting (la que contiene a public_html), o '' si no se
 * reconoce la estructura. Es la misma que usa preinscripciones-lib.php para la
 * carpeta de admisiones: lo que está ahí no se toca al publicar.
 */
function ceevs_db_hosting_private_dir(): string {
  $roots = array(
    dirname(__DIR__),
    isset($_SERVER['DOCUMENT_ROOT']) ? (string) $_SERVER['DOCUMENT_ROOT'] : '',
  );
  foreach ($roots as $root) {
    $priv = ceevs_hosting_padre_public_html((string) $root);
    if ($priv !== '') {
      return $priv;
    }
  }
  return '';
}

/** Rutas donde se busca la configuración, en orden de preferencia. */
function ceevs_db_config_paths(): array {
  $paths = array();

  $env = getenv('CEEVS_DB_CONFIG');
  if (is_string($env) && trim($env) !== '') {
    $paths[] = trim($env);
  }

  $priv = ceevs_db_hosting_private_dir();
  if ($priv !== '') {
    $paths[] = $priv . '/VIRGINIASAPP/ceevs-db.php';
    $paths[] = $priv . '/ceevs-db.php';
  }

  $paths[] = CEEVS_DATA_DIR . '/db-config.php';
  $paths[] = __DIR__ . '/db-config.php';

  return $paths;
}

/**
 * Primera ruta de la lista donde se pueda escribir de verdad.
 * Se comprueba escribiendo, no adivinando permisos: en hosting compartido
 * is_writable() miente con frecuencia (open_basedir, propietario del proceso).
 */
function ceevs_db_config_write_path(): string {
  $priv = ceevs_db_hosting_private_dir();
  $candidatos = array();
  if ($priv !== '') {
    $candidatos[] = $priv . '/VIRGINIASAPP/ceevs-db.php';
    $candidatos[] = $priv . '/ceevs-db.php';
  }
  $candidatos[] = CEEVS_DATA_DIR . '/db-config.php';

  foreach ($candidatos as $path) {
    $dir = dirname($path);
    if (!@is_dir($dir)) {
      @mkdir($dir, 0755, true);
    }
    if (!@is_dir($dir)) {
      continue;
    }
    $prueba = $dir . '/.ceevs-escritura.tmp';
    if (@file_put_contents($prueba, 'ok') !== false) {
      @unlink($prueba);
      return $path;
    }
  }
  return '';
}

/** Ruta del archivo de configuración que se está usando ahora ('' si ninguno). */
function ceevs_db_config_actual(): string {
  foreach (ceevs_db_config_paths() as $path) {
    if (@is_file($path)) {
      return $path;
    }
  }
  return '';
}

/* ─── Configuración ─── */

/** Nombre de cada valor cuando viaja como variable (entorno o .env). */
function ceevs_db_env_map(): array {
  return array(
    'host'    => 'CEEVS_DB_HOST',
    'puerto'  => 'CEEVS_DB_PORT',
    'nombre'  => 'CEEVS_DB_NAME',
    'usuario' => 'CEEVS_DB_USER',
    'clave'   => 'CEEVS_DB_PASS',
    'charset' => 'CEEVS_DB_CHARSET',
  );
}

/**
 * Valores CEEVS_DB_* leídos de un archivo .env.
 *
 * Se busca primero fuera de public_html (donde sobrevive a las publicaciones) y
 * después en la raíz del sitio. No se usa parse_ini_file a propósito: en
 * formato .ini una almohadilla abre un comentario, y las contraseñas que genera
 * el hosting suelen llevarla, así que la contraseña se cortaría por la mitad.
 */
function ceevs_db_env_file(bool $recargar = false): array {
  static $vals = null;
  if ($recargar) {
    $vals = null;
  }
  if (is_array($vals)) {
    return $vals;
  }
  $vals = array();

  $paths = array();
  $priv = ceevs_db_hosting_private_dir();
  if ($priv !== '') {
    $paths[] = $priv . '/.env';
  }
  $paths[] = dirname(__DIR__) . '/.env';

  $raw = '';
  foreach ($paths as $path) {
    if (@is_file($path)) {
      $contenido = @file_get_contents($path);
      if (is_string($contenido) && $contenido !== '') {
        $raw = $contenido;
        ceevs_db_env_path($path);
        break;
      }
    }
  }
  if ($raw === '') {
    return $vals;
  }

  foreach (preg_split('/\r\n|\r|\n/', $raw) ?: array() as $linea) {
    $linea = trim($linea);
    if ($linea === '' || $linea[0] === '#') {
      continue;
    }
    if (strncmp($linea, 'export ', 7) === 0) {
      $linea = trim(substr($linea, 7));
    }
    $corte = strpos($linea, '=');
    if ($corte === false) {
      continue;
    }
    $clave = trim(substr($linea, 0, $corte));
    if (preg_match('/^CEEVS_DB_[A-Z0-9_]+$/', $clave) !== 1) {
      continue;   // este archivo solo manda sobre la base de datos
    }
    $valor = trim(substr($linea, $corte + 1));
    $comilla = $valor === '' ? '' : $valor[0];
    if (($comilla === '"' || $comilla === "'") && substr($valor, -1) === $comilla && strlen($valor) > 1) {
      $valor = substr($valor, 1, -1);
      if ($comilla === '"') {
        $valor = str_replace(array('\\"', '\\\\'), array('"', '\\'), $valor);
      }
    } elseif (preg_match('/\s#/', $valor) === 1) {
      // Comentario al final de la línea, solo si el valor venía sin comillas.
      $valor = rtrim((string) preg_replace('/\s#.*$/', '', $valor));
    }
    $vals[$clave] = $valor;
  }
  return $vals;
}

/** Ruta del .env que se acabó usando ('' si no había ninguno). */
function ceevs_db_env_path(?string $set = null): string {
  static $path = '';
  if ($set !== null) {
    $path = $set;
  }
  return $path;
}

/**
 * De dónde salen las credenciales que se están usando y, sobre todo, si ese
 * lugar sobrevive a una publicación del sitio.
 *
 * Existe para que el panel pueda afirmarlo en pantalla: la pregunta natural de
 * quien acaba de conectar la base es "¿voy a tener que repetir esto en cada
 * actualización?", y la respuesta depende de dónde quedó guardado el archivo.
 *
 * @return array{ruta:string, permanente:bool}
 */
function ceevs_db_origen(): array {
  // La ruta del .env solo se conoce después de haberlo leído. Se fuerza aquí
  // (está memorizado, así que no cuesta nada) para no depender de que alguien
  // haya llamado antes a ceevs_db_config().
  ceevs_db_env_file();

  $sitio = rtrim(str_replace('\\', '/', dirname(__DIR__)), '/');
  $fuera = function (string $ruta) use ($sitio): bool {
    $ruta = str_replace('\\', '/', $ruta);
    return $ruta !== '' && strncmp($ruta, $sitio . '/', strlen($sitio) + 1) !== 0;
  };

  if (is_string(getenv('CEEVS_DB_NAME')) && getenv('CEEVS_DB_NAME') !== '') {
    return array('ruta' => 'Variables de entorno del servidor', 'permanente' => true);
  }
  $archivo = ceevs_db_config_actual();
  if ($archivo !== '') {
    return array('ruta' => $archivo, 'permanente' => $fuera($archivo));
  }
  $env = ceevs_db_env_path();
  if ($env !== '') {
    return array('ruta' => $env, 'permanente' => $fuera($env));
  }
  return array('ruta' => '', 'permanente' => false);
}

/**
 * Credenciales de la base de datos.
 *
 * De menor a mayor prioridad: .env → archivo de configuración (el que escribe
 * el panel) → variables de entorno del servidor. Así, si algún día se configura
 * desde el panel, eso manda sobre un .env viejo que se hubiera quedado por ahí.
 * La contraseña nunca sale de aquí hacia el navegador (ver preinscripciones.php,
 * acción "bd").
 */
function ceevs_db_config(bool $recargar = false): array {
  static $config = null;
  if ($recargar) {
    $config = null;
    ceevs_db_env_file(true);
  }
  if (is_array($config)) {
    return $config;
  }

  $config = array(
    'host'    => '',
    'puerto'  => 3306,
    'nombre'  => '',
    'usuario' => '',
    'clave'   => '',
    'charset' => 'utf8mb4',
  );

  $mapa = ceevs_db_env_map();

  $env = ceevs_db_env_file();
  foreach ($mapa as $k => $name) {
    if (isset($env[$name]) && $env[$name] !== '') {
      $config[$k] = $env[$name];
    }
  }

  $path = ceevs_db_config_actual();
  if ($path !== '') {
    $cargado = @include $path;
    if (is_array($cargado)) {
      foreach ($config as $k => $unused) {
        if (array_key_exists($k, $cargado) && $cargado[$k] !== '') {
          $config[$k] = $cargado[$k];
        }
      }
    }
  }

  foreach ($mapa as $k => $name) {
    $v = getenv($name);
    if (is_string($v) && $v !== '') {
      $config[$k] = $v;
    }
  }

  return $config = ceevs_db_normaliza_config($config);
}

/** Deja los valores en el tipo y el rango correctos, vengan de donde vengan. */
function ceevs_db_normaliza_config(array $c): array {
  $out = array(
    'host'    => trim((string) ($c['host'] ?? '')),
    'puerto'  => (int) ($c['puerto'] ?? 3306),
    'nombre'  => trim((string) ($c['nombre'] ?? '')),
    'usuario' => trim((string) ($c['usuario'] ?? '')),
    'clave'   => (string) ($c['clave'] ?? ''),
    'charset' => trim((string) ($c['charset'] ?? 'utf8mb4')),
  );
  $out['puerto'] = $out['puerto'] > 0 && $out['puerto'] < 65536 ? $out['puerto'] : 3306;
  if (preg_match('/^[A-Za-z0-9_]{1,32}$/', $out['charset']) !== 1) {
    $out['charset'] = 'utf8mb4';
  }
  // El host llega del panel: solo nombre de máquina, IP o socket local.
  if (preg_match('/^[A-Za-z0-9._:\/-]{0,120}$/', $out['host']) !== 1) {
    $out['host'] = '';
  }
  return $out;
}

function ceevs_db_configurada(): bool {
  $c = ceevs_db_config();
  return $c['host'] !== '' && $c['nombre'] !== '' && $c['usuario'] !== '';
}

/**
 * Escribe las credenciales. El archivo es PHP ejecutable (no un .json legible):
 * aunque el servidor llegara a servirlo por error, la guarda del principio corta
 * la ejecución y no se ve ni una letra de la contraseña.
 */
function ceevs_db_save_config(array $c, ?string &$error = null): bool {
  $error = '';
  $c = ceevs_db_normaliza_config($c);
  $path = ceevs_db_config_write_path();
  if ($path === '') {
    $error = 'No se pudo escribir el archivo de configuración en el servidor.';
    return false;
  }

  $php = "<?php\n"
    . "/**\n"
    . " * Credenciales de la base de datos del sitio CEEVS.\n"
    . " * Generado desde el panel. No subir a ningún repositorio ni carpeta pública.\n"
    . " */\n\n"
    . "defined('CEEVS_DATA_DIR') || exit;\n\n"
    . 'return ' . var_export(array(
      'host'    => $c['host'],
      'puerto'  => $c['puerto'],
      'nombre'  => $c['nombre'],
      'usuario' => $c['usuario'],
      'clave'   => $c['clave'],
      'charset' => $c['charset'],
    ), true) . ";\n";

  $tmp = $path . '.tmp';
  if (@file_put_contents($tmp, $php, LOCK_EX) === false) {
    $error = 'No se pudo escribir el archivo de configuración en el servidor.';
    return false;
  }
  if (!@rename($tmp, $path)) {
    @unlink($tmp);
    if (@file_put_contents($path, $php, LOCK_EX) === false) {
      $error = 'No se pudo guardar el archivo de configuración.';
      return false;
    }
  }
  @chmod($path, 0600);
  return true;
}

/* ─── Conexión ─── */

/** Último error de conexión, en texto apto para mostrar al administrador. */
function ceevs_db_error(?string $set = null): string {
  static $error = '';
  if ($set !== null) {
    $error = $set;
  }
  return $error;
}

/**
 * Abre (una sola vez por petición) la conexión PDO, o devuelve null.
 *
 * Devolver null en vez de lanzar es deliberado: quien llama debe poder seguir
 * con el respaldo de archivos sin envolver cada consulta en un try.
 */
function ceevs_db(bool $reconectar = false): ?PDO {
  static $pdo = false;
  if ($reconectar) {
    $pdo = false;
  }
  if ($pdo !== false) {
    return $pdo;
  }
  $pdo = null;

  if (!ceevs_db_soportada()) {
    ceevs_db_error('Este servidor no tiene el conector MySQL de PHP (PDO).');
    return null;
  }
  if (!ceevs_db_configurada()) {
    ceevs_db_error('La base de datos todavía no está configurada.');
    return null;
  }

  $c = ceevs_db_config();
  try {
    $pdo = ceevs_db_conectar($c);
  } catch (Throwable $e) {
    $pdo = null;
    ceevs_db_error(ceevs_db_mensaje_error($e));
    return null;
  }

  if (!ceevs_db_schema($pdo)) {
    $pdo = null;
    return null;
  }
  ceevs_db_error('');
  return $pdo;
}

/** ¿Tiene este PHP el conector MySQL? */
function ceevs_db_soportada(): bool {
  return class_exists('PDO') && in_array('mysql', PDO::getAvailableDrivers(), true);
}

/** Abre una conexión nueva con las credenciales dadas (lanza si falla). */
function ceevs_db_conectar(array $c): PDO {
  $dsn = 'mysql:host=' . $c['host'] . ';port=' . $c['puerto']
    . ';dbname=' . $c['nombre'] . ';charset=' . $c['charset'];
  return new PDO($dsn, $c['usuario'], $c['clave'], array(
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::ATTR_TIMEOUT            => CEEVS_DB_TIMEOUT,
  ));
}

/**
 * Comprueba unas credenciales ANTES de guardarlas.
 *
 * Importa el orden: si se guardaran primero y fallaran después, el sitio se
 * quedaría apuntando a una base inservible hasta que alguien lo corrigiera a
 * mano en el servidor.
 */
function ceevs_db_probar(array $c, ?string &$error = null): bool {
  $error = '';
  $c = ceevs_db_normaliza_config($c);
  if (!ceevs_db_soportada()) {
    $error = 'Este servidor no tiene el conector MySQL de PHP (PDO).';
    return false;
  }
  if ($c['host'] === '' || $c['nombre'] === '' || $c['usuario'] === '') {
    $error = 'Faltan el host, el nombre de la base de datos o el usuario.';
    return false;
  }
  try {
    $pdo = ceevs_db_conectar($c);
  } catch (Throwable $e) {
    $error = ceevs_db_mensaje_error($e);
    return false;
  }
  if (!ceevs_db_schema($pdo)) {
    $error = ceevs_db_error();
    return false;
  }
  return true;
}

/** Olvida la conexión y las credenciales memorizadas en esta petición. */
function ceevs_db_reset(): void {
  ceevs_db_config(true);
  ceevs_db(true);
}

/**
 * Traduce el error de PDO a algo accionable, sin filtrar la contraseña ni
 * rutas del servidor (el mensaje se muestra en el panel).
 */
function ceevs_db_mensaje_error(Throwable $e): string {
  $codigo = (string) $e->getCode();
  $mapa = array(
    '1045' => 'Usuario o contraseña de la base de datos incorrectos.',
    '1044' => 'Ese usuario no tiene permisos sobre esa base de datos.',
    '1049' => 'No existe una base de datos con ese nombre.',
    '2002' => 'No se pudo contactar con el servidor de base de datos (revisa el host).',
    '2005' => 'No se reconoce el host del servidor de base de datos.',
  );
  foreach ($mapa as $num => $texto) {
    if (strpos($e->getMessage(), '[' . $num . ']') !== false || $codigo === $num) {
      return $texto;
    }
  }
  return 'No se pudo conectar con la base de datos.';
}

/**
 * Crea las tablas si faltan.
 *
 * Se ejecuta en cada petición que usa base de datos: CREATE TABLE IF NOT EXISTS
 * sobre tablas ya creadas es una consulta de catálogo, no toca datos. A cambio,
 * el sistema se instala solo la primera vez y se repara si alguien borra una
 * tabla por accidente.
 */
function ceevs_db_schema(PDO $pdo): bool {
  // Se recuerda POR CONEXIÓN, no por petición: al reconfigurar la base desde el
  // panel se abre una conexión nueva y las tablas hay que crearlas otra vez.
  static $hechoEn = null;
  if ($hechoEn === $pdo) {
    return true;
  }
  $motor = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  $sql = array(
    'CREATE TABLE IF NOT EXISTS ' . CEEVS_DB_TABLA_PREINS . ' ('
      . 'id CHAR(16) NOT NULL,'
      . 'num INT UNSIGNED NOT NULL DEFAULT 0,'
      . 'creado DATETIME NOT NULL,'
      . 'estado VARCHAR(16) NOT NULL DEFAULT "nueva",'
      . 'ciclo VARCHAR(40) NOT NULL DEFAULT "",'
      . 'alumno VARCHAR(160) NOT NULL DEFAULT "",'
      . 'grado VARCHAR(120) NOT NULL DEFAULT "",'
      . 'encargado VARCHAR(160) NOT NULL DEFAULT "",'
      . 'tel VARCHAR(60) NOT NULL DEFAULT "",'
      . 'correo VARCHAR(160) NOT NULL DEFAULT "",'
      . 'tiene_foto TINYINT(1) NOT NULL DEFAULT 0,'
      . 'tiene_pdf TINYINT(1) NOT NULL DEFAULT 0,'
      . 'datos LONGTEXT NOT NULL,'
      . 'PRIMARY KEY (id),'
      . 'KEY idx_creado (creado),'
      . 'KEY idx_estado (estado),'
      . 'KEY idx_num (num)'
      . ')' . $motor,

    'CREATE TABLE IF NOT EXISTS ' . CEEVS_DB_TABLA_ARCHIVOS . ' ('
      . 'id CHAR(16) NOT NULL,'
      . 'tipo VARCHAR(8) NOT NULL,'
      . 'nombre VARCHAR(200) NOT NULL DEFAULT "",'
      . 'mime VARCHAR(80) NOT NULL DEFAULT "",'
      . 'bytes INT UNSIGNED NOT NULL DEFAULT 0,'
      . 'contenido MEDIUMBLOB NOT NULL,'
      . 'PRIMARY KEY (id, tipo),'
      . 'KEY idx_tipo (tipo, bytes)'   // deja sumar el disco usado sin leer los blobs
      . ')' . $motor,

    'CREATE TABLE IF NOT EXISTS ' . CEEVS_DB_TABLA_AJUSTES . ' ('
      . 'clave VARCHAR(60) NOT NULL,'
      . 'valor LONGTEXT NOT NULL,'
      . 'PRIMARY KEY (clave)'
      . ')' . $motor,
  );

  try {
    foreach ($sql as $q) {
      $pdo->exec($q);
    }
  } catch (Throwable $e) {
    ceevs_db_error('La base de datos conecta, pero el usuario no puede crear las tablas.');
    return false;
  }
  $hechoEn = $pdo;
  return true;
}

/** ¿Hay base de datos utilizable en esta petición? */
function ceevs_db_ready(): bool {
  return ceevs_db() instanceof PDO;
}

/* ─── Cerrojo entre procesos ─── */

/**
 * Nombre del cerrojo. Lleva dentro el nombre de la base porque en hosting
 * compartido GET_LOCK es del servidor MySQL entero, no de nuestra base: sin
 * distinguirlo, otro cliente del mismo servidor podría bloquearnos.
 */
function ceevs_db_lock_name(): string {
  return 'ceevs_' . substr(md5((string) ceevs_db_config()['nombre']), 0, 24);
}

/** Toma el cerrojo (espera hasta 3 s). Devuelve false si no lo consigue. */
function ceevs_db_lock(): bool {
  $pdo = ceevs_db();
  if (!$pdo) {
    return false;
  }
  try {
    $st = $pdo->prepare('SELECT GET_LOCK(?, 3)');
    $st->execute(array(ceevs_db_lock_name()));
    return (int) $st->fetchColumn() === 1;
  } catch (Throwable $e) {
    return false;
  }
}

function ceevs_db_unlock(): void {
  $pdo = ceevs_db();
  if (!$pdo) {
    return;
  }
  try {
    $st = $pdo->prepare('SELECT RELEASE_LOCK(?)');
    $st->execute(array(ceevs_db_lock_name()));
    $st->fetchAll();
  } catch (Throwable $e) {
    // Al cerrar la conexión MySQL suelta el cerrojo igualmente.
  }
}

/* ─── Utilidades comunes ─── */

/** Consulta preparada; devuelve null si la base falla (quien llama decide). */
function ceevs_db_run(string $sql, array $params = array()): ?PDOStatement {
  $pdo = ceevs_db();
  if (!$pdo) {
    return null;
  }
  try {
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st;
  } catch (Throwable $e) {
    ceevs_db_error('Error al consultar la base de datos.');
    return null;
  }
}
