'use strict';

const Main = {
  name: 'Main',

  init() {
    this._setupCursor();
    this._setupParallaxAndNavbar();
    this._setupMobileMenu();
    this._setupNavActive();
    this._setupLogoFallback();
    this._setupFAQ();
    this._setupCounters();
    this._setupScrollReveal();
    this._setupStagger();
    this._setupDropdowns();
    this._setupValorCards();
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
    const menu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('nav-hamburger');
    if (!menu || !hamburger) return;

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    hamburger.addEventListener('click', () => {
      setOpen(!menu.classList.contains('open'));
    });

    const closeBtn = document.querySelector('.mm-close');
    if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false));

    menu.addEventListener('click', (e) => {
      if (e.target === menu || e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    this._toggleMobileMenu = () => setOpen(!menu.classList.contains('open'));
  },

  _setupNavActive() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const MAP = {
      'quienes-somos.html': 'quienes-somos',
      'admisiones.html': 'admisiones',
      'contactenos.html': 'contactenos',
      'interactivo.html': 'actividades',
      'mision-evangelistica.html': 'mision-evangelistica',
    };
    const activeId = MAP[path];
    if (!activeId) return;
    document.querySelectorAll('[data-nav-id="' + activeId + '"]').forEach(el => {
      el.classList.add('nav-active');
    });
  },

  _setupLogoFallback() {
    const img = document.getElementById('nav-logo-img');
    if (!img) return;
    img.addEventListener('error', () => {
      img.src = 'assets/logo.jpg';
    }, { once: true });
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
