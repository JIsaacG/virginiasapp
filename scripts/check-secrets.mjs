/**
 * Escáner de secretos y archivos sensibles versionados.
 *
 * Sustituye a una dependencia tipo gitleaks para el caso concreto de este repositorio.
 * Solo mira **archivos versionados** (`git ls-files`), porque son los únicos que acaban
 * publicados en GitHub. Un `.env` en disco pero ignorado no es una fuga; el mismo `.env`
 * versionado sí lo es.
 *
 * Dos reglas:
 *   A) Rutas prohibidas — archivos que nunca deben estar versionados.
 *   B) Patrones de credenciales dentro del contenido de archivos de texto versionados.
 *
 * Los hallazgos documentados y aceptados viven en ACKNOWLEDGED: se imprimen siempre
 * (visibles, no ocultos) pero no bloquean, para que el gate no quede rojo de forma
 * permanente y un hallazgo NUEVO destaque de inmediato.
 *
 * Los valores nunca se imprimen completos. Se redactan.
 *
 * Exit: 0 = PASS · 1 = FAIL
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

/* ── A) Rutas que nunca deben estar versionadas ───────────────────────────── */
const FORBIDDEN_PATHS = [
  { re: /^\.env$/, why: 'credenciales reales de la base de datos' },
  { re: /^\.env\.(?!example$)/, why: 'variante de .env con credenciales' },
  { re: /^api\/db-config\.php$/, why: 'credenciales MySQL del sitio' },
  { re: /^api\/correo-config\.php$/, why: 'credenciales SMTP' },
  { re: /^server-data\//, why: 'estado del servidor: cuenta admin, config publicada, bitácora' },
  { re: /^uploads\//, why: 'archivos subidos por el panel' },
  { re: /\.(pem|key|pfx|p12|keystore)$/i, why: 'material criptográfico privado' },
  { re: /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/, why: 'clave SSH privada' },
  { re: /(^|\/)\.htpasswd$/, why: 'hashes de autenticación HTTP' },
];

/* ── B) Patrones de credenciales en el contenido ──────────────────────────── */
const PATTERNS = [
  { name: 'clave privada', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'token de Slack', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}/g },
  { name: 'token de GitHub', re: /\bgh[pousr]_[0-9A-Za-z]{36,}/g },
  { name: 'hash bcrypt', re: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g },
  { name: 'cadena de conexión con contraseña', re: /\b(?:mysql|postgres|mongodb|redis):\/\/[^\s:@/]+:[^\s@/]+@/g },
  {
    // Sin \b delante: en `$db_pass` o `smtp_password` el guion bajo es carácter de
    // palabra, así que un \b inicial nunca casaría y el secreto pasaría inadvertido.
    //
    // El `['"\]]*` antes del operador es lo que hace que funcione con la forma que usa
    // este repositorio: `'clave' => '…'` (api/db-config.example.php), `"password": "…"`
    // en JSON y `$cfg['password'] = '…'`. Sin él, la clave entrecomillada nunca casaba
    // y la rama `=>` era inalcanzable justo para el idioma que sí se usa aquí.
    // `secret(?!ari)` evita que "Secretario"/"Secretaría" —cargos del equipo directivo,
    // muy presentes en js/i18n-data.js— se lean como la palabra "secret".
    name: 'credencial asignada en código',
    re: /[\w.$-]*(?:password|passwd|pwd|pass|secret(?!ari)|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|contrase(?:n|ñ)a|clave)\w*['"\]]*\s*(?:=>|[:=])\s*(['"])([^'"\n]{8,})\1/gi,
    valueGroup: 2,
  },
  {
    // define('DB_PASSWORD', '…') — la constante PHP separa clave y valor con coma, no
    // con un operador de asignación, así que no la ve el patrón anterior.
    name: 'credencial en define()',
    re: /\bdefine\s*\(\s*(['"])[\w.-]*(?:password|passwd|pwd|pass|secret|key|token|contrase(?:n|ñ)a|clave)\w*\1\s*,\s*(['"])([^'"\n]{8,})\2/gi,
    valueGroup: 3,
  },
];

/** Valores que son claramente marcadores de posición, no secretos. */
const PLACEHOLDER = /^(?:$|x{3,}|\*{3,}|\.{3,}|-+|<.*>|\{\{.*\}\}|\$\{.*\}|%[A-Z_]+%|(?:tu|your|my)[_-].*|cambia.*|reemplaza.*|change[_-]?me|placeholder|ejemplo.*|example.*|sample.*|dummy|test|demo|null|none|true|false|password|secret|123456\d*|abc123)$/i;

/**
 * Archivos que son plantillas por convención de nombre (`db-config.example.php`,
 * `.env.example`). Anclado a separadores: una versión por subcadena exoneraba de paso
 * *toda* la documentación `.md`, que es justo uno de los sitios donde de verdad se filtra
 * una contraseña copiada de producción.
 */
const PLACEHOLDER_CONTEXT = /(?:^|[/.\\-])(?:example|ejemplo|sample|template|dist)(?:$|[/.\\-])/i;

/**
 * Distingue un mensaje de interfaz de una contraseña. `js/admin.js` está lleno de cadenas
 * como '🔑 Contraseña cambiada' asignadas a claves cuyo nombre contiene "password"; sin
 * este filtro el ruido entierra los hallazgos reales.
 *
 * Se considera prosa si lleva espacio y **no** tiene ningún rasgo típico de contraseña
 * (dígito o símbolo). Filtrar por "contiene un espacio" a secas era demasiado amplio: dejaba
 * pasar cualquier passphrase.
 *
 * LIMITACIÓN CONOCIDA: una passphrase de palabras corrientes sin dígitos ni símbolos
 * ('correct horse battery staple') sigue leyéndose como prosa y no se reporta. Separarlas
 * de un mensaje en español no es resoluble con una expresión regular; la Regla A y la
 * revisión del diff por el security-reviewer son la red para ese caso.
 */
const PASSWORD_TRAITS = /[\d!@#$%^&*_+=<>?~/\\|-]/;
const looksLikeProse = (value) => /\s/.test(value) && !PASSWORD_TRAITS.test(value);

/**
 * Un identificador en mayúsculas es el **nombre** de una variable de entorno, no su valor.
 * `api/db.php` y `api/bootstrap.php` mapean sus ajustes así: `'clave' => 'CEEVS_DB_PASS'`.
 * Lo que importa es el valor que llega por el entorno, y ese no está en el repositorio.
 */
const ENV_VAR_NAME = /^[A-Z][A-Z0-9_]{2,}$/;

/**
 * Rutas y órdenes: `"check:secrets": "node scripts/check-secrets.mjs"` en package.json es
 * una clave con la palabra "secret" y un comando por valor.
 */
const LOOKS_LIKE_PATH = /(?:^|[\s/\\])[\w.-]+\.(?:mjs|cjs|js|ts|py|sh|php|json|ya?ml|md|html|css)(?:\s|$)/i;

/**
 * Valores que ya casan con un patrón más específico de esta misma lista. Se reportan una
 * sola vez, bajo el patrón concreto (que además es el que puede estar en ACKNOWLEDGED),
 * y no otra vez bajo la regla genérica.
 */
const COVERED_BY_SPECIFIC = /^(?:\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})$/;

/**
 * Hallazgos revisados y aceptados. Se listan en la salida como ACKNOWLEDGED.
 *
 * La aceptación se ancla al **valor concreto** mediante huella SHA-256 truncada, no al
 * archivo: aceptar "api/bootstrap.php + hash bcrypt" en bloque silenciaría también
 * cualquier credencial que alguien añadiera mañana a ese archivo. Con la huella, un valor
 * distinto vuelve a bloquear. Se guarda la huella, nunca el valor.
 *
 * Para añadir una entrada hace falta una razón escrita. Si no la puedes escribir, no la aceptes.
 * Huella: node -e "console.log(require('crypto').createHash('sha256').update(VALOR).digest('hex').slice(0,16))"
 */
const ACKNOWLEDGED = [
  {
    file: 'api/bootstrap.php',
    fingerprint: '6c30cf3fbe3b187c',
    why:
      'CEEVS_SEED_PASS_HASH — semilla bcrypt de la cuenta admin, no la contraseña. La cuenta ' +
      'se siembra en el primer arranque y la credencial real vive en server-data/admin-user.php ' +
      '(no versionado). RIESGO ACEPTADO: en un repositorio público, un bcrypt de coste 10 es ' +
      'atacable offline. Mitigación: cambiar la contraseña desde el panel tras el primer arranque.',
  },
  {
    file: 'api/bootstrap.php',
    fingerprint: '990abb06d47b5889',
    why: 'CEEVS_SEED_RECOVERY_HASH — misma semilla de recuperación, mismo razonamiento y mismo riesgo aceptado.',
  },
  {
    file: 'js/admin.js',
    fingerprint: 'fb1aebf5770b1244',
    why:
      'ADMIN_PASS — contraseña de emergencia del "modo local" del panel (sitio abierto sin PHP). ' +
      'En producción, con PHP disponible, el login va contra el servidor y esta rama no se alcanza ' +
      '(js/admin.js:175-193), y el modo local solo escribe en el localStorage del propio navegador. ' +
      'PENDIENTE DE DECISIÓN DEL DUEÑO: sigue siendo una contraseña en texto plano en un repositorio ' +
      'público; si coincide o se parece a la del servidor, cámbiala. Fuera del alcance de esta tarea.',
  },
  {
    file: 'INFORME_HALLAZGOS.md',
    fingerprint: 'fb1aebf5770b1244',
    why:
      'El mismo ADMIN_PASS, citado en la auditoría que lo documenta. No es una fuga nueva: es el ' +
      'mismo valor. Se acusa recibo aparte a propósito, para que quede constancia de que la ' +
      'contraseña aparece en DOS archivos versionados — al cambiarla hay que tocar los dos.',
  },
];

/* ── Superficie de prueba ─────────────────────────────────────────────────── */
/* Exportadas para que `tests/check-secrets.test.mjs` pueda afirmar sobre los patrones
   sin ejecutar el escaneo completo. El escaneo solo corre cuando este archivo se
   invoca directamente, no cuando se importa. */
export { PATTERNS };

/** Filtros de la regla genérica, en un solo sitio para que prueba y escáner no diverjan. */
export function shouldIgnoreValue(value, file) {
  const trimmed = String(value).trim();
  return (
    PLACEHOLDER.test(trimmed) ||
    PLACEHOLDER_CONTEXT.test(file) ||
    looksLikeProse(trimmed) ||
    ENV_VAR_NAME.test(trimmed) ||
    LOOKS_LIKE_PATH.test(trimmed) ||
    COVERED_BY_SPECIFIC.test(trimmed)
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

if (!invokedDirectly) {
  // Importado desde las pruebas: solo se exponen los patrones.
} else {

/* ── Recolección ──────────────────────────────────────────────────────────── */
const BINARY = /\.(png|jpe?g|webp|gif|avif|ico|svgz|mp4|webm|mp3|m4a|ogg|zip|gz|tgz|pdf|xlsx?|docx?|pptx?|woff2?|ttf|eot|min\.js|min\.css)$/i;
const SKIP = /^(?:node_modules|dist|js\/vendor)\//;

let tracked;
try {
  tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 32 * 1024 * 1024 })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
} catch (error) {
  console.error(`\nEscáner de secretos: no se pudo listar el índice de git (${error.message}).`);
  console.error('  Este check solo tiene sentido dentro de un repositorio git.');
  process.exit(1);
}

const blocking = [];
const acknowledged = [];

/* Regla A */
for (const file of tracked) {
  const rule = FORBIDDEN_PATHS.find((entry) => entry.re.test(file));
  if (rule) blocking.push(`[ruta prohibida] ${file} — ${rule.why}`);
}

/* Regla B */
/**
 * Los informes acaban en los registros del CI, que son legibles por más gente que el
 * repositorio. Solo se muestra un prefijo cuando el valor es lo bastante largo como para
 * que revelar 4 caracteres no acerque a nadie a adivinarlo; por debajo se oculta entero.
 */
function redact(value) {
  const text = String(value);
  if (text.length < 16) return `[REDACTADO — ${text.length} chars]`;
  return `${text.slice(0, 2)}…${text.slice(-2)} [REDACTADO — ${text.length} chars]`;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function isAcknowledged(file, value) {
  const print = fingerprint(value);
  return ACKNOWLEDGED.find((entry) => entry.file === file && entry.fingerprint === print);
}

let scanned = 0;
for (const file of tracked) {
  if (BINARY.test(file) || SKIP.test(file)) continue;
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  let content;
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\0')) continue; // binario disfrazado
  scanned += 1;

  for (const pattern of PATTERNS) {
    pattern.re.lastIndex = 0;
    for (const match of content.matchAll(pattern.re)) {
      const value = pattern.valueGroup ? match[pattern.valueGroup] : match[0];
      if (pattern.valueGroup && shouldIgnoreValue(value, file)) continue;

      const line = content.slice(0, match.index).split('\n').length;
      const note = isAcknowledged(file, value);
      const entry = `${file}:${line} — ${pattern.name} — ${redact(value)}`;
      if (note) {
        // Una entrada por coincidencia, no por archivo: si mañana aparece un hash extra
        // en un archivo ya aceptado, tiene que verse en la salida en vez de fundirse
        // con el que ya estaba aceptado.
        acknowledged.push({ entry, why: note.why });
      } else {
        blocking.push(`[patrón] ${entry}`);
      }
    }
  }
}

/* ── Salida ───────────────────────────────────────────────────────────────── */
console.log(`\nEscáner de secretos: ${scanned} archivos versionados analizados`);

if (acknowledged.length) {
  console.log(`\n  Aceptados y documentados (${acknowledged.length}) — no bloquean:`);
  for (const item of acknowledged) console.log(`    ~ ${item.entry}`);
  const reasons = [...new Set(acknowledged.map((item) => item.why))];
  for (const reason of reasons) console.log(`      motivo: ${reason}`);
}

if (blocking.length) {
  console.error(`\n  ${blocking.length} hallazgo(s) bloqueante(s):\n`);
  for (const item of blocking) console.error(`    ✗ ${item}`);
  console.error('\n  Si alguno es un falso positivo, documéntalo en ACKNOWLEDGED de este archivo');
  console.error('  con una razón escrita. Nunca lo silencies borrando el patrón.\n');
  process.exit(1);
}

console.log('  Sin secretos ni archivos sensibles versionados.');
process.exit(0);

} // fin de invokedDirectly
