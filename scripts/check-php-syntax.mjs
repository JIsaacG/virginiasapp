/**
 * Comprobación de sintaxis del backend PHP (`php -l`).
 *
 * `api/` maneja login, CSRF, uploads y las solicitudes de admisión en MySQL. Un error de
 * sintaxis ahí no rompe una página: rompe el envío de una solicitud de una familia, y el
 * fallo solo aparece en producción. `php -l` parsea sin ejecutar y no necesita base de
 * datos ni servidor.
 *
 * PHP no siempre está en el PATH de la máquina de desarrollo (en Windows con XAMPP suele
 * no estarlo). En ese caso el resultado es NOT AVAILABLE, no un fallo: declarar la
 * ausencia es más honesto que fingir un verde.
 *
 * Exit: 0 = PASS · 1 = FAIL · 2 = NOT AVAILABLE
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SCAN_DIRS = ['api'];

function phpBinary() {
  for (const candidate of [process.env.PHP_BIN, 'php'].filter(Boolean)) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'pipe' });
      return candidate;
    } catch {
      /* seguimos probando */
    }
  }
  return null;
}

const php = phpBinary();
if (!php) {
  console.log('\nSintaxis PHP: NOT AVAILABLE — no hay intérprete PHP en el PATH.');
  console.log('  Instálalo o exporta PHP_BIN con la ruta al binario (XAMPP: C:\\xampp\\php\\php.exe).');
  process.exit(2);
}

function collect(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.name.endsWith('.php')) out.push(full);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => collect(path.join(root, dir)));
const failures = [];

for (const file of files) {
  try {
    execFileSync(php, ['-l', file], { stdio: 'pipe' });
  } catch (error) {
    const detail = String(error.stdout || error.stderr || error.message)
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 3)
      .join('\n    ');
    failures.push(`${path.relative(root, file)}\n    ${detail}`);
  }
}

if (failures.length) {
  console.error(`\nSintaxis PHP: ${failures.length} archivo(s) con error\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}\n`);
  process.exit(1);
}

console.log(`\nSintaxis PHP: ${files.length} archivos analizados, 0 errores`);
process.exit(0);
