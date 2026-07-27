<?php
/**
 * Plantilla de conexión a la base de datos MySQL de CEEVS.
 *
 * Lo normal es NO tocar este archivo: la conexión se configura desde el panel
 * (pestaña 📋 Pre-inscripciones → tarjeta "Base de datos"), que prueba las
 * credenciales, crea las tablas y guarda el archivo en el sitio correcto.
 *
 * Esta plantilla es para hacerlo a mano. En Hostinger:
 *  1. hPanel → Bases de datos → MySQL: crear base y usuario.
 *  2. Copiar este archivo, con los datos rellenos, a la PRIMERA ruta que exista
 *     de estas (de más a menos recomendable):
 *       /home/<cuenta>/VIRGINIASAPP/ceevs-db.php     ← fuera de public_html
 *       /home/<cuenta>/ceevs-db.php                  ← fuera de public_html
 *       <sitio>/server-data/db-config.php
 *       <sitio>/api/db-config.php
 *     Las dos primeras son las buenas: al estar fuera de public_html, publicar
 *     una versión nueva del sitio no se las lleva.
 *
 * También se puede prescindir del archivo usando variables de entorno:
 * CEEVS_DB_HOST, CEEVS_DB_PORT, CEEVS_DB_NAME, CEEVS_DB_USER, CEEVS_DB_PASS.
 *
 * Si no hay nada configurado, el sitio sigue funcionando contra archivos.
 */

defined('CEEVS_DATA_DIR') || exit;

return array(
  'host'    => 'localhost', // En Hostinger casi siempre localhost
  'puerto'  => 3306,
  'nombre'  => '',          // Ejemplo: u123456789_ceevs
  'usuario' => '',          // Ejemplo: u123456789_admin
  'clave'   => '',
  'charset' => 'utf8mb4',
);
