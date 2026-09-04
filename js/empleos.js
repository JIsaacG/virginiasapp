'use strict';

/* ═══════════════════════════════════════
   EMPLEOS — "Forma parte de nuestro equipo" (Contáctenos)
   El correo con el CV adjunto lo manda api/empleos.php desde la cuenta
   institucional del sitio. Antes era un enlace mailto que dependía de que la
   persona tuviera un cliente de correo configurado y adjuntara el archivo a
   mano; ahora el formulario sube el PDF y lo envía por SMTP.

   Este freno (3 al día) es solo comodidad para el usuario; el que de verdad
   protege es el del servidor, que no depende del localStorage del navegador.
═══════════════════════════════════════ */

const Empleos = {
  name: 'Empleos',

  API_URL: 'api/empleos.php',
  MAX_CV_BYTES: 5 * 1024 * 1024,

  DAILY_LIMIT: 3,
  RATE_KEY: 'ceevs_em_rate',

  init() {
    const form = document.getElementById('empleos-form');
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
    const btn = document.querySelector('.empleos-submit');
    if (!btn) return;
    if (this._isRateLimited()) {
      btn.disabled = true;
      btn.textContent = 'Límite diario alcanzado (3/3)';
    }
  },

  /* ── Submit ── */
  async _handleSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('empleos-error');
    const btn = document.querySelector('.empleos-submit');
    const val = id => (document.getElementById(id)?.value || '').trim();

    const fail = (msg, focusId) => {
      if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
      if (focusId) document.getElementById(focusId)?.focus();
    };

    if (errorEl) errorEl.hidden = true;

    if (this._isRateLimited()) {
      fail('Has alcanzado el límite de 3 aplicaciones por día. Vuelve mañana.');
      return;
    }

    const nombre = val('em-nombre');
    const correo = val('em-correo');
    const puesto = val('em-puesto');
    const cvInput = document.getElementById('em-cv');
    const cv = cvInput?.files?.[0] || null;

    if (!nombre) { fail('Por favor escribe tu nombre completo.', 'em-nombre'); return; }
    if (!correo) { fail('Por favor escribe un correo electrónico válido.', 'em-correo'); return; }
    if (!puesto) { fail('Por favor indica el puesto de tu interés.', 'em-puesto'); return; }
    if (!cv) { fail('Por favor adjunta tu hoja de vida en PDF.', 'em-cv'); return; }
    if (cv.type !== 'application/pdf') { fail('La hoja de vida debe estar en formato PDF.', 'em-cv'); return; }
    if (cv.size > this.MAX_CV_BYTES) { fail('El archivo debe pesar menos de 5 MB.', 'em-cv'); return; }

    const telefono = val('em-telefono');
    const nivelArea = val('em-nivel-area');
    const mensaje = val('em-mensaje');

    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    try {
      const body = new FormData();
      body.append('nombre', nombre);
      body.append('correo', correo);
      body.append('telefono', telefono);
      body.append('puesto', puesto);
      body.append('nivel_area', nivelArea);
      body.append('mensaje', mensaje);
      body.append('sitio_web', val('em-sitio-web'));
      body.append('cv', cv, cv.name);

      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok !== true) {
        const err = new Error(json.error || `HTTP ${res.status}`);
        err.delServidor = typeof json.error === 'string' && json.error !== '';
        throw err;
      }

      this._recordSubmission();
      document.getElementById('empleos-form')?.reset();
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar aplicación'; }

      const remaining = this._remaining();
      const toastEl = document.getElementById('toast');
      const iconEl = document.getElementById('toast-icon');
      const titleEl = document.getElementById('toast-title');
      const descEl = document.getElementById('toast-desc');
      if (toastEl) {
        if (iconEl) iconEl.textContent = '✉️';
        if (titleEl) titleEl.textContent = '¡Aplicación enviada!';
        if (descEl) descEl.textContent = remaining > 0
          ? `Puedes enviar ${remaining} más hoy.`
          : 'Has usado tus 3 envíos de hoy.';
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 4500);
      }

      this._updateRateUI();

    } catch (err) {
      fail(err?.delServidor ? err.message : 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar aplicación'; }
    }
  },
};

App.register(Empleos);
