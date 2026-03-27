/* ═══════════════════════════════════════════════════
   games.js — Zona Interactiva · Instituto CEEVS
   4 mini-juegos: Trivia, Sopa de Letras, Memoria, Versículo del Día
═══════════════════════════════════════════════════ */

'use strict';

// ─── Helpers de gamificación (seguros si no cargó gamification.js) ───
function giveXP(pts, icon, title, desc) {
  if (typeof window.addXP === 'function') window.addXP(pts, icon, title, desc);
}
function giveBadge(id) {
  if (typeof window.unlockBadge === 'function') window.unlockBadge(id);
}

// ─── Estado global de juegos ───
const GS = {
  trivia:  { questions: [], currentIdx: 0, score: 0, timer: null, answered: false },
  sopa:    { firstCell: null, selecting: false, found: [] },
  memoria: { flipped: [], matched: 0, moves: 0, locked: false, firstBadge: false },
  versiculo: { loaded: false }
};

// ═══════════════════════════════════════
// MODAL CONTROLLER
// ═══════════════════════════════════════
function filterGames(audience) {
  document.querySelectorAll('.audience-tab').forEach(t => t.classList.toggle('active', t.dataset.audience === audience));
  document.querySelectorAll('.game-card').forEach(card => {
    const audiences = (card.dataset.audiences || '').split(',');
    card.dataset.hidden = audience === 'todos' || audiences.includes(audience) ? 'false' : 'true';
  });
}

function openGame(id) {
  const modal = document.getElementById('game-modal');
  const content = document.getElementById('game-content');
  if (!modal || !content) return;
  clearGameTimers();
  content.innerHTML = '';
  if (id === 'trivia')    content.innerHTML = buildTriviaHTML();
  if (id === 'sopa')      content.innerHTML = buildSopaHTML();
  if (id === 'memoria')   content.innerHTML = buildMemoriaHTML();
  if (id === 'versiculo') content.innerHTML = buildVersiculoHTML();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'trivia')    startTrivia();
  if (id === 'sopa')      initSopa();
  if (id === 'memoria')   initMemoria();
  if (id === 'versiculo') initVersiculo();
}

