/**
 * gallery.js — Cinematic carousel, lightbox, Facebook API integration
 * Features: Ken Burns animations, filmstrip, swipe, keyboard nav,
 * auto-play with progress bars, category filtering, FB Graph API
 */

// ── FACEBOOK ALBUM CONFIG ──
const FB_ALBUM_URL = 'https://www.facebook.com/media/set/?set=a.442742817865421&type=3';
const FB_PAGE_URL  = 'https://www.facebook.com/ieevs.edu.hn/';
const FB_ALBUM_ID  = '442742817865421';

// ── MANUAL PHOTOS (Facebook CDN) ──
const FB_PHOTOS = [
  {
    fbid: '442742817865421',
    fbUrl: FB_ALBUM_URL,
    tag: '64 Aniversario', title: '64 Años de Historia',
    subtitle: 'Celebramos con gratitud y alegría · 2025',
    cat: 'cultural', kb: 'kenburns',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742817865421',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742817865421',
  },
  {
    fbid: '442742821198754',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742821198754&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Ceremonia Oficial',
    subtitle: 'Autoridades y docentes en acto solemne',
    cat: 'cultural', kb: 'kenburns-b',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742821198754',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742821198754',
  },
  {
    fbid: '442742824532087',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742824532087&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Comunidad Unida',
    subtitle: 'Maestros, alumnos y familias celebrando',
    cat: 'cultural', kb: 'kenburns-alt',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742824532087',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742824532087',
  },
  {
    fbid: '442742827865420',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742827865420&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Estudiantes de Secundaria',
    subtitle: 'Nuevas generaciones, mismo legado',
    cat: 'cultural', kb: 'kenburns',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742827865420',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742827865420',
  },
  {
    fbid: '442742831198753',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742831198753&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Acto Cultural',
    subtitle: 'Danza, música y tradición hondureña',
    cat: 'cultural', kb: 'kenburns-b',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742831198753',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742831198753',
  },
  {
    fbid: '442742834532086',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742834532086&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Reconocimientos',
    subtitle: 'Premiando la excelencia y la dedicación',
    cat: 'cultural', kb: 'kenburns-alt',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742834532086',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742834532086',
  },
  {
    fbid: '442742837865419',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742837865419&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Primaria & Preescolar',
    subtitle: 'Los más pequeños también celebran',
    cat: 'cultural', kb: 'kenburns',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742837865419',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742837865419',
  },
  {
    fbid: '442742841198752',
    fbUrl: 'https://www.facebook.com/photo/?fbid=442742841198752&set=a.442742817865421',
    tag: '64 Aniversario', title: 'Orgullo Institucional',
    subtitle: 'Virginia Sapp · 1962 – 2026',
    cat: 'cultural', kb: 'kenburns-b',
    src: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742841198752',
    thumb: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742841198752',
  },
];

const IG_POSTS = FB_PHOTOS;

// Fallback images (Unsplash)
const IG_FALLBACKS = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1400&q=80&auto=format',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&q=80&auto=format',
];
const IG_FALLBACKS_THUMB = IG_FALLBACKS.map(u => u.replace('w=1400', 'w=300').replace('q=80', 'q=60'));

// ── GALLERY SLIDES ──
const GALLERY_SLIDES = IG_POSTS.map((p, i) => ({
  src: p.src, thumb: p.thumb,
  fallback: IG_FALLBACKS[i % IG_FALLBACKS.length],
  fallbackTh: IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length],
  tag: p.tag, title: p.title, subtitle: p.subtitle,
  cat: p.cat, kb: p.kb,
  igUrl: p.igUrl, fbUrl: p.fbUrl,
}));

// ── CAROUSEL STATE ──
let cSlides = [...GALLERY_SLIDES];
let cCurrent = 0;
let cTimer = null;
let cPaused = false;
const cInterval = 3000;
let cLbIndex = 0;
let cDragStartX = 0;
let cDragging = false;

// ── FACEBOOK GRAPH API ──
const FB_ACCESS_TOKEN = '';

