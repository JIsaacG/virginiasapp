/**
 * build-deploy.mjs — arma la carpeta que se sube al hosting.
 *
 * El sitio no tiene proceso de build: se publica copiando archivos. El riesgo
 * de una subida manual no es olvidar algo, es subir de más: `.env` con las
 * credenciales de la base, `server-data/` (que pisaría la configuración real
 * del panel en el servidor), `node_modules/`, o el .xlsx de 11 MB.
 *
 * Este script deja en output/deploy/ exactamente lo que debe ser público, con
 * una lista explícita de exclusiones que se puede leer y discutir. No sustituye
 * al criterio: si añades una carpeta nueva al repositorio, decide aquí si viaja.
 *
 * Uso:  node scripts/build-deploy.mjs [--list]
 *       --list  solo imprime lo que copiaría, sin escribir nada.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'output', 'deploy');
const listOnly = process.argv.includes('--list');

/* Carpetas excluidas por NOMBRE, estén donde estén: no hay ningún caso legítimo
   de una carpeta con estos nombres que deba publicarse. */
const EXCLUDED_DIR_NAMES = new Map([
  ['node_modules', 'dependencias de desarrollo'],
  ['__pycache__', 'caché de Python'],
  ['.git', 'historial del repositorio'],
]);

/* Carpetas excluidas por RUTA EXACTA desde la raíz. Van por ruta y no por nombre
   porque el nombre solo no basta: `components/` (fragmentos HTML de referencia)
   no se publica, pero `js/components/` es JavaScript que las páginas sí cargan. */
const EXCLUDED_DIRS = new Map([
  ['.github', 'CI'],
  ['.claude', 'configuración del asistente'],
  ['.lighthouseci', 'informes locales'],
  ['.playwright-cli', 'trazas locales'],
  ['Docs', 'documentación interna'],
  ['Requerimientos', 'documentación interna'],
  ['components', 'fragmentos de referencia: ninguna página los carga en runtime'],
  ['layouts', 'plantillas de referencia, sin consumidor en runtime'],
  ['scripts', 'herramientas de desarrollo'],
  ['tests', 'pruebas de las herramientas'],
  ['_test', 'pruebas manuales'],
  ['patches', 'parches de npm'],
  ['reports', 'informes generados'],
  ['output', 'salida de este mismo script'],
  // Estado del servidor: vive EN el hosting y no debe viajar desde el portátil.
  // Subir la copia local pisaría la configuración publicada del panel y, peor,
  // las solicitudes de admisión guardadas en modo archivos.
  ['server-data', 'estado del servidor: se migra aparte, nunca se sobrescribe'],
  ['uploads', 'imágenes subidas desde el panel: se migran aparte'],
  // Fuentes de la mascota. El sitio solo pide assets/animacion/N.webp
  // (js/modules/mascota.js:45); estas carpetas son el material del que
  // salieron los .webp y suman ~14 MB que nadie descarga.
  ['assets/animacion/originales', 'fuentes de la animación, no se sirven'],
  ['assets/animacion/nuevas', 'fuentes de la animación, no se sirven'],
]);

/* Archivos que NUNCA se publican. */
const EXCLUDED_FILES = new Set([
  'CLAUDE.md', 'README.md', 'package.json', 'package-lock.json',
  'lighthouserc.cjs', '_config.yml', '.editorconfig', '.mcp.json', '.gitignore',
  'generate-pages.py', 'minify.py',
  // Credenciales: nunca, bajo ningún concepto.
  '.env', 'api/db-config.php', 'api/correo-config.php',
]);

/* Extensiones que no pintan nada en un servidor web. */
const EXCLUDED_EXT = new Set(['.md', '.py', '.pyc', '.xlsx', '.zip', '.log', '.bak', '.sql']);

/* Excepciones a lo anterior: archivos que sí viajan aunque encajen en una regla. */
const FORCE_INCLUDE = new Set([
  '.htaccess',                  // oculto, y sin él se cae HTTPS, caché y seguridad
  'api/db-esquema.sql',         // referencia del esquema, útil en el servidor
  'assets/README.md',           // convenciones de imágenes, inofensivo
]);

const copied = [];
const skipped = [];

function walk(rel) {
  const abs = path.join(root, rel);
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const reason = EXCLUDED_DIR_NAMES.get(entry.name) ?? EXCLUDED_DIRS.get(childRel);
      if (reason) { skipped.push(`${childRel}/  — ${reason}`); continue; }
      walk(childRel);
      continue;
    }

    if (!FORCE_INCLUDE.has(childRel)) {
      if (EXCLUDED_FILES.has(childRel) || EXCLUDED_FILES.has(entry.name)) {
        skipped.push(`${childRel}  — excluido`); continue;
      }
      if (EXCLUDED_EXT.has(path.extname(entry.name).toLowerCase())) {
        skipped.push(`${childRel}  — extensión no publicable`); continue;
      }
      // .env, .env.local, .env.production… cualquier variante.
      if (entry.name.startsWith('.env')) {
        skipped.push(`${childRel}  — credenciales`); continue;
      }
    }

    copied.push(childRel);
    if (!listOnly) {
      const dest = path.join(outDir, childRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(root, childRel), dest);
    }
  }
}

if (!listOnly && fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
walk('');

const bytes = copied.reduce((sum, f) => sum + fs.statSync(path.join(root, f)).size, 0);

console.log(`\nPaquete de publicación: ${copied.length} archivos · ${(bytes / 1048576).toFixed(1)} MB`);
console.log(listOnly ? '  (--list: no se escribió nada)' : `  Destino: output/deploy/`);
console.log('\nCarpetas y archivos excluidos:');
for (const s of skipped) console.log(`  – ${s}`);

/* Red de seguridad: si algo con pinta de credencial se coló, fallar ruidosamente. */
const leaked = copied.filter((f) =>
  /(^|\/)\.env/.test(f) || /db-config\.php$/.test(f) || /correo-config\.php$/.test(f) ||
  f.startsWith('server-data/') || f.startsWith('uploads/'));
if (leaked.length) {
  console.error('\n✗ ABORTAR: el paquete contiene archivos que no deben publicarse:');
  for (const f of leaked) console.error(`    ${f}`);
  process.exitCode = 1;
} else {
  console.log('\n✓ Sin credenciales ni estado del servidor en el paquete.');
}
