import * as ChromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = 'c:/xampp1/VirginiaSappAlex/virginiasapp';
const OUT = 'C:/Users/jguil/AppData/Local/Temp/claude/c--xampp1-VirginiaSappAlex-virginiasapp/93c5c6eb-d373-4f51-b013-97298bf1f15e/scratchpad';
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml',
  '.json':'application/json','.mp4':'video/mp4','.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(8912, r));

const chrome = await ChromeLauncher.launch({ chromeFlags: ['--headless=new','--no-sandbox'] });
const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${chrome.port}/json/version`)).json();
const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
const errores = [];

async function probar(page) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on('pageerror', e => errores.push(`${page}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errores.push(`${page}: console ${m.text().slice(0,120)}`); });
  await p.goto(`http://127.0.0.1:8912/${page}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 700));

  const hay = await p.$('#acsi-fab');
  if (!hay) { console.log(`=== ${page} === sin #wa-fab -> sin sello (correcto)`); await p.close(); return; }

  await p.evaluate(() => { document.getElementById('acsi-fab').style.animationPlayState = 'paused'; });
  await p.screenshot({ path: `${OUT}/acsi-${page}-fab.png`, clip: { x: 0, y: 620, width: 460, height: 280 } });
  await p.click('#acsi-fab');
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: `${OUT}/acsi-${page}-panel.png` });
  await p.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  // inglés
  const tieneI18n = await p.evaluate(() => typeof App !== 'undefined' && !!App.modules.find(m => m.name === 'I18n'));
  let en = null;
  if (tieneI18n) {
    await p.evaluate(() => App.modules.find(m => m.name === 'I18n').setLang('en'));
    await new Promise(r => setTimeout(r, 200));
    await p.click('#acsi-fab');
    await new Promise(r => setTimeout(r, 400));
    en = await p.evaluate(() => {
      const c = document.querySelector('.acsi-panel.open .acsi-panel-card');
      return { h2: c.querySelector('h2').textContent,
               texto: c.querySelector('.acsi-panel-text').textContent.slice(0, 70),
               chip1: c.querySelector('.acsi-panel-list li').textContent,
               enlace: c.querySelector('.acsi-panel-link').textContent,
               tip: document.querySelector('.acsi-fab-tip').textContent };
    });
    await p.screenshot({ path: `${OUT}/acsi-${page}-panel-en.png` });
    await p.evaluate(() => App.modules.find(m => m.name === 'I18n').setLang('es'));
  }
  console.log(`=== ${page} ===  i18n EN:`, JSON.stringify(en));
  await p.close();
}

for (const pg of ['index.html']) {
  await probar(pg);
}
console.log('\nErrores de consola:', errores.length ? errores : 'ninguno');
await browser.disconnect(); await chrome.kill(); server.close();