async function loadFBAlbum() {
  if (!FB_ACCESS_TOKEN) return false;
  const url = `https://graph.facebook.com/v22.0/${FB_ALBUM_ID}/photos`
    + `?fields=images,name,created_time,link`
    + `&limit=20&access_token=${FB_ACCESS_TOKEN}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.data || data.error) return false;

    const kbCycle = ['kenburns', 'kenburns-b', 'kenburns-alt'];
    GALLERY_SLIDES.length = 0;
    data.data.forEach((photo, i) => {
      const large = photo.images?.[0]?.source || IG_FALLBACKS[i % IG_FALLBACKS.length];
      const thumb = photo.images?.[2]?.source || IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length];
      GALLERY_SLIDES.push({
        src: large, thumb: thumb,
        fallback: IG_FALLBACKS[i % IG_FALLBACKS.length],
        fallbackTh: IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length],
        tag: '64 Aniversario',
        title: (photo.name || 'Virginia Sapp').substring(0, 40),
        subtitle: new Date(photo.created_time || Date.now()).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
        cat: 'cultural', kb: kbCycle[i % 3],
        fbUrl: photo.link || FB_ALBUM_URL,
        igUrl: photo.link || FB_ALBUM_URL,
      });
    });
    return true;
  } catch (e) {
    console.warn('FB load failed:', e.message);
    return false;
  }
}

// ── CONFIG PANEL ──
function showFBConfigPanel() {
  const panel = document.getElementById('fb-config-panel');
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function applyFBToken() {
  const token = document.getElementById('fb-token-input')?.value.trim();
  const albumId = document.getElementById('fb-album-input')?.value.trim() || FB_ALBUM_ID;
  const status = document.getElementById('fb-status');
  if (!token) { if (status) { status.style.color = '#f87171'; status.textContent = '⚠ Pega tu token primero'; } return; }
  if (status) { status.style.color = 'rgba(255,255,255,.4)'; status.textContent = '⏳ Cargando...'; }

  const url = `https://graph.facebook.com/v22.0/${albumId}/photos?fields=images,name,created_time,link&limit=20&access_token=${token}`;
  fetch(url).then(r => r.json()).then(data => {
    if (data.error) { if (status) { status.style.color = '#f87171'; status.textContent = '❌ ' + data.error.message; } return; }
    GALLERY_SLIDES.length = 0;
    const kbs = ['kenburns', 'kenburns-b', 'kenburns-alt'];
    data.data.forEach((photo, i) => {
      const large = photo.images?.[0]?.source || IG_FALLBACKS[i % IG_FALLBACKS.length];
      const thumb = photo.images?.[2]?.source || IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length];
      GALLERY_SLIDES.push({
        src: large, thumb: large,
        fallback: IG_FALLBACKS[i % IG_FALLBACKS.length],
        fallbackTh: IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length],
        tag: '64 Aniversario', title: (photo.name || 'Virginia Sapp').substring(0, 40),
        subtitle: new Date(photo.created_time || Date.now()).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
        cat: 'cultural', kb: kbs[i % 3],
        fbUrl: photo.link || FB_ALBUM_URL, igUrl: photo.link || FB_ALBUM_URL,
      });
    });
    buildCarousel();
    if (status) { status.style.color = '#4ade80'; status.textContent = `✅ ${data.data.length} fotos cargadas`; }
    if (typeof addXP === 'function') addXP(20, '📘', '¡Álbum de FB conectado!', `+20 XP · ${data.data.length} fotos`);
  }).catch(e => { if (status) { status.style.color = '#f87171'; status.textContent = '❌ ' + e.message; } });
}

