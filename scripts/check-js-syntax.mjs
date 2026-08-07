/**
 * Comprobación de sintaxis de todo el JavaScript del sitio.
 *
 * El sitio no tiene bundler ni linter: los scripts se cargan tal cual con <script>.
 * Un error de sintaxis no lo detecta nada hasta que un visitante abre la página y el
 * navegador deja de ejecutar el archivo entero en silencio. `node --check` parsea sin
 * ejecutar, así que atrapa ese caso sin instalar ninguna dependencia.
 *
 * Exit: 0 = PASS · 1 = FAIL
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// vendor/ es código de terceros minificado y dist/ es salida generada por minify.py:
// ninguno de los dos se edita a mano, así que un fallo ahí no diría nada útil.
const SCAN_DIRS = ['js', 'scripts'];
const SKIP_DIRS = new Set(['vendor', 'node_modules']);

function collect(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collect(path.join(dir, entry.name), out);
    } else if (/\.(m|c)?js$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => collect(path.join(root, dir)));
const failures = [];

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    const detail = String(error.stderr || error.message)
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 4)
      .join('\n    ');
    failures.push(`${path.relative(root, file)}\n    ${detail}`);
  }
}

if (failures.length) {
  console.error(`\nSintaxis JS: ${failures.length} archivo(s) con error\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}\n`);
  process.exit(1);
}

console.log(`\nSintaxis JS: ${files.length} archivos analizados, 0 errores`);
process.exit(0);
