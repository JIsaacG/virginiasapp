import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const origin = 'https://virginiasapp.edu.hn';
const errors = [];
const notices = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (file, message) => errors.push(`${file}: ${message}`);
const one = (html, regex) => html.match(regex)?.[1]?.trim() ?? '';
const count = (html, regex) => [...html.matchAll(regex)].length;

function localPath(raw) {
  const clean = raw.split('#')[0].split('?')[0];
  if (!clean) return '';
  try {
    return decodeURIComponent(clean).replace(/^\//, '');
  } catch {
    return clean.replace(/^\//, '');
  }
}

function validateJsonLd(file, html) {
  const blocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (blocks.length === 0) fail(file, 'falta JSON-LD');
  for (const [index, block] of blocks.entries()) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(file, `JSON-LD ${index + 1} inválido (${error.message})`);
    }
  }
}

function validateLinks(file, html) {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const links = [...withoutComments.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi)];

  for (const [, href] of links) {
    if (href === '#') {
      fail(file, 'enlace placeholder href="#"');
      continue;
    }
    if (!href || /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const [rawTarget, fragment = ''] = href.split('#');
    const target = localPath(rawTarget) || file;
    const targetFile = target.endsWith('/') ? `${target}index.html` : target;

    if (!fs.existsSync(path.join(root, targetFile))) {
      fail(file, `enlace local roto: ${href}`);
      continue;
    }

    if (fragment && targetFile.endsWith('.html')) {
      const targetHtml = read(targetFile);
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(?:id|name)=["']${escaped}["']`, 'i').test(targetHtml)) {
        fail(file, `ancla inexistente: ${href}`);
      }
    }
  }

  for (const [, src] of withoutComments.matchAll(/<(?:img|script)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    if (/^(?:https?:|data:|blob:)/i.test(src)) continue;
    const target = localPath(src);
    if (target && !fs.existsSync(path.join(root, target))) fail(file, `recurso local roto: ${src}`);
  }
}

const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
const duplicateUrls = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);
if (duplicateUrls.length) fail('sitemap.xml', `URLs duplicadas: ${[...new Set(duplicateUrls)].join(', ')}`);
if (sitemapUrls.length === 0) fail('sitemap.xml', 'no contiene URLs');
if (sitemap.includes('www.virginiasapp.edu.hn')) fail('sitemap.xml', 'usa el host www no canónico');
if (sitemap.includes('/index.html')) fail('sitemap.xml', 'la portada debe declararse como /');

const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1].trim());
if (lastmods.length !== sitemapUrls.length) fail('sitemap.xml', 'cada URL debe tener lastmod');
for (const date of lastmods) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    fail('sitemap.xml', `lastmod inválido: ${date}`);
  }
}

const files = sitemapUrls.map((url) => {
  if (!url.startsWith(`${origin}/`)) {
    fail('sitemap.xml', `URL fuera del origen canónico: ${url}`);
  }
  const pathname = new URL(url).pathname;
  return pathname === '/' ? 'index.html' : pathname.slice(1);
});

const titles = new Map();
const descriptions = new Map();

for (const [index, file] of files.entries()) {
  if (!fs.existsSync(path.join(root, file))) {
    fail('sitemap.xml', `archivo inexistente: ${file}`);
    continue;
  }

  const html = read(file);
  const searchable = html.replace(/<!--[\s\S]*?-->/g, '');
  const expectedCanonical = sitemapUrls[index];
  const title = one(html, /<title>([\s\S]*?)<\/title>/i);
  const description = one(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i);
  const canonical = one(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i);
  const robots = one(html, /<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/i);
  const ogTitle = one(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i);
  const ogDescription = one(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i);
  const ogUrl = one(html, /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["'][^>]*>/i);
  const ogImage = one(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i);

  if (!/^<html\s+[^>]*lang=["']es(?:-HN)?["']/im.test(html)) fail(file, 'html debe declarar lang="es" o lang="es-HN"');
  if (!title) fail(file, 'falta title');
  else if (title.length < 25 || title.length > 65) fail(file, `title fuera de 25–65 caracteres (${title.length})`);
  if (!description) fail(file, 'falta meta description');
  else if (description.length < 105 || description.length > 165) fail(file, `description fuera de 105–165 caracteres (${description.length})`);
  if (canonical !== expectedCanonical) fail(file, `canonical debe ser ${expectedCanonical}`);
  if (ogUrl !== canonical) fail(file, 'og:url debe coincidir con canonical');
  if (!ogTitle || !ogDescription || !ogImage) fail(file, 'Open Graph incompleto');
  if (!/<meta\s+property=["']og:image:type["']/i.test(html)) fail(file, 'falta og:image:type');
  if (!/<meta\s+property=["']og:image:width["']/i.test(html)) fail(file, 'falta og:image:width');
  if (!/<meta\s+property=["']og:image:height["']/i.test(html)) fail(file, 'falta og:image:height');
  if (!/<meta\s+name=["']twitter:image:alt["']/i.test(html)) fail(file, 'falta twitter:image:alt');
  if (!/\bindex\b/i.test(robots) || !/\bfollow\b/i.test(robots)) fail(file, 'robots debe permitir index y follow');
  if (count(searchable, /<h1\b[^>]*>/gi) !== 1) fail(file, 'debe contener exactamente un h1');
  if (html.includes('www.virginiasapp.edu.hn')) fail(file, 'contiene el host www no canónico');
  if (/https:\/\/virginiasapp\.edu\.hn\/index\.html/i.test(html)) fail(file, 'contiene la portada no canónica /index.html');

  for (const image of searchable.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(image[0])) fail(file, 'hay una imagen sin atributo alt');
  }

  if (titles.has(title)) fail(file, `title duplicado con ${titles.get(title)}`);
  else titles.set(title, file);
  if (descriptions.has(description)) fail(file, `description duplicada con ${descriptions.get(description)}`);
  else descriptions.set(description, file);

  validateJsonLd(file, html);
  validateLinks(file, html);
  notices.push(`${file}: title ${title.length}, description ${description.length}, canonical OK`);
}

const robotsTxt = read('robots.txt');
if (!robotsTxt.includes(`Sitemap: ${origin}/sitemap.xml`)) fail('robots.txt', 'Sitemap no coincide con el origen canónico');
if (!/Disallow:\s*\/admin\.html/i.test(robotsTxt)) fail('robots.txt', 'debe excluir admin.html');

const admin = read('admin.html');
if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']/i.test(admin)) {
  fail('admin.html', 'debe declarar noindex');
}
if (sitemapUrls.some((url) => url.endsWith('/admin.html'))) fail('sitemap.xml', 'admin.html no debe aparecer');

if (errors.length) {
  console.error(`\nSEO check: ${errors.length} error(es)\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exitCode = 1;
} else {
  console.log(`\nSEO check: ${files.length} páginas válidas\n`);
  for (const notice of notices) console.log(`  ✓ ${notice}`);
}
