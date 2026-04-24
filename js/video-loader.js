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
    load: load
  };

  // Auto-cargar al iniciar página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
