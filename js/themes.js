/**
 * THEMES — Sistema de paletas de color administrables
 *
 * Proporciona un sistema de temas basado en variables CSS con paletas pre-validadas.
 * La paleta global se lee desde window.CEEVS_SITE_SETTINGS y la selección local
 * temporal se guarda en localStorage (ceevs_theme).
 *
 * IIFE pattern: se ejecuta automáticamente y expone window.ceevsThemes
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'ceevs_theme';
  const STYLE_ID = 'ceevs-theme-override';

  const PALETTES = {
    clasico: {
      label: 'Clásico (Original)',
      description: 'La paleta histórica del sitio, útil como referencia y punto de retorno.',
      swatches: ['#412404', '#ab6423', '#f0b95a', '#fdf6ec'],
      forest: '#412404',
      forest2: '#5a3208',
      gold: '#ab6423',
      gold2: '#d4882e',
      gold3: '#f0b95a',
      cream: '#fdf6ec'
    },
    institucional_balanceado: {
      label: 'Institucional Balanceado',
      description: 'Negro suave para estructura, cafe para profundidad, dorado y naranja en CTA, y celeste como acento vivo.',
      swatches: ['#1E1E1E', '#6A2407', '#D7AF4A', '#F57C00', '#3BA6E0'],
      forest: '#1E1E1E',
      forest2: '#6A2407',
      gold: '#D7AF4A',
      gold2: '#F57C00',
      gold3: '#3BA6E0',
      cream: '#FFFFFF'
    },
    azul_academico: {
      label: 'Azul Academico',
      description: 'El azul institucional toma liderazgo visual; dorado y naranja sostienen jerarquia sin perder calidez.',
      swatches: ['#0B67A5', '#3BA6E0', '#D7AF4A', '#F57C00', '#FFFFFF'],
      forest: '#0B67A5',
      forest2: '#084D7B',
      gold: '#D7AF4A',
      gold2: '#3BA6E0',
      gold3: '#F57C00',
      cream: '#F7FBFF'
    },
    cafe_dorado: {
      label: 'Cafe Dorado',
      description: 'La combinacion mas institucional para comunicar legado, cercania y sobriedad cristiana.',
      swatches: ['#6A2407', '#D7AF4A', '#F57C00', '#3BA6E0', '#FFFFFF'],
      forest: '#6A2407',
      forest2: '#1E1E1E',
      gold: '#D7AF4A',
      gold2: '#F57C00',
      gold3: '#3BA6E0',
      cream: '#FFF9F2'
    },
    fuego_mision: {
      label: 'Fuego Mision',
      description: 'Naranja y cafe empujan llamados y momentos evangelisticos, con dorado para reforzar valor institucional.',
      swatches: ['#6A2407', '#F57C00', '#D7AF4A', '#1E1E1E', '#FFFFFF'],
      forest: '#6A2407',
      forest2: '#1E1E1E',
      gold: '#F57C00',
      gold2: '#D7AF4A',
      gold3: '#3BA6E0',
      cream: '#FFF7EF'
    },
    contraste_formal: {
      label: 'Contraste Formal',
      description: 'Negro y azul para una base solida; dorado y celeste iluminan botones, chips y detalles interactivos.',
      swatches: ['#1E1E1E', '#0B67A5', '#D7AF4A', '#3BA6E0', '#FFFFFF'],
      forest: '#1E1E1E',
      forest2: '#0B67A5',
      gold: '#D7AF4A',
      gold2: '#3BA6E0',
      gold3: '#F57C00',
      cream: '#F4F8FB'
    }
  };

  function getDefaultPalette() {
    const configured = window.CEEVS_SITE_SETTINGS && window.CEEVS_SITE_SETTINGS.defaultPalette;
    return PALETTES[configured] ? configured : 'institucional_balanceado';
  }

  /**
   * Aplica una paleta inyectando un <style> en <head>
   * @param {string} id - ID de la paleta (key en PALETTES)
   */
  function apply(id) {
    const palette = PALETTES[id] || PALETTES[getDefaultPalette()];
    let styleEl = document.getElementById(STYLE_ID);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `:root {
      --forest: ${palette.forest};
      --forest2: ${palette.forest2};
      --gold: ${palette.gold};
      --gold2: ${palette.gold2};
      --gold3: ${palette.gold3};
      --cream: ${palette.cream};
    }`;
  }

  /**
   * Carga el tema guardado en localStorage y lo aplica
   */
  function loadSaved() {
    let paletteId = getDefaultPalette();
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && PALETTES[savedId]) {
        paletteId = savedId;
      }
    } catch (e) {
      // localStorage no disponible o error de acceso
      console.warn('Theme loader: localStorage not available', e);
    }
    apply(paletteId);
  }

  /**
   * Guarda una paleta en localStorage y la aplica inmediatamente
   * @param {string} id - ID de la paleta
   */
  function save(id) {
    if (!PALETTES[id]) {
      console.error('Invalid theme ID:', id);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, id);
      apply(id);
      return true;
    } catch (e) {
      console.error('Theme save failed:', e);
      return false;
    }
  }

  /**
  * Resetea a la paleta por defecto.
   */
  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Theme reset failed:', e);
    }
    apply(getDefaultPalette());
  }

  /**
   * Obtiene el ID de la paleta actualmente guardada
   */
  function getCurrent() {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      return savedId && PALETTES[savedId] ? savedId : getDefaultPalette();
    } catch (e) {
      return getDefaultPalette();
    }
  }

  // Exponer API pública
  window.ceevsThemes = {
    PALETTES: PALETTES,
    apply: apply,
    loadSaved: loadSaved,
    save: save,
    reset: reset,
    getCurrent: getCurrent,
    getDefault: getDefaultPalette
  };

  // Auto-cargar tema guardado al iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSaved);
  } else {
    loadSaved();
  }
})();
