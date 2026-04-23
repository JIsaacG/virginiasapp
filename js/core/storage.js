/**
 * STORAGE — Gestión segura de localStorage
 */

const Storage = {
  prefix: 'ceevs_',

  /**
   * Guarda dato en localStorage
   */
  set(key, value) {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  /**
   * Obtiene dato de localStorage
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const value = localStorage.getItem(fullKey);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Elimina dato de localStorage
   */
  remove(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  /**
   * Limpia todos los datos con prefix
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Obtiene todas las claves
   */
  keys() {
    const keys = Object.keys(localStorage);
    return keys.filter(key => key.startsWith(this.prefix))
               .map(key => key.replace(this.prefix, ''));
  },

  /**
   * Obtiene tamaño aproximado en bytes
   */
  getSize() {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        size += key.length + (value ? value.length : 0);
      }
    });
    return size;
  },
};
