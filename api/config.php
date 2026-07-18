<?php
/**
 * config.php — Entrega la configuración publicada del sitio (lectura pública).
 *
 * GET → { app: 'ceevs-admin', updatedAt: string|null, data: { ceevs_*: string } }
 * La leen todas las páginas del sitio (image-manager.js) y el panel admin.
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  json_fail('Método no permitido.', 405);
}

json_out(ceevs_read_config());
