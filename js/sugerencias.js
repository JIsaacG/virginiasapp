'use strict';

/* ═══════════════════════════════════════
   SUGERENCIAS — Fase 4 CEEVS
   El formulario abre el cliente de correo (mailto).
   No simula envíos ni guarda datos: SDD-F4-FEEDBACK-001.
═══════════════════════════════════════ */

const Sugerencias = {
  name: 'Sugerencias',

  // PENDING_DECISION_SUGGESTIONS_EMAIL — confirmar correo oficial (data/redirects.json)
  EMAIL: 'administracion.general@virginiasapp.edu.hn',
  SUBJECT: 'OPORTUNIDAD DE MEJORA CEEVS',

  init() {
    const form = document.getElementById('sugerencias-form');
    if (!form) return;
    form.addEventListener('submit', e => this._handleSubmit(e));
  },

  _handleSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('sg-error');
    const val = id => (document.getElementById(id)?.value || '').trim();

    const nombre = val('sg-nombre');
    const nivel = val('sg-nivel');
    const seccion = val('sg-seccion');
    const grado = val('sg-grado');
    const area = val('sg-area');
    const mensaje = val('sg-mensaje');
    const contacto = val('sg-contacto');

    const fail = (msg, focusId) => {
      if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
      document.getElementById(focusId)?.focus();
    };

    // Nivel es obligatorio (SDD-PEND-007 / requerimiento §21.1)
    if (!nivel) {
      fail('Por favor indica en qué nivel está inscrito tu hijo/a.', 'sg-nivel');
      return;
    }
    if (!mensaje) {
      fail('Por favor escribe tu sugerencia en el campo "Mensaje".', 'sg-mensaje');
      return;
    }
    if (errorEl) errorEl.hidden = true;

    const body = [
      this.SUBJECT,
      '',
      'Nombre: ' + (nombre || '(no indicado)'),
      'Nivel: ' + nivel,
      'Sección: ' + (seccion || '(no indicada)'),
      'Grado: ' + (grado || '(no indicado)'),
      'Área: ' + (area || '(no indicada)'),
      '',
      'Mensaje:',
      mensaje,
      '',
      '¿Cómo contactarme?: ' + (contacto || '(no indicado)'),
    ].join('\n');

    const mailto = 'mailto:' + this.EMAIL +
      '?subject=' + encodeURIComponent(this.SUBJECT) +
      '&body=' + encodeURIComponent(body);

    window.location.href = mailto;
  },
};

App.register(Sugerencias);
