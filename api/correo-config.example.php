<?php
/**
 * Plantilla de correo SMTP para CEEVS.
 *
 * Cuando se tengan los datos del servidor:
 * 1. Copiar este archivo como ../server-data/correo-config.php
 * 2. Rellenar los valores.
 * 3. Mantener el archivo fuera del repositorio y de cualquier carpeta pública.
 *
 * `smtp_security`:
 *   - tls  → STARTTLS, normalmente puerto 587
 *   - ssl  → TLS desde la conexión, normalmente puerto 465
 *   - none → sin cifrado (no recomendado)
 */

defined('CEEVS_DATA_DIR') || exit;

return array(
  'smtp_host'     => '', // Ejemplo: smtp.proveedor.com
  'smtp_port'     => 587,
  'smtp_security' => 'tls',
  'smtp_user'     => '',
  'smtp_password' => '',

  'from_email'    => '', // Cuenta autorizada para enviar
  'from_name'     => 'Centro Educativo Evangélico Virginia Sapp',
  'admissions_to' => '', // Dirección institucional que recibirá las solicitudes

  'timeout'       => 15,
);
