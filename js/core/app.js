/**
 * APP — Inicializador central de la aplicación
 *
 * Gestiona la inicialización de todos los módulos y componentes.
 * Evita conflictos globales usando namespace de módulos.
 */

const App = {
  name: 'CEEVS Web',
  version: '2.0.0',
  modules: [],
  isInitialized: false,

  /**
   * Registra un módulo en la aplicación
   */
  register(module) {
    if (module && module.name && module.init) {
      this.modules.push(module);
    }
  },

  /**
   * Inicializa todos los módulos registrados
   */
  init() {
    if (this.isInitialized) return;

    console.log(`🚀 Inicializando ${this.name} v${this.version}`);

    // Esperar DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._initModules());
    } else {
      this._initModules();
    }

    this.isInitialized = true;
  },

  /**
   * Inicializa todos los módulos en orden
   */
  _initModules() {
    for (const module of this.modules) {
      try {
        module.init();
        console.log(`✓ ${module.name} inicializado`);
      } catch (error) {
        console.error(`✗ Error inicializando ${module.name}:`, error);
      }
    }
  },

  /**
   * Desregistra un módulo
   */
  unregister(moduleName) {
    this.modules = this.modules.filter(m => m.name !== moduleName);
  },

  /**
   * Obtiene un módulo por nombre
   */
  getModule(moduleName) {
    return this.modules.find(m => m.name === moduleName);
  },
};

// Auto-inicializar cuando el documento esté listo
if (document.readyState !== 'loading') {
  App.init();
}
