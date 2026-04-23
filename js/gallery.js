'use strict';

const Gallery = {
  name: 'Gallery',

  // ── CONFIG ──────────────────────────────────────────────────────
  FB_ALBUM_URL: 'https://www.facebook.com/media/set/?set=a.442742817865421&type=3',
  FB_PAGE_URL:  'https://www.facebook.com/ieevs.edu.hn/',
  FB_ALBUM_ID:  '442742817865421',
  FB_ACCESS_TOKEN: '',

  FB_PHOTOS: [
    { fbid:'442742817865421', fbUrl:'https://www.facebook.com/media/set/?set=a.442742817865421&type=3', tag:'64 Aniversario', title:'64 Años de Historia', subtitle:'Celebramos con gratitud y alegría · 2025', cat:'cultural', kb:'kenburns', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742817865421', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742817865421' },
    { fbid:'442742821198754', fbUrl:'https://www.facebook.com/photo/?fbid=442742821198754&set=a.442742817865421', tag:'64 Aniversario', title:'Ceremonia Oficial', subtitle:'Autoridades y docentes en acto solemne', cat:'cultural', kb:'kenburns-b', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742821198754', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742821198754' },
    { fbid:'442742824532087', fbUrl:'https://www.facebook.com/photo/?fbid=442742824532087&set=a.442742817865421', tag:'64 Aniversario', title:'Comunidad Unida', subtitle:'Maestros, alumnos y familias celebrando', cat:'cultural', kb:'kenburns-alt', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742824532087', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742824532087' },
    { fbid:'442742827865420', fbUrl:'https://www.facebook.com/photo/?fbid=442742827865420&set=a.442742817865421', tag:'64 Aniversario', title:'Estudiantes de Secundaria', subtitle:'Nuevas generaciones, mismo legado', cat:'cultural', kb:'kenburns', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742827865420', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742827865420' },
    { fbid:'442742831198753', fbUrl:'https://www.facebook.com/photo/?fbid=442742831198753&set=a.442742817865421', tag:'64 Aniversario', title:'Acto Cultural', subtitle:'Danza, música y tradición hondureña', cat:'cultural', kb:'kenburns-b', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742831198753', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742831198753' },
    { fbid:'442742834532086', fbUrl:'https://www.facebook.com/photo/?fbid=442742834532086&set=a.442742817865421', tag:'64 Aniversario', title:'Reconocimientos', subtitle:'Premiando la excelencia y la dedicación', cat:'cultural', kb:'kenburns-alt', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742834532086', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742834532086' },
    { fbid:'442742837865419', fbUrl:'https://www.facebook.com/photo/?fbid=442742837865419&set=a.442742817865421', tag:'64 Aniversario', title:'Primaria & Preescolar', subtitle:'Los más pequeños también celebran', cat:'cultural', kb:'kenburns', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742837865419', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742837865419' },
    { fbid:'442742841198752', fbUrl:'https://www.facebook.com/photo/?fbid=442742841198752&set=a.442742817865421', tag:'64 Aniversario', title:'Orgullo Institucional', subtitle:'Virginia Sapp · 1962 – 2026', cat:'cultural', kb:'kenburns-b', src:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742841198752', thumb:'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=442742841198752' },
  ],

  IG_FALLBACKS: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1400&q=80&auto=format',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&q=80&auto=format',
  ],

  // ── STATE ────────────────────────────────────────────────────────
  slides: [],
  allSlides: [],
  current: 0,
  timer: null,
  paused: false,
  interval: 3000,
  lbIndex: 0,
  dragStartX: 0,
  dragging: false,

  async init() {
    if (!document.getElementById('galeria')) return;
    const fbLoaded = await this._loadFBAlbum();
    const igFallbacksTh = this.IG_FALLBACKS.map(u => u.replace('w=1400', 'w=300').replace('q=80', 'q=60'));
    if (!fbLoaded) {
      this.allSlides = this.FB_PHOTOS.map((p, i) => ({
        src: p.src, thumb: p.thumb,
        fallback: this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        fallbackTh: igFallbacksTh[i % igFallbacksTh.length],
        tag: p.tag, title: p.title, subtitle: p.subtitle,
        cat: p.cat, kb: p.kb,
        fbUrl: p.fbUrl || this.FB_ALBUM_URL,
        igUrl: p.fbUrl || this.FB_ALBUM_URL,
      }));
    }
    this.slides = [...this.allSlides];
    this._buildCarousel();
    this._bindEvents();
  },

  _bindEvents() {
    // Carousel controls
    const prev = document.querySelector('.c-ctrl-prev');
    const next = document.querySelector('.c-ctrl-next');
    const pp = document.getElementById('c-playpause');
    if (prev) prev.addEventListener('click', e => { e.stopPropagation(); this.step(-1); });
    if (next) next.addEventListener('click', e => { e.stopPropagation(); this.step(1); });
    if (pp) pp.addEventListener('click', e => { e.stopPropagation(); this.togglePause(); });

    // Lightbox controls
    const lbClose = document.querySelector('.lb-close');
    const lbPrev = document.querySelector('.lb-prev');
    const lbNext = document.querySelector('.lb-next');
    if (lbClose) lbClose.addEventListener('click', () => this.closeLightbox());
    if (lbPrev) lbPrev.addEventListener('click', () => this.lbStep(-1));
    if (lbNext) lbNext.addEventListener('click', () => this.lbStep(1));

    const lb = document.getElementById('lightbox');
    if (lb) lb.addEventListener('click', e => { if (e.target === lb) this.closeLightbox(); });

    // Gallery filters
    const filtersContainer = document.querySelector('.galeria-filters');
    if (filtersContainer) {
      filtersContainer.addEventListener('click', e => {
        const btn = e.target.closest('.gal-filter');
        if (!btn) return;
        this.filter(btn, btn.dataset.cat);
      });
    }

    // FB Config panel
    const fbConfigPanel = document.getElementById('fb-config-panel');
    if (fbConfigPanel) {
      const closeBtn = fbConfigPanel.querySelector('.fb-config-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.toggleFBConfigPanel());
      const applyBtn = fbConfigPanel.querySelector('.fb-apply-btn');
      if (applyBtn) applyBtn.addEventListener('click', () => this.applyFBToken());
    }

    // Touch + mouse swipe
    const stage = document.getElementById('carousel-stage');
    if (stage) {
      stage.addEventListener('touchstart', e => { this.dragStartX = e.touches[0].clientX; this.dragging = true; }, { passive: true });
      stage.addEventListener('touchend', e => {
        if (!this.dragging) return;
        const dx = e.changedTouches[0].clientX - this.dragStartX;
        if (Math.abs(dx) > 40) this.step(dx < 0 ? 1 : -1);
        this.dragging = false;
      });
      stage.addEventListener('mousedown', e => { this.dragStartX = e.clientX; this.dragging = true; });
      stage.addEventListener('mouseup', e => {
        if (!this.dragging) return;
        const dx = e.clientX - this.dragStartX;
        if (Math.abs(dx) > 40) this.step(dx < 0 ? 1 : -1);
        this.dragging = false;
      });
      stage.addEventListener('mouseenter', () => { if (!this.paused) this._clearProgressBar(); });
      stage.addEventListener('mouseleave', () => { if (!this.paused) this._startProgressBar(); });
    }

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === ' ') {
        const lbEl = document.getElementById('lightbox');
        if (lbEl && !lbEl.classList.contains('open')) this.togglePause();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); this.toggleFBConfigPanel(); }
    });
  },

  // ── FB API ───────────────────────────────────────────────────────

  async _loadFBAlbum() {
    if (!this.FB_ACCESS_TOKEN) return false;
    const igFallbacksTh = this.IG_FALLBACKS.map(u => u.replace('w=1400', 'w=300').replace('q=80', 'q=60'));
    const url = `https://graph.facebook.com/v22.0/${this.FB_ALBUM_ID}/photos?fields=images,name,created_time,link&limit=20&access_token=${this.FB_ACCESS_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.data || data.error) return false;
      const kbCycle = ['kenburns', 'kenburns-b', 'kenburns-alt'];
      this.allSlides = data.data.map((photo, i) => ({
        src: photo.images?.[0]?.source || this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        thumb: photo.images?.[2]?.source || igFallbacksTh[i % igFallbacksTh.length],
        fallback: this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        fallbackTh: igFallbacksTh[i % igFallbacksTh.length],
        tag: '64 Aniversario',
        title: (photo.name || 'Virginia Sapp').substring(0, 40),
        subtitle: new Date(photo.created_time || Date.now()).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
        cat: 'cultural', kb: kbCycle[i % 3],
        fbUrl: photo.link || this.FB_ALBUM_URL,
        igUrl: photo.link || this.FB_ALBUM_URL,
      }));
      return true;
    } catch (e) {
      console.warn('FB load failed:', e.message);
      return false;
    }
  },

  toggleFBConfigPanel() {
    const panel = document.getElementById('fb-config-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  },

  applyFBToken() {
    const token = document.getElementById('fb-token-input')?.value.trim();
    const albumId = document.getElementById('fb-album-input')?.value.trim() || this.FB_ALBUM_ID;
    const status = document.getElementById('fb-status');
    if (!token) { if (status) { status.style.color = '#f87171'; status.textContent = '⚠ Pega tu token primero'; } return; }
    if (status) { status.style.color = 'rgba(255,255,255,.4)'; status.textContent = '⏳ Cargando...'; }
    const igFallbacksTh = this.IG_FALLBACKS.map(u => u.replace('w=1400', 'w=300').replace('q=80', 'q=60'));
    const url = `https://graph.facebook.com/v22.0/${albumId}/photos?fields=images,name,created_time,link&limit=20&access_token=${token}`;
    fetch(url).then(r => r.json()).then(data => {
      if (data.error) { if (status) { status.style.color = '#f87171'; status.textContent = '❌ ' + data.error.message; } return; }
      const kbs = ['kenburns', 'kenburns-b', 'kenburns-alt'];
      this.allSlides = data.data.map((photo, i) => ({
        src: photo.images?.[0]?.source || this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        thumb: photo.images?.[0]?.source || this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        fallback: this.IG_FALLBACKS[i % this.IG_FALLBACKS.length],
        fallbackTh: igFallbacksTh[i % igFallbacksTh.length],
        tag: '64 Aniversario',
        title: (photo.name || 'Virginia Sapp').substring(0, 40),
        subtitle: new Date(photo.created_time || Date.now()).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
        cat: 'cultural', kb: kbs[i % 3],
        fbUrl: photo.link || this.FB_ALBUM_URL, igUrl: photo.link || this.FB_ALBUM_URL,
      }));
      this.slides = [...this.allSlides];
      this._buildCarousel();
      if (status) { status.style.color = '#4ade80'; status.textContent = `✅ ${data.data.length} fotos cargadas`; }
      if (typeof addXP === 'function') addXP(20, '📘', '¡Álbum de FB conectado!', `+20 XP · ${data.data.length} fotos`);
    }).catch(e => { if (status) { status.style.color = '#f87171'; status.textContent = '❌ ' + e.message; } });
  },

  // ── CAROUSEL ─────────────────────────────────────────────────────

  _buildCarousel() {
    const wrap = document.getElementById('c-slides-wrap');
    const prog = document.getElementById('c-progress-row');
    const film = document.getElementById('c-filmstrip');
    const ticker = document.getElementById('c-ticker-track');
    if (!wrap) return;

    wrap.innerHTML = '';
    if (prog) prog.innerHTML = '';
    if (film) film.innerHTML = '';

    this.slides.forEach((sl, i) => {
      const div = document.createElement('div');
      div.className = 'c-slide' + (i === 0 ? ' active' : '');
      div.dataset.index = i;

      const bgImg = new Image();
      bgImg.onload = () => {
        const el = div.querySelector('.c-slide-img');
        if (el) el.style.backgroundImage = `url('${sl.src}')`;
        const th = document.querySelectorAll('.c-thumb img')[i];
        if (th) th.src = sl.thumb;
      };
      bgImg.onerror = () => {
        const el = div.querySelector('.c-slide-img');
        if (el) el.style.backgroundImage = `url('${sl.fallback}')`;
        const th = document.querySelectorAll('.c-thumb img')[i];
        if (th) th.src = sl.fallbackTh;
      };
      bgImg.src = sl.src;

      div.innerHTML = `
        <div class="c-slide-img" style="background-image:url('${sl.fallback}');animation-name:${sl.kb};"></div>
        <div class="c-slide-content">
          <div class="c-slide-tag"><div class="c-slide-tag-dot"></div><span style="margin-right:6px">📷</span>${sl.tag}</div>
          <div class="c-slide-title">${this._formatTitle(sl.title)}</div>
          <div class="c-slide-sub">${sl.subtitle}</div>
          <div class="c-ig-hint">Doble clic · Ver en Facebook →</div>
        </div>`;

      div.addEventListener('click', e => {
        if (e.target.closest('.c-ctrl') || e.target.closest('.c-playpause')) return;
        this.lbIndex = i;
        this.openLightbox(i);
      });
      div.addEventListener('dblclick', e => {
        e.stopPropagation();
        window.open(sl.fbUrl || sl.igUrl || this.FB_ALBUM_URL, '_blank', 'noopener');
        if (typeof addXP === 'function') addXP(5, '📘', '¡Abriendo Facebook!', '+5 XP');
      });
      wrap.appendChild(div);
    });

    if (prog) {
      this.slides.forEach((_, i) => {
        const bar = document.createElement('div');
        bar.className = 'c-prog-bar';
        bar.innerHTML = '<div class="c-prog-fill"></div>';
        bar.addEventListener('click', () => this.goto(i));
        prog.appendChild(bar);
      });
    }

    if (film) {
      this.slides.forEach((sl, i) => {
        const th = document.createElement('div');
        th.className = 'c-thumb' + (i === 0 ? ' active' : '');
        th.innerHTML = `<img src="${sl.fallbackTh}" alt="${sl.title}" loading="lazy"><div class="c-thumb-bar"></div><div class="c-thumb-label"><span>${sl.tag}<br>${sl.title}</span></div>`;
        th.addEventListener('click', () => {
          this.goto(i);
          if (typeof addXP === 'function') addXP(2, '🎞️', '¡Explorando la galería!', '+2 XP');
        });
        film.appendChild(th);
      });
    }

    if (ticker) {
      ticker.innerHTML = [...this.slides, ...this.slides].map(sl =>
        `<span class="c-ticker-item">${sl.tag} · ${sl.title}</span>`
      ).join('');
    }

    const tot = document.getElementById('c-tot');
    if (tot) tot.textContent = this.slides.length;
    this._updateUI(0);
    this._startProgressBar();
  },

  _formatTitle(t) {
    const words = t.split(' ');
    if (words.length <= 2) return t;
    const mid = Math.ceil(words.length / 2);
    return words.slice(0, mid).join(' ') + '<br><em>' + words.slice(mid).join(' ') + '</em>';
  },

  goto(idx, skipParticles) {
    if (idx === this.current) return;
    const slides = document.querySelectorAll('.c-slide');
    const thumbs = document.querySelectorAll('.c-thumb');
    const bars = document.querySelectorAll('.c-prog-bar');

    if (bars[this.current]) {
      bars[this.current].classList.add('done');
      bars[this.current].querySelector('.c-prog-fill').style.width = '100%';
      bars[this.current].querySelector('.c-prog-fill').style.transition = 'none';
    }

    const morph = document.getElementById('c-morph');
    if (morph) { morph.classList.add('flash'); setTimeout(() => morph.classList.remove('flash'), 550); }
    if (!skipParticles) this._spawnParticles();

    if (slides[this.current]) {
      slides[this.current].classList.remove('active');
      slides[this.current].classList.add('leaving');
      const prevIdx = this.current;
      setTimeout(() => { if (slides[prevIdx]) slides[prevIdx].classList.remove('leaving'); }, 600);
      const oldImg = slides[this.current].querySelector('.c-slide-img');
      if (oldImg) { oldImg.style.animation = 'none'; void oldImg.offsetWidth; }
    }

    if (thumbs[this.current]) thumbs[this.current].classList.remove('active');
    this.current = idx;
    if (slides[this.current]) slides[this.current].classList.add('active');
    if (thumbs[this.current]) thumbs[this.current].classList.add('active');

    const newImg = slides[this.current]?.querySelector('.c-slide-img');
    if (newImg) {
      const kb = this.slides[this.current].kb;
      newImg.style.animation = 'none';
      void newImg.offsetWidth;
      newImg.style.animation = `${kb} 6s ease-in-out both`;
    }

    this._updateUI(this.current);
    this._scrollFilmstripTo(this.current);
    this._startProgressBar();
  },

  step(dir) {
    this.goto(((this.current + dir) + this.slides.length) % this.slides.length);
  },

  togglePause() {
    this.paused = !this.paused;
    const icon = document.getElementById('c-pp-icon');
    if (icon) icon.textContent = this.paused ? '▶' : '⏸';
    if (this.paused) this._clearProgressBar();
    else this._startProgressBar();
  },

  _updateUI(idx) {
    const cur = document.getElementById('c-cur');
    if (cur) cur.textContent = idx + 1;
    document.querySelectorAll('.c-prog-bar').forEach((b, i) => {
      const fill = b.querySelector('.c-prog-fill');
      if (i < idx) { b.classList.add('done'); fill.style.width = '100%'; fill.style.transition = 'none'; }
      else if (i > idx) { b.classList.remove('done'); fill.style.width = '0%'; fill.style.transition = 'none'; }
      else b.classList.remove('done');
    });
  },

  _startProgressBar() {
    this._clearProgressBar();
    if (this.paused) return;
    const bar = document.querySelectorAll('.c-prog-bar')[this.current];
    if (!bar) return;
    const fill = bar.querySelector('.c-prog-fill');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    void fill.offsetWidth;
    fill.style.transition = `width ${this.interval}ms linear`;
    fill.style.width = '100%';
    this.timer = setTimeout(() => { this.goto((this.current + 1) % this.slides.length, true); }, this.interval);
  },

  _clearProgressBar() {
    clearTimeout(this.timer);
    document.querySelectorAll('.c-prog-bar').forEach(b => {
      const f = b.querySelector('.c-prog-fill');
      if (f) { const w = getComputedStyle(f).width; f.style.transition = 'none'; f.style.width = w; }
    });
  },

  _scrollFilmstripTo(idx) {
    const film = document.getElementById('c-filmstrip');
    const thumb = film?.querySelectorAll('.c-thumb')[idx];
    if (!film || !thumb) return;
    film.scrollLeft = thumb.offsetLeft - (film.clientWidth - thumb.offsetWidth) / 2;
  },

  _spawnParticles() {
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
      p.style.cssText = `width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;opacity:${0.4 + Math.random() * 0.5};animation-duration:${0.5 + Math.random() * 0.5}s;animation-delay:${Math.random() * 0.15}s;`;
      stage.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  },

  // ── LIGHTBOX ─────────────────────────────────────────────────────

  openLightbox(idx) {
    this.lbIndex = idx;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lb-img');
    const sl = this.slides[idx];
    if (!lb || !img) return;
    img.src = sl.fallback;
    const test = new Image();
    test.onload = () => img.src = sl.src;
    test.onerror = () => {};
    test.src = sl.src;
    const lbTag = document.getElementById('lb-tag');
    const lbTitle = document.getElementById('lb-title');
    const lbBtn = document.getElementById('lb-ig-btn');
    if (lbTag) lbTag.textContent = sl.tag;
    if (lbTitle) lbTitle.textContent = sl.title + ' · ' + sl.subtitle;
    if (lbBtn) lbBtn.href = sl.fbUrl || sl.igUrl || this.FB_ALBUM_URL;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof addXP === 'function') addXP(4, '🔍', '¡Vista completa!', '+4 XP');
  },

  closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
    document.body.style.overflow = '';
  },

  lbStep(dir) {
    this.lbIndex = ((this.lbIndex + dir) + this.slides.length) % this.slides.length;
    const img = document.getElementById('lb-img');
    const sl = this.slides[this.lbIndex];
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
      if (lbBtn) lbBtn.href = sl.fbUrl || sl.igUrl || this.FB_ALBUM_URL;
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 180);
  },

  filter(btn, cat) {
    btn.closest('.galeria-filters').querySelectorAll('.gal-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.slides = cat === 'all' ? [...this.allSlides] : this.allSlides.filter(s => s.cat === cat);
    if (this.slides.length === 0) this.slides = [...this.allSlides];
    this.current = 0;
    clearTimeout(this.timer);
    this._buildCarousel();
    if (typeof addXP === 'function') addXP(3, '📸', '¡Explorando la galería!', '+3 XP');
  },
};

// Backward-compatible global stubs
function showFBConfigPanel() { Gallery.toggleFBConfigPanel(); }
function applyFBToken() { Gallery.applyFBToken(); }
function filterGalCarousel(btn, cat) { Gallery.filter(btn, cat); }
function carouselStep(dir) { Gallery.step(dir); }
function toggleCarouselPause() { Gallery.togglePause(); }
function closeLightbox() { Gallery.closeLightbox(); }
function lbStep(dir) { Gallery.lbStep(dir); }

App.register(Gallery);
