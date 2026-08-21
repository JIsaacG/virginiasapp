/**
 * COMUNICADO-POPUP — Aviso emergente al entrar al sitio
 *
 * Lee la clave ceevs_comunicado (la publica el panel de administración) y, si
 * está habilitada y tiene una imagen, muestra esa imagen sobre todo el
 * contenido con desenfoque detrás y un botón de cerrar para seguir navegando.
 *
 * Estructura de la clave:
 *   { enabled: bool, image: 'url.jpg', alt: 'texto', repeat: bool }
 *
 * Por defecto se muestra una sola vez por visita (sessionStorage). Si la
 * imagen cambia, vuelve a mostrarse aunque ya se hubiera cerrado.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ceevs_comunicado';
  var SEEN_KEY = 'ceevs_comunicado_visto';
  var DEFAULT_ALT = 'Comunicado importante';

  var overlay = null;
  var lastFocus = null;

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: !!cfg.enabled,
        image: cfg.image || '',
        alt: cfg.alt || '',
        repeat: !!cfg.repeat
      }));
      return true;
    } catch (e) { return false; }
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    close();
  }

  function seen(signature) {
    try { return sessionStorage.getItem(SEEN_KEY) === signature; }
    catch (e) { return false; }
  }

  function markSeen(signature) {
    try { sessionStorage.setItem(SEEN_KEY, signature); } catch (e) {}
  }

  /* ─── Construcción del aviso ─── */

  function build() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'com-popup';
    overlay.id = 'comunicado-popup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', DEFAULT_ALT);
    overlay.hidden = true;

    var card = document.createElement('div');
    card.className = 'com-popup-card';

    var body = document.createElement('div');
    body.className = 'com-popup-body';

    var img = document.createElement('img');
    img.className = 'com-popup-img';
    img.alt = DEFAULT_ALT;

    var msg = document.createElement('p');
    msg.className = 'com-popup-msg';
    msg.id = 'comunicado-popup-msg';
    msg.hidden = true;

    var closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'com-popup-close';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '✕';

    var foot = document.createElement('div');
    foot.className = 'com-popup-foot';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'com-popup-btn';
    closeBtn.textContent = 'Cerrar y continuar';
    foot.appendChild(closeBtn);

    body.appendChild(img);
    body.appendChild(msg);
    card.appendChild(body);
    card.appendChild(closeX);
    card.appendChild(foot);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    closeX.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      // El foco no debe salir del aviso mientras está abierto
      if (e.key === 'Tab') {
        var focusables = [closeX, closeBtn];
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (focusables.indexOf(document.activeElement) === -1) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    // Si la imagen no existe (borrada del servidor), no dejamos un hueco negro
    img.addEventListener('error', function () { close(); });

    overlay.__img = img;
    overlay.__msg = msg;
    overlay.__closeBtn = closeBtn;
    return overlay;
  }

  /* ─── Abrir / cerrar ─── */

  function open(cfg, force) {
    if (!document.body) return;
    var el = build();
    var img = el.__img;
    if (img.getAttribute('src') !== cfg.image) img.setAttribute('src', cfg.image);
    var texto = (cfg.alt || '').trim();
    var msg = el.__msg;
    if (texto) {
      // El mensaje se muestra debajo de la imagen y además la describe:
      // por eso la imagen queda con alt vacío (si no, se leería dos veces).
      msg.textContent = texto;
      msg.hidden = false;
      img.alt = '';
      el.setAttribute('aria-labelledby', msg.id);
      el.removeAttribute('aria-label');
    } else {
      msg.textContent = '';
      msg.hidden = true;
      img.alt = DEFAULT_ALT;
      el.removeAttribute('aria-labelledby');
      el.setAttribute('aria-label', DEFAULT_ALT);
    }
    el.hidden = false;
    el.classList.add('open');
    document.documentElement.classList.add('com-popup-lock');
    lastFocus = document.activeElement;
    try { el.__closeBtn.focus({ preventScroll: true }); } catch (e) {}
    if (!force) markSeen(signatureOf(cfg));
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.hidden = true;
    document.documentElement.classList.remove('com-popup-lock');
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocus = null;
  }

  function signatureOf(cfg) {
    return String(cfg.image || '');
  }

  /**
   * Aplica la configuración vigente. La llama la carga de la página y también
   * image-manager.js cuando llega la configuración publicada del servidor.
   */
  function apply() {
    var cfg = getConfig();
    if (!cfg.enabled || !cfg.image) { close(); return; }
    if (overlay && overlay.classList.contains('open')) {
      // Ya está abierto: solo refrescamos la imagen si cambió
      open(cfg, true);
      markSeen(signatureOf(cfg));
      return;
    }
    if (!cfg.repeat && seen(signatureOf(cfg))) return;
    open(cfg, false);
  }

  /** Vista previa desde el panel: se muestra aunque ya se haya cerrado. */
  function preview() {
    var cfg = getConfig();
    if (!cfg.image) return false;
    open(cfg, true);
    return true;
  }

  window.ceevsComunicadoPopup = {
    apply: apply,
    preview: preview,
    close: close,
    get: getConfig,
    save: saveConfig,
    reset: reset
  };

  // En el panel de administración no se muestra solo: hay botón de vista previa.
  if (!window.CEEVS_ADMIN_PAGE) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', apply);
    } else {
      apply();
    }
  }
})();
