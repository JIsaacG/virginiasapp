'use strict';

/* ═══════════════════════════════════════
   SUGERENCIAS — Fase 4 CEEVS
   El correo lo manda api/contacto.php desde la cuenta institucional del sitio.
   Antes salía por Web3Forms, un servicio externo cuya clave viajaba en este
   mismo archivo: cualquiera podía leerla y escribirle al buzón del colegio.

   Este freno (3 al día) es solo comodidad para el usuario; el que de verdad
   protege es el del servidor, que no depende del localStorage del navegador.
═══════════════════════════════════════ */

const Sugerencias = {
  name: 'Sugerencias',

  API_URL: 'api/contacto.php',

  // Rate limit: máx. 3 envíos al día por navegador (localStorage)
  DAILY_LIMIT: 3,
  RATE_KEY: 'ceevs_sg_rate',

  init() {
    const form = document.getElementById('sugerencias-form');
    if (!form) return;
    form.addEventListener('submit', e => this._handleSubmit(e));
    this._updateRateUI();
  },

  /* ── Rate limiting ── */
  _getRateData() {
    try {
      return JSON.parse(localStorage.getItem(this.RATE_KEY) || 'null') || { date: '', count: 0 };
    } catch { return { date: '', count: 0 }; }
  },

  _isRateLimited() {
    const d = this._getRateData();
    return d.date === new Date().toDateString() && d.count >= this.DAILY_LIMIT;
  },

  _remaining() {
    const d = this._getRateData();
    if (d.date !== new Date().toDateString()) return this.DAILY_LIMIT;
    return Math.max(0, this.DAILY_LIMIT - d.count);
  },

  _recordSubmission() {
    const today = new Date().toDateString();
    const d = this._getRateData();
    const count = d.date === today ? d.count + 1 : 1;
    try { localStorage.setItem(this.RATE_KEY, JSON.stringify({ date: today, count })); } catch {}
  },

  _updateRateUI() {
    const btn = document.querySelector('.sg-submit');
    if (!btn) return;
    if (this._isRateLimited()) {
      btn.disabled = true;
      btn.textContent = 'Límite diario alcanzado (3/3)';
    }
  },

  /* ── Submit ── */
  async _handleSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('sg-error');
    const btn = document.querySelector('.sg-submit');
    const val = id => (document.getElementById(id)?.value || '').trim();

    const fail = (msg, focusId) => {
      if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
      if (focusId) document.getElementById(focusId)?.focus();
    };

    if (errorEl) errorEl.hidden = true;

    if (this._isRateLimited()) {
      fail('Has alcanzado el límite de 3 sugerencias por día. Vuelve mañana.');
      return;
    }

    const nivel   = val('sg-nivel');
    const mensaje = val('sg-mensaje');
    if (!nivel)   { fail('Por favor indica en qué nivel está inscrito su hijo/a.', 'sg-nivel');  return; }
    if (!mensaje) { fail('Por favor escribe tu sugerencia en el campo Mensaje.', 'sg-mensaje'); return; }

    const nombre   = val('sg-nombre');
    const grado    = val('sg-grado');
    const seccion  = val('sg-seccion');
    const area     = val('sg-area');
    const contacto = val('sg-contacto');

    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        // El texto del correo lo arma el servidor: así el formato no depende de
        // lo que mande el navegador, que es manipulable.
        body: JSON.stringify({
          tipo: 'sugerencia',
          nombre,
          nivel,
          grado,
          seccion,
          area,
          mensaje,
          contacto,
          sitio_web: val('sg-sitio-web'),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok !== true) {
        // Cuando el servidor explica el motivo (cupo agotado, dato inválido…),
        // se le enseña a la persona: vale más que "revisa tu conexión" cuando la
        // conexión no tiene nada que ver.
        const err = new Error(json.error || `HTTP ${res.status}`);
        err.delServidor = typeof json.error === 'string' && json.error !== '';
        throw err;
      }

      this._recordSubmission();
      document.getElementById('sugerencias-form')?.reset();

      // Toast de confirmación
      const remaining = this._remaining();
      const toastEl   = document.getElementById('toast');
      const iconEl    = document.getElementById('toast-icon');
      const titleEl   = document.getElementById('toast-title');
      const descEl    = document.getElementById('toast-desc');
      if (toastEl) {
        if (iconEl)  iconEl.textContent  = '✉️';
        if (titleEl) titleEl.textContent = '¡Sugerencia enviada!';
        if (descEl)  descEl.textContent  = remaining > 0
          ? `Puedes enviar ${remaining} más hoy.`
          : 'Has usado tus 3 envíos de hoy.';
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 4500);
      }

      this._updateRateUI();

    } catch (err) {
      fail(err?.delServidor ? err.message : 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar sugerencia'; }
    }
  },
};

App.register(Sugerencias);