function closeGame() {
  clearGameTimers();
  const modal = document.getElementById('game-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function clearGameTimers() {
  if (GS.trivia.timer) { clearInterval(GS.trivia.timer); GS.trivia.timer = null; }
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('game-modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeGame(); });
  // close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGame(); });
});


// ═══════════════════════════════════════
// 1. TRIVIA BÍBLICA
// ═══════════════════════════════════════
const TRIVIA_BANK = [
  { q: '¿En qué año fue fundado el Instituto Evangélico Virginia Sapp?', opts: ['1945', '1962', '1970', '1955'], ans: 1 },
  { q: '¿Cuál versículo dice "Porque de tal manera amó Dios al mundo..."?', opts: ['Romanos 3:23', 'Juan 3:16', 'Salmos 23:1', 'Mateo 28:19'], ans: 1 },
  { q: '¿Cómo se llama la misionera que fundó el instituto?', opts: ['Margaret Smith', 'Virginia Sapp', 'Helen Brown', 'Ruth Davis'], ans: 1 },
  { q: '¿En qué ciudad de Honduras está ubicado el CEEVS?', opts: ['San Pedro Sula', 'La Ceiba', 'Tegucigalpa', 'Comayagua'], ans: 2 },
  { q: '¿Cuántos libros tiene la Biblia en total?', opts: ['60', '64', '66', '72'], ans: 2 },
  { q: '¿Cuál es el primer libro de la Biblia?', opts: ['Éxodo', 'Génesis', 'Mateo', 'Salmos'], ans: 1 },
  { q: '¿Quién escribió la mayoría de las epístolas del Nuevo Testamento?', opts: ['Pedro', 'Juan', 'Pablo', 'Santiago'], ans: 2 },
  { q: '¿Cuál de estos es un fruto del Espíritu según Gálatas 5?', opts: ['Riqueza', 'Sabiduría', 'Amor', 'Fortaleza'], ans: 2 },
  { q: '¿Con cuántos peces y panes alimentó Jesús a la multitud?', opts: ['10 peces y 2 panes', '2 peces y 7 panes', '5 panes y 2 peces', '3 panes y 5 peces'], ans: 2 },
  { q: '¿Cuál es el río en que Jesús fue bautizado?', opts: ['Río Nilo', 'Río Jordán', 'Río Éufrates', 'Río Tigris'], ans: 1 },
  { q: '¿Cuál es el Salmo más conocido que empieza con "El Señor es mi pastor"?', opts: ['Salmo 100', 'Salmo 91', 'Salmo 23', 'Salmo 1'], ans: 2 },
  { q: '¿Cuántos discípulos eligió Jesús?', opts: ['7', '10', '12', '14'], ans: 2 },
  { q: '¿Qué valor cristiano significa "actuar sin esperar recompensa"?', opts: ['Humildad', 'Servicio', 'Fe', 'Gracia'], ans: 1 },
  { q: '¿Qué significa la palabra "Evangelio"?', opts: ['Buenas nuevas', 'Libro sagrado', 'Oración diaria', 'Ley de Dios'], ans: 0 },
  { q: '¿Cuál fue el primer milagro de Jesús según el Evangelio de Juan?', opts: ['Sanar a un ciego', 'Convertir agua en vino', 'Resucitar a Lázaro', 'Multiplicar peces'], ans: 1 },
  { q: '¿En qué ciudad nació Jesús?', opts: ['Nazaret', 'Jerusalén', 'Belén', 'Jericó'], ans: 2 },
  { q: '¿Qué instrumento musical tocaba el rey David?', opts: ['Flauta', 'Arpa', 'Trompeta', 'Lira'], ans: 1 },
  { q: '¿Cuál es el mandamiento más grande según Jesús?', opts: ['No mentirás', 'Amar a Dios con todo el corazón', 'Honrarás padre y madre', 'No matarás'], ans: 1 },
  { q: '¿Cuántos libros tiene el Nuevo Testamento?', opts: ['22', '25', '27', '29'], ans: 2 },
  { q: '¿Qué significa "CEEVS" en las siglas del colegio?', opts: ['Centro Educativo Evangélico Virginia Sapp', 'Colegio Evangélico Educativo Virginia Sapp', 'Centro Educativo Evangélico Vida Sapp', 'Colegio Educativo Evangélico Valle Sapp'], ans: 0 },
];

function buildTriviaHTML() {
  return `
    <div id="trivia-wrap">
      <div class="game-modal-title">🧠 Trivia Bíblica</div>
      <div class="game-modal-sub">10 preguntas · 30 segundos por pregunta</div>
      <div class="trivia-progress">
        <div class="trivia-progress-bar"><div class="trivia-progress-fill" id="t-prog-fill" style="width:10%"></div></div>
        <span class="trivia-progress-label" id="t-prog-label">1 / 10</span>
      </div>
      <div class="trivia-timer-wrap">
        <div class="trivia-timer-bar"><div class="trivia-timer-fill" id="t-timer-fill" style="width:100%"></div></div>
      </div>
      <div id="t-question" class="trivia-question"></div>
      <div class="trivia-options" id="t-options"></div>
    </div>`;
}

function startTrivia() {
  // Seleccionar 10 preguntas aleatorias del banco
  const shuffled = [...TRIVIA_BANK].sort(() => Math.random() - 0.5);
  GS.trivia.questions = shuffled.slice(0, 10);
  GS.trivia.currentIdx = 0;
  GS.trivia.score = 0;
  renderTriviaQuestion();
}

function renderTriviaQuestion() {
  const wrap = document.getElementById('trivia-wrap');
  if (!wrap) return;
  const { questions, currentIdx } = GS.trivia;
  if (currentIdx >= questions.length) { endTrivia(); return; }

  const q = questions[currentIdx];
  const pct = ((currentIdx + 1) / 10) * 100;
  const progFill = document.getElementById('t-prog-fill');
  const progLabel = document.getElementById('t-prog-label');
  if (progFill) progFill.style.width = pct + '%';
  if (progLabel) progLabel.textContent = `${currentIdx + 1} / 10`;

  const qEl = document.getElementById('t-question');
  if (qEl) qEl.textContent = q.q;

  const optsEl = document.getElementById('t-options');
  if (!optsEl) return;
  optsEl.innerHTML = q.opts.map((opt, i) =>
    `<button class="trivia-opt" onclick="selectTriviaAnswer(this, ${i === q.ans})">${opt}</button>`
  ).join('');

  GS.trivia.answered = false;
  startTriviaTimer();
}

function startTriviaTimer() {
  clearGameTimers();
  let secs = 30;
  const fill = document.getElementById('t-timer-fill');
  if (fill) { fill.style.width = '100%'; fill.classList.remove('urgent'); }

  GS.trivia.timer = setInterval(() => {
    secs--;
    const pct = (secs / 30) * 100;
    if (fill) {
      fill.style.width = pct + '%';
      if (secs <= 8) fill.classList.add('urgent');
    }
    if (secs <= 0) {
      clearInterval(GS.trivia.timer);
      GS.trivia.timer = null;
      if (!GS.trivia.answered) timeoutTrivia();
    }
  }, 1000);
}

function selectTriviaAnswer(btn, isCorrect) {
  if (GS.trivia.answered) return;
  GS.trivia.answered = true;
  clearGameTimers();

  const opts = document.querySelectorAll('.trivia-opt');
  const q = GS.trivia.questions[GS.trivia.currentIdx];
  opts.forEach((o, i) => {
    o.disabled = true;
    if (i === q.ans) o.classList.add('correct');
  });

  if (isCorrect) {
    btn.classList.add('correct');
    GS.trivia.score++;
    giveXP(3, '🎯', '¡Respuesta correcta!', '+3 XP');
  } else {
    btn.classList.add('wrong');
  }

  setTimeout(() => {
    GS.trivia.currentIdx++;
    renderTriviaQuestion();
  }, 1200);
}

function timeoutTrivia() {
  if (GS.trivia.answered) return;
  GS.trivia.answered = true;
  const opts = document.querySelectorAll('.trivia-opt');
  const q = GS.trivia.questions[GS.trivia.currentIdx];
  opts.forEach((o, i) => {
    o.disabled = true;
    if (i === q.ans) o.classList.add('correct');
  });
  setTimeout(() => {
    GS.trivia.currentIdx++;
    renderTriviaQuestion();
  }, 1200);
}

function endTrivia() {
  const score = GS.trivia.score;
  const wrap = document.getElementById('trivia-wrap');
  if (!wrap) return;

  giveXP(15, '🏆', '¡Trivia completada!', `${score}/10 respuestas correctas · +15 XP`);
  giveBadge('trivia');

  const msgs = ['¡Sigue practicando!', '¡Buen intento!', '¡Muy bien!', '¡Excelente!', '¡Perfecto!'];
  const msgIdx = Math.min(Math.floor(score / 2.5), 4);

  wrap.innerHTML = `
    <div class="game-modal-title">🧠 Trivia Bíblica</div>
    <div class="game-modal-sub">¡Completada!</div>
    <div class="trivia-score-wrap">
      <div class="trivia-score-num">${score}<span style="font-size:24px;opacity:.5">/10</span></div>
      <div class="trivia-score-sub">${msgs[msgIdx]} · +${15 + score * 3} XP ganados</div>
    </div>
    <button class="trivia-btn-again" onclick="startTrivia()">🔄 Jugar de nuevo</button>`;
}


// ═══════════════════════════════════════
// 2. SOPA DE LETRAS
// ═══════════════════════════════════════

// Grid 12×12 pre-construida. Palabras y sus posiciones:
// AMOR        → fila 0, col 0-3, horizontal
// FE          → fila 1, col 5-6, horizontal
// PAZ         → fila 2, col 9-11, horizontal
// BIBLIA      → fila 0-5, col 11, vertical
// GRACIA      → fila 3, col 0-5, horizontal
// ORACION     → fila 5, col 1-7, horizontal
// VERDAD      → fila 0-5, col 7, vertical
// FAMILIA     → fila 7, col 2-8, horizontal
// JESUS       → fila 9-10 col 4, vertical (J fila9, E fila10... let me redo)
// ESPERANZA   → fila 10, col 1-9, horizontal

const SOPA_WORDS = [
  { word: 'AMOR',      cells: [[0,0],[0,1],[0,2],[0,3]] },
  { word: 'FE',        cells: [[1,5],[1,6]] },
  { word: 'PAZ',       cells: [[2,9],[2,10],[2,11]] },
  { word: 'BIBLIA',    cells: [[0,11],[1,11],[2,11],[3,11],[4,11],[5,11]] },
  { word: 'GRACIA',    cells: [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]] },
  { word: 'ORACION',   cells: [[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7]] },
  { word: 'VERDAD',    cells: [[0,7],[1,7],[2,7],[3,7],[4,7],[5,7]] },
  { word: 'FAMILIA',   cells: [[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8]] },
  { word: 'JESUS',     cells: [[9,4],[9,5],[9,6],[9,7],[9,8]] },
  { word: 'ESPERANZA', cells: [[10,1],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9]] },
];

