'use strict';

const Gamification = {
  name: 'Gamification',

  xp: 0,
  earnedBadges: new Set(),
  sectionEarned: new Set(),
  hudMinimized: false,

  init() {
    this.xp = parseInt(localStorage.getItem('ceevs_xp') || '0');
    this.earnedBadges = new Set(JSON.parse(localStorage.getItem('ceevs_badges') || '[]'));
    this.sectionEarned = new Set(JSON.parse(localStorage.getItem('ceevs_sections') || '[]'));
    this._bindButtons();
    this._observeSections();
    this.updateHUD();
    this._welcomeXP();
    this._autoMinimizeMobile();
  },

  saveState() {
    localStorage.setItem('ceevs_xp', this.xp);
    localStorage.setItem('ceevs_badges', JSON.stringify([...this.earnedBadges]));
    localStorage.setItem('ceevs_sections', JSON.stringify([...this.sectionEarned]));
  },

  addXP(pts, icon, title, desc) {
    this.xp += pts;
    if (this.xp > CONFIG.XP_MAX) this.xp = CONFIG.XP_MAX;
    this.updateHUD();
    this.showToast(icon, title, desc || `+${pts} XP`);
    this.saveState();
  },

  updateHUD() {
    const pct = Math.min((this.xp / CONFIG.XP_MAX) * 100, 100);
    const fill = document.getElementById('hud-fill');
    const score = document.getElementById('hud-score');
    const scoreMin = document.getElementById('hud-score-min');
    const ptsLabel = document.getElementById('hud-pts-label');
    const ptsMax = document.getElementById('hud-pts-max');

    if (fill) fill.style.width = pct + '%';
    if (score) score.textContent = this.xp;
    if (scoreMin) scoreMin.textContent = this.xp + ' XP';

    const lvl = this.xp < 30 ? 'Explorador'
      : this.xp < 80 ? 'Conocedor'
      : this.xp < 150 ? 'Fan de CEEVS'
      : '⭐ Familia Virginia Sapp';

    if (ptsLabel) ptsLabel.textContent = this.xp + ' pts · ' + lvl;
    if (ptsMax) ptsMax.textContent = CONFIG.XP_MAX + ' pts';

    this.earnedBadges.forEach(id => {
      const b = document.querySelector(`[data-id="${id}"]`);
      if (b) b.classList.add('earned');
    });
  },

  unlockBadge(id) {
    if (this.earnedBadges.has(id)) return;
    this.earnedBadges.add(id);
    const b = document.querySelector(`[data-id="${id}"]`);
    if (b) {
      b.classList.add('earned');
      b.style.transform = 'scale(1.3)';
      setTimeout(() => b.style.transform = '', 300);
    }
    this.saveState();
  },

  showToast(icon, title, desc) {
    const t = document.getElementById('toast');
    if (!t) return;
    const iconEl = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const descEl = document.getElementById('toast-desc');

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    clearTimeout(t._timer);
    t._dismissed = false;
    t.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1)';
    t.style.opacity = '';
    t.classList.add('show');
    const delay = window.innerWidth <= 900 ? CONFIG.TOAST_DELAY_MOBILE : CONFIG.TOAST_DELAY_DESKTOP;
    t._timer = setTimeout(() => { if (!t._dismissed) t.classList.remove('show'); }, delay);
  },

  dismissToast(e) {
    if (e) e.stopPropagation();
    const t = document.getElementById('toast');
    if (!t || !t.classList.contains('show')) return;
    t._dismissed = true;
    clearTimeout(t._timer);

    const r = t.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      p.className = 'c-particle';
      const size = 3 + Math.random() * 5;
      const angle = (Math.PI * 2 / 16) * i + Math.random() * 0.4;
      const dist = 40 + Math.random() * 100;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;opacity:${0.5 + Math.random() * 0.5};animation-duration:${0.4 + Math.random() * 0.4}s;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }

    t.style.transition = 'transform .2s ease-in, opacity .15s';
    t.style.opacity = '0';
    setTimeout(() => {
      t.classList.remove('show');
      t.style.transition = '';
      t.style.opacity = '';
    }, 200);
  },

  toggleHUD() {
    this.hudMinimized = !this.hudMinimized;
    const main = document.getElementById('hud-main-content');
    const min = document.getElementById('hud-min-content');
    const toggle = document.getElementById('hud-toggle');
    if (main) main.style.display = this.hudMinimized ? 'none' : 'block';
    if (min) min.style.display = this.hudMinimized ? 'block' : 'none';
    if (toggle) toggle.textContent = this.hudMinimized ? '+' : '−';
  },

  _bindButtons() {
    const hudToggleBtn = document.getElementById('hud-toggle');
    if (hudToggleBtn) hudToggleBtn.addEventListener('click', () => this.toggleHUD());

    const toastEl = document.getElementById('toast');
    if (toastEl) toastEl.addEventListener('click', e => this.dismissToast(e));
  },

  _observeSections() {
    const sectionXP = {
      historia: 10, filosofia: 5, 'declaracion-fe': 5,
      niveles: 8, valores: 5, 'perfil-egresado': 5,
      quiz: 0, admisiones: 10, 'portal-educativo': 3,
      galeria: 5, testimonios: 5, exalumnos: 3, contacto: 8,
    };
    const sectionBadge = {
      historia: 'history', filosofia: 'explorer', niveles: 'explorer',
      valores: 'explorer', 'perfil-egresado': 'knower', contacto: 'contact',
    };
    const sectionMessages = {
      historia:           ['📖', '¡Conociste nuestra historia!', '+10 XP · Conocedor de CEEVS'],
      niveles:            ['🎒', '¡Exploraste los niveles!', '+8 XP · Sigue explorando'],
      admisiones:         ['🎓', '¡Revisaste admisiones!', '+10 XP · ¡Casi listo para inscribirte!'],
      galeria:            ['📸', '¡Viste la galería!', '+5 XP · La vida escolar en CEEVS'],
      testimonios:        ['❤️', '¡Leíste testimonios!', '+5 XP · Familias felices'],
      contacto:           ['🏫', '¡Llegaste al contacto!', '+8 XP · ¡Un paso más!'],
      valores:            ['✦', '¡Conociste nuestros valores!', '+5 XP'],
      filosofia:          ['📖', '¡Exploraste nuestra filosofía!', '+5 XP · Fundamentos de CEEVS'],
      'declaracion-fe':   ['✝️', '¡Conociste nuestra fe!', '+5 XP · Identidad cristiana'],
      'perfil-egresado':  ['🎓', '¡Viste el perfil del egresado!', '+5 XP'],
      'portal-educativo': ['🖥️', '¡Revisaste el portal!', '+3 XP'],
      exalumnos:          ['🏫', '¡Comunidad de egresados!', '+3 XP'],
    };

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const id = e.target.id;
        if (e.isIntersecting && sectionXP[id] && !this.sectionEarned.has(id)) {
          this.sectionEarned.add(id);
          const pts = sectionXP[id];
          const m = sectionMessages[id] || ['✦', '¡Nuevo logro!', `+${pts} XP`];
          this.addXP(pts, m[0], m[1], m[2]);
          if (sectionBadge[id]) this.unlockBadge(sectionBadge[id]);
        }
      });
    }, { threshold: 0.3 });

    Object.keys(sectionXP).forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  },

  _welcomeXP() {
    if (!localStorage.getItem('ceevs_welcomed')) {
      setTimeout(() => {
        this.addXP(5, '👋', '¡Bienvenido/a a CEEVS!', 'Comenzaste a explorar +5 XP');
        this.unlockBadge('explorer');
        localStorage.setItem('ceevs_welcomed', '1');
      }, CONFIG.WELCOME_XP_DELAY);
    }
  },

  _autoMinimizeMobile() {
    if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) {
      setTimeout(() => {
        const main = document.getElementById('hud-main-content');
        const min = document.getElementById('hud-min-content');
        const toggle = document.getElementById('hud-toggle');
        if (main) main.style.display = 'none';
        if (min) min.style.display = 'block';
        if (toggle) toggle.textContent = '+';
        this.hudMinimized = true;
      }, CONFIG.HUD_MINIMIZE_DELAY);
    }
  },
};

// Backward-compatible global stubs (used by gallery.js, games.js, quiz.js)
function addXP(pts, icon, title, desc) { Gamification.addXP(pts, icon, title, desc); }
function unlockBadge(id) { Gamification.unlockBadge(id); }

App.register(Gamification);
