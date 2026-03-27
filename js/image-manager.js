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
      var key = imgs[i].getAttribute('data-img-key');

      // URL override
      if (saved[key]) {
        imgs[i].setAttribute('src', saved[key]);
      }

      // Position & fit settings
      var s = settings[key];
      if (s) {
        var posX = s.posX != null ? s.posX : 50;
        var posY = s.posY != null ? s.posY : 50;
        imgs[i].style.objectPosition = posX + '% ' + posY + '%';

        if (s.fit) imgs[i].style.objectFit = s.fit;

        var zoom = s.zoom != null ? s.zoom : 100;
        if (zoom !== 100) {
          imgs[i].style.transform = 'scale(' + (zoom / 100) + ')';
          imgs[i].style.transformOrigin = posX + '% ' + posY + '%';
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

  // API pública
  window.ceevsImageManager = {
    getSavedImages: getSavedImages,
    getSettings: getSettings,
    applyImageOverrides: applyImageOverrides,

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