// Build 12×12 letter grid
function buildSopaGrid12() {
  const grid = Array.from({length:12}, () => Array(12).fill(''));
  // Place words
  SOPA_WORDS.forEach(({ word, cells }) => {
    cells.forEach(([r,c], i) => { grid[r][c] = word[i]; });
  });
  // Fill empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 12; c++)
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
  return grid;
}

function buildSopaHTML() {
  const grid = buildSopaGrid12();
  // Store grid for later reference
  window._sopaGrid = grid;

  const gridHTML = grid.map((row, r) =>
    row.map((letter, c) =>
      `<div class="sopa-cell" data-r="${r}" data-c="${c}">${letter}</div>`
    ).join('')
  ).join('');

  const wordListHTML = SOPA_WORDS.map(w =>
    `<div class="sopa-word-item" id="sw-${w.word}">${w.word}</div>`
  ).join('');

  return `
    <div class="game-modal-title">🔤 Sopa de Letras</div>
    <div class="game-modal-sub">Encuentra las 10 palabras. Toca la primera y luego la última letra.</div>
    <div class="sopa-layout">
      <div class="sopa-grid-wrap">
        <div class="sopa-grid" id="sopa-grid">${gridHTML}</div>
        <p class="sopa-hint">Toca la letra inicial → luego la letra final de la palabra</p>
        <p class="sopa-status" id="sopa-status">0 / 10 palabras encontradas</p>
      </div>
      <div>
        <div class="sopa-words-list">${wordListHTML}</div>
      </div>
    </div>`;
}

