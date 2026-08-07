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
    this._setupHistoriaLightbox();
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

  // Visor de las fotos de la línea de tiempo: la polaroid crece hasta el centro (FLIP)
  _setupHistoriaLightbox() {
    const lb = DOM.byId('hl-lightbox');
    const lbFig = lb && lb.querySelector('.hl-lb-figure');
    const lbCap = DOM.byId('hl-lb-caption');
    const lbCount = DOM.byId('hl-lb-count');
    const fotos = Array.from(DOM.selectAll('.historia-linea .hl-foto'));
    if (!lb || !lbFig || !fotos.length) return;

    // La imagen se crea aquí: así el HTML no necesita un src de relleno
    const lbImg = document.createElement('img');
    lbImg.className = 'hl-lb-img';
    lbImg.alt = '';
    lbFig.insertBefore(lbImg, lbFig.firstChild);

    let idx = 0;
    let lastFocused = null;

    const miniatura = i => fotos[i] && fotos[i].querySelector('img');

    // FLIP: coloca la imagen sobre la miniatura y la deja viajar a su sitio final
    const zoomDesde = origen => {
      const desde = origen && origen.getBoundingClientRect();
      const hasta = lbImg.getBoundingClientRect();
      if (!desde || !desde.width || !hasta.width) return;

      const sx = desde.width / hasta.width;
      const sy = desde.height / hasta.height;
      const dx = (desde.left + desde.width / 2) - (hasta.left + hasta.width / 2);
      const dy = (desde.top + desde.height / 2) - (hasta.top + hasta.height / 2);

      lbImg.style.transition = 'none';
      lbImg.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      DOM.addClass(lb, 'is-ready');
      void lbImg.offsetWidth;              // fuerza el reflow antes de animar
      lbImg.style.transition = '';
      lbImg.style.transform = '';
    };

    const pintar = i => {
      const src = miniatura(i);
      const cap = fotos[i].querySelector('figcaption');
      if (!src) return;
      lbImg.src = src.currentSrc || src.src;
      lbImg.alt = src.alt || '';
      DOM.text(lbCap, cap ? cap.textContent : '');
      DOM.text(lbCount, `${i + 1} / ${fotos.length}`);
    };

    const abrir = async (i, disparador) => {
      idx = i;
      lastFocused = disparador || document.activeElement;
      pintar(idx);

      DOM.addClass(lb, 'is-open');
      DOM.attr(lb, 'aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      try { await lbImg.decode(); } catch (err) { /* caché o formato ya listo: seguimos */ }
      zoomDesde(miniatura(idx));

      const cerrar = lb.querySelector('[data-hl-close]');
      if (cerrar) cerrar.focus();
    };

    const navegar = async paso => {
      idx = (idx + paso + fotos.length) % fotos.length;
      DOM.addClass(lb, 'is-swapping');
      window.setTimeout(async () => {
        pintar(idx);
        try { await lbImg.decode(); } catch (err) { /* idem */ }
        DOM.removeClass(lb, 'is-swapping');
      }, 180);
    };

    const cerrar = () => {
      // FLIP inverso: la imagen se encoge de vuelta hacia su polaroid
      const origen = miniatura(idx);
      const desde = origen && origen.getBoundingClientRect();
      const hasta = lbImg.getBoundingClientRect();
      if (desde && desde.width && hasta.width) {
        const sx = desde.width / hasta.width;
        const sy = desde.height / hasta.height;
        const dx = (desde.left + desde.width / 2) - (hasta.left + hasta.width / 2);
        const dy = (desde.top + desde.height / 2) - (hasta.top + hasta.height / 2);
        lbImg.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      }
      DOM.removeClass(lb, 'is-ready');
      DOM.attr(lb, 'aria-hidden', 'true');

      window.setTimeout(() => {
        DOM.removeClass(lb, 'is-open');
        DOM.removeClass(lb, 'is-swapping');
        lbImg.style.transform = '';
        document.body.style.overflow = '';
      }, 420);

      if (lastFocused) { lastFocused.focus(); lastFocused = null; }
    };

    fotos.forEach((foto, i) => {
      DOM.on(foto.querySelector('.hl-zoom'), 'click', e => abrir(i, e.currentTarget));
    });

    DOM.on(lb, 'click', e => {
      if (e.target.closest('[data-hl-prev]')) { navegar(-1); return; }
      if (e.target.closest('[data-hl-next]')) { navegar(1); return; }
      if (e.target.closest('[data-hl-close]') || !e.target.closest('.hl-lb-figure')) cerrar();
    });

    DOM.on(document, 'keydown', e => {
      if (!DOM.hasClass(lb, 'is-open')) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') navegar(-1);
      if (e.key === 'ArrowRight') navegar(1);
    });
  },
};

App.register(QuienesSomos);
