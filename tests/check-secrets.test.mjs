/**
 * Prueba de los patrones de `check-secrets.mjs`.
 *
 * El escáner es el único check cuyo modo de fallo es invisible: si un patrón deja de
 * detectar algo, el resultado sigue siendo verde y nadie se entera. La revisión adversarial
 * de este sistema encontró exactamente eso — la expresión regular genérica no veía
 * `'clave' => '…'`, que es justo el idioma que usa `api/db-config.example.php` —, así que
 * estos casos existen para que esa regresión no pueda repetirse en silencio.
 *
 * Sin dependencias: se ejecuta con `node tests/check-secrets.test.mjs`.
 * Exit: 0 = PASS · 1 = FAIL
 */
import { PATTERNS, shouldIgnoreValue } from '../scripts/check-secrets.mjs';

/** [descripción, contenido, ¿debe detectarse?] */
const CASES = [
  // ── Debe detectar ────────────────────────────────────────────────────────
  ['asignación con $ y guion bajo', `$db_pass = 'Tegus2026#Real';`, true],
  ['clave entrecomillada con =>', `'clave'   => 'Sup3rS3cretPwd!',`, true],
  ['JSON', `"password": "hunter2xyz#9",`, true],
  ['índice de array PHP', `$cfg['password'] = 'M1ContrasenaReal!';`, true],
  ['define() de PHP', `define('DB_PASSWORD', 'r3alPassw0rd!');`, true],
  ['smtp_password real', `'smtp_password' => 'Correo2026$hn',`, true],
  ['api key', `const apiKey = "sk-live-8f3ba91c77de4402";`, true],
  ['AWS access key', 'AKIAIOSFODNN7EXAMPLE', true],
  ['hash bcrypt', "'$2y$10$O6hiA/RhC.0ZLhY.RUYphueVdHtIZ5a8nlV0apCbpjHQGjWpPfksW'", true],
  ['clave privada', '-----BEGIN RSA PRIVATE KEY-----', true],
  ['cadena de conexión', 'mysql://ceevs:Cl4veReal@localhost:3306/db', true],

  // ── No debe detectar (ruido real de este repositorio) ─────────────────────
  ['mensaje de interfaz con emoji', `password_changed: '🔑 Contraseña cambiada',`, false],
  ['mensaje largo en español', `password_change_fail: '⛔ Cambio de contraseña rechazado',`, false],
  ['valor vacío', `'clave'   => '',`, false],
  ['marcador de posición', `'password' => 'CAMBIA_ESTO',`, false],
  ['placeholder en inglés', `password = "your-password-here"`, false],
  ['demasiado corto', `pass = 'abc'`, false],
  ['nombre de campo sin valor', `<input type="password" name="admin-pass">`, false],
];

function detects(content, file = 'prueba.php') {
  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    for (const match of content.matchAll(pattern.re)) {
      const value = pattern.valueGroup ? match[pattern.valueGroup] : match[0];
      if (pattern.valueGroup && shouldIgnoreValue(value, file)) continue;
      return true;
    }
  }
  return false;
}

let failed = 0;
console.log('\nPatrones de check-secrets\n');

for (const [label, content, expected] of CASES) {
  const actual = detects(content);
  const ok = actual === expected;
  if (!ok) failed += 1;
  const verb = expected ? 'detecta' : 'ignora';
  console.log(`  ${ok ? '✓' : '✗'} ${verb.padEnd(7)} ${label}${ok ? '' : `  ← esperado ${expected}, obtenido ${actual}`}`);
}

// El contexto de plantilla exonera al archivo de ejemplo, pero no a la documentación.
const CONTEXT = [
  ['api/db-config.example.php', `'clave' => 'AlgoQueParezcaReal1!',`, false],
  ['.env.example', `CEEVS_DB_PASS="AlgoQueParezcaReal1!"`, false],
  ['Docs/DEPLOYMENT.md', `db_password = "Tr0ub4dor&3xK"`, true],
];

console.log('');
for (const [file, content, expected] of CONTEXT) {
  const actual = detects(content, file);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${expected ? 'detecta' : 'ignora '} en ${file}${ok ? '' : `  ← esperado ${expected}, obtenido ${actual}`}`);
}

if (failed) {
  console.error(`\n  ${failed} caso(s) fallando.\n`);
  process.exit(1);
}
console.log(`\n  ${CASES.length + CONTEXT.length} casos, 0 fallos.\n`);
process.exit(0);
