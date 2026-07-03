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
    this._setupLeadModal();
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

  // SDD-F3-QS-005 — acordeones accesibles (teclado + aria)
  _setupAccordions() {
    document.addEventListener('click', e => {
      const trigger = e.target.closest('.qs-acc-trigger');
      if (!trigger) return;

      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
    });
  },

  // SDD-F3-QS-008 — modal de reseña del equipo directivo (retratos clicables)
  _setupLeadModal() {
    const modal = document.getElementById('lead-modal');
    if (!modal) return;

    const els = {
      mono: document.getElementById('lead-modal-mono'),
      title: document.getElementById('lead-modal-title'),
      name: document.getElementById('lead-modal-name'),
      role: document.getElementById('lead-modal-role'),
      bio: document.getElementById('lead-modal-bio'),
    };
    let lastFocused = null;

    const open = card => {
      lastFocused = card;
      els.mono.textContent = card.dataset.mono || '';
      els.title.textContent = card.dataset.title || '';
      els.name.textContent = card.dataset.name || '';
      els.role.textContent = card.dataset.role || '';
      els.bio.textContent = card.dataset.bio || '';
      els.bio.classList.toggle('is-pending', card.dataset.bioPending === 'true');

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const closeBtn = modal.querySelector('.lead-modal-close');
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) { lastFocused.focus(); lastFocused = null; }
    };

    document.addEventListener('click', e => {
      const card = e.target.closest('[data-lead]');
      if (card) { open(card); return; }
      if (e.target.closest('[data-lead-close]')) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  },
};

App.register(QuienesSomos);