function initSopa() {
  GS.sopa.firstCell = null;
  GS.sopa.selecting = false;
  GS.sopa.found = [];

  const sopaGrid = document.getElementById('sopa-grid');
  if (!sopaGrid) return;

  sopaGrid.addEventListener('click', e => {
    const cell = e.target.closest('.sopa-cell');
    if (!cell || cell.classList.contains('found')) return;
    handleSopaCellClick(cell);
  });
}

function handleSopaCellClick(cell) {
  if (!GS.sopa.selecting) {
    // First selection
    GS.sopa.firstCell = cell;
    GS.sopa.selecting = true;
    cell.classList.add('first-sel', 'selecting');
  } else {
    // Second selection — check word
    const first = GS.sopa.firstCell;
    if (first === cell) {
      // Same cell — deselect
      clearSopaSelection();
      return;
    }
    // Highlight path and check
    checkSopaWord(first, cell);
    clearSopaSelection();
  }
}

function clearSopaSelection() {
  document.querySelectorAll('.sopa-cell.selecting, .sopa-cell.first-sel').forEach(c => {
    c.classList.remove('selecting', 'first-sel');
  });
  GS.sopa.firstCell = null;
  GS.sopa.selecting = false;
}

function cellsOnPath(r1, c1, r2, c2) {
  const cells = [];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const steps = Math.max(Math.abs(r2-r1), Math.abs(c2-c1));
  for (let i = 0; i <= steps; i++) cells.push([r1 + dr*i, c1 + dc*i]);
  return cells;
}

