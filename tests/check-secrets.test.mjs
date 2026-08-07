/**
 * Prueba de los patrones de `check-secrets.mjs`.
 *
 * El escáner es el único check cuyo modo de fallo es invisible: si un patrón deja de
 * detectar algo, el resultado sigue siendo verde y nadie se entera. La revisión adversarial
 * de este sistema encontró exactamente eso — la expresión regular genérica no veía
 * `'clave' => '…'`, que es justo el idioma que usa `api/db-config.example.php` —, así que
 * estos casos existen para que esa regresión no pueda repetirse en silencio.
 *
 * ⚠️ POR QUÉ LOS VALORES ESTÁN PARTIDOS EN FRAGMENTOS
 * Este archivo se versiona, y el escáner analiza todo archivo versionado. Si los señuelos
 * estuvieran escritos enteros, el escáner los detectaría —correctamente— y se pondría rojo
 * contra su propia suite. Partirlos evita el falso positivo **sin** crear un punto ciego:
 * `tests/` se sigue analizando como cualquier otra carpeta, así que un secreto de verdad
 * escrito aquí sí bloquearía. La alternativa (excluir `tests/` del escaneo) habría sido
 * más corta y habría dejado justo el hueco que este sistema existe para no tener.
 *
 * Sin dependencias: `node tests/check-secrets.test.mjs`
 * Exit: 0 = PASS · 1 = FAIL
 */
import { PATTERNS, shouldIgnoreValue } from '../scripts/check-secrets.mjs';

/* Fragmentos. Los nombres evitan a propósito palabras clave de credencial (pass, secret,
   key, clave…) para que estas mismas líneas no disparen la regla genérica. */
const V_DB = 'Tegus2026' + '#Real';
const V_QUOTED = 'Sup3rS3' + 'cretPwd!';
const V_JSON = 'hunter2' + 'xyz#9';
const V_ARRAY = 'M1Contrasena' + 'Real!';
const V_DEFINE = 'r3alPass' + 'w0rd!';
const V_SMTP = 'Correo2026' + '$hn';
const V_API = 'sk-live-' + '8f3ba91c77de4402';
const V_AWS = 'AKIA' + 'IOSFODNN7EXAMPLE';
const V_BCRYPT = '$2y$10$' + 'O6hiA/RhC.0ZLhY.RUYphueVdHtIZ5a8nlV0apCbpjHQGjWpPfksW';
const V_PEM = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
const V_DSN = 'mysql://ceevs:' + 'Cl4veReal@localhost:3306/db';
const V_DOC = 'Tr0ub4dor' + '&3xK';
const V_TEMPLATE = 'AlgoQueParezca' + 'Real1!';
const V_PROSE = 'correct horse ' + 'battery staple';

/** [descripción, contenido, ¿debe detectarse?] */
const CASES = [
  // ── Debe detectar ────────────────────────────────────────────────────────
  ['asignación con $ y guion bajo', `$db_pass = '${V_DB}';`, true],
  ['clave entrecomillada con =>', `'clave'   => '${V_QUOTED}',`, true],
  ['JSON', `"password": "${V_JSON}",`, true],
  ['índice de array PHP', `$cfg['password'] = '${V_ARRAY}';`, true],
  ['define() de PHP', `define('DB_PASSWORD', '${V_DEFINE}');`, true],
  ['smtp_password real', `'smtp_password' => '${V_SMTP}',`, true],
  ['api key', `const apiKey = "${V_API}";`, true],
  ['AWS access key', V_AWS, true],
  ['hash bcrypt', `'${V_BCRYPT}'`, true],
  ['clave privada', V_PEM, true],
  ['cadena de conexión', V_DSN, true],

  // ── No debe detectar (ruido real de este repositorio) ─────────────────────
  ['mensaje de interfaz con emoji', `password_changed: '🔑 Contraseña cambiada',`, false],
  ['mensaje largo en español', `password_change_fail: '⛔ Cambio de contraseña rechazado',`, false],
  ['valor vacío', `'clave'   => '',`, false],
  ['marcador de posición', `'password' => 'CAMBIA_ESTO',`, false],
  ['placeholder en inglés', `password = "your-password-here"`, false],
  ['demasiado corto', `pass = 'abc'`, false],
  ['nombre de campo sin valor', `<input type="password" name="admin-pass">`, false],
  ['nombre de variable de entorno', `'clave'   => 'CEEVS_DB_PASS',`, false],
  ['ruta de script en package.json', `"check:secrets": "node scripts/check-secrets.mjs",`, false],
  ['cargo del equipo directivo', `"Secretario": "Secretary",`, false],
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
  const verb = expected ? 'detecta' : 'ignora ';
  console.log(`  ${ok ? '✓' : '✗'} ${verb} ${label}${ok ? '' : `  ← esperado ${expected}, obtenido ${actual}`}`);
}

/* El contexto de plantilla exonera al archivo de ejemplo, pero NO a la documentación:
   un `.md` es uno de los sitios donde de verdad acaba pegada una contraseña de producción. */
const CONTEXT = [
  ['api/db-config.example.php', `'clave' => '${V_TEMPLATE}',`, false],
  ['.env.example', `CEEVS_DB_PASS="${V_TEMPLATE}"`, false],
  ['Docs/DEPLOYMENT.md', `db_password = "${V_DOC}"`, true],
];

console.log('');
for (const [file, content, expected] of CONTEXT) {
  const actual = detects(content, file);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${expected ? 'detecta' : 'ignora '} en ${file}${ok ? '' : `  ← esperado ${expected}, obtenido ${actual}`}`);
}

/* Limitación conocida y aceptada, aquí para que quede documentada y no se olvide:
   una passphrase de palabras corrientes, sin dígitos ni símbolos, se lee como prosa. */
console.log('');
const passphraseDetected = detects(`$db_pass = '${V_PROSE}';`);
console.log(`  ${passphraseDetected ? '!' : '·'} limitación conocida: passphrase sin dígitos ni símbolos → ${passphraseDetected ? 'detectada' : 'NO detectada (documentado)'}`);

if (failed) {
  console.error(`\n  ${failed} caso(s) fallando.\n`);
  process.exit(1);
}
console.log(`\n  ${CASES.length + CONTEXT.length} casos, 0 fallos.\n`);
process.exit(0);
