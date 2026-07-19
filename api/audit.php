<?php
/**
 * audit.php — Entrega la bitácora de movimientos del panel (requiere sesión).
 *
 * GET ?limit=100 → { ok: true, entries: [ { t, a, ok, u, ip, ua, d }, ... ] }
 * La más reciente primero. Solo lectura: la bitácora no se puede editar ni
 * borrar desde la API.
 */

require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
  json_fail('Método no permitido.', 405);
}

require_auth();

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
$limit = max(1, min($limit, 300));

json_out(array('ok' => true, 'entries' => ceevs_audit_read($limit)));
