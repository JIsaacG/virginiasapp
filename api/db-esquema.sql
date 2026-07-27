-- ============================================================================
-- Esquema de la base de datos del sitio CEEVS (solicitudes de admisión).
--
-- NO hace falta ejecutarlo: api/db.php crea estas tablas solo la primera vez
-- que conecta. Este archivo existe para poder crearlas a mano desde phpMyAdmin
-- y como documentación de la estructura.
--
-- CÓMO USARLO EN HOSTINGER
--   hPanel → Bases de datos → phpMyAdmin → entrar a la base (p. ej.
--   u550773096_preinscrip) → pestaña "SQL" → pegar todo → Continuar.
--
--   Ojo: hay que ENTRAR primero a la base en el panel izquierdo. Aquí no se
--   incluye CREATE DATABASE porque en hosting compartido el usuario no tiene
--   ese permiso: la base se crea desde hPanel, no por SQL.
--
-- Es repetible: con IF NOT EXISTS, volver a ejecutarlo no borra ni duplica nada.
--
-- ⚠️ Si algún día cambia una columna, hay que cambiarla también en
--    ceevs_db_schema() dentro de api/db.php, que es la versión que manda.
-- ============================================================================

-- Una fila por solicitud. Las columnas sueltas son las que necesita la lista
-- del panel (buscar, filtrar, ordenar); `datos` guarda el expediente completo
-- en JSON, que es lo que se lee al abrir la ficha.
CREATE TABLE IF NOT EXISTS `ceevs_preinscripciones` (
  `id`         CHAR(16)     NOT NULL,
  `num`        INT UNSIGNED NOT NULL DEFAULT 0,
  `creado`     DATETIME     NOT NULL,
  `estado`     VARCHAR(16)  NOT NULL DEFAULT 'nueva',
  `ciclo`      VARCHAR(40)  NOT NULL DEFAULT '',
  `alumno`     VARCHAR(160) NOT NULL DEFAULT '',
  `grado`      VARCHAR(120) NOT NULL DEFAULT '',
  `encargado`  VARCHAR(160) NOT NULL DEFAULT '',
  `tel`        VARCHAR(60)  NOT NULL DEFAULT '',
  `correo`     VARCHAR(160) NOT NULL DEFAULT '',
  `tiene_foto` TINYINT(1)   NOT NULL DEFAULT 0,
  `tiene_pdf`  TINYINT(1)   NOT NULL DEFAULT 0,
  `datos`      LONGTEXT     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_creado` (`creado`),
  KEY `idx_estado` (`estado`),
  KEY `idx_num` (`num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foto del alumno y copia PDF de la hoja, como binarios. Van dentro de la base
-- a propósito: en disco se perderían en cada publicación del sitio, que es
-- justo el problema que esto resuelve.
CREATE TABLE IF NOT EXISTS `ceevs_preinscripcion_archivos` (
  `id`         CHAR(16)     NOT NULL,
  `tipo`       VARCHAR(8)   NOT NULL,
  `nombre`     VARCHAR(200) NOT NULL DEFAULT '',
  `mime`       VARCHAR(80)  NOT NULL DEFAULT '',
  `bytes`      INT UNSIGNED NOT NULL DEFAULT 0,
  `contenido`  MEDIUMBLOB   NOT NULL,
  PRIMARY KEY (`id`, `tipo`),
  KEY `idx_tipo` (`tipo`, `bytes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajustes del formulario público y correlativo de solicitudes.
-- Se llena solo desde el panel; si está vacía se usan los valores por defecto
-- (formulario abierto y correlativo empezando en 111).
CREATE TABLE IF NOT EXISTS `ceevs_ajustes` (
  `clave` VARCHAR(60) NOT NULL,
  `valor` LONGTEXT    NOT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
