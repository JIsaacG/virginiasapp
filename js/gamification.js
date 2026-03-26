/**
 * gamification.js — XP, badges, HUD, toast notifications
 * Tracks user engagement across pages via localStorage
 */

// ── STATE (persisted in localStorage) ──
let xp = parseInt(localStorage.getItem('ceevs_xp') || '0');
let earnedBadges = new Set(JSON.parse(localStorage.getItem('ceevs_badges') || '[]'));
let hudMinimized = false;
let sectionEarned = new Set(JSON.parse(localStorage.getItem('ceevs_sections') || '[]'));

function saveState() {
  localStorage.setItem('ceevs_xp', xp);
  localStorage.setItem('ceevs_badges', JSON.stringify([...earnedBadges]));
  localStorage.setItem('ceevs_sections', JSON.stringify([...sectionEarned]));
}

// ── CORE FUNCTIONS ──
function addXP(pts, icon, title, desc) {
  xp += pts;
  if (xp > 200) xp = 200;
  updateHUD();
  showToast(icon, title, desc || `+${pts} XP`);
  saveState();
}

function updateHUD() {
  const pct = Math.min((xp / 200) * 100, 100);
  const fill = document.getElementById('hud-fill');
  const score = document.getElementById('hud-score');
  const scoreMin = document.getElementById('hud-score-min');
  const ptsLabel = document.getElementById('hud-pts-label');
  const ptsMax = document.getElementById('hud-pts-max');

  if (fill) fill.style.width = pct + '%';
  if (score) score.textContent = xp;
  if (scoreMin) scoreMin.textContent = xp + ' XP';

  const lvl = xp < 30 ? 'Explorador'
    : xp < 80 ? 'Conocedor'
    : xp < 150 ? 'Fan de CEEVS'
    : '⭐ Familia Virginia Sapp';

  if (ptsLabel) ptsLabel.textContent = xp + ' pts · ' + lvl;
  if (ptsMax) ptsMax.textContent = '200 pts';

  // Restore earned badges visually
  earnedBadges.forEach(id => {
    const b = document.querySelector(`[data-id="${id}"]`);
    if (b) b.classList.add('earned');
  });
}

function unlockBadge(id) {
  if (earnedBadges.has(id)) return;
  earnedBadges.add(id);
  const b = document.querySelector(`[data-id="${id}"]`);
  if (b) {
    b.classList.add('earned');
    b.style.transform = 'scale(1.3)';
    setTimeout(() => b.style.transform = '', 300);
  }
  saveState();
}

function showToast(icon, title, desc) {
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
  const delay = window.innerWidth <= 900 ? 2000 : 3000;
  t._timer = setTimeout(() => { if (!t._dismissed) t.classList.remove('show'); }, delay);
}

function dismissToast(e) {
  if (e) e.stopPropagation();
  const t = document.getElementById('toast');
  if (!t || !t.classList.contains('show')) return;
  t._dismissed = true;
  clearTimeout(t._timer);

  // Particle burst
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
    p.style.cssText = `
      position:fixed; width:${size}px; height:${size}px;
      left:${cx}px; top:${cy}px;
      --tx:${tx}px; --ty:${ty}px;
      opacity:${0.5 + Math.random() * 0.5};
      animation-duration:${0.4 + Math.random() * 0.4}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }

  // Exit animation
  t.style.transition = 'transform .2s ease-in, opacity .15s';
  t.style.opacity = '0';
  setTimeout(() => {
    t.classList.remove('show');
    t.style.transition = '';
    t.style.opacity = '';
  }, 200);
}

function toggleHUD() {
  hudMinimized = !hudMinimized;
  const main = document.getElementById('hud-main-content');
  const min = document.getElementById('hud-min-content');
  const toggle = document.getElementById('hud-toggle');
  if (main) main.style.display = hudMinimized ? 'none' : 'block';
  if (min) min.style.display = hudMinimized ? 'block' : 'none';
  if (toggle) toggle.textContent = hudMinimized ? '+' : '−';
}

// ── SECTION XP TRIGGERS ──
const sectionXP = {
  historia: 10, filosofia: 5, 'declaracion-fe': 5,
  niveles: 8, valores: 5, 'perfil-egresado': 5,
  quiz: 0, admisiones: 10, 'portal-educativo': 3,
  galeria: 5, testimonios: 5, exalumnos: 3, contacto: 8
};

const sectionBadge = {
  historia: 'history', filosofia: 'explorer', niveles: 'explorer',
  valores: 'explorer', 'perfil-egresado': 'knower', contacto: 'contact'
};

const sectionMessages = {
  historia:          ['📖', '¡Conociste nuestra historia!', '+10 XP · Conocedor de CEEVS'],
  niveles:           ['🎒', '¡Exploraste los niveles!', '+8 XP · Sigue explorando'],
  admisiones:        ['🎓', '¡Revisaste admisiones!', '+10 XP · ¡Casi listo para inscribirte!'],
  galeria:           ['📸', '¡Viste la galería!', '+5 XP · La vida escolar en CEEVS'],
  testimonios:       ['❤️', '¡Leíste testimonios!', '+5 XP · Familias felices'],
  contacto:          ['🏫', '¡Llegaste al contacto!', '+8 XP · ¡Un paso más!'],
  valores:           ['✦', '¡Conociste nuestros valores!', '+5 XP'],
  filosofia:         ['📖', '¡Exploraste nuestra filosofía!', '+5 XP · Fundamentos de CEEVS'],
  'declaracion-fe':  ['✝️', '¡Conociste nuestra fe!', '+5 XP · Identidad cristiana'],
  'perfil-egresado': ['🎓', '¡Viste el perfil del egresado!', '+5 XP'],
  'portal-educativo':['🖥️', '¡Revisaste el portal!', '+3 XP'],
  exalumnos:         ['🏫', '¡Comunidad de egresados!', '+3 XP'],
};

const secObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const id = e.target.id;
    if (e.isIntersecting && sectionXP[id] && !sectionEarned.has(id)) {
      sectionEarned.add(id);
      const pts = sectionXP[id];
      const m = sectionMessages[id] || ['✦', '¡Nuevo logro!', `+${pts} XP`];
      addXP(pts, m[0], m[1], m[2]);
      if (sectionBadge[id]) unlockBadge(sectionBadge[id]);
    }
  });
}, { threshold: 0.3 });

// Observe all gamified sections present on current page
Object.keys(sectionXP).forEach(id => {
  const el = document.getElementById(id);
  if (el) secObs.observe(el);
});

// ── INIT ──
// Restore HUD state on page load
updateHUD();

// Welcome XP (only first visit)
if (!localStorage.getItem('ceevs_welcomed')) {
  setTimeout(() => {
    addXP(5, '👋', '¡Bienvenido/a a CEEVS!', 'Comenzaste a explorar +5 XP');
    unlockBadge('explorer');
    localStorage.setItem('ceevs_welcomed', '1');
  }, 2000);
}

// Auto-minimize HUD on mobile
if (window.innerWidth <= 600) {
  setTimeout(() => {
    const main = document.getElementById('hud-main-content');
    const min = document.getElementById('hud-min-content');
    const toggle = document.getElementById('hud-toggle');
    if (main) main.style.display = 'none';
    if (min) min.style.display = 'block';
    if (toggle) toggle.textContent = '+';
    hudMinimized = true;
  }, 3500);
}
