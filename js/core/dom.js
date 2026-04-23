/**
 * DOM — Utilidades de manipulación del DOM
 */

const DOM = {
  /**
   * Selecciona un elemento
   */
  select(selector) {
    return document.querySelector(selector);
  },

  /**
   * Selecciona múltiples elementos
   */
  selectAll(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Obtiene elemento por ID
   */
  byId(id) {
    return document.getElementById(id);
  },

  /**
   * Agrega clase a elemento
   */
  addClass(el, className) {
    if (el) el.classList.add(className);
  },

  /**
   * Remueve clase de elemento
   */
  removeClass(el, className) {
    if (el) el.classList.remove(className);
  },

  /**
   * Alterna clase
   */
  toggleClass(el, className) {
    if (el) el.classList.toggle(className);
  },

  /**
   * Verifica si elemento tiene clase
   */
  hasClass(el, className) {
    return el ? el.classList.contains(className) : false;
  },

  /**
   * Establece atributo
   */
  attr(el, attr, value) {
    if (el) el.setAttribute(attr, value);
  },

  /**
   * Obtiene atributo
   */
  getAttr(el, attr) {
    return el ? el.getAttribute(attr) : null;
  },

  /**
   * Establece contenido HTML
   */
  html(el, html) {
    if (el) el.innerHTML = html;
  },

  /**
   * Obtiene contenido HTML
   */
  getHtml(el) {
    return el ? el.innerHTML : '';
  },

  /**
   * Establece contenido texto
   */
  text(el, text) {
    if (el) el.textContent = text;
  },

  /**
   * Obtiene contenido texto
   */
  getText(el) {
    return el ? el.textContent : '';
  },

  /**
   * Agrega evento
   */
  on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  },

  /**
   * Remueve evento
   */
  off(el, event, handler) {
    if (el) el.removeEventListener(event, handler);
  },

  /**
   * Delega eventos
   */
  delegate(parent, selector, event, handler) {
    if (!parent) return;
    parent.addEventListener(event, (e) => {
      if (e.target.matches(selector)) handler(e);
    });
  },

  /**
   * Oculta elemento
   */
  hide(el) {
    if (el) el.style.display = 'none';
  },

  /**
   * Muestra elemento
   */
  show(el, display = 'block') {
    if (el) el.style.display = display;
  },

  /**
   * Alterna visibilidad
   */
  toggle(el) {
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  /**
   * Obtiene computed style
   */
  getStyle(el, prop) {
    return el ? window.getComputedStyle(el).getPropertyValue(prop) : null;
  },

  /**
   * Establece múltiples estilos
   */
  setStyles(el, styles) {
    if (!el) return;
    for (const [prop, value] of Object.entries(styles)) {
      el.style[prop] = value;
    }
  },

  /**
   * Obtiene posición y tamaño
   */
  getRect(el) {
    return el ? el.getBoundingClientRect() : null;
  },

  /**
   * Verifica si elemento está en viewport
   */
  isInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Simula click en elemento
   */
  click(el) {
    if (el) el.click();
  },

  /**
   * Enfoca elemento
   */
  focus(el) {
    if (el) el.focus();
  },

  /**
   * Desenfoca elemento
   */
  blur(el) {
    if (el) el.blur();
  },
};
