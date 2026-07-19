<?php
/**
 * upload.php — Sube una imagen o video al servidor (requiere sesión).
 *
 * POST multipart con el campo "file". El archivo queda en uploads/AAAA/MM/ y
 * se responde { ok: true, url: 'uploads/AAAA/MM/nombre.ext' }. El tipo real
 * se verifica con finfo (no se confía en la extensión del nombre).
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

require_auth();
ceevs_require_csrf();

if (empty($_FILES['file'])) {
  json_fail('No se recibió ningún archivo.');
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
  $msg = 'No se pudo subir el archivo (código ' . $file['error'] . ').';
  if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
    $msg = 'El archivo supera el tamaño máximo permitido por el servidor (límite actual: ' . ini_get('upload_max_filesize') . ').';
  }
  json_fail($msg);
}

if ($file['size'] <= 0 || $file['size'] > CEEVS_MAX_UPLOAD_BYTES) {
  json_fail('El archivo supera el máximo de 60 MB.');
}

$allowed = array(
  'image/jpeg'      => 'jpg',
  'image/png'       => 'png',
  'image/webp'      => 'webp',
  'image/gif'       => 'gif',
  'image/avif'      => 'avif',
  'video/mp4'       => 'mp4',
  'video/webm'      => 'webm',
  'video/quicktime' => 'mov',
);

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!isset($allowed[$mime])) {
  json_fail('Tipo de archivo no permitido (' . $mime . '). Usa JPG, PNG, WebP, GIF, AVIF, MP4 o WebM.');
}
$ext = $allowed[$mime];

ceevs_ensure_uploads_dir();
$subdir = gmdate('Y') . '/' . gmdate('m');
$destDir = CEEVS_UPLOADS_DIR . '/' . $subdir;
if (!is_dir($destDir) && !@mkdir($destDir, 0755, true)) {
  json_fail('No se pudo crear la carpeta de destino en el servidor.', 500);
}

// Nombre seguro: base del nombre original (sin tildes ni símbolos) + sufijo aleatorio.
$base = pathinfo($file['name'], PATHINFO_FILENAME);
$base = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base) ?: 'archivo';
$base = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $base));
$base = trim(substr($base, 0, 40), '-') ?: 'archivo';
$name = $base . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

$dest = $destDir . '/' . $name;
if (!@move_uploaded_file($file['tmp_name'], $dest)) {
  json_fail('No se pudo guardar el archivo en el servidor.', 500);
}
@chmod($dest, 0644);

ceevs_audit('file_uploaded', 'Subió "' . $file['name'] . '" (' . $mime . ', ' . round($file['size'] / 1024) . ' KB) → uploads/' . $subdir . '/' . $name);

json_out(array(
  'ok'   => true,
  'url'  => 'uploads/' . $subdir . '/' . $name,
  'name' => $file['name'],
  'size' => $file['size'],
  'type' => $mime,
));
