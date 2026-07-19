<?php
/**
 * save.php — Publica la configuración del panel (requiere sesión + token CSRF).
 *
 * POST JSON { data: { ceevs_images: "<json>", ceevs_theme: "clasico", ... } }
 * Cada valor es la cadena cruda tal como vive en localStorage. Las claves que
 * no se envían se eliminan de la configuración publicada (restaurar original).
 * Cada publicación que cambia algo queda registrada en la bitácora.
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_fail('Método no permitido.', 405);
}

require_auth();
ceevs_require_csrf();

$body = read_json_body();
$data = isset($body['data']) && is_array($body['data']) ? $body['data'] : null;
if ($data === null) {
  json_fail('Formato inválido: falta el objeto "data".');
}

$clean = array();
$total = 0;
foreach (CEEVS_CONFIG_KEYS as $key) {
  if (!isset($data[$key])) {
    continue;
  }
  if (!is_string($data[$key])) {
    json_fail('Valor inválido para "' . $key . '" (se esperaba texto).');
  }
  $size = strlen($data[$key]);
  if ($size > CEEVS_MAX_VALUE_BYTES) {
    json_fail('El apartado "' . $key . '" es demasiado grande. Usa URLs o archivos subidos, no imágenes pegadas.');
  }
  $total += $size;
  $clean[$key] = $data[$key];
}

if ($total > CEEVS_MAX_VALUE_BYTES * 3) {
  json_fail('La configuración total es demasiado grande.');
}

// Diferencia contra lo ya publicado, para la bitácora.
$prev = ceevs_read_config();
$prevData = is_array($prev['data']) ? $prev['data'] : array();
$changed = array();
$removed = array();
foreach (CEEVS_CONFIG_KEYS as $key) {
  $before = isset($prevData[$key]) && is_string($prevData[$key]) ? $prevData[$key] : null;
  $after = $clean[$key] ?? null;
  if ($before === $after) {
    continue;
  }
  if ($after === null) {
    $removed[] = $key;
  } else {
    $changed[] = $key;
  }
}

if (!ceevs_write_config($clean)) {
  json_fail('No se pudo escribir la configuración en el servidor.', 500);
}

if ($changed || $removed) {
  $parts = array();
  if ($changed) {
    $parts[] = 'actualizó: ' . implode(', ', $changed);
  }
  if ($removed) {
    $parts[] = 'restauró/eliminó: ' . implode(', ', $removed);
  }
  ceevs_audit('config_saved', 'Publicación de cambios — ' . implode(' · ', $parts));
}

json_out(array('ok' => true, 'saved' => count($clean)));