// ── BUILD CAROUSEL ──
function buildCarousel() {
  const wrap = document.getElementById('c-slides-wrap');
  const prog = document.getElementById('c-progress-row');
  const film = document.getElementById('c-filmstrip');
  const ticker = document.getElementById('c-ticker-track');
  if (!wrap) return;

  wrap.innerHTML = '';
  if (prog) prog.innerHTML = '';
  if (film) film.innerHTML = '';

  cSlides.forEach((sl, i) => {
    const div = document.createElement('div');
    div.className = 'c-slide' + (i === 0 ? ' active' : '');
    div.dataset.index = i;

    const bgImg = new Image();
    const slideDiv = div;
    const slideIdx = i;
    bgImg.onload = () => {
      const el = slideDiv.querySelector('.c-slide-img');
      if (el) el.style.backgroundImage = `url('${sl.src}')`;
      const th = document.querySelectorAll('.c-thumb img')[slideIdx];
      if (th) th.src = sl.thumb;
    };
    bgImg.onerror = () => {
      const el = slideDiv.querySelector('.c-slide-img');
      if (el) el.style.backgroundImage = `url('${sl.fallback}')`;
      const th = document.querySelectorAll('.c-thumb img')[slideIdx];
      if (th) th.src = sl.fallbackTh;
    };
    bgImg.src = sl.src;

    div.innerHTML = `
      <div class="c-slide-img" style="background-image:url('${sl.fallback}');animation-name:${sl.kb};"></div>
      <div class="c-slide-content">
        <div class="c-slide-tag"><div class="c-slide-tag-dot"></div>
          <span style="margin-right:6px">📷</span>${sl.tag}
        </div>
        <div class="c-slide-title">${formatTitle(sl.title)}</div>
        <div class="c-slide-sub">${sl.subtitle}</div>
        <div class="c-ig-hint">Doble clic · Ver en Facebook →</div>
      </div>`;

    div.addEventListener('click', e => {
      if (e.target.closest('.c-ctrl') || e.target.closest('.c-playpause')) return;
      cLbIndex = i;
      openLightbox(i);
    });

    div.addEventListener('dblclick', e => {
      e.stopPropagation();
      window.open(sl.fbUrl || sl.igUrl || FB_ALBUM_URL, '_blank', 'noopener');
      if (typeof addXP === 'function') addXP(5, '📘', '¡Abriendo Facebook!', '+5 XP');
    });

    wrap.appendChild(div);
  });

  // Progress bars
  if (prog) {
    cSlides.forEach((_, i) => {
      const bar = document.createElement('div');
      bar.className = 'c-prog-bar';
      bar.innerHTML = '<div class="c-prog-fill"></div>';
      bar.addEventListener('click', () => carouselGoto(i));
      prog.appendChild(bar);
    });
  }

  // Filmstrip
  if (film) {
    cSlides.forEach((sl, i) => {
      const th = document.createElement('div');
      th.className = 'c-thumb' + (i === 0 ? ' active' : '');
      th.innerHTML = `<img src="${sl.fallbackTh}" alt="${sl.title}" loading="lazy">
        <div class="c-thumb-bar"></div>
        <div class="c-thumb-label"><span>${sl.tag}<br>${sl.title}</span></div>`;
      th.addEventListener('click', () => {
        carouselGoto(i);
        if (typeof addXP === 'function') addXP(2, '🎞️', '¡Explorando la galería!', '+2 XP');
      });
      film.appendChild(th);
    });
  }

  // Ticker
  if (ticker) {
    ticker.innerHTML = [...cSlides, ...cSlides].map(sl =>
      `<span class="c-ticker-item">${sl.tag} · ${sl.title}</span>`
    ).join('');
  }

  // Counter
  const tot = document.getElementById('c-tot');
  if (tot) tot.textContent = cSlides.length;
  updateCarouselUI(0);
  startProgressBar();
}

function formatTitle(t) {
  const words = t.split(' ');
  if (words.length <= 2) return t;
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ') + '<br><em>' + words.slice(mid).join(' ') + '</em>';
}

function carouselGoto(idx, skipParticles) {
  if (idx === cCurrent) return;
  const slides = document.querySelectorAll('.c-slide');
  const thumbs = document.querySelectorAll('.c-thumb');
  const bars = document.querySelectorAll('.c-prog-bar');

  if (bars[cCurrent]) {
    bars[cCurrent].classList.add('done');
    bars[cCurrent].querySelector('.c-prog-fill').style.width = '100%';
    bars[cCurrent].querySelector('.c-prog-fill').style.transition = 'none';
  }

  const morph = document.getElementById('c-morph');
  if (morph) { morph.classList.add('flash'); setTimeout(() => morph.classList.remove('flash'), 550); }

  if (!skipParticles) spawnParticles();

  if (slides[cCurrent]) {
    slides[cCurrent].classList.remove('active');
    slides[cCurrent].classList.add('leaving');
    const prevIdx = cCurrent;
    setTimeout(() => { if (slides[prevIdx]) slides[prevIdx].classList.remove('leaving'); }, 600);
    const oldImg = slides[cCurrent].querySelector('.c-slide-img');
    if (oldImg) { oldImg.style.animation = 'none'; void oldImg.offsetWidth; }
  }

  if (thumbs[cCurrent]) thumbs[cCurrent].classList.remove('active');
  cCurrent = idx;
  if (slides[cCurrent]) slides[cCurrent].classList.add('active');
  if (thumbs[cCurrent]) thumbs[cCurrent].classList.add('active');

  const newImg = slides[cCurrent]?.querySelector('.c-slide-img');
  if (newImg) {
    const kb = cSlides[cCurrent].kb;
    newImg.style.animation = 'none';
    void newImg.offsetWidth;
    newImg.style.animation = `${kb} 6s ease-in-out both`;
  }

  updateCarouselUI(cCurrent);
  scrollFilmstripTo(cCurrent);
  startProgressBar();
}

