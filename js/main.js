'use strict';

const Main = {
  name: 'Main',

  init() {
    this._setupCursor();
    this._setupParallaxAndNavbar();
    this._setupMobileMenu();
    this._setupFAQ();
    this._setupCounters();
    this._setupScrollReveal();
    this._setupStagger();
    this._setupDropdowns();
    this._setupValorCards();
    this._setupContactForm();
    this._setupXPLinks();
  },

  _setupCursor() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
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

      const animateRing = () => {
        ringX += (mouseX - ringX) * CONFIG.CURSOR_RING_EASING;
        ringY += (mouseY - ringY) * CONFIG.CURSOR_RING_EASING;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
      };
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
  },

  _setupParallaxAndNavbar() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const heroBg = document.getElementById('hero-parallax');
    let ticking = false;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const navbar = document.getElementById('navbar');
      if (navbar) navbar.classList.toggle('scrolled', y > CONFIG.NAVBAR_SCROLL_THRESHOLD);
      if (!isTouch && heroBg && !ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          heroBg.style.transform = `translateY(${y * CONFIG.PARALLAX_SPEED}px)`;
          ticking = false;
        });
      }
    });
  },

  _setupMobileMenu() {
    const toggle = () => {
      const menu = document.getElementById('mobile-menu');
      const btn = document.getElementById('nav-hamburger');
      if (!menu || !btn) return;
      const open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    const hamburger = document.getElementById('nav-hamburger');
    if (hamburger) hamburger.addEventListener('click', toggle);

    const mmClose = document.querySelector('.mm-close');
    if (mmClose) mmClose.addEventListener('click', toggle);

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.addEventListener('click', e => {
        if (e.target === mobileMenu || e.target.tagName === 'A') toggle();
      });
    }

    // Store toggle so other code can call it
    this._toggleMobileMenu = toggle;
  },

  _setupFAQ() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.faq-q');
      if (!btn) return;
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
    });
  },

  _setupCounters() {
    const animateCount = el => {
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
    };

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.count').forEach(el => obs.observe(el));
  },

  _setupScrollReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), 60);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => obs.observe(el));
  },

  _setupStagger() {
    document.querySelectorAll(
      '.steps-row .step-box,' +
      '.testimonios-grid .testi-card,' +
      '.galeria-mosaic .gi,' +
      '.valores-grid .valor-card,' +
      '.niveles-cards .nivel-card'
    ).forEach((el, i) => {
      el.style.transitionDelay = (i * CONFIG.STAGGER_DELAY_MS) + 'ms';
    });
  },

  _setupDropdowns() {
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
  },

  _setupValorCards() {
    let valorCount = 0;
    document.addEventListener('click', e => {
      const card = e.target.closest('.valor-card');
      if (!card) return;
      const wasActive = card.classList.contains('active');
      card.classList.toggle('active');
      if (!wasActive) {
        valorCount++;
        const badgeId = card.dataset.badge;
        if (valorCount === 1) addXP(5, '✦', '¡Explorando valores!', 'Conociste el primer valor +5 XP');
        if (valorCount === 5) { addXP(10, '🌟', '¡Medio camino!', 'Exploraste 5 valores +10 XP'); unlockBadge('knower'); }
        if (valorCount === 10) { addXP(15, '💎', '¡Conoces todos los valores!', '¡Explorador completo! +15 XP'); }
        if (badgeId) unlockBadge(badgeId);
      }
    });
  },

  _setupContactForm() {
    const btn = document.getElementById('f-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const textEl = btn.querySelector('.f-submit-text');
      const spinnerEl = btn.querySelector('.f-submit-spinner');
      btn.disabled = true;
      if (textEl) textEl.style.display = 'none';
      if (spinnerEl) spinnerEl.style.display = 'inline-flex';
      addXP(25, '🏫', '¡Bienvenido/a a la familia CEEVS!', 'Solicitud enviada · +25 XP');
      unlockBadge('contact');
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
    });
  },

  _setupXPLinks() {
    // Hero CTA XP action
    const heroCta = document.querySelector('.hero-ctas .btn-cta-main[data-xp-action]');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        const pts = +heroCta.dataset.xpPts || 15;
        const icon = heroCta.dataset.xpIcon || '🎓';
        const title = heroCta.dataset.xpTitle || '¡Explorando admisiones!';
        const desc = heroCta.dataset.xpDesc || '+' + pts + ' XP';
        addXP(pts, icon, title, desc);
      });
    }

    // Gallery badge FB link
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-xp-pts]');
      if (!el) return;
      const pts = +el.dataset.xpPts;
      const icon = el.dataset.xpIcon || '✦';
      const title = el.dataset.xpTitle || '¡Nuevo logro!';
      const desc = el.dataset.xpDesc || '+' + pts + ' XP';
      if (pts) addXP(pts, icon, title, desc);
    });
  },
};

// Backward-compatible global stub
function toggleMobileMenu() { Main._toggleMobileMenu && Main._toggleMobileMenu(); }
function submitForm() { document.getElementById('f-submit-btn')?.click(); }
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
}

App.register(Main);
