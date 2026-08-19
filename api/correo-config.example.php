<?php
/**
 * Plantilla de correo SMTP para CEEVS.
 *
 * Cuando se tengan los datos del servidor:
 * 1. Copiar este archivo como ../server-data/correo-config.php
 * 2. Rellenar los valores.
 * 3. Mantener el archivo fuera del repositorio y de cualquier carpeta pública.
 *
 * Cuenta institucional de envío automático (todos los correos que manda el
 * sitio salen de aquí): servicios@virginiasapp.edu.hn, en Microsoft 365 con
 * SMTP autenticado habilitado — host smtp.office365.com, puerto 587, STARTTLS.
 * La contraseña NO se escribe en este archivo: va solo en la copia privada de
 * server-data/ o en la variable de entorno CEEVS_SMTP_PASSWORD.
 *
 * `smtp_security`:
 *   - tls  → STARTTLS, normalmente puerto 587
 *   - ssl  → TLS desde la conexión, normalmente puerto 465
 *   - none → sin cifrado (no recomendado)
 */

defined('CEEVS_DATA_DIR') || exit;

return array(
  'smtp_host'     => '', // Ejemplo: smtp.office365.com
  'smtp_port'     => 587,
  'smtp_security' => 'tls',
  'smtp_user'     => '', // Ejemplo: servicios@virginiasapp.edu.hn
  'smtp_password' => '',

  'from_email'    => '', // Cuenta autorizada para enviar (la misma del usuario SMTP)
  'from_name'     => 'Centro Educativo Evangélico Virginia Sapp',
  'admissions_to' => '', // Dirección institucional que recibirá las solicitudes

  'timeout'       => 15,
);
