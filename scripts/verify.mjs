/**
 * Quality Gate ejecutable — CEEVS.
 *
 * Ejecuta los checks aplicables al nivel de riesgo declarado e imprime un informe con la
 * misma forma que el informe del agente `quality-gate`. Su razón de ser es que el Quality
 * Gate decida sobre **salidas de comandos**, no sobre lo que otro agente afirme.
 *
 *   node scripts/verify.mjs --level=low      texto, copy, ajustes puntuales
 *   node scripts/verify.mjs --level=medium   layout, navegación, CSS/JS de interfaz (por defecto)
 *   node scripts/verify.mjs --level=high     formularios, api/, auth, datos, i18n masivo
 *
 * Cada check devuelve una de cuatro categorías, nunca un "casi":
 *   PASS · FAIL · NOT AVAILABLE (falta la herramienta) · NOT APPLICABLE (no aplica aquí)
 *
 * Exit: 0 si no hay FAIL · 1 si hay algún FAIL.
 */
import { spawnSync } from 'node:child_process';

const LEVELS = ['low', 'medium', 'high'];
const levelArg = process.argv.find((arg) => arg.startsWith('--level='));
const level = levelArg ? levelArg.slice('--level='.length) : 'medium';
const verbose = process.argv.includes('--verbose');

if (!LEVELS.includes(level)) {
  console.error(`Nivel desconocido: "${level}". Usa uno de: ${LEVELS.join(', ')}.`);
  process.exit(1);
}

const minLevel = (required) => LEVELS.indexOf(level) >= LEVELS.indexOf(required);

/**
 * Un check se define por el comando que lo respalda. `notAvailableExit` permite que un
 * comando distinga "he fallado" de "no puedo ejecutarme aquí" (php -l sin PHP instalado).
 */
const CHECKS = [
  {
    key: 'Secret scan',
    from: 'low',
    cmd: [process.execPath, ['scripts/check-secrets.mjs']],
  },
  {
    key: 'JavaScript syntax',
    from: 'low',
    cmd: [process.execPath, ['scripts/check-js-syntax.mjs']],
  },
  {
    key: 'PHP syntax',
    from: 'low',
    cmd: [process.execPath, ['scripts/check-php-syntax.mjs']],
    notAvailableExit: 2,
  },
  {
    key: 'Page validator',
    from: 'low',
    cmd: ['python', ['generate-pages.py']],
    fallbackCmd: ['python3', ['generate-pages.py']],
    notAvailableWhenMissing: true,
  },
  {
    key: 'SEO checks',
    from: 'low',
    cmd: [process.execPath, ['scripts/seo-check.mjs']],
  },
  {
    key: 'Dependency audit (production)',
    from: 'medium',
    cmd: ['npm', ['audit', '--omit=dev', '--audit-level=moderate']],
    shell: true,
    notAvailableWhenMissing: true,
  },
  {
    key: 'Lighthouse',
    from: 'high',
    cmd: ['npx', ['lhci', 'autorun']],
    shell: true,
    notAvailableWhenMissing: true,
    slow: true,
  },
];

function run(check) {
  const attempts = [check.cmd, check.fallbackCmd].filter(Boolean);
  let last = null;

  for (const [bin, args] of attempts) {
    const result = spawnSync(bin, args, {
      encoding: 'utf8',
      shell: check.shell === true,
      maxBuffer: 32 * 1024 * 1024,
    });
    last = result;

    // ENOENT: el binario no existe en el PATH.
    if (result.error && result.error.code === 'ENOENT') continue;

    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();

    if (result.error) {
      return { status: 'FAIL', output: `${result.error.message}\n${output}`, cmd: `${bin} ${args.join(' ')}` };
    }
    if (check.notAvailableExit !== undefined && result.status === check.notAvailableExit) {
      return { status: 'NOT AVAILABLE', output, cmd: `${bin} ${args.join(' ')}` };
    }
    return {
      status: result.status === 0 ? 'PASS' : 'FAIL',
      output,
      cmd: `${bin} ${args.join(' ')}`,
    };
  }

  const cmd = `${attempts[0][0]} ${attempts[0][1].join(' ')}`;
  if (check.notAvailableWhenMissing) {
    return { status: 'NOT AVAILABLE', output: `"${attempts[0][0]}" no está en el PATH.`, cmd };
  }
  return { status: 'FAIL', output: last?.error?.message || 'no se pudo ejecutar', cmd };
}

