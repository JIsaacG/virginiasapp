const target = new URL(process.env.SEO_TARGET_URL || 'https://lavenderblush-jackal-726259.hostingersite.com/');
const canonicalOrigin = 'https://lavenderblush-jackal-726259.hostingersite.com';
const failures = [];

async function get(pathname, userAgent = 'CEEVS-SEO-Monitor/1.0') {
  const url = new URL(pathname, target);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': userAgent }
  });
  return { url: response.url, status: response.status, text: await response.text() };
}

function fail(message) {
  failures.push(message);
}

try {
  const [home, robots, sitemap] = await Promise.all([
    get('/'),
    get('/robots.txt', 'Googlebot'),
    get('/sitemap.xml')
  ]);

  if (home.status !== 200) fail(`la portada respondió HTTP ${home.status}`);
  if (robots.status !== 200) fail(`robots.txt respondió HTTP ${robots.status}`);
  if (sitemap.status !== 200) fail(`sitemap.xml respondió HTTP ${sitemap.status}`);

  const canonical = home.text.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || '';
  if (canonical !== `${canonicalOrigin}/`) fail(`canonical de portada inesperada: ${canonical || '(ausente)'}`);
  if (!/<meta\s+name=["']description["']/i.test(home.text)) fail('falta meta description en producción');
  if (!/<script\s+type=["']application\/ld\+json["']/i.test(home.text)) fail('falta JSON-LD en producción');

  const googleBlocks = [...robots.text.matchAll(/User-agent:\s*Googlebot([\s\S]*?)(?=User-agent:|$)/gi)]
    .some((match) => /^\s*Disallow:\s*\/\s*$/im.test(match[1]));
  const globalBlocks = [...robots.text.matchAll(/User-agent:\s*\*([\s\S]*?)(?=User-agent:|$)/gi)]
    .some((match) => /^\s*Disallow:\s*\/\s*$/im.test(match[1]));
  if (googleBlocks || globalBlocks) fail('robots.txt bloquea el rastreo completo de Googlebot');

  if (!sitemap.text.includes(`<loc>${canonicalOrigin}/</loc>`)) fail('sitemap.xml no contiene la portada canónica');
  if (sitemap.text.includes('www.virginiasapp.edu.hn')) fail('sitemap.xml todavía contiene el host www');
  if (sitemap.text.includes('/index.html</loc>')) fail('sitemap.xml todavía contiene /index.html');

  console.log(`\nProducción comprobada: ${target.origin}`);
  console.log(`  Portada: ${home.status}`);
  console.log(`  Canonical: ${canonical || '(ausente)'}`);
  console.log(`  Robots: ${robots.status}`);
  console.log(`  Sitemap: ${sitemap.status}`);
} catch (error) {
  fail(`no se pudo completar la comprobación remota: ${error.message}`);
}

if (failures.length) {
  console.error(`\nSEO de producción: ${failures.length} bloqueo(s)\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nSEO de producción: OK, rastreo e indexación habilitados.');
}
