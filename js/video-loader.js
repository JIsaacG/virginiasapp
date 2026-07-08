/**
 * VIDEO-LOADER — Gestión de video en la sección hero
 *
 * Lee ceevs_video_settings de localStorage, inyecta el src en #hero-video,
 * y controla la visibilidad del video vs. el parallax background.
 *
 * IIFE pattern: se ejecuta automáticamente en index.html
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'ceevs_video_settings';
  const VIDEO_SELECTOR = '#hero-video';
  const PARALLAX_SELECTOR = '#hero-parallax';

  const HUB_KEY = 'ceevs_hub_video';
  const HUB_SELECTOR = '.hub-video-el';

  /**
   * Carga y aplica las configuraciones de video guardadas
   */
  function load() {
    try {
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

      if (!settings.url || !settings.enabled) {
        // Video no habilitado — mostrar parallax por defecto
        const video = document.querySelector(VIDEO_SELECTOR);
        if (video) video.style.display = 'none';
        return;
      }

      const video = document.querySelector(VIDEO_SELECTOR);
      const parallax = document.querySelector(PARALLAX_SELECTOR);

      if (!video) {
        console.warn('Video element not found on this page');
        return;
      }

      // Inyectar src y mostrar video
      video.src = settings.url;
      video.style.display = 'block';
      if (parallax) parallax.style.display = 'none';
    } catch (e) {
      console.error('Video loader error:', e);
    }
  }

  /**
   * Guarda la configuración de video en localStorage
   * @param {string} url - URL del video (MP4, WebM, etc.)
   * @param {boolean} enabled - Si el video debe estar activo
   */
  function save(url, enabled) {
    try {
      const settings = { url: url || '', enabled: !!enabled };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Recargar para aplicar cambios
      load();
    } catch (e) {
      console.error('Video save failed:', e);
      return false;
    }
    return true;
  }

  /**
   * Video de presentación (sección hub del index).
   * Si hay URL/poster guardados en localStorage, reemplazan al archivo local.
   */
  function loadHub() {
    try {
      const cfg = JSON.parse(localStorage.getItem(HUB_KEY)) || {};
      const video = document.querySelector(HUB_SELECTOR);
      if (!video) return;
      // El atributo src del <video> tiene prioridad sobre los <source> hijos
      if (cfg.url) video.src = cfg.url;
      if (cfg.poster) video.setAttribute('poster', cfg.poster);
      if (cfg.url) video.load();
    } catch (e) {
      console.error('Hub video load error:', e);
    }
  }

  /**
   * Guarda URL y poster del video de presentación
   */
  function saveHub(url, poster) {
    try {
      localStorage.setItem(HUB_KEY, JSON.stringify({ url: url || '', poster: poster || '' }));
      loadHub();
    } catch (e) {
      console.error('Hub video save failed:', e);
      return false;
    }
    return true;
  }

  function getHub() {
    try { return JSON.parse(localStorage.getItem(HUB_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function resetHub() {
    try { localStorage.removeItem(HUB_KEY); } catch (e) {}
  }

  /**
   * Resetea el video a valores por defecto
   */
  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const video = document.querySelector(VIDEO_SELECTOR);
      const parallax = document.querySelector(PARALLAX_SELECTOR);
      if (video) video.style.display = 'none';
      if (parallax) parallax.style.display = 'block';
    } catch (e) {
      console.error('Video reset failed:', e);
    }
  }

  // Exponer API pública (para uso en admin.js)
  window.ceevsVideoLoader = {
    save: save,
    reset: reset,
    load: load,
    saveHub: saveHub,
    getHub: getHub,
    resetHub: resetHub,
    loadHub: loadHub
  };

  // Auto-cargar al iniciar página
  function loadAll() { load(); loadHub(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }
})();
