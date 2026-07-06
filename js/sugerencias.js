'use strict';

/* ═══════════════════════════════════════
   SUGERENCIAS — Fase 4 CEEVS
   Envío directo vía Web3Forms (sin cliente de correo).
   Rate limit: máx. 3 envíos por día por navegador.

   ► CONFIGURACIÓN REQUERIDA:
     1. Ve a https://web3forms.com
     2. Ingresa: administracion.general@virginiasapp.edu.hn
     3. Confirma el correo de activación
     4. Copia el access key y reemplaza el valor de WEB3FORMS_KEY abajo
═══════════════════════════════════════ */

const Sugerencias = {
  name: 'Sugerencias',

  WEB3FORMS_KEY: '61f1a5f2-8d5e-4634-9d1e-0f1aa515f9cb',

  SUBJECT: 'OPORTUNIDAD DE MEJORA CEEVS',
  API_URL: 'https://api.web3forms.com/submit',

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
        body: JSON.stringify({
          access_key: this.WEB3FORMS_KEY,
          subject:    this.SUBJECT,
          from_name:  nombre || 'Anónimo (CEEVS)',
          message: [
            'Nombre:    ' + (nombre   || '(no indicado)'),
            'Nivel:     ' + nivel,
            'Grado:     ' + (grado    || '(no indicado)'),
            'Sección:   ' + (seccion  || '(no indicada)'),
            'Área:      ' + (area     || '(no indicada)'),
            '',
            'Mensaje:',
            mensaje,
            '',
            'Contacto:  ' + (contacto || '(no indicado)'),
          ].join('\n'),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);

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

    } catch {
      fail('No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar sugerencia'; }
    }
  },
};

App.register(Sugerencias);
