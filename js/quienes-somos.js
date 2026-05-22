'use strict';

/* ═══════════════════════════════════════
   QUIÉNES SOMOS — Fase 3 CEEVS
   Navegación interna (scroll-spy) + acordeones accesibles
═══════════════════════════════════════ */

const QuienesSomos = {
  name: 'QuienesSomos',

  init() {
    if (!document.querySelector('.qs-nav')) return;
    this._setupScrollSpy();
    this._setupAccordions();
  },

  // SDD-F3-QS-001 — resaltar la sección visible en la navegación interna
  _setupScrollSpy() {
    const links = Array.from(document.querySelectorAll('.qs-nav a[href^="#"]'));
    if (!links.length) return;

    const byId = {};
    links.forEach(link => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (section) byId[id] = link;
    });

    const setActive = id => {
      links.forEach(l => l.classList.remove('qs-active'));
      if (byId[id]) {
        byId[id].classList.add('qs-active');
        byId[id].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-150px 0px -55% 0px', threshold: 0 });

    Object.keys(byId).forEach(id => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  },

  // SDD-F3-QS-005 / QS-008 — acordeones accesibles (teclado + aria)
  _setupAccordions() {
    document.addEventListener('click', e => {
      const trigger = e.target.closest('.qs-acc-trigger, .equipo-card-head');
      if (!trigger) return;

      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
    });
  },
};

App.register(QuienesSomos);
