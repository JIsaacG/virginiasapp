/**
 * image-manager.js — Sistema de gestión de imágenes por URL
 * Lee overrides de localStorage y los aplica al DOM.
 * Soporta: URL, posición (object-position / background-position),
 * ajuste (object-fit) y zoom (transform scale).
 * Cargado en TODAS las páginas del sitio.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ceevs_images';
  var SETTINGS_KEY = 'ceevs_image_settings';

  function getSavedImages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function applyImageOverrides() {
    var saved = getSavedImages();
    var settings = getSettings();
    var imgs = document.querySelectorAll('[data-img-key]');

    for (var i = 0; i < imgs.length; i++) {
      var el = imgs[i];
      var key = el.getAttribute('data-img-key');
      // data-img-attr permite sobrescribir otros atributos (data-src, poster…)
      var attr = el.getAttribute('data-img-attr') || 'src';

      // URL override
      if (saved[key]) {
        el.setAttribute(attr, saved[key]);
      }

      // Position & fit settings — solo aplican a <img> reales
      if (el.tagName !== 'IMG') continue;
      var s = settings[key];
      if (s) {
        var posX = s.posX != null ? s.posX : 50;
        var posY = s.posY != null ? s.posY : 50;
        el.style.objectPosition = posX + '% ' + posY + '%';

        if (s.fit) el.style.objectFit = s.fit;

        var zoom = s.zoom != null ? s.zoom : 100;
        if (zoom !== 100) {
          el.style.transform = 'scale(' + (zoom / 100) + ')';
          el.style.transformOrigin = posX + '% ' + posY + '%';
        }
      }
    }

    // Hero parallax background (index.html)
    var heroBg = document.getElementById('hero-parallax');
    if (heroBg) {
      if (saved['hero-bg']) {
        heroBg.style.backgroundImage = "url('" + saved['hero-bg'] + "')";
      }
      var hs = settings['hero-bg'];
      if (hs) {
        var hx = hs.posX != null ? hs.posX : 50;
        var hy = hs.posY != null ? hs.posY : 50;
        heroBg.style.backgroundPosition = hx + '% ' + hy + '%';
        if (hs.fit === 'contain') heroBg.style.backgroundSize = 'contain';
        else if (hs.fit === 'fill') heroBg.style.backgroundSize = '100% 100%';
        else heroBg.style.backgroundSize = 'cover';
        if (hs.zoom && hs.zoom !== 100) {
          heroBg.style.backgroundSize = hs.zoom + '%';
        }
      }
    }

    // Page-hero background (internal pages)
    var css = '';
    if (saved['page-hero-bg']) {
      css += "background-image: url('" + saved['page-hero-bg'] + "') !important; ";
    }
    var ps = settings['page-hero-bg'];
    if (ps) {
      var px = ps.posX != null ? ps.posX : 50;
      var py = ps.posY != null ? ps.posY : 50;
      css += 'background-position: ' + px + '% ' + py + '% !important; ';
      if (ps.zoom && ps.zoom !== 100) {
        css += 'background-size: ' + ps.zoom + '% !important; ';
      }
    }
    if (css) {
      var style = document.getElementById('ceevs-bg-override');
      if (!style) {
        style = document.createElement('style');
        style.id = 'ceevs-bg-override';
        document.head.appendChild(style);
      }
      style.textContent = '.page-hero::before { ' + css + '}';
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyImageOverrides);
  } else {
    applyImageOverrides();
  }

  /* ─── Configuración remota (api/config.php) ───
     Con el sitio publicado en un hosting con PHP, la configuración del panel
     vive en el servidor y es la misma para todos los visitantes. localStorage
     pasa a ser una copia local que se refresca en cada visita. Sin PHP
     (uso local o hosting estático), todo sigue funcionando como antes. */

  var REMOTE_CONFIG_KEYS = [
    'ceevs_images', 'ceevs_image_settings', 'ceevs_gallery',
    'ceevs_video_settings', 'ceevs_hub_video', 'ceevs_theme', 'ceevs_inventory'
  ];

  /** Re-aplica toda la configuración visible en la página actual. */
  function reapplyAll() {
    applyImageOverrides();
    try { if (window.ceevsThemes) window.ceevsThemes.loadSaved(); } catch (e) {}
    try {
      if (window.ceevsVideoLoader) {
        window.ceevsVideoLoader.load();
        window.ceevsVideoLoader.loadHub();
      }
    } catch (e) {}
    try { if (window.ceevsGalleryExtra) window.ceevsGalleryExtra.apply(); } catch (e) {}
    try {
      // El catálogo público de inventario se re-renderiza pulsando el filtro activo
      var invBtn = document.querySelector('.inv-filter-btn.active');
      if (invBtn && document.getElementById('inv-grid')) invBtn.click();
    } catch (e) {}
  }

  /** Vuelca la configuración del servidor en localStorage. Devuelve true si algo cambió. */
  function applyRemoteData(data) {
    var changed = false;
    window.__ceevsApplyingRemote = true;
    for (var j = 0; j < REMOTE_CONFIG_KEYS.length; j++) {
      var key = REMOTE_CONFIG_KEYS[j];
      var value = data ? data[key] : undefined;
      try {
        if (typeof value === 'string') {
          if (localStorage.getItem(key) !== value) {
            localStorage.setItem(key, value);
            changed = true;
          }
        } else if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          changed = true;
        }
      } catch (e) {}
    }
    window.__ceevsApplyingRemote = false;
    return changed;
  }

  function syncFromServer() {
    // En admin.html la sincronización la dirige admin-sync.js (decide si baja o publica).
    if (window.CEEVS_ADMIN_PAGE) return;
    if (typeof fetch !== 'function' || location.protocol === 'file:') return;
    fetch('api/config.php', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok || (r.headers.get('content-type') || '').indexOf('json') === -1) return null;
        return r.json();
      })
      .then(function (cfg) {
        if (!cfg || cfg.app !== 'ceevs-admin' || typeof cfg.data !== 'object' || cfg.data === null) return;
        // Sin configuración publicada todavía: no tocar lo guardado localmente.
        if (!cfg.updatedAt) return;
        var changed = applyRemoteData(cfg.data);
        if (changed) reapplyAll();
        document.dispatchEvent(new CustomEvent('ceevs:remote-config', { detail: { changed: changed } }));
      })
      .catch(function () { /* sin PHP: el sitio sigue con localStorage */ });
  }

  syncFromServer();

  // API pública
  window.ceevsImageManager = {
    getSavedImages: getSavedImages,
    getSettings: getSettings,
    applyImageOverrides: applyImageOverrides,
    applyRemoteData: applyRemoteData,
    reapplyAll: reapplyAll,

    saveImage: function (key, url) {
      var saved = getSavedImages();
      if (url && url.trim()) saved[key] = url.trim();
      else delete saved[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },

    saveSetting: function (key, settingObj) {
      var all = getSettings();
      all[key] = settingObj;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
    },

    resetImage: function (key) {
      var saved = getSavedImages();
      delete saved[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      var all = getSettings();
      delete all[key];
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
    },

    resetAll: function () {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    }
  };
})();
