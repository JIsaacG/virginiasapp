/**
 * HUD Component — Gamification profile widget
 *
 * Encapsula toda la lógica del HUD de gamificación sin contaminar global scope.
 */

const HUDComponent = {
  name: 'HUD',
  el: null,
  state: {
    xp: 0,
    level: 1,
    badges: {},
  },

  init() {
    this.el = DOM.byId('game-hud');
    if (!this.el) return;

    this.loadState();
    this.setupEvents();
    this.render();
  },

  loadState() {
    const saved = Storage.get('gamification', {});
    this.state = Object.assign(this.state, saved);
  },

  saveState() {
    Storage.set('gamification', this.state);
  },

  setupEvents() {
    const toggle = DOM.byId('hud-toggle');
    if (toggle) DOM.on(toggle, 'click', () => this.toggleMinimize());
  },

  toggleMinimize() {
    DOM.toggleClass(this.el, 'minimized');
  },

  addXP(amount, icon, title, desc) {
    this.state.xp += amount;
    this.saveState();
    this.updateDisplay();
    this.showToast(icon, title, desc);
  },

  updateDisplay() {
    const score = DOM.byId('hud-score');
    const scoreMin = DOM.byId('hud-score-min');
    if (score) DOM.text(score, this.state.xp);
    if (scoreMin) DOM.text(scoreMin, `${this.state.xp} XP`);
  },

  unlockBadge(badgeId) {
    const badge = DOM.select(`.hud-badge[data-id="${badgeId}"]`);
    if (badge) {
      DOM.addClass(badge, 'earned');
      this.state.badges[badgeId] = true;
      this.saveState();
    }
  },

  showToast(icon, title, desc) {
    const toast = DOM.byId('toast');
    if (!toast) return;

    DOM.text(DOM.byId('toast-icon'), icon);
    DOM.text(DOM.byId('toast-title'), title);
    DOM.text(DOM.byId('toast-desc'), desc);
    DOM.addClass(toast, 'show');

    setTimeout(() => DOM.removeClass(toast, 'show'), 3500);
  },

  render() {
    this.updateDisplay();
  },
};

// Registrar en app si disponible
if (typeof App !== 'undefined') {
  App.register(HUDComponent);
}

// También exponer como global para compatibilidad (temporal)
window.HUDComponent = HUDComponent;
