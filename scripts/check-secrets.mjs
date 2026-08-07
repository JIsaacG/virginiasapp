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
    name: 'credencial asignada en código',
    re: /[\w.$-]*(?:password|passwd|pwd|pass|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|contrase(?:n|ñ)a|clave)\w*\s*(?:=>|[:=])\s*(['"])([^'"\n]{8,})\1/gi,
    valueGroup: 2,
  },
];

/** Valores que son claramente marcadores de posición, no secretos. */
const PLACEHOLDER = /^(?:$|x{3,}|\*{3,}|\.{3,}|-+|<.*>|\{\{.*\}\}|\$\{.*\}|%[A-Z_]+%|(?:tu|your|my)[_-].*|cambia.*|reemplaza.*|change[_-]?me|placeholder|ejemplo.*|example.*|sample.*|dummy|test|demo|null|none|true|false|password|secret|123456\d*|abc123)$/i;
const PLACEHOLDER_CONTEXT = /example|ejemplo|placeholder|sample|\.md$/i;

/**
 * Una contraseña no lleva espacios; un mensaje de interfaz sí. `js/admin.js` y el panel
 * están llenos de cadenas como '🔑 Contraseña cambiada' asignadas a claves cuyo nombre
 * contiene "password". Sin este filtro el escáner ahoga los hallazgos reales en ruido.
 */
const LOOKS_LIKE_PROSE = /\s/;

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
];

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
function redact(value) {
  const text = String(value);
  if (text.length <= 8) return `[REDACTADO — ${text.length} chars]`;
  return `${text.slice(0, 3)}…${text.slice(-2)} [REDACTADO — ${text.length} chars]`;
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
      if (pattern.valueGroup) {
        const trimmed = value.trim();
        if (PLACEHOLDER.test(trimmed)) continue;
        if (PLACEHOLDER_CONTEXT.test(file)) continue;
        if (LOOKS_LIKE_PROSE.test(trimmed)) continue;
        if (COVERED_BY_SPECIFIC.test(trimmed)) continue;
      }

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
