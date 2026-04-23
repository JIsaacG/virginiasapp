'use strict';

const Quiz = {
  name: 'Quiz',
  answers: {},
  currentStep: 1,

  init() {
    if (!document.getElementById('quiz-section')) return;
    this._bindEvents();
  },

  _bindEvents() {
    // Option selection via delegation
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      quizSection.addEventListener('click', e => {
        const opt = e.target.closest('.quiz-opt');
        if (opt) {
          const q = opt.dataset.q;
          const val = opt.dataset.val;
          if (q && val) this.selectOpt(opt, q, val);
        }
        const nextBtn = e.target.closest('.quiz-btn-next[data-step]');
        if (nextBtn && !nextBtn.disabled) this.goStep(+nextBtn.dataset.step);
        const backBtn = e.target.closest('.quiz-btn-back[data-step]');
        if (backBtn) this.goStep(+backBtn.dataset.step);
        const showResultBtn = e.target.closest('[data-show-result]');
        if (showResultBtn && !showResultBtn.disabled) this.showResult();
        if (e.target.id === 'quiz-show-result') this.showResult();
        if (e.target.id === 'quiz-restart-btn') this.restart();
        if (e.target.id === 'quiz-lead-submit') this.submitLead();
      });
    }
  },

  selectOpt(btn, q, val) {
    btn.closest('.quiz-options').querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.answers[q] = val;
    const nextBtn = document.getElementById(`${q}-next`);
    if (nextBtn) nextBtn.disabled = false;
  },

  goStep(n) {
    const current = document.getElementById(`qs-${this.currentStep}`);
    if (current) current.classList.remove('active');
    this.currentStep = n;
    const next = document.getElementById(`qs-${n}`);
    if (next) next.classList.add('active');

    const pct = (n / 4) * 100;
    const fill = document.getElementById('q-fill');
    const stepLabel = document.getElementById('q-step-label');
    const pctLabel = document.getElementById('q-pct-label');

    if (fill) fill.style.width = pct + '%';
    if (stepLabel) stepLabel.textContent = `Pregunta ${n} de 4`;
    if (pctLabel) pctLabel.textContent = pct + '%';

    addXP(5, '🎯', '¡Avanzando en el quiz!', '+5 XP por cada respuesta');
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
    let emoji = '🏫', title = '¡Tenemos el programa ideal!';
    let sub = 'Basándonos en tus respuestas, te recomendamos:';
    let rec = '';

    if (age === 'preschool') {
      emoji = '🌱'; title = '¡El Preescolar es para tu hijo!';
      rec = 'Nuestro programa de Preescolar (Pre-Kínder y Kínder) brinda estimulación temprana integral, valores bíblicos y el amor que cada niño merece para florecer. ¡El mejor comienzo de vida!';
    } else if (age === 'primary' && lang === 'bilingue') {
      emoji = '📚'; title = '¡Primaria Bilingüe es el camino!';
      rec = 'El programa de Primaria Bilingüe de 1° a 6° grado combina excelencia académica en inglés y español con valores cristianos. Tu hijo tendrá una ventaja enorme para el futuro.';
    } else if (age === 'primary') {
      emoji = '📚'; title = '¡Primaria es tu opción!';
      rec = 'El programa de Primaria Bilingüe de 1° a 6° grado ofrece la base académica más sólida en un ambiente de fe y valores. ¡El mejor lugar para crecer!';
    } else if (age === 'secondary' && lang === 'bilingue') {
      emoji = '🎓'; title = '¡Secundaria Bilingüe, sin duda!';
      rec = 'El Bachillerato Bilingüe de 7° a 11° grado preparará a tu hijo/a para la universidad con inglés avanzado, liderazgo cristiano y una formación académica de primer nivel.';
    } else if (age === 'secondary') {
      emoji = '🎓'; title = '¡Secundaria es la respuesta!';
      rec = 'Nuestro Bachillerato en Ciencias y Humanidades de 7° a 9° grado (Español) forma líderes con valores sólidos listos para enfrentar el mundo con fe y excelencia.';
    } else {
      emoji = '💬'; title = '¡Platiquemos personalmente!';
      rec = 'Basado en tus respuestas, lo mejor es que conversemos para orientarte de manera personalizada. Nuestro equipo de admisiones está listo para ayudarte a tomar la mejor decisión para tu familia.';
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
    if (result) result.classList.add('show');

    addXP(20, '🏆', '¡Quiz completado!', '¡Conoces perfectamente CEEVS! +20 XP');
    unlockBadge('quiz');
  },

  restart() {
    for (const k in this.answers) delete this.answers[k];
    this.currentStep = 1;
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.quiz-btn-next').forEach(b => b.disabled = true);

    const result = document.getElementById('quiz-result');
    if (result) result.classList.remove('show');
    const qs1 = document.getElementById('qs-1');
    if (qs1) qs1.classList.add('active');

    const fill = document.getElementById('q-fill');
    const stepLabel = document.getElementById('q-step-label');
    const pctLabel = document.getElementById('q-pct-label');

    if (fill) fill.style.width = '25%';
    if (stepLabel) stepLabel.textContent = 'Pregunta 1 de 4';
    if (pctLabel) pctLabel.textContent = '25%';

    const leadForm = document.getElementById('quiz-lead-form');
    if (leadForm) leadForm.style.display = 'block';
    const leadMsg = document.getElementById('quiz-lead-msg');
    if (leadMsg) leadMsg.style.display = 'none';
    ['quiz-lead-name', 'quiz-lead-phone', 'quiz-lead-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  },

  submitLead() {
    const name = (document.getElementById('quiz-lead-name')?.value || '').trim();
    const phone = (document.getElementById('quiz-lead-phone')?.value || '').trim();
    const email = (document.getElementById('quiz-lead-email')?.value || '').trim();
    const msg = document.getElementById('quiz-lead-msg');

    if (!name && !phone && !email) {
      if (msg) {
        msg.textContent = 'Por favor ingresa al menos un dato de contacto.';
        msg.style.color = '#ff9800';
        msg.style.display = 'block';
      }
      return;
    }

    let leads = [];
    try { leads = JSON.parse(localStorage.getItem('ceevs_quiz_leads')) || []; } catch { leads = []; }
    leads.push({
      name, phone, email,
      quizAnswers: { ...this.answers },
      recommendation: document.getElementById('r-title')?.textContent || '',
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('ceevs_quiz_leads', JSON.stringify(leads));

    if (msg) {
      msg.textContent = '¡Gracias! Nuestro equipo te contactará pronto.';
      msg.style.color = '#4caf50';
      msg.style.display = 'block';
    }

    const form = document.getElementById('quiz-lead-form');
    if (form) {
      form.querySelectorAll('input, button').forEach(el => { el.disabled = true; el.style.opacity = '.5'; });
    }

    addXP(10, '📋', '¡Datos enviados!', 'Nuestro equipo te contactará +10 XP');
  },
};

// Backward-compatible stubs (HTML still uses data attributes but these remain for safety)
function selectOpt(btn, q, val) { Quiz.selectOpt(btn, q, val); }
function goStep(n) { Quiz.goStep(n); }
function showQuizResult() { Quiz.showResult(); }
function restartQuiz() { Quiz.restart(); }
function submitQuizLead() { Quiz.submitLead(); }

App.register(Quiz);
