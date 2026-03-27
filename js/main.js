/**
 * main.js — Shared core functionality
 * Handles: touch detection, custom cursor, parallax, navbar scroll,
 * mobile menu, counter animations, scroll-reveal, FAQ accordion,
 * stagger animations, form submission
 */

// ── TOUCH DETECTION ──
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const isMobile = window.innerWidth <= 600;

// ── CUSTOM CURSOR (desktop only) ──
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

if (!isTouch && cursor && cursorRing) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a,button,.valor-card,.nivel-card,.quiz-opt').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2.5)';
      cursorRing.style.opacity = '.2';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursorRing.style.opacity = '.5';
    });
  });
} else if (cursor && cursorRing) {
  cursor.style.display = 'none';
  cursorRing.style.display = 'none';
  document.body.style.cursor = 'auto';
}

// ── PARALLAX HERO + NAVBAR SCROLL ──
const heroBg = document.getElementById('hero-parallax');
let ticking = false;

window.addEventListener('scroll', () => {
  const y = window.scrollY;

  // Navbar scroll state
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', y > 60);

  // Parallax (desktop only, when hero exists)
  if (!isTouch && heroBg && !ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      heroBg.style.transform = `translateY(${y * 0.3}px)`;
      ticking = false;
    });
  }
});

// ── MOBILE MENU ──
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('nav-hamburger');
  if (!menu || !btn) return;
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

// Close on backdrop tap
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenu) {
  mobileMenu.addEventListener('click', function (e) {
    if (e.target === this) toggleMobileMenu();
  });
}

// ── FAQ ACCORDION ──
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// ── COUNTER ANIMATION ──
function animateCount(el) {
  const target = parseInt(el.dataset.target);
  const duration = target > 1000 ? 2000 : 1200;
  const start = Date.now();
  const step = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  };
  step();
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCount(e.target);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.count').forEach(el => counterObs.observe(el));

// ── SCROLL REVEAL ──
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), 60);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => revealObs.observe(el));

// ── STAGGER CHILDREN ──
document.querySelectorAll(
  '.steps-row .step-box,' +
  '.testimonios-grid .testi-card,' +
  '.galeria-mosaic .gi,' +
  '.valores-grid .valor-card,' +
  '.niveles-cards .nivel-card'
).forEach((el, i) => {
  el.style.transitionDelay = (i * 80) + 'ms';
});

// ── VALORES SELECTION ──
let valorCount = 0;
function selectValor(card, badgeId) {
  const wasActive = card.classList.contains('active');
  card.classList.toggle('active');
  if (!wasActive && typeof addXP === 'function') {
    valorCount++;
    if (valorCount === 1) addXP(5, '✦', '¡Explorando valores!', 'Conociste el primer valor +5 XP');
    if (valorCount === 5) { addXP(10, '🌟', '¡Medio camino!', 'Exploraste 5 valores +10 XP'); unlockBadge('knower'); }
    if (valorCount === 10) { addXP(15, '💎', '¡Conoces todos los valores!', '¡Explorador completo! +15 XP'); }
  }
}

// ── FORM SUBMIT ──
function submitForm(btn) {
  const textEl = btn.querySelector('.f-submit-text');
  const spinnerEl = btn.querySelector('.f-submit-spinner');
  btn.disabled = true;
  if (textEl) textEl.style.display = 'none';
  if (spinnerEl) spinnerEl.style.display = 'inline-flex';
  if (typeof addXP === 'function') {
    addXP(25, '🏫', '¡Bienvenido/a a la familia CEEVS!', 'Solicitud enviada · +25 XP');
    unlockBadge('contact');
  }
  setTimeout(() => {
    if (spinnerEl) spinnerEl.style.display = 'none';
    if (textEl) { textEl.textContent = '✓ ¡Solicitud enviada!'; textEl.style.display = ''; }
    btn.style.background = '#22c55e';
    btn.style.color = '#fff';
    setTimeout(() => {
      if (textEl) textEl.textContent = 'Enviar solicitud →';
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
    }, 3500);
  }, 1500);
}

// ── DROPDOWN NAV (desktop) ──
document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
  let timeout;
  dropdown.addEventListener('mouseenter', () => {
    clearTimeout(timeout);
    dropdown.classList.add('dropdown-open');
  });
  dropdown.addEventListener('mouseleave', () => {
    timeout = setTimeout(() => dropdown.classList.remove('dropdown-open'), 200);
  });
});
