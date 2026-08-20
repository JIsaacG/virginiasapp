'use strict';

const MisionEvangelistica = {
  name: 'MisionEvangelistica',

  /* El correo lo manda api/contacto.php desde la cuenta institucional. Antes
     salía por Web3Forms, con la clave del servicio escrita aquí mismo y por
     tanto legible por cualquiera que abriera este archivo. */
  API_URL: 'api/contacto.php',

  DAILY_LIMIT: 2,
  RATE_KEY: 'ceevs_mission_newsletter_rate',

  init() {
    const form = document.getElementById('mission-newsletter-form');
    if (!form) return;
    form.addEventListener('submit', event => this._handleSubmit(event));
    this._updateRateUI();
  },

  _getRateData() {
    try {
      return JSON.parse(localStorage.getItem(this.RATE_KEY) || 'null') || { date: '', count: 0 };
    } catch {
      return { date: '', count: 0 };
    }
  },

  _isRateLimited() {
    const rateData = this._getRateData();
    return rateData.date === new Date().toDateString() && rateData.count >= this.DAILY_LIMIT;
  },

  _remaining() {
    const rateData = this._getRateData();
    if (rateData.date !== new Date().toDateString()) return this.DAILY_LIMIT;
    return Math.max(0, this.DAILY_LIMIT - rateData.count);
  },

  _recordSubmission() {
    const today = new Date().toDateString();
    const rateData = this._getRateData();
    const count = rateData.date === today ? rateData.count + 1 : 1;
    try {
      localStorage.setItem(this.RATE_KEY, JSON.stringify({ date: today, count }));
    } catch {}
  },

  _updateRateUI() {
    const button = document.querySelector('#mission-newsletter-form .btn-cta-main');
    if (!button) return;
    if (this._isRateLimited()) {
      button.disabled = true;
      button.textContent = 'Límite diario alcanzado (2/2)';
      return;
    }
    button.disabled = false;
    button.textContent = 'Quiero recibir updates';
  },

  async _handleSubmit(event) {
    event.preventDefault();

    const errorEl = document.getElementById('mn-error');
    const form = document.getElementById('mission-newsletter-form');
    const button = form?.querySelector('.btn-cta-main');
    const value = id => (document.getElementById(id)?.value || '').trim();

    const fail = (message, focusId) => {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
      if (focusId) document.getElementById(focusId)?.focus();
    };

    if (errorEl) errorEl.hidden = true;

    if (this._isRateLimited()) {
      fail('Has alcanzado el límite de 2 registros por día. Vuelve mañana.');
      return;
    }

    const nombre = value('mn-nombre');
    const correo = value('mn-correo');
    const perfil = value('mn-perfil');

    if (!correo) {
      fail('Por favor escribe un correo electrónico válido.', 'mn-correo');
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Registrando…';
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        // El texto del correo lo arma el servidor: así el formato no depende de
        // lo que mande el navegador, que es manipulable.
        body: JSON.stringify({
          tipo: 'suscripcion',
          nombre,
          correo,
          perfil,
          sitio_web: value('mn-sitio-web'),
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok !== true) {
        // Cuando el servidor explica el motivo (cupo agotado, correo inválido…),
        // se le enseña a la persona en vez de culpar a su conexión.
        const err = new Error(json.error || `HTTP ${response.status}`);
        err.delServidor = typeof json.error === 'string' && json.error !== '';
        throw err;
      }

      this._recordSubmission();
      form?.reset();

      const toastEl = document.getElementById('toast');
      const iconEl = document.getElementById('toast-icon');
      const titleEl = document.getElementById('toast-title');
      const descEl = document.getElementById('toast-desc');
      const remaining = this._remaining();

      if (toastEl) {
        if (iconEl) iconEl.textContent = '📬';
        if (titleEl) titleEl.textContent = '¡Registro recibido!';
        if (descEl) {
          descEl.textContent = remaining > 0
            ? `Puedes registrar ${remaining} suscripción más hoy.`
            : 'Has usado tus 2 registros de hoy.';
        }
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 4500);
      }

      this._updateRateUI();
    } catch (err) {
      fail(err?.delServidor ? err.message : 'No se pudo registrar la suscripción. Revisa tu conexión e intenta de nuevo.');
      this._updateRateUI();
    }
  },
};

App.register(MisionEvangelistica);