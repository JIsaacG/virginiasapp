/**
 * ACSI-FAB — Sello flotante de la acreditación
 *
 * Coloca una placa con el logotipo de ACSI justo encima del botón de
 * WhatsApp (#wa-fab), flotando sobre toda la página. Al pulsarla se
 * despliega un cuadro con la información de la acreditación y un enlace
 * a la sección completa de "Quiénes somos".
 *
 * Se construye desde JavaScript —igual que js/comunicado-popup.js— para
 * no repetir el mismo bloque de HTML en las ocho páginas públicas. El
 * traductor (js/i18n.js) observa el DOM, así que el texto insertado aquí
 * también se traduce al cambiar a inglés.
 *
 * Estilos: css/3-layout/acsi-fab.css
 */

const AcsiFab = {
  name: 'AcsiFab',

  LOGO: 'assets/acsi-badge.png',
  ALT: 'Logotipo de Association of Christian Schools International (ACSI)',

  TEXTO: 'Acreditada por Association of Christian Schools International (ACSI), ' +
    'nuestra institución reafirma su compromiso con una educación cristiana de ' +
    'excelencia, basada en estándares internacionales de calidad académica, ' +
    'formación espiritual y mejora continua.',

  PILARES: [
    'Educación cristiana de excelencia',
    'Estándares internacionales',
    'Formación espiritual',
    'Mejora continua',
  ],

  fab: null,
  panel: null,
  card: null,
  closeBtn: null,
  lastFocus: null,

  init() {
    if (!document.body) return;
    // Solo acompaña al botón de WhatsApp: si la página no lo tiene, no aparece
    if (!DOM.byId('wa-fab')) return;
    if (DOM.byId('acsi-fab')) return;

    this.buildFab();
    this.buildPanel();
  },

  /* ─── La placa flotante ─── */

  buildFab() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'acsi-fab';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'acsi-panel');
    btn.setAttribute('aria-label', 'Acreditación ACSI: ver información');

    const img = document.createElement('img');
    img.src = this.LOGO;
    img.alt = '';
    img.width = 420;
    img.height = 145;
    img.decoding = 'async';
    btn.appendChild(img);

    const tip = document.createElement('span');
    tip.className = 'acsi-fab-tip';
    tip.textContent = 'Acreditación ACSI';
    btn.appendChild(tip);

    // Si el logotipo no está en el servidor, la placa no deja un hueco vacío
    DOM.on(img, 'error', () => btn.remove());
    DOM.on(btn, 'click', () => this.toggle());

    document.body.appendChild(btn);
    this.fab = btn;
  },

  /* ─── El cuadro de información ─── */

  buildPanel() {
    const panel = document.createElement('div');
    panel.className = 'acsi-panel';
    panel.id = 'acsi-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'acsi-panel-title');

    const veil = document.createElement('div');
    veil.className = 'acsi-panel-veil';
    panel.appendChild(veil);

    const card = document.createElement('div');
    card.className = 'acsi-panel-card';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'acsi-panel-close';
    close.setAttribute('aria-label', 'Cerrar');
    close.textContent = '✕';
    card.appendChild(close);

    const logo = document.createElement('img');
    logo.className = 'acsi-panel-logo';
    logo.src = this.LOGO;
    logo.alt = this.ALT;
    logo.width = 420;
    logo.height = 145;
    logo.decoding = 'async';
    card.appendChild(logo);

    const kicker = document.createElement('span');
    kicker.className = 'acsi-panel-kicker';
    kicker.textContent = 'Credibilidad institucional';
    card.appendChild(kicker);

    const title = document.createElement('h2');
    title.id = 'acsi-panel-title';
    title.textContent = 'Acreditación ACSI';
    card.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'acsi-panel-sub';
    sub.textContent = 'Association of Christian Schools International';
    card.appendChild(sub);

    const text = document.createElement('p');
    text.className = 'acsi-panel-text';
    text.textContent = this.TEXTO;
    card.appendChild(text);

    const list = document.createElement('ul');
    list.className = 'acsi-panel-list';
    this.PILARES.forEach((pilar) => {
      const li = document.createElement('li');
      li.textContent = pilar;
      list.appendChild(li);
    });
    card.appendChild(list);

    // En "Quiénes somos" la sección ya está en la página: se salta a ella
    const link = document.createElement('a');
    link.className = 'acsi-panel-link';
    link.href = document.getElementById('acsi') ? '#acsi' : 'quienes-somos.html#acsi';
    // La flecha va aparte: así el texto traducible queda en un nodo limpio
    link.appendChild(document.createTextNode('Conoce más sobre nuestra acreditación'));
    const flecha = document.createElement('span');
    flecha.setAttribute('aria-hidden', 'true');
    flecha.textContent = '→';
    link.appendChild(flecha);
    card.appendChild(link);

    panel.appendChild(card);
    document.body.appendChild(panel);

    DOM.on(close, 'click', () => this.close());
    DOM.on(veil, 'click', () => this.close());
    DOM.on(link, 'click', () => this.close());
    DOM.on(document, 'keydown', (e) => this.onKeydown(e));

    this.panel = panel;
    this.card = card;
    this.closeBtn = close;
  },

  /* ─── Abrir / cerrar ─── */

  isOpen() {
    return !!this.panel && this.panel.classList.contains('open');
  },

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  },

  open() {
    if (!this.panel || this.isOpen()) return;
    this.lastFocus = document.activeElement;
    DOM.addClass(this.panel, 'open');
    document.documentElement.classList.add('acsi-panel-lock');
    if (this.fab) this.fab.setAttribute('aria-expanded', 'true');
    try { this.closeBtn.focus({ preventScroll: true }); } catch (e) {}
  },

  close() {
    if (!this.panel || !this.isOpen()) return;
    DOM.removeClass(this.panel, 'open');
    document.documentElement.classList.remove('acsi-panel-lock');
    if (this.fab) this.fab.setAttribute('aria-expanded', 'false');
    const volver = this.lastFocus;
    this.lastFocus = null;
    try { (volver || this.fab).focus({ preventScroll: true }); } catch (e) {}
  },

  // Escape cierra; Tab no debe salirse del cuadro mientras está abierto
  onKeydown(e) {
    if (!this.isOpen()) return;
    if (e.key === 'Escape') { this.close(); return; }
    if (e.key !== 'Tab') return;

    const focusables = Array.prototype.slice.call(
      this.card.querySelectorAll('button, a[href]')
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (focusables.indexOf(document.activeElement) === -1) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },
};

// Registro en el sistema de módulos
if (typeof App !== 'undefined' && App.register) {
  App.register(AcsiFab);
}

window.AcsiFab = AcsiFab;
