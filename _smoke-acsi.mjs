import * as ChromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = 'c:/xampp1/VirginiaSappAlex/virginiasapp';
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.json':'application/json', '.mp4':'video/mp4' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(path.resolve(ROOT)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('nope'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(8912, r));

const chrome = await ChromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
const res = await fetch(`http://127.0.0.1:${chrome.port}/json/version`);
const { webSocketDebuggerUrl } = await res.json();
const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });

const errores = [];
async function probar(page, label) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on('pageerror', e => errores.push(`${label}: pageerror ${e.message}`));
  await p.goto(`http://127.0.0.1:8912/${page}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const info = await p.evaluate(() => {
    const fab = document.getElementById('acsi-fab');
    const wa = document.getElementById('wa-fab');
    if (!fab || !wa) return { fab: !!fab, wa: !!wa };
    const f = fab.getBoundingClientRect(), w = wa.getBoundingClientRect();
    const img = fab.querySelector('img');
    return {
      fab: true, wa: true,
      encima: Math.round(w.top - f.bottom),
      mismaIzquierda: Math.round(f.left - w.left),
      tamano: [Math.round(f.width), Math.round(f.height)],
      imgCargada: img.complete && img.naturalWidth > 0,
      anim: getComputedStyle(fab).animationName,
      panelAbierto: document.querySelector('.acsi-panel.open') !== null,
    };
  });

  // clic → panel
  await p.click('#acsi-fab');
  await new Promise(r => setTimeout(r, 500));
  const abierto = await p.evaluate(() => {
    const pan = document.querySelector('.acsi-panel.open');
    if (!pan) return null;
    const card = pan.querySelector('.acsi-panel-card').getBoundingClientRect();
    return {
      visible: card.width > 0 && card.top >= 0 && card.bottom <= innerHeight,
      titulo: pan.querySelector('h2').textContent,
      chips: pan.querySelectorAll('.acsi-panel-list li').length,
      enlace: pan.querySelector('.acsi-panel-link').getAttribute('href'),
      expanded: document.getElementById('acsi-fab').getAttribute('aria-expanded'),
      foco: document.activeElement.className,
      rect: [Math.round(card.left), Math.round(card.top), Math.round(card.width), Math.round(card.height)],
    };
  });

  // Escape → cierra
  await p.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 350));
  const cerrado = await p.evaluate(() => document.querySelector('.acsi-panel.open') === null);

  console.log(`\n=== ${page} ===`);
  console.log('  fab:', JSON.stringify(info));
  console.log('  panel:', JSON.stringify(abierto));
  console.log('  cierra con Escape:', cerrado);

  // móvil
  await p.setViewport({ width: 390, height: 780 });
  await new Promise(r => setTimeout(r, 300));
  const movil = await p.evaluate(() => {
    const fab = document.getElementById('acsi-fab'), wa = document.getElementById('wa-fab');
    const f = fab.getBoundingClientRect(), w = wa.getBoundingClientRect();
    return { encima: Math.round(w.top - f.bottom), left: Math.round(f.left),
             dentro: f.top > 0 && f.right < innerWidth, tamano:[Math.round(f.width), Math.round(f.height)] };
  });
  await p.click('#acsi-fab');
  await new Promise(r => setTimeout(r, 450));
  const movilPanel = await p.evaluate(() => {
    const c = document.querySelector('.acsi-panel.open .acsi-panel-card').getBoundingClientRect();
    return { dentro: c.left >= 0 && c.right <= innerWidth && c.top >= 0 && c.bottom <= innerHeight,
             rect: [Math.round(c.left), Math.round(c.top), Math.round(c.width), Math.round(c.height)] };
  });
  console.log('  movil 390px fab:', JSON.stringify(movil));
  console.log('  movil 390px panel:', JSON.stringify(movilPanel));
  await p.close();
}

for (const pg of ['index.html', 'quienes-somos.html', 'preinscripcion.html', 'recuerdos.html']) {
  await probar(pg, pg);
}

console.log('\nErrores de consola:', errores.length ? errores : 'ninguno');
await browser.disconnect();
await chrome.kill();
server.close();