function updateCarouselUI(idx) {
  const cur = document.getElementById('c-cur');
  if (cur) cur.textContent = idx + 1;
  document.querySelectorAll('.c-prog-bar').forEach((b, i) => {
    const fill = b.querySelector('.c-prog-fill');
    if (i < idx) { b.classList.add('done'); fill.style.width = '100%'; fill.style.transition = 'none'; }
    else if (i > idx) { b.classList.remove('done'); fill.style.width = '0%'; fill.style.transition = 'none'; }
    else { b.classList.remove('done'); }
  });
}

function startProgressBar() {
  clearProgressBar();
  if (cPaused) return;
  const bar = document.querySelectorAll('.c-prog-bar')[cCurrent];
  if (!bar) return;
  const fill = bar.querySelector('.c-prog-fill');
  fill.style.transition = 'none';
  fill.style.width = '0%';
  void fill.offsetWidth;
  fill.style.transition = `width ${cInterval}ms linear`;
  fill.style.width = '100%';
  cTimer = setTimeout(() => {
    carouselGoto((cCurrent + 1) % cSlides.length, true);
  }, cInterval);
}

function clearProgressBar() {
  clearTimeout(cTimer);
  document.querySelectorAll('.c-prog-bar').forEach(b => {
    const f = b.querySelector('.c-prog-fill');
    if (f) { const w = getComputedStyle(f).width; f.style.transition = 'none'; f.style.width = w; }
  });
}

function carouselStep(dir, e) {
  if (e?.stopPropagation) e.stopPropagation();
  carouselGoto(((cCurrent + dir) + cSlides.length) % cSlides.length);
}

function toggleCarouselPause(e) {
  if (e?.stopPropagation) e.stopPropagation();
  cPaused = !cPaused;
  const icon = document.getElementById('c-pp-icon');
  if (icon) icon.textContent = cPaused ? '▶' : '⏸';
  if (cPaused) clearProgressBar();
  else startProgressBar();
}

function scrollFilmstripTo(idx) {
  const film = document.getElementById('c-filmstrip');
  const thumb = film?.querySelectorAll('.c-thumb')[idx];
  if (!film || !thumb) return;
  film.scrollLeft = thumb.offsetLeft - (film.clientWidth - thumb.offsetWidth) / 2;
}

