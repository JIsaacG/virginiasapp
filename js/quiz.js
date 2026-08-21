'use strict';

/* ═══════════════════════════════════════
   QUIZ DE ADMISIÓN — Fase 2 CEEVS
   Auto-avance sin botón "Continuar" (SDD-F2-ADM-004)
   Resultado con CTAs concretos (SDD-F2-ADM-005)
═══════════════════════════════════════ */

const Quiz = {
  name: 'Quiz',
  answers: {},
  currentStep: 1,
  totalSteps: 4,
  transitioning: false,

  // Fuente de verdad de redirecciones (espejo de data/redirects.json)
  REDIRECTS: {
    // La solicitud de admisión se hace en el formulario propio del sitio,
    // no en EDUBOX (EDUBOX queda solo para la matrícula/plataforma).
    preinscripcion: 'preinscripcion.html',
    edubox: 'https://portal.edubox.app/login/virginiasapp',
    waGeneral: 'https://wa.me/50492215752?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp.',
    waPrimaria: 'https://wa.me/50492215752?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Primaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp.',
    waSecundaria: 'https://wa.me/50492700210?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Secundaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp.',
  },

  init() {
    if (!document.getElementById('quiz-section')) return;
    this._bindEvents();
  },

  _bindEvents() {
    const quizSection = document.getElementById('quiz-section');
    if (!quizSection) return;

    quizSection.addEventListener('click', e => {
      const opt = e.target.closest('.quiz-opt');
      if (opt) {
        const q = opt.dataset.q;
        const val = opt.dataset.val;
        if (q && val) this.selectOpt(opt, q, val);
        return;
      }
      const backBtn = e.target.closest('.quiz-btn-back[data-step]');
      if (backBtn) { this.goStep(+backBtn.dataset.step); return; }
      if (e.target.closest('#quiz-restart-btn')) this.restart();
    });
  },

  selectOpt(btn, q, val) {
    if (this.transitioning) return;

    btn.closest('.quiz-options')
      .querySelectorAll('.quiz-opt')
      .forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.answers[q] = val;

    const stepNum = parseInt(q.replace('q', ''), 10);

    // Feedback visual breve y avance automático (SDD-F2-ADM-004)
    this.transitioning = true;
    setTimeout(() => {
      if (stepNum >= this.totalSteps) {
        this.showResult();
      } else {
        this.goStep(stepNum + 1);
      }
      this.transitioning = false;
    }, 350);
  },

  goStep(n) {
    const current = document.getElementById(`qs-${this.currentStep}`);
    if (current) current.classList.remove('active');

    const result = document.getElementById('quiz-result');
    if (result) result.classList.remove('show');

    this.currentStep = n;
    const next = document.getElementById(`qs-${n}`);
    if (next) next.classList.add('active');

    const pct = (n / this.totalSteps) * 100;
    const fill = document.getElementById('q-fill');
    const stepLabel = document.getElementById('q-step-label');
    const pctLabel = document.getElementById('q-pct-label');

    if (fill) fill.style.width = pct + '%';
    if (stepLabel) stepLabel.textContent = `Pregunta ${n} de ${this.totalSteps}`;
    if (pctLabel) pctLabel.textContent = Math.round(pct) + '%';

    if (typeof addXP === 'function') {
      addXP(5, '🎯', '¡Avanzando en el quiz!', '+5 XP por cada respuesta');
    }
  },

  showResult() {
    const current = document.getElementById(`qs-${this.currentStep}`);
    if (current) current.classList.remove('active');

    const fill = document.getElementById('q-fill');
    const stepLabel = document.getElementById('q-step-label');
    const pctLabel = document.getElementById('q-pct-label');

    if (fill) fill.style.width = '100%';
    if (stepLabel) stepLabel.textContent = '¡Listo!';
    if (pctLabel) pctLabel.textContent = '100%';

    const age = this.answers.q1;
    const lang = this.answers.q3;
    let emoji = '🏫';
    let title = '¡Tenemos el programa ideal!';
    const sub = 'Basándonos en tus respuestas, te recomendamos:';
    let rec = '';
    let track = 'unsure'; // preescolar | primaria | secundaria | unsure

    if (age === 'preschool') {
      track = 'preescolar';
      emoji = '🌱'; title = '¡El Preescolar es para tu hijo/a!';
      rec = 'Nuestro programa de Preescolar (Pre-Kínder y Kínder) brinda estimulación temprana integral, valores bíblicos y el amor que cada niño merece para florecer. ¡El mejor comienzo de vida!';
    } else if (age === 'primary' && lang === 'bilingue') {
      track = 'primaria';
      emoji = '📚'; title = '¡Primaria Bilingüe es el camino!';
      rec = 'El programa de Primaria Bilingüe de 1° a 6° grado combina excelencia académica en inglés y español con valores cristianos. Tu hijo/a tendrá una ventaja enorme para el futuro.';
    } else if (age === 'primary') {
      track = 'primaria';
      emoji = '📚'; title = '¡Primaria es tu opción!';
      rec = 'El programa de Primaria Bilingüe de 1° a 6° grado ofrece la base académica más sólida en un ambiente de fe y valores. ¡El mejor lugar para crecer!';
    } else if (age === 'secondary' && lang === 'bilingue') {
      track = 'secundaria';
      emoji = '🎓'; title = '¡Secundaria Bilingüe, sin duda!';
      rec = 'El Bachillerato Bilingüe de 7° a 11° grado preparará a tu hijo/a para la universidad con inglés avanzado, liderazgo cristiano y una formación académica de primer nivel.';
    } else if (age === 'secondary') {
      track = 'secundaria';
      emoji = '🎓'; title = '¡Secundaria es la respuesta!';
      rec = 'Nuestro Bachillerato en Ciencias y Humanidades de 7° a 9° grado (Español) forma líderes con valores sólidos listos para enfrentar el mundo con fe y excelencia.';
    } else {
      track = 'unsure';
      emoji = '💬'; title = '¡Platiquemos personalmente!';
      rec = 'Lo mejor es que conversemos para orientarte de manera personalizada. Nuestro equipo de admisiones está listo para ayudarte a tomar la mejor decisión para tu familia.';
    }

    const rEmoji = document.getElementById('r-emoji');
    const rTitle = document.getElementById('r-title');
    const rSub = document.getElementById('r-sub');
    const rRec = document.getElementById('r-rec');
    const result = document.getElementById('quiz-result');

    if (rEmoji) rEmoji.textContent = emoji;
    if (rTitle) rTitle.textContent = title;
    if (rSub) rSub.textContent = sub;
    if (rRec) rRec.textContent = rec;

    this._renderResultCTAs(track);

    if (result) result.classList.add('show');

    if (typeof addXP === 'function') {
      addXP(20, '🏆', '¡Quiz completado!', '¡Conoces perfectamente CEEVS! +20 XP');
    }
    if (typeof unlockBadge === 'function') unlockBadge('quiz');
  },

  // SDD-F2-ADM-005 — cada resultado entrega al menos 2 CTAs concretos
  _renderResultCTAs(track) {
    const container = document.getElementById('quiz-result-btns');
    if (!container) return;

    // Limpiar CTAs dinámicos previos
    container.querySelectorAll('.quiz-cta-dynamic').forEach(el => el.remove());

    const R = this.REDIRECTS;
    let ctas;
    if (track === 'unsure') {
      ctas = [
        { label: '💬 Hablar por WhatsApp', href: R.waGeneral, cls: 'btn-cta-main', external: true },
        { label: 'Ver niveles educativos', href: '#niveles', cls: 'btn-cta-ghost', external: false },
      ];
    } else {
      const wa = track === 'secundaria' ? R.waSecundaria : R.waPrimaria;
      const waLabel = track === 'secundaria'
        ? '💬 Consultar por WhatsApp Secundaria'
        : '💬 Consultar por WhatsApp Primaria';
      ctas = [
        { label: '🎓 Solicitar admisión en línea', href: R.preinscripcion, cls: 'btn-cta-main', external: false },
        { label: waLabel, href: wa, cls: 'btn-cta-ghost', external: true },
      ];
    }

    const restartBtn = document.getElementById('quiz-restart-btn');
    ctas.forEach(cta => {
      const a = document.createElement('a');
      a.href = cta.href;
      a.className = `${cta.cls} quiz-cta-dynamic`;
      a.textContent = cta.label;
      if (cta.external) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      container.insertBefore(a, restartBtn);
    });
  },

  restart() {
    for (const k in this.answers) delete this.answers[k];
    this.currentStep = 1;
    this.transitioning = false;

    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));

    const result = document.getElementById('quiz-result');
    if (result) result.classList.remove('show');

    const btnsContainer = document.getElementById('quiz-result-btns');
    if (btnsContainer) {
      btnsContainer.querySelectorAll('.quiz-cta-dynamic').forEach(el => el.remove());
    }

    const qs1 = document.getElementById('qs-1');
    if (qs1) qs1.classList.add('active');

    const fill = document.getElementById('q-fill');
    const stepLabel = document.getElementById('q-step-label');
    const pctLabel = document.getElementById('q-pct-label');

    if (fill) fill.style.width = '25%';
    if (stepLabel) stepLabel.textContent = `Pregunta 1 de ${this.totalSteps}`;
    if (pctLabel) pctLabel.textContent = '25%';
  },
};

// Stubs retrocompatibles
function goStep(n) { Quiz.goStep(n); }
function showQuizResult() { Quiz.showResult(); }
function restartQuiz() { Quiz.restart(); }

App.register(Quiz);
