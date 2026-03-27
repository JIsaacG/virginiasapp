/**
 * image-manager.js — Sistema de gestión de imágenes por URL
 * Lee overrides de localStorage y los aplica al DOM.
 * Cargado en TODAS las páginas del sitio.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ceevs_images';

  /** Devuelve el objeto completo de imágenes guardadas */
  function getSavedImages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  /** Aplica overrides a todas las imágenes con data-img-key */
  function applyImageOverrides() {
    var saved = getSavedImages();
    var imgs = document.querySelectorAll('[data-img-key]');

    for (var i = 0; i < imgs.length; i++) {
      var key = imgs[i].getAttribute('data-img-key');
      if (saved[key]) {
        imgs[i].setAttribute('src', saved[key]);
      }
    }

    // Override del fondo parallax del hero (index.html)
    var heroBg = document.getElementById('hero-parallax');
    if (heroBg && saved['hero-bg']) {
      heroBg.style.backgroundImage = "url('" + saved['hero-bg'] + "')";
    }

    // Override del fondo de page-hero (páginas internas)
    if (saved['page-hero-bg']) {
      var style = document.getElementById('ceevs-bg-override');
      if (!style) {
        style = document.createElement('style');
        style.id = 'ceevs-bg-override';
        document.head.appendChild(style);
      }
      style.textContent = ".page-hero::before { background-image: url('" + saved['page-hero-bg'] + "') !important; }";
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyImageOverrides);
  } else {
    applyImageOverrides();
  }

  // Exponer para uso externo (admin panel)
  window.ceevsImageManager = {
    getSavedImages: getSavedImages,
    applyImageOverrides: applyImageOverrides,
    saveImage: function (key, url) {
      var saved = getSavedImages();
      if (url && url.trim()) {
        saved[key] = url.trim();
      } else {
        delete saved[key];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
    resetImage: function (key) {
      var saved = getSavedImages();
      delete saved[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    },
    resetAll: function () {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
})();