const ICON = { PASS: '✓', FAIL: '✗', 'NOT AVAILABLE': '·', 'NOT APPLICABLE': '–' };

console.log(`\n═══ VERIFY — nivel ${level.toUpperCase()} ═══\n`);

const results = [];
for (const check of CHECKS) {
  if (!minLevel(check.from)) {
    results.push({ key: check.key, status: 'NOT APPLICABLE', reason: `solo en nivel ${check.from}+`, cmd: '—' });
    console.log(`  ${ICON['NOT APPLICABLE']} ${check.key}: NOT APPLICABLE (solo en nivel ${check.from}+)`);
    continue;
  }

  if (check.slow) console.log(`  … ${check.key}: ejecutando (puede tardar)`);
  const result = run(check);
  results.push({ key: check.key, ...result });
  console.log(`  ${ICON[result.status]} ${check.key}: ${result.status}`);

  if (result.status === 'FAIL' || result.status === 'NOT AVAILABLE' || verbose) {
    const detail = (result.output || '').split('\n').filter(Boolean);
    const shown = verbose ? detail : detail.slice(-15);
    for (const line of shown) console.log(`      ${line}`);
  }
}

/* Checks que este repositorio no puede satisfacer hoy: se declaran, no se ocultan. */
const DECLARED = [
  ['Tests', 'NOT AVAILABLE', 'no hay runner de tests en el repositorio (package.json sin "test")'],
  ['HTML validation (W3C)', 'NOT AVAILABLE', 'no hay validador W3C instalado; generate-pages.py cubre la estructura del proyecto'],
  ['Accessibility (axe)', 'NOT AVAILABLE', 'sin axe; la categoría accessibility de Lighthouse es la cobertura automatizada disponible'],
  ['Mutation testing', 'NOT APPLICABLE', 'sitio mayoritariamente de contenido y presentación, sin suite de tests que mutar'],
  ['Build', 'NOT APPLICABLE', 'el sitio se publica tal cual; dist/ vía minify.py es opcional'],
];

console.log('\n─── Declarado (no ejecutable en este repositorio) ───\n');
for (const [key, status, why] of DECLARED) {
  console.log(`  ${ICON[status]} ${key}: ${status} — ${why}`);
}

const failed = results.filter((result) => result.status === 'FAIL');
const unavailable = results.filter((result) => result.status === 'NOT AVAILABLE');

console.log('\n─── Resumen ───\n');
console.log(`  PASS: ${results.filter((r) => r.status === 'PASS').length}`);
console.log(`  FAIL: ${failed.length}`);
console.log(`  NOT AVAILABLE: ${unavailable.length}`);
console.log(`  NOT APPLICABLE: ${results.filter((r) => r.status === 'NOT APPLICABLE').length}`);

if (failed.length) {
  console.log(`\n  DECISIÓN: FAIL — ${failed.map((r) => r.key).join(', ')}`);
  console.log('  Arregla el cambio. No relajes el check.\n');
  process.exit(1);
}

if (unavailable.length) {
  console.log(`\n  DECISIÓN: PASS con checks no disponibles — ${unavailable.map((r) => r.key).join(', ')}`);
  console.log('  El Quality Gate debe tratarlo como CONDITIONAL PASS si alguno era aplicable.\n');
} else {
  console.log('\n  DECISIÓN: PASS — todos los checks aplicables ejecutados y en verde.\n');
}

console.log('  Recuerda: esto es evidencia de los checks automáticos, no aprobación.');
console.log('  Faltan la revisión adversarial y el Quality Gate.\n');
process.exit(0);
