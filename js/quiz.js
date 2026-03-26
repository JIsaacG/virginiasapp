/**
 * quiz.js — Interactive admission quiz
 * 4-step flow: age → values → language → timing → recommendation
 */

const answers = {};
let currentStep = 1;

function selectOpt(btn, q, val) {
  btn.closest('.quiz-options').querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  answers[q] = val;
  const nextBtn = document.getElementById(`${q}-next`);
  if (nextBtn) nextBtn.disabled = false;
}

function goStep(n) {
  const current = document.getElementById(`qs-${currentStep}`);
  if (current) current.classList.remove('active');
  currentStep = n;
  const next = document.getElementById(`qs-${n}`);
  if (next) next.classList.add('active');

  const pct = (n / 4) * 100;
  const fill = document.getElementById('q-fill');
  const stepLabel = document.getElementById('q-step-label');
  const pctLabel = document.getElementById('q-pct-label');

  if (fill) fill.style.width = pct + '%';
  if (stepLabel) stepLabel.textContent = `Pregunta ${n} de 4`;
  if (pctLabel) pctLabel.textContent = pct + '%';

  if (typeof addXP === 'function') {
    addXP(5, '🎯', '¡Avanzando en el quiz!', '+5 XP por cada respuesta');
  }
}

function showQuizResult() {
  const current = document.getElementById(`qs-${currentStep}`);
  if (current) current.classList.remove('active');

  const fill = document.getElementById('q-fill');
  const stepLabel = document.getElementById('q-step-label');
  const pctLabel = document.getElementById('q-pct-label');

  if (fill) fill.style.width = '100%';
  if (stepLabel) stepLabel.textContent = '¡Listo!';
  if (pctLabel) pctLabel.textContent = '100%';

  const age = answers.q1;
  const lang = answers.q3;
  let emoji = '🏫', title = '¡Tenemos el programa ideal!';
  let sub = 'Basándonos en tus respuestas, te recomendamos:';
  let rec = '';

  if (age === 'preschool') {
    emoji = '🌱';
    title = '¡El Preescolar es para tu hijo!';
    rec = 'Nuestro programa de Preescolar (Pre-Kínder y Kínder) brinda estimulación temprana integral, valores bíblicos y el amor que cada niño merece para florecer. ¡El mejor comienzo de vida!';
  } else if (age === 'primary' && lang === 'bilingue') {
    emoji = '📚';
    title = '¡Primaria Bilingüe es el camino!';
    rec = 'El programa de Primaria Bilingüe de 1° a 6° grado combina excelencia académica en inglés y español con valores cristianos. Tu hijo tendrá una ventaja enorme para el futuro.';
  } else if (age === 'primary') {
    emoji = '📚';
    title = '¡Primaria es tu opción!';
    rec = 'El programa de Primaria Bilingüe de 1° a 6° grado ofrece la base académica más sólida en un ambiente de fe y valores. ¡El mejor lugar para crecer!';
  } else if (age === 'secondary' && lang === 'bilingue') {
    emoji = '🎓';
    title = '¡Secundaria Bilingüe, sin duda!';
    rec = 'El Bachillerato Bilingüe de 7° a 11° grado preparará a tu hijo/a para la universidad con inglés avanzado, liderazgo cristiano y una formación académica de primer nivel.';
  } else if (age === 'secondary') {
    emoji = '🎓';
    title = '¡Secundaria es la respuesta!';
    rec = 'Nuestro Bachillerato en Ciencias y Humanidades de 7° a 9° grado (Español) forma líderes con valores sólidos listos para enfrentar el mundo con fe y excelencia.';
  } else {
    emoji = '💬';
    title = '¡Platiquemos personalmente!';
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

  if (typeof addXP === 'function') {
    addXP(20, '🏆', '¡Quiz completado!', '¡Conoces perfectamente CEEVS! +20 XP');
    unlockBadge('quiz');
  }
}

function restartQuiz() {
  for (let k in answers) delete answers[k];
  currentStep = 1;
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
}
