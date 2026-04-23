'use strict';

// ─── Gamification helpers (safe if gamification.js not loaded) ───
function giveXP(pts, icon, title, desc) {
  if (typeof addXP === 'function') addXP(pts, icon, title, desc);
}
function giveBadge(id) {
  if (typeof unlockBadge === 'function') unlockBadge(id);
}

const Games = {
  name: 'Games',

  state: {
    trivia:   { questions: [], currentIdx: 0, score: 0, timer: null, answered: false },
    sopa:     { firstCell: null, selecting: false, found: [] },
    memoria:  { flipped: [], matched: 0, moves: 0, locked: false },
    versiculo:{ loaded: false },
  },

  init() {
    if (!document.getElementById('games-grid')) return;
    this._bindEvents();
  },

  _bindEvents() {
    // Audience filter tabs
    document.addEventListener('click', e => {
      const tab = e.target.closest('.audience-tab');
      if (tab) this.filterGames(tab.dataset.audience);
    });

    // Game card open
    document.addEventListener('click', e => {
      const card = e.target.closest('.game-card[data-game]');
      if (card) this.openGame(card.dataset.game);
    });

    // Modal close button
    document.addEventListener('click', e => {
      if (e.target.closest('.game-modal-close')) this.closeGame();
    });

    // Modal backdrop click
    const modal = document.getElementById('game-modal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) this.closeGame(); });

    // Escape key
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeGame(); });

    // Dynamic content event delegation (trivia, memoria, versiculo)
    const gameContent = document.getElementById('game-content');
    if (gameContent) {
      gameContent.addEventListener('click', e => {
        if (e.target.closest('.trivia-opt'))      this._onTriviaOptClick(e.target.closest('.trivia-opt'));
        if (e.target.closest('.trivia-btn-again')) this.startTrivia();
        if (e.target.closest('.memoria-card'))    this._flipCard(e.target.closest('.memoria-card'));
        if (e.target.id === 'btn-fav')            this._favVersiculo();
        if (e.target.id === 'memoria-play-again') this._initMemoria();
      });
    }
  },

  filterGames(audience) {
    document.querySelectorAll('.audience-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.audience === audience)
    );
    document.querySelectorAll('.game-card').forEach(card => {
      const audiences = (card.dataset.audiences || '').split(',');
      card.dataset.hidden = audience === 'todos' || audiences.includes(audience) ? 'false' : 'true';
    });
  },

  openGame(id) {
    const modal = document.getElementById('game-modal');
    const content = document.getElementById('game-content');
    if (!modal || !content) return;
    this._clearGameTimers();
    content.innerHTML = '';
    if (id === 'trivia')    { content.innerHTML = this._buildTriviaHTML();    this.startTrivia(); }
    if (id === 'sopa')      { content.innerHTML = this._buildSopaHTML();      this._initSopa(); }
    if (id === 'memoria')   { content.innerHTML = this._buildMemoriaHTML();   this._initMemoria(); }
    if (id === 'versiculo') { content.innerHTML = this._buildVersiculoHTML(); this._initVersiculo(); }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeGame() {
    this._clearGameTimers();
    const modal = document.getElementById('game-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  },

  _clearGameTimers() {
    if (this.state.trivia.timer) { clearInterval(this.state.trivia.timer); this.state.trivia.timer = null; }
  },

  // ── TRIVIA ──────────────────────────────────────────────────────

  _TRIVIA_BANK: [
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
  ],

  _buildTriviaHTML() {
    return `<div id="trivia-wrap">
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
  },

  startTrivia() {
    const shuffled = [...this._TRIVIA_BANK].sort(() => Math.random() - 0.5);
    this.state.trivia.questions = shuffled.slice(0, 10);
    this.state.trivia.currentIdx = 0;
    this.state.trivia.score = 0;
    this._renderTriviaQuestion();
  },

  _renderTriviaQuestion() {
    const wrap = document.getElementById('trivia-wrap');
    if (!wrap) return;
    const { questions, currentIdx } = this.state.trivia;
    if (currentIdx >= questions.length) { this._endTrivia(); return; }

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
      `<button class="trivia-opt" data-correct="${i === q.ans}">${opt}</button>`
    ).join('');

    this.state.trivia.answered = false;
    this._startTriviaTimer();
  },

  _startTriviaTimer() {
    this._clearGameTimers();
    let secs = 30;
    const fill = document.getElementById('t-timer-fill');
    if (fill) { fill.style.width = '100%'; fill.classList.remove('urgent'); }
    this.state.trivia.timer = setInterval(() => {
      secs--;
      const pct = (secs / 30) * 100;
      if (fill) { fill.style.width = pct + '%'; if (secs <= 8) fill.classList.add('urgent'); }
      if (secs <= 0) {
        clearInterval(this.state.trivia.timer);
        this.state.trivia.timer = null;
        if (!this.state.trivia.answered) this._timeoutTrivia();
      }
    }, 1000);
  },

  _onTriviaOptClick(btn) {
    if (this.state.trivia.answered) return;
    const isCorrect = btn.dataset.correct === 'true';
    this.state.trivia.answered = true;
    this._clearGameTimers();

    const opts = document.querySelectorAll('.trivia-opt');
    const q = this.state.trivia.questions[this.state.trivia.currentIdx];
    opts.forEach((o, i) => { o.disabled = true; if (i === q.ans) o.classList.add('correct'); });

    if (isCorrect) { btn.classList.add('correct'); this.state.trivia.score++; giveXP(3, '🎯', '¡Respuesta correcta!', '+3 XP'); }
    else btn.classList.add('wrong');

    setTimeout(() => { this.state.trivia.currentIdx++; this._renderTriviaQuestion(); }, 1200);
  },

  _timeoutTrivia() {
    if (this.state.trivia.answered) return;
    this.state.trivia.answered = true;
    const opts = document.querySelectorAll('.trivia-opt');
    const q = this.state.trivia.questions[this.state.trivia.currentIdx];
    opts.forEach((o, i) => { o.disabled = true; if (i === q.ans) o.classList.add('correct'); });
    setTimeout(() => { this.state.trivia.currentIdx++; this._renderTriviaQuestion(); }, 1200);
  },

  _endTrivia() {
    const score = this.state.trivia.score;
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
      <button class="trivia-btn-again">🔄 Jugar de nuevo</button>`;
  },

  // ── SOPA DE LETRAS ───────────────────────────────────────────────

  _SOPA_WORDS: [
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
  ],

  _buildSopaGrid12() {
    const grid = Array.from({ length: 12 }, () => Array(12).fill(''));
    this._SOPA_WORDS.forEach(({ word, cells }) => {
      cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
    });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < 12; r++)
      for (let c = 0; c < 12; c++)
        if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    return grid;
  },

  _buildSopaHTML() {
    const grid = this._buildSopaGrid12();
    this._sopaGrid = grid;
    const gridHTML = grid.map((row, r) =>
      row.map((letter, c) => `<div class="sopa-cell" data-r="${r}" data-c="${c}">${letter}</div>`).join('')
    ).join('');
    const wordListHTML = this._SOPA_WORDS.map(w =>
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
        <div><div class="sopa-words-list">${wordListHTML}</div></div>
      </div>`;
  },

  _initSopa() {
    this.state.sopa = { firstCell: null, selecting: false, found: [] };
    const sopaGrid = document.getElementById('sopa-grid');
    if (!sopaGrid) return;
    sopaGrid.addEventListener('click', e => {
      const cell = e.target.closest('.sopa-cell');
      if (!cell || cell.classList.contains('found')) return;
      this._handleSopaCellClick(cell);
    });
  },

  _handleSopaCellClick(cell) {
    if (!this.state.sopa.selecting) {
      this.state.sopa.firstCell = cell;
      this.state.sopa.selecting = true;
      cell.classList.add('first-sel', 'selecting');
    } else {
      const first = this.state.sopa.firstCell;
      if (first === cell) { this._clearSopaSelection(); return; }
      this._checkSopaWord(first, cell);
      this._clearSopaSelection();
    }
  },

  _clearSopaSelection() {
    document.querySelectorAll('.sopa-cell.selecting, .sopa-cell.first-sel').forEach(c => {
      c.classList.remove('selecting', 'first-sel');
    });
    this.state.sopa.firstCell = null;
    this.state.sopa.selecting = false;
  },

  _cellsOnPath(r1, c1, r2, c2) {
    const cells = [];
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    for (let i = 0; i <= steps; i++) cells.push([r1 + dr * i, c1 + dc * i]);
    return cells;
  },

  _checkSopaWord(firstCell, lastCell) {
    const r1 = +firstCell.dataset.r, c1 = +firstCell.dataset.c;
    const r2 = +lastCell.dataset.r, c2 = +lastCell.dataset.c;
    const rowDiff = Math.abs(r2 - r1);
    const colDiff = Math.abs(c2 - c1);
    if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) return;
    const path = this._cellsOnPath(r1, c1, r2, c2);
    const attempt = path.map(([r, c]) => this._sopaGrid[r][c]).join('');
    const attemptRev = attempt.split('').reverse().join('');
    const match = this._SOPA_WORDS.find(w =>
      !this.state.sopa.found.includes(w.word) && (attempt === w.word || attemptRev === w.word)
    );
    if (match) this._markSopaWordFound(match, path);
  },

  _markSopaWordFound(match, path) {
    this.state.sopa.found.push(match.word);
    path.forEach(([r, c]) => {
      const cell = document.querySelector(`.sopa-cell[data-r="${r}"][data-c="${c}"]`);
      if (cell) { cell.classList.add('found'); cell.classList.remove('selecting', 'first-sel'); }
    });
    const wordEl = document.getElementById('sw-' + match.word);
    if (wordEl) wordEl.classList.add('found');
    const statusEl = document.getElementById('sopa-status');
    if (statusEl) statusEl.textContent = `${this.state.sopa.found.length} / 10 palabras encontradas`;
    giveXP(5, '🔤', `¡Encontraste ${match.word}!`, '+5 XP');
    if (this.state.sopa.found.length === this._SOPA_WORDS.length) {
      giveXP(10, '🎉', '¡Sopa completada!', '¡Todas las palabras encontradas! +10 XP');
      giveBadge('sopaletras');
      if (statusEl) statusEl.innerHTML = '<span style="color:#4caf50;font-weight:700">🎉 ¡Completada! Todas las palabras encontradas</span>';
    }
  },

  // ── MEMORIA ──────────────────────────────────────────────────────

  _MEMORIA_PAIRS: [
    { word: 'AMOR',      emoji: '❤️' }, { word: 'FE',       emoji: '🙏' },
    { word: 'PAZ',       emoji: '☮️' }, { word: 'GRACIA',   emoji: '✨' },
    { word: 'ESPERANZA', emoji: '🌟' }, { word: 'VERDAD',   emoji: '📖' },
    { word: 'SERVICIO',  emoji: '🤝' }, { word: 'HUMILDAD', emoji: '🌾' },
  ],

  _buildMemoriaHTML() {
    return `<div id="memoria-wrap">
      <div class="game-modal-title">🃏 Memoria Cristiana</div>
      <div class="game-modal-sub">Empareja valor con su símbolo. Memoriza y descúbrelos.</div>
      <div class="memoria-stats">
        <div class="mem-stat"><div class="mem-stat-num" id="mem-moves">0</div><div class="mem-stat-label">Movimientos</div></div>
        <div class="mem-stat"><div class="mem-stat-num" id="mem-pairs">0/8</div><div class="mem-stat-label">Pares</div></div>
      </div>
      <div class="memoria-grid" id="memoria-grid"></div>
      <div id="memoria-win" class="memoria-win" style="display:none"></div>
    </div>`;
  },

  _initMemoria() {
    this.state.memoria = { flipped: [], matched: 0, moves: 0, locked: false };
    const cards = [];
    this._MEMORIA_PAIRS.forEach(p => {
      cards.push({ id: p.word, type: 'word', label: p.word, emoji: p.emoji });
      cards.push({ id: p.word, type: 'emoji', label: p.emoji, emoji: p.emoji });
    });
    cards.sort(() => Math.random() - 0.5);
    const grid = document.getElementById('memoria-grid');
    if (!grid) return;
    grid.innerHTML = cards.map((card, idx) => `
      <div class="memoria-card" data-idx="${idx}" data-id="${card.id}" data-type="${card.type}">
        <div class="memoria-card-inner">
          <div class="memoria-card-face memoria-card-back">✝</div>
          <div class="memoria-card-face memoria-card-front">
            <span class="card-emoji">${card.type === 'emoji' ? card.label : card.emoji}</span>
            <span class="card-word">${card.type === 'word' ? card.label : ''}</span>
          </div>
        </div>
      </div>`).join('');
    const winEl = document.getElementById('memoria-win');
    if (winEl) winEl.style.display = 'none';
  },

  _flipCard(card) {
    if (this.state.memoria.locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    this.state.memoria.flipped.push(card);
    if (this.state.memoria.flipped.length === 2) {
      this.state.memoria.locked = true;
      this.state.memoria.moves++;
      const movesEl = document.getElementById('mem-moves');
      if (movesEl) movesEl.textContent = this.state.memoria.moves;
      this._checkMemoriaMatch();
    }
  },

  _checkMemoriaMatch() {
    const [a, b] = this.state.memoria.flipped;
    if (a.dataset.id === b.dataset.id && a.dataset.type !== b.dataset.type) {
      setTimeout(() => {
        a.classList.add('matched'); b.classList.add('matched');
        this.state.memoria.flipped = [];
        this.state.memoria.locked = false;
        this.state.memoria.matched++;
        const pairsEl = document.getElementById('mem-pairs');
        if (pairsEl) pairsEl.textContent = `${this.state.memoria.matched}/8`;
        if (this.state.memoria.matched === 8) this._memoriaWin();
      }, 600);
    } else {
      setTimeout(() => {
        a.classList.remove('flipped'); b.classList.remove('flipped');
        this.state.memoria.flipped = []; this.state.memoria.locked = false;
      }, 900);
    }
  },

  _memoriaWin() {
    giveXP(20, '🃏', '¡Memoria completada!', `${this.state.memoria.moves} movimientos · +20 XP`);
    giveBadge('memoria');
    const winEl = document.getElementById('memoria-win');
    if (winEl) {
      winEl.style.display = 'block';
      winEl.innerHTML = `
        <div class="memoria-win-title">🎉 ¡Completado!</div>
        <div class="memoria-win-sub">${this.state.memoria.moves} movimientos para completar los 8 pares · +20 XP</div>
        <button class="trivia-btn-again" id="memoria-play-again">🔄 Jugar de nuevo</button>`;
    }
  },

  // ── VERSÍCULO DEL DÍA ────────────────────────────────────────────

  _BOOKS_ES: [
    '', 'Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut',
    '1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras',
    'Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías',
    'Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías',
    'Jonás','Miqueas','Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías',
    'Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios',
    'Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses',
    '1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro',
    '1 Juan','2 Juan','3 Juan','Judas','Apocalipsis',
  ],

  _VERSE_FALLBACK: [
    { text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', ref: 'Juan 3:16' },
    { text: 'El Señor es mi pastor; nada me faltará.', ref: 'Salmos 23:1' },
    { text: 'Todo lo puedo en Cristo que me fortalece.', ref: 'Filipenses 4:13' },
    { text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.', ref: 'Proverbios 3:5' },
    { text: 'Buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', ref: 'Mateo 6:33' },
  ],

  _buildVersiculoHTML() {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem('ceevs_verse_' + today);
    const faved = !!localStorage.getItem('ceevs_fav_' + today);
    const verseBlock = cached
      ? this._renderVersiculoCard(JSON.parse(cached), faved)
      : `<div class="versiculo-loading" id="v-loading">Cargando versículo del día... ✦</div>`;
    return `<div id="versiculo-wrap">
      <div class="game-modal-title">✝️ Versículo del Día</div>
      <div class="game-modal-sub">Reina Valera 1960 — renovado cada día</div>
      <div id="versiculo-content">${verseBlock}</div>
    </div>`;
  },

  _renderVersiculoCard(verse, faved) {
    return `<div class="versiculo-card">
      <div class="versiculo-text">"${verse.text}"</div>
      <div class="versiculo-ref">— ${verse.ref} (RVR 1960)</div>
    </div>
    <div class="versiculo-actions">
      <button class="btn-fav ${faved ? 'faved' : ''}" id="btn-fav" ${faved ? 'disabled' : ''}>
        ${faved ? '⭐ Marcado como favorito' : '☆ Marcar como favorito (+5 XP)'}
      </button>
    </div>`;
  },

  _initVersiculo() {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('ceevs_verse_' + today)) return;
    fetch('https://bolls.life/get-random-verse/rvr1960/')
      .then(r => r.json())
      .then(data => {
        const rawText = (data.text || '').replace(/<[^>]+>/g, '').trim();
        const bookName = this._BOOKS_ES[data.book] || 'Biblia';
        const verse = { text: rawText, ref: `${bookName} ${data.chapter}:${data.verse}` };
        localStorage.setItem('ceevs_verse_' + today, JSON.stringify(verse));
        const container = document.getElementById('versiculo-content');
        if (container) {
          const faved = !!localStorage.getItem('ceevs_fav_' + today);
          container.innerHTML = this._renderVersiculoCard(verse, faved);
        }
      })
      .catch(() => {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const verse = this._VERSE_FALLBACK[dayOfYear % this._VERSE_FALLBACK.length];
        localStorage.setItem('ceevs_verse_' + today, JSON.stringify(verse));
        const container = document.getElementById('versiculo-content');
        if (container) {
          const faved = !!localStorage.getItem('ceevs_fav_' + today);
          container.innerHTML = this._renderVersiculoCard(verse, faved);
        }
      });
  },

  _favVersiculo() {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('ceevs_fav_' + today)) return;
    localStorage.setItem('ceevs_fav_' + today, '1');
    giveXP(5, '⭐', '¡Versículo guardado!', '+5 XP por tu favorito del día');
    const btn = document.getElementById('btn-fav');
    if (btn) { btn.textContent = '⭐ Marcado como favorito'; btn.classList.add('faved'); btn.disabled = true; }
  },
};

// Backward-compatible global stubs
function openGame(id) { Games.openGame(id); }
function closeGame() { Games.closeGame(); }
function filterGames(audience) { Games.filterGames(audience); }

App.register(Games);
