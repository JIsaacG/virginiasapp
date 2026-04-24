/**
 * THEMES — Sistema de paletas de color administrables
 *
 * Proporciona un sistema de temas basado en variables CSS con 5 paletas pre-validadas.
 * Los temas se guardan en localStorage (ceevs_theme) y se aplican automáticamente al cargar.
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
      forest: '#412404',
      forest2: '#5a3208',
      gold: '#ab6423',
      gold2: '#d4882e',
      gold3: '#f0b95a',
      cream: '#fdf6ec'
    },
    azul_marino: {
      label: 'Marino Institucional',
      forest: '#0c2340',
      forest2: '#1a3a5c',
      gold: '#2b6cb0',
      gold2: '#3182ce',
      gold3: '#63b3ed',
      cream: '#ebf4ff'
    },
    verde_fe: {
      label: 'Verde Fe',
      forest: '#1a3a2a',
      forest2: '#2d5a3d',
      gold: '#2f855a',
      gold2: '#38a169',
      gold3: '#68d391',
      cream: '#f0fff4'
    },
    purpura_real: {
      label: 'Púrpura Real',
      forest: '#2d1a4e',
      forest2: '#44287a',
      gold: '#6b46c1',
      gold2: '#805ad5',
      gold3: '#b794f4',
      cream: '#faf5ff'
    },
    terracota: {
      label: 'Terracota Cálido',
      forest: '#3d1c0d',
      forest2: '#5c2d18',
      gold: '#c05621',
      gold2: '#dd6b20',
      gold3: '#f6ad55',
      cream: '#fffaf0'
    }
  };

  /**
   * Aplica una paleta inyectando un <style> en <head>
   * @param {string} id - ID de la paleta (key en PALETTES)
   */
  function apply(id) {
    const palette = PALETTES[id] || PALETTES.clasico;
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
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId && PALETTES[savedId]) {
        apply(savedId);
      }
    } catch (e) {
      // localStorage no disponible o error de acceso
      console.warn('Theme loader: localStorage not available', e);
    }
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
   * Resetea a la paleta por defecto (clasico)
   */
  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      const styleEl = document.getElementById(STYLE_ID);
      if (styleEl) styleEl.remove();
    } catch (e) {
      console.error('Theme reset failed:', e);
    }
  }

  /**
   * Obtiene el ID de la paleta actualmente guardada
   */
  function getCurrent() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'clasico';
    } catch (e) {
      return 'clasico';
    }
  }

  // Exponer API pública
  window.ceevsThemes = {
    PALETTES: PALETTES,
    apply: apply,
    loadSaved: loadSaved,
    save: save,
    reset: reset,
    getCurrent: getCurrent
  };

  // Auto-cargar tema guardado al iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSaved);
  } else {
    loadSaved();
  }
})();