function checkSopaWord(firstCell, lastCell) {
  const r1 = +firstCell.dataset.r, c1 = +firstCell.dataset.c;
  const r2 = +lastCell.dataset.r, c2 = +lastCell.dataset.c;

  // Only allow horizontal, vertical, or diagonal
  const rowDiff = Math.abs(r2 - r1);
  const colDiff = Math.abs(c2 - c1);
  if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) return; // not straight line

  const path = cellsOnPath(r1, c1, r2, c2);
  const grid = window._sopaGrid;
  if (!grid) return;
  const attempt = path.map(([r,c]) => grid[r][c]).join('');
  const attemptRev = attempt.split('').reverse().join('');

  const match = SOPA_WORDS.find(w =>
    !GS.sopa.found.includes(w.word) &&
    (attempt === w.word || attemptRev === w.word)
  );

  if (match) {
    markWordFound(match, path);
  }
}

function markWordFound(match, path) {
  GS.sopa.found.push(match.word);
  // Mark cells
  path.forEach(([r,c]) => {
    const cell = document.querySelector(`.sopa-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) { cell.classList.add('found'); cell.classList.remove('selecting','first-sel'); }
  });
  // Mark word list
  const wordEl = document.getElementById('sw-' + match.word);
  if (wordEl) wordEl.classList.add('found');
  // Update status
  const statusEl = document.getElementById('sopa-status');
  if (statusEl) statusEl.textContent = `${GS.sopa.found.length} / 10 palabras encontradas`;

  giveXP(5, '🔤', `¡Encontraste ${match.word}!`, '+5 XP');

  if (GS.sopa.found.length === SOPA_WORDS.length) {
    giveXP(10, '🎉', '¡Sopa completada!', '¡Todas las palabras encontradas! +10 XP');
    giveBadge('sopaletras');
    const statusEl2 = document.getElementById('sopa-status');
    if (statusEl2) statusEl2.innerHTML = '<span style="color:#4caf50;font-weight:700">🎉 ¡Completada! Todas las palabras encontradas</span>';
  }
}


// ═══════════════════════════════════════
// 3. MEMORIA CRISTIANA
// ═══════════════════════════════════════
const MEMORIA_PAIRS = [
  { word: 'AMOR',      emoji: '❤️' },
  { word: 'FE',        emoji: '🙏' },
  { word: 'PAZ',       emoji: '☮️' },
  { word: 'GRACIA',    emoji: '✨' },
  { word: 'ESPERANZA', emoji: '🌟' },
  { word: 'VERDAD',    emoji: '📖' },
  { word: 'SERVICIO',  emoji: '🤝' },
  { word: 'HUMILDAD',  emoji: '🌾' },
];

function buildMemoriaHTML() {
  return `
    <div id="memoria-wrap">
      <div class="game-modal-title">🃏 Memoria Cristiana</div>
      <div class="game-modal-sub">Empareja valor con su símbolo. Memoriza y descúbrelos.</div>
      <div class="memoria-stats">
        <div class="mem-stat"><div class="mem-stat-num" id="mem-moves">0</div><div class="mem-stat-label">Movimientos</div></div>
        <div class="mem-stat"><div class="mem-stat-num" id="mem-pairs">0/8</div><div class="mem-stat-label">Pares</div></div>
      </div>
      <div class="memoria-grid" id="memoria-grid"></div>
      <div id="memoria-win" class="memoria-win" style="display:none"></div>
    </div>`;
}

function initMemoria() {
  GS.memoria.flipped = [];
  GS.memoria.matched = 0;
  GS.memoria.moves = 0;
  GS.memoria.locked = false;

  // Build shuffled card deck: each pair = word card + emoji card
  const cards = [];
  MEMORIA_PAIRS.forEach(p => {
    cards.push({ id: p.word, type: 'word', label: p.word, emoji: p.emoji });
    cards.push({ id: p.word, type: 'emoji', label: p.emoji, emoji: p.emoji });
  });
  cards.sort(() => Math.random() - 0.5);

  const grid = document.getElementById('memoria-grid');
  if (!grid) return;

  grid.innerHTML = cards.map((card, idx) => `
    <div class="memoria-card" data-idx="${idx}" data-id="${card.id}" data-type="${card.type}" onclick="flipCard(this)">
      <div class="memoria-card-inner">
        <div class="memoria-card-face memoria-card-back">✝</div>
        <div class="memoria-card-face memoria-card-front">
          <span class="card-emoji">${card.type === 'emoji' ? card.label : card.emoji}</span>
          <span class="card-word">${card.type === 'word' ? card.label : ''}</span>
        </div>
      </div>
    </div>`
  ).join('');
}

function flipCard(card) {
  if (GS.memoria.locked) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  GS.memoria.flipped.push(card);

  if (GS.memoria.flipped.length === 2) {
    GS.memoria.locked = true;
    GS.memoria.moves++;
    const movesEl = document.getElementById('mem-moves');
    if (movesEl) movesEl.textContent = GS.memoria.moves;
    checkMemoriaMatch();
  }
}

function checkMemoriaMatch() {
  const [a, b] = GS.memoria.flipped;
  if (a.dataset.id === b.dataset.id && a.dataset.type !== b.dataset.type) {
    // Match!
    setTimeout(() => {
      a.classList.add('matched');
      b.classList.add('matched');
      GS.memoria.flipped = [];
      GS.memoria.locked = false;
      GS.memoria.matched++;
      const pairsEl = document.getElementById('mem-pairs');
      if (pairsEl) pairsEl.textContent = `${GS.memoria.matched}/8`;
      if (GS.memoria.matched === 8) memoriaWin();
    }, 600);
  } else {
    // No match
    setTimeout(() => {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      GS.memoria.flipped = [];
      GS.memoria.locked = false;
    }, 900);
  }
}

function memoriaWin() {
  giveXP(20, '🃏', '¡Memoria completada!', `${GS.memoria.moves} movimientos · +20 XP`);
  giveBadge('memoria');

  const winEl = document.getElementById('memoria-win');
  if (winEl) {
    winEl.style.display = 'block';
    winEl.innerHTML = `
      <div class="memoria-win-title">🎉 ¡Completado!</div>
      <div class="memoria-win-sub">${GS.memoria.moves} movimientos para completar los 8 pares · +20 XP</div>
      <button class="trivia-btn-again" style="margin-top:14px" onclick="initMemoria()">🔄 Jugar de nuevo</button>`;
  }
}


// ═══════════════════════════════════════
// 4. VERSÍCULO DEL DÍA (API bolls.life)
// ═══════════════════════════════════════
const BOOKS_ES = [
  '', 'Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut',
  '1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras',
  'Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías',
  'Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías',
  'Jonás','Miqueas','Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías',
  'Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios',
  'Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses',
  '1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro',
  '1 Juan','2 Juan','3 Juan','Judas','Apocalipsis'
];

// Fallback verses if API fails
const VERSE_FALLBACK = [
  { text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', ref: 'Juan 3:16' },
  { text: 'El Señor es mi pastor; nada me faltará.', ref: 'Salmos 23:1' },
  { text: 'Todo lo puedo en Cristo que me fortalece.', ref: 'Filipenses 4:13' },
  { text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.', ref: 'Proverbios 3:5' },
  { text: 'Buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', ref: 'Mateo 6:33' },
];

function buildVersiculoHTML() {
  const today = new Date().toISOString().slice(0,10);
  const cached = localStorage.getItem('ceevs_verse_' + today);
  const faved  = !!localStorage.getItem('ceevs_fav_' + today);

  let verseBlock;
  if (cached) {
    const v = JSON.parse(cached);
    verseBlock = renderVersiculoCard(v.text, v.ref, faved);
  } else {
    verseBlock = `<div class="versiculo-loading" id="v-loading">Cargando versículo del día... ✦</div>`;
  }

  return `
    <div id="versiculo-wrap">
      <div class="game-modal-title">✝️ Versículo del Día</div>
      <div class="game-modal-sub">Reina Valera 1960 — renovado cada día</div>
      <div id="versiculo-content">${verseBlock}</div>
    </div>`;
}

function renderVersiculoCard(text, ref, faved) {
  return `
    <div class="versiculo-card">
      <div class="versiculo-text">"${text}"</div>
      <div class="versiculo-ref">— ${ref} (RVR 1960)</div>
    </div>
    <div class="versiculo-actions">
      <button class="btn-fav ${faved ? 'faved' : ''}" id="btn-fav" onclick="favVersiculo()" ${faved ? 'disabled' : ''}>
        ${faved ? '⭐ Marcado como favorito' : '☆ Marcar como favorito (+5 XP)'}
      </button>
    </div>`;
}

function initVersiculo() {
  const today = new Date().toISOString().slice(0,10);
  const cached = localStorage.getItem('ceevs_verse_' + today);
  if (cached) return; // Already loaded & rendered

  // Fetch from bolls.life
  fetch('https://bolls.life/get-random-verse/rvr1960/')
    .then(r => r.json())
    .then(data => {
      const rawText = (data.text || '').replace(/<[^>]+>/g, '').trim();
      const bookName = BOOKS_ES[data.book] || 'Biblia';
      const ref = `${bookName} ${data.chapter}:${data.verse}`;
      const verse = { text: rawText, ref };

      localStorage.setItem('ceevs_verse_' + today, JSON.stringify(verse));

      const container = document.getElementById('versiculo-content');
      if (container) {
        const faved = !!localStorage.getItem('ceevs_fav_' + today);
        container.innerHTML = renderVersiculoCard(verse.text, verse.ref, faved);
      }
    })
    .catch(() => {
      // Fallback: pick verse by day of year
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
      const verse = VERSE_FALLBACK[dayOfYear % VERSE_FALLBACK.length];
      localStorage.setItem('ceevs_verse_' + today, JSON.stringify(verse));
      const container = document.getElementById('versiculo-content');
      if (container) {
        const faved = !!localStorage.getItem('ceevs_fav_' + today);
        container.innerHTML = renderVersiculoCard(verse.text, verse.ref, faved);
      }
    });
}

function favVersiculo() {
  const today = new Date().toISOString().slice(0,10);
  if (localStorage.getItem('ceevs_fav_' + today)) return;
  localStorage.setItem('ceevs_fav_' + today, '1');
  giveXP(5, '⭐', '¡Versículo guardado!', '+5 XP por tu favorito del día');

  const btn = document.getElementById('btn-fav');
  if (btn) {
    btn.textContent = '⭐ Marcado como favorito';
    btn.classList.add('faved');
    btn.disabled = true;
  }
}