// ── PARTICLES ──
function spawnParticles() {
  const stage = document.getElementById('carousel-stage');
  if (!stage) return;
  const cx = stage.offsetWidth / 2;
  const cy = stage.offsetHeight / 2;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'c-particle';
    const size = 3 + Math.random() * 6;
    const angle = (Math.PI * 2 / 18) * i + Math.random() * 0.3;
    const dist = 60 + Math.random() * 180;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${cx}px;top:${cy}px;
      --tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;
      opacity:${0.4 + Math.random() * 0.5};
      animation-duration:${0.5 + Math.random() * 0.5}s;
      animation-delay:${Math.random() * 0.15}s;
    `;
    stage.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

// ── LIGHTBOX ──
function openLightbox(idx) {
  cLbIndex = idx;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const sl = cSlides[idx];
  if (!lb || !img) return;

  img.src = sl.fallback;
  const test = new Image();
  test.onload = () => { img.src = sl.src; };
  test.onerror = () => { img.src = sl.fallback; };
  test.src = sl.src;

  const lbTag = document.getElementById('lb-tag');
  const lbTitle = document.getElementById('lb-title');
  const lbBtn = document.getElementById('lb-ig-btn');
  if (lbTag) lbTag.textContent = sl.tag;
  if (lbTitle) lbTitle.textContent = sl.title + ' · ' + sl.subtitle;
  if (lbBtn) lbBtn.href = sl.fbUrl || sl.igUrl || FB_ALBUM_URL;

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (typeof addXP === 'function') addXP(4, '🔍', '¡Vista completa!', '+4 XP');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

function lbStep(dir) {
  cLbIndex = ((cLbIndex + dir) + cSlides.length) % cSlides.length;
  const img = document.getElementById('lb-img');
  const sl = cSlides[cLbIndex];
  if (!img) return;
  img.style.opacity = '0';
  img.style.transform = 'scale(.92)';
  setTimeout(() => {
    img.src = sl.fallback;
    const t2 = new Image();
    t2.onload = () => img.src = sl.src;
    t2.onerror = () => {};
    t2.src = sl.src;
    const lbTag = document.getElementById('lb-tag');
    const lbTitle = document.getElementById('lb-title');
    const lbBtn = document.getElementById('lb-ig-btn');
    if (lbTag) lbTag.textContent = sl.tag;
    if (lbTitle) lbTitle.textContent = sl.title + ' · ' + sl.subtitle;
    if (lbBtn) lbBtn.href = sl.fbUrl || sl.igUrl || FB_ALBUM_URL;
    img.style.opacity = '1';
    img.style.transform = 'scale(1)';
  }, 180);
}

// ── FILTER ──
function filterGalCarousel(btn, cat) {
  btn.closest('.galeria-filters').querySelectorAll('.gal-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cSlides = cat === 'all' ? [...GALLERY_SLIDES] : GALLERY_SLIDES.filter(s => s.cat === cat);
  if (cSlides.length === 0) cSlides = [...GALLERY_SLIDES];
  cCurrent = 0;
  clearTimeout(cTimer);
  buildCarousel();
  if (typeof addXP === 'function') addXP(3, '📸', '¡Explorando la galería!', '+3 XP');
}

// ── TOUCH / SWIPE ──
const cStage = document.getElementById('carousel-stage');
if (cStage) {
  cStage.addEventListener('touchstart', e => { cDragStartX = e.touches[0].clientX; cDragging = true; }, { passive: true });
  cStage.addEventListener('touchend', e => {
    if (!cDragging) return;
    const dx = e.changedTouches[0].clientX - cDragStartX;
    if (Math.abs(dx) > 40) carouselStep(dx < 0 ? 1 : -1, { stopPropagation: () => {} });
    cDragging = false;
  });
  cStage.addEventListener('mousedown', e => { cDragStartX = e.clientX; cDragging = true; });
  cStage.addEventListener('mouseup', e => {
    if (!cDragging) return;
    const dx = e.clientX - cDragStartX;
    if (Math.abs(dx) > 40) carouselStep(dx < 0 ? 1 : -1, { stopPropagation: () => {} });
    cDragging = false;
  });

  // Pause on hover
  cStage.addEventListener('mouseenter', () => { if (!cPaused) clearProgressBar(); });
  cStage.addEventListener('mouseleave', () => { if (!cPaused) startProgressBar(); });
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') carouselStep(-1, { stopPropagation: () => {} });
  if (e.key === 'ArrowRight') carouselStep(1, { stopPropagation: () => {} });
  if (e.key === 'Escape') closeLightbox();
  if (e.key === ' ') {
    const lb = document.getElementById('lightbox');
    if (lb && !lb.classList.contains('open')) toggleCarouselPause({ stopPropagation: () => {} });
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); showFBConfigPanel(); }
});

// Lightbox close on backdrop
const lbEl = document.getElementById('lightbox');
if (lbEl) {
  lbEl.addEventListener('click', function (e) { if (e.target === this) closeLightbox(); });
}

// ── INIT ──
(async () => {
  const fbLoaded = await loadFBAlbum();
  if (!fbLoaded) {
    GALLERY_SLIDES.length = 0;
    IG_POSTS.forEach((p, i) => {
      GALLERY_SLIDES.push({
        src: p.src, thumb: p.thumb,
        fallback: IG_FALLBACKS[i % IG_FALLBACKS.length],
        fallbackTh: IG_FALLBACKS_THUMB[i % IG_FALLBACKS_THUMB.length],
        tag: p.tag, title: p.title, subtitle: p.subtitle,
        cat: p.cat, kb: p.kb,
        fbUrl: p.fbUrl || FB_ALBUM_URL, igUrl: p.fbUrl || FB_ALBUM_URL,
      });
    });
  }
  buildCarousel();
})();
