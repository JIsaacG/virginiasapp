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
    trivia:    { questions: [], currentIdx: 0, score: 0, streak: 0, bestStreak: 0, xpEarned: 0, timer: null, answered: false },
    sopa:      { firstCell: null, selecting: false, found: [], timer: null, secs: 0 },
    memoria:   { flipped: [], matched: 0, moves: 0, locked: false, timer: null, secs: 0, started: false },
    versiculo: { loaded: false },
    ordena:    { verses: [], round: 0, total: 5, correct: 0, pool: [], placed: [], checked: false },
  },

  init() {
    if (!document.getElementById('games-grid')) return;
    this._loadWordSearch();
    this._bindEvents();
  },

  // SDD-F5-ACT-002 — palabras de la sopa de letras desde data/word-search.json.
  // _SOPA_WORDS (más abajo) es el listado por defecto si la carga falla.
  _loadWordSearch() {
    fetch('data/word-search.json')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && data.status === 'approved' &&
            Array.isArray(data.words) && data.words.length) {
          this._SOPA_WORDS = data.words;
        }
      })
      .catch(() => { /* se mantiene el listado por defecto embebido */ });
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

    // Dynamic content event delegation (one action per click)
    const gameContent = document.getElementById('game-content');
    if (gameContent) {
      gameContent.addEventListener('click', e => {
        const opt = e.target.closest('.trivia-opt');
        if (opt) { this._onTriviaOptClick(opt); return; }
        if (e.target.closest('.trivia-next')) { this._nextTrivia(); return; }
        const card = e.target.closest('.memoria-card');
        if (card) { this._flipCard(card); return; }
        if (e.target.id === 'btn-fav') { this._favVersiculo(); return; }

        // "Jugar de nuevo" — todos comparten estilo; se distinguen por data-replay
        const again = e.target.closest('[data-replay]');
        if (again) {
          if (again.dataset.replay === 'trivia')  this.startTrivia();
          if (again.dataset.replay === 'memoria') this._initMemoria();
          if (again.dataset.replay === 'ordena')  this._initOrdena();
          return;
        }

        // Ordena el Versículo
        const chip = e.target.closest('.vs-chip');
        if (chip) { this._onOrdenaChip(chip); return; }
        if (e.target.closest('.vs-check')) { this._checkOrdena(); return; }
        if (e.target.closest('.vs-next'))  { this._nextOrdena(); return; }
        if (e.target.closest('.vs-clear')) { this._resetOrdenaRound(); return; }
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
    // La Sopa usa un modal más ancho para mostrar sus 12 columnas sin scroll horizontal
    const inner = document.getElementById('game-modal-inner');
    if (inner) inner.classList.toggle('game-modal-wide', id === 'sopa');
    content.innerHTML = '';
    // startTrivia / _initOrdena reconstruyen su propio HTML (para el "Jugar de nuevo")
    if (id === 'trivia')    { this.startTrivia(); }
    if (id === 'sopa')      { content.innerHTML = this._buildSopaHTML();      this._initSopa(); }
    if (id === 'memoria')   { content.innerHTML = this._buildMemoriaHTML();   this._initMemoria(); }
    if (id === 'versiculo') { content.innerHTML = this._buildVersiculoHTML(); this._initVersiculo(); }
    if (id === 'ordena')    { this._initOrdena(); }
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
    if (this.state.trivia.timer)  { clearInterval(this.state.trivia.timer);  this.state.trivia.timer = null; }
    if (this.state.sopa.timer)    { clearInterval(this.state.sopa.timer);    this.state.sopa.timer = null; }
    if (this.state.memoria.timer) { clearInterval(this.state.memoria.timer); this.state.memoria.timer = null; }
  },

  // Pequeña ráfaga de partículas doradas para celebrar (reusa .c-particle del sitio)
  _celebrate(originEl) {
    const host = originEl || document.getElementById('game-modal-inner');
    if (!host) return;
    const r = host.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + Math.min(r.height * 0.35, 180);
    const colors = ['#E6B17E', '#AB6423', '#4caf50', '#ffd86b', '#fff'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('div');
      p.className = 'c-particle';
      const size = 4 + Math.random() * 7;
      const angle = (Math.PI * 2 / 26) * i + Math.random() * 0.5;
      const dist = 60 + Math.random() * 140;
      p.style.cssText =
        `position:fixed;width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;` +
        `background:${colors[i % colors.length]};` +
        `--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;` +
        `opacity:${0.6 + Math.random() * 0.4};animation-duration:${0.6 + Math.random() * 0.5}s;z-index:9999;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  },

  _fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  // ── TRIVIA ──────────────────────────────────────────────────────

  _TRIVIA_BANK: [
    { q: '¿En qué año fue fundado el Centro Educativo Evangélico Virginia Sapp?', opts: ['1945', '1962', '1970', '1955'], ans: 1, exp: 'El CEEVS fue fundado en 1962 en Tegucigalpa, formando líderes con fe y valores desde entonces.' },
    { q: '¿Cuál versículo dice "Porque de tal manera amó Dios al mundo..."?', opts: ['Romanos 3:23', 'Juan 3:16', 'Salmos 23:1', 'Mateo 28:19'], ans: 1, exp: 'Juan 3:16 es uno de los versículos más conocidos: habla del amor de Dios y la vida eterna.' },
    { q: '¿Cómo se llama la misionera que dio nombre a nuestro instituto?', opts: ['Margaret Smith', 'Virginia Sapp', 'Helen Brown', 'Ruth Davis'], ans: 1, exp: 'Virginia Sapp fue la misionera cuyo legado de servicio inspira nuestra labor educativa.' },
    { q: '¿En qué ciudad de Honduras está ubicado el CEEVS?', opts: ['San Pedro Sula', 'La Ceiba', 'Tegucigalpa', 'Comayagua'], ans: 2, exp: 'El CEEVS está en Tegucigalpa, la capital de Honduras.' },
    { q: '¿Cuántos libros tiene la Biblia en total?', opts: ['60', '64', '66', '72'], ans: 2, exp: 'La Biblia tiene 66 libros: 39 del Antiguo Testamento y 27 del Nuevo Testamento.' },
    { q: '¿Cuál es el primer libro de la Biblia?', opts: ['Éxodo', 'Génesis', 'Mateo', 'Salmos'], ans: 1, exp: 'Génesis significa "origen": narra la creación del mundo por Dios.' },
    { q: '¿Quién escribió la mayoría de las epístolas del Nuevo Testamento?', opts: ['Pedro', 'Juan', 'Pablo', 'Santiago'], ans: 2, exp: 'El apóstol Pablo escribió 13 epístolas, llevando el evangelio a muchas ciudades.' },
    { q: '¿Cuál de estos es un fruto del Espíritu según Gálatas 5?', opts: ['Riqueza', 'Sabiduría', 'Amor', 'Fortaleza'], ans: 2, exp: 'El amor encabeza el fruto del Espíritu, junto con gozo, paz, paciencia y más.' },
    { q: '¿Con cuántos panes y peces alimentó Jesús a la multitud?', opts: ['10 peces y 2 panes', '2 peces y 7 panes', '5 panes y 2 peces', '3 panes y 5 peces'], ans: 2, exp: 'Con 5 panes y 2 peces Jesús alimentó a más de 5,000 personas: un milagro de provisión.' },
    { q: '¿En qué río fue bautizado Jesús?', opts: ['Río Nilo', 'Río Jordán', 'Río Éufrates', 'Río Tigris'], ans: 1, exp: 'Jesús fue bautizado por Juan el Bautista en el río Jordán.' },
    { q: '¿Cuál Salmo comienza con "El Señor es mi pastor"?', opts: ['Salmo 100', 'Salmo 91', 'Salmo 23', 'Salmo 1'], ans: 2, exp: 'El Salmo 23 expresa la confianza en Dios como nuestro pastor que cuida y guía.' },
    { q: '¿Cuántos discípulos cercanos eligió Jesús?', opts: ['7', '10', '12', '14'], ans: 2, exp: 'Jesús eligió a 12 discípulos para acompañarle y continuar su misión.' },
    { q: '¿Qué valor cristiano significa "ayudar a otros sin esperar recompensa"?', opts: ['Humildad', 'Servicio', 'Fe', 'Gracia'], ans: 1, exp: 'El servicio es entregar ayuda a los demás con amor, como enseñó Jesús al lavar los pies.' },
    { q: '¿Qué significa la palabra "Evangelio"?', opts: ['Buenas nuevas', 'Libro sagrado', 'Oración diaria', 'Ley de Dios'], ans: 0, exp: 'Evangelio significa "buenas nuevas": el mensaje de salvación en Jesucristo.' },
    { q: '¿Cuál fue el primer milagro de Jesús según el Evangelio de Juan?', opts: ['Sanar a un ciego', 'Convertir agua en vino', 'Resucitar a Lázaro', 'Multiplicar peces'], ans: 1, exp: 'En las bodas de Caná, Jesús convirtió el agua en vino: su primera señal.' },
    { q: '¿En qué ciudad nació Jesús?', opts: ['Nazaret', 'Jerusalén', 'Belén', 'Jericó'], ans: 2, exp: 'Jesús nació en Belén, cumpliendo la profecía del profeta Miqueas.' },
    { q: '¿Qué instrumento musical tocaba el rey David?', opts: ['Flauta', 'Arpa', 'Trompeta', 'Lira'], ans: 1, exp: 'David tocaba el arpa y compuso muchos Salmos de alabanza a Dios.' },
    { q: '¿Cuál es el mandamiento más grande según Jesús?', opts: ['No mentirás', 'Amar a Dios con todo el corazón', 'Honrarás padre y madre', 'No matarás'], ans: 1, exp: 'Jesús dijo que amar a Dios con todo el corazón es el primer y gran mandamiento.' },
    { q: '¿Cuántos libros tiene el Nuevo Testamento?', opts: ['22', '25', '27', '29'], ans: 2, exp: 'El Nuevo Testamento tiene 27 libros, desde Mateo hasta Apocalipsis.' },
    { q: '¿Qué significan las siglas "CEEVS"?', opts: ['Centro Educativo Evangélico Virginia Sapp', 'Colegio Evangélico Educativo Virginia Sapp', 'Centro Educativo Evangélico Vida Sapp', 'Colegio Educativo Evangélico Valle Sapp'], ans: 0, exp: 'CEEVS significa Centro Educativo Evangélico Virginia Sapp.' },
    { q: '¿Quién construyó el arca por mandato de Dios?', opts: ['Abraham', 'Moisés', 'Noé', 'José'], ans: 2, exp: 'Noé construyó el arca por fe y salvó a su familia y a los animales del diluvio.' },
    { q: '¿Quién guió al pueblo de Israel fuera de Egipto?', opts: ['Josué', 'Moisés', 'Aarón', 'Elías'], ans: 1, exp: 'Moisés guió a Israel fuera de la esclavitud en Egipto hacia la tierra prometida.' },
    { q: '¿Cuántos días estuvo Jesús en la tumba antes de resucitar?', opts: ['1 día', '3 días', '7 días', '40 días'], ans: 1, exp: 'Jesús resucitó al tercer día, victoria central de la fe cristiana: la Pascua.' },
    { q: '¿Cuál es el último libro de la Biblia?', opts: ['Judas', 'Hebreos', 'Apocalipsis', 'Malaquías'], ans: 2, exp: 'Apocalipsis cierra la Biblia con la esperanza del regreso de Cristo.' },
    { q: '¿Qué pidió Salomón a Dios cuando le ofreció lo que quisiera?', opts: ['Riquezas', 'Sabiduría', 'Larga vida', 'Poder'], ans: 1, exp: 'Salomón pidió sabiduría para gobernar con justicia, y Dios se la concedió.' },
    { q: '¿Cómo se llamaba el gigante que David venció con una honda?', opts: ['Goliat', 'Sansón', 'Nabucodonosor', 'Faraón'], ans: 0, exp: 'David venció al gigante Goliat confiando en Dios, no en su tamaño.' },
    { q: '¿Qué celebra la Navidad en la fe cristiana?', opts: ['La resurrección', 'El nacimiento de Jesús', 'La creación', 'Pentecostés'], ans: 1, exp: 'La Navidad celebra el nacimiento de Jesús, Dios hecho hombre por amor a nosotros.' },
    { q: '¿Cuántos mandamientos recibió Moisés en el monte Sinaí?', opts: ['7', '10', '12', '5'], ans: 1, exp: 'Dios entregó los Diez Mandamientos a Moisés como guía de vida para su pueblo.' },
    { q: '¿Qué valor mostramos al reconocer nuestros errores sin orgullo?', opts: ['Humildad', 'Justicia', 'Valentía', 'Paciencia'], ans: 0, exp: 'La humildad reconoce nuestros límites y honra a Dios y a los demás.' },
    { q: '¿Quién traicionó a Jesús por treinta monedas de plata?', opts: ['Pedro', 'Tomás', 'Judas', 'Felipe'], ans: 2, exp: 'Judas Iscariote entregó a Jesús, una lección sobre las consecuencias de la avaricia.' },
  ],

  _buildTriviaHTML() {
    return `<div id="trivia-wrap">
      <div class="game-modal-title">🧠 Trivia Bíblica</div>
      <div class="game-modal-sub">10 preguntas · 30 segundos por pregunta · ¡encadena rachas!</div>
      <div class="trivia-topbar">
        <div class="trivia-progress">
          <div class="trivia-progress-bar"><div class="trivia-progress-fill" id="t-prog-fill" style="width:10%"></div></div>
          <span class="trivia-progress-label" id="t-prog-label">1 / 10</span>
        </div>
        <div class="trivia-streak" id="t-streak" data-on="false">🔥 <span id="t-streak-num">0</span></div>
      </div>
      <div class="trivia-timer-wrap">
        <div class="trivia-timer-bar"><div class="trivia-timer-fill" id="t-timer-fill" style="width:100%"></div></div>
      </div>
      <div id="t-question" class="trivia-question"></div>
      <div class="trivia-options" id="t-options"></div>
      <div id="t-feedback" class="trivia-feedback"></div>
    </div>`;
  },

  startTrivia() {
    const content = document.getElementById('game-content');
    if (content) content.innerHTML = this._buildTriviaHTML();
    const shuffled = [...this._TRIVIA_BANK].sort(() => Math.random() - 0.5);
    this.state.trivia.questions = shuffled.slice(0, 10);
    this.state.trivia.currentIdx = 0;
    this.state.trivia.score = 0;
    this.state.trivia.streak = 0;
    this.state.trivia.bestStreak = 0;
    this.state.trivia.xpEarned = 0;
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
    this._updateStreakUI();

    const qEl = document.getElementById('t-question');
    if (qEl) qEl.textContent = q.q;

    const fb = document.getElementById('t-feedback');
    if (fb) { fb.innerHTML = ''; fb.classList.remove('show'); }

    const optsEl = document.getElementById('t-options');
    if (!optsEl) return;
    optsEl.innerHTML = q.opts.map((opt, i) =>
      `<button class="trivia-opt" data-correct="${i === q.ans}">${opt}</button>`
    ).join('');

    this.state.trivia.answered = false;
    this._startTriviaTimer();
  },

  _updateStreakUI() {
    const el = document.getElementById('t-streak');
    const num = document.getElementById('t-streak-num');
    if (num) num.textContent = this.state.trivia.streak;
    if (el) el.dataset.on = this.state.trivia.streak >= 2 ? 'true' : 'false';
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

    if (isCorrect) {
      btn.classList.add('correct');
      this.state.trivia.score++;
      this.state.trivia.streak++;
      this.state.trivia.bestStreak = Math.max(this.state.trivia.bestStreak, this.state.trivia.streak);
      const streak = this.state.trivia.streak;
      const pts = streak >= 5 ? 5 : streak >= 3 ? 4 : 3;
      this.state.trivia.xpEarned += pts;
      const bonusMsg = streak >= 3 ? ` · 🔥 racha x${streak}` : '';
      giveXP(pts, '🎯', '¡Respuesta correcta!', `+${pts} XP${bonusMsg}`);
    } else {
      btn.classList.add('wrong');
      this.state.trivia.streak = 0;
    }
    this._updateStreakUI();
    this._showTriviaFeedback(isCorrect, q);
  },

  _timeoutTrivia() {
    if (this.state.trivia.answered) return;
    this.state.trivia.answered = true;
    this.state.trivia.streak = 0;
    this._updateStreakUI();
    const opts = document.querySelectorAll('.trivia-opt');
    const q = this.state.trivia.questions[this.state.trivia.currentIdx];
    opts.forEach((o, i) => { o.disabled = true; if (i === q.ans) o.classList.add('correct'); });
    this._showTriviaFeedback(false, q, true);
  },

  _showTriviaFeedback(isCorrect, q, timedOut) {
    const fb = document.getElementById('t-feedback');
    if (!fb) return;
    const isLast = this.state.trivia.currentIdx >= 9;
    const head = timedOut
      ? '⏱ ¡Se acabó el tiempo!'
      : isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto';
    fb.className = `trivia-feedback show ${isCorrect ? 'ok' : 'no'}`;
    fb.innerHTML = `
      <div class="trivia-fb-head">${head}</div>
      <div class="trivia-fb-exp">${q.exp || ''}</div>
      <button class="trivia-next">${isLast ? 'Ver resultados →' : 'Siguiente pregunta →'}</button>`;
  },

  _nextTrivia() {
    this.state.trivia.currentIdx++;
    this._renderTriviaQuestion();
  },

  _endTrivia() {
    const { score, bestStreak, xpEarned } = this.state.trivia;
    const wrap = document.getElementById('trivia-wrap');
    if (!wrap) return;
    const bonus = 15;
    giveXP(bonus, '🏆', '¡Trivia completada!', `${score}/10 correctas · +${bonus} XP`);
    giveBadge('trivia');
    const total = xpEarned + bonus;
    const msgs = ['¡Sigue practicando!', '¡Buen intento!', '¡Muy bien!', '¡Excelente!', '¡Perfecto!'];
    const msgIdx = Math.min(Math.floor(score / 2.5), 4);
    wrap.innerHTML = `
      <div class="game-modal-title">🧠 Trivia Bíblica</div>
      <div class="game-modal-sub">¡Completada!</div>
      <div class="trivia-score-wrap">
        <div class="trivia-score-num">${score}<span style="font-size:1.59375rem;opacity:.5">/10</span></div>
        <div class="trivia-score-sub">${msgs[msgIdx]}</div>
        <div class="trivia-result-stats">
          <div class="trivia-rs"><span class="trivia-rs-num">${Math.round(score / 10 * 100)}%</span><span class="trivia-rs-lbl">Acierto</span></div>
          <div class="trivia-rs"><span class="trivia-rs-num">🔥 ${bestStreak}</span><span class="trivia-rs-lbl">Mejor racha</span></div>
          <div class="trivia-rs"><span class="trivia-rs-num">+${total}</span><span class="trivia-rs-lbl">XP ganados</span></div>
        </div>
      </div>
      <button class="trivia-btn-again" data-replay="trivia">🔄 Jugar de nuevo</button>`;
    if (score >= 7) this._celebrate(wrap);
  },

  // ── SOPA DE LETRAS (generación dinámica) ─────────────────────────

  _SOPA_WORDS: [
    { word: 'AMOR' },      { word: 'FE' },        { word: 'PAZ' },
    { word: 'BIBLIA' },    { word: 'GRACIA' },    { word: 'ORACION' },
    { word: 'VERDAD' },    { word: 'FAMILIA' },   { word: 'JESUS' },
    { word: 'ESPERANZA' }, { word: 'BONDAD' },    { word: 'PERDON' },
  ],

  _GRID_SIZE: 12,

  // Normaliza a A-Z sin acentos para que coincida con la rejilla
  _normWord(w) {
    return (w || '').toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z]/g, '');
  },

  // Coloca las palabras al azar en 8 direcciones, permitiendo cruces compatibles
  _generateSopa() {
    const size = this._GRID_SIZE;
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
    const placements = [];

    const fits = (word, r, c, dr, dc) => {
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i, cc = c + dc * i;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) return false;
        const cur = grid[rr][cc];
        if (cur && cur !== word[i]) return false;
      }
      return true;
    };

    const words = this._SOPA_WORDS
      .map(w => this._normWord(w.word))
      .filter(w => w.length >= 2 && w.length <= size)
      .sort((a, b) => b.length - a.length);

    words.forEach(word => {
      for (let tries = 0; tries < 250; tries++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);
        if (!fits(word, r, c, dr, dc)) continue;
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i, cc = c + dc * i;
          grid[rr][cc] = word[i];
          cells.push([rr, cc]);
        }
        placements.push({ word, cells });
        break;
      }
    });

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];

    return { grid, placements };
  },

  _buildSopaHTML() {
    const size = this._GRID_SIZE;
    const { grid, placements } = this._generateSopa();
    this._sopaGrid = grid;
    this._sopaPlacements = placements;
    const gridHTML = grid.map((row, r) =>
      row.map((letter, c) => `<div class="sopa-cell" data-r="${r}" data-c="${c}">${letter}</div>`).join('')
    ).join('');
    const wordListHTML = placements.map(p =>
      `<div class="sopa-word-item" id="sw-${p.word}">${p.word}</div>`
    ).join('');
    const total = placements.length;
    return `
      <div class="game-modal-title">🔤 Sopa de Letras</div>
      <div class="game-modal-sub">Encuentra las ${total} palabras. ¡Cada partida es distinta!</div>
      <div class="sopa-topbar">
        <span class="sopa-status" id="sopa-status">0 / ${total} encontradas</span>
        <span class="sopa-clock" id="sopa-clock">⏱ 0:00</span>
      </div>
      <div class="sopa-layout">
        <div class="sopa-grid-wrap">
          <div class="sopa-grid" id="sopa-grid" style="grid-template-columns:repeat(${size},1fr)">${gridHTML}</div>
          <p class="sopa-hint">Toca la letra inicial → luego la letra final de la palabra (➡️ ⬇️ ↘️ en cualquier dirección)</p>
        </div>
        <div><div class="sopa-words-list">${wordListHTML}</div></div>
      </div>`;
  },

  _initSopa() {
    this.state.sopa = { firstCell: null, selecting: false, found: [], timer: null, secs: 0 };
    const sopaGrid = document.getElementById('sopa-grid');
    if (!sopaGrid) return;
    sopaGrid.addEventListener('click', e => {
      const cell = e.target.closest('.sopa-cell');
      if (!cell || cell.classList.contains('found')) return;
      this._startSopaTimer();
      this._handleSopaCellClick(cell);
    });
  },

  _startSopaTimer() {
    if (this.state.sopa.timer) return;
    const clock = document.getElementById('sopa-clock');
    this.state.sopa.timer = setInterval(() => {
      this.state.sopa.secs++;
      if (clock) clock.textContent = '⏱ ' + this._fmtTime(this.state.sopa.secs);
    }, 1000);
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
    const match = this._sopaPlacements.find(p =>
      !this.state.sopa.found.includes(p.word) && (attempt === p.word || attemptRev === p.word)
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
    const total = this._sopaPlacements.length;
    if (statusEl) statusEl.textContent = `${this.state.sopa.found.length} / ${total} encontradas`;
    giveXP(5, '🔤', `¡Encontraste ${match.word}!`, '+5 XP');
    if (this.state.sopa.found.length === total) {
      if (this.state.sopa.timer) { clearInterval(this.state.sopa.timer); this.state.sopa.timer = null; }
      const fast = this.state.sopa.secs <= 90 ? 10 : 0;
      giveXP(10 + fast, '🎉', '¡Sopa completada!', fast ? '¡Rápido! +20 XP' : '¡Todas encontradas! +10 XP');
      giveBadge('sopaletras');
      if (statusEl) statusEl.innerHTML = `<span style="color:#4caf50;font-weight:700">🎉 ¡Completada en ${this._fmtTime(this.state.sopa.secs)}!</span>`;
      this._celebrate(document.getElementById('sopa-grid'));
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
    const best = localStorage.getItem('ceevs_mem_best');
    const bestLabel = best ? `${best} mov.` : '—';
    return `<div id="memoria-wrap">
      <div class="game-modal-title">🃏 Memoria Cristiana</div>
      <div class="game-modal-sub">Empareja cada valor con su símbolo. ¡Hazlo en los menos movimientos posibles!</div>
      <div class="memoria-stats">
        <div class="mem-stat"><div class="mem-stat-num" id="mem-moves">0</div><div class="mem-stat-label">Movimientos</div></div>
        <div class="mem-stat"><div class="mem-stat-num" id="mem-pairs">0/8</div><div class="mem-stat-label">Pares</div></div>
        <div class="mem-stat"><div class="mem-stat-num" id="mem-time">0:00</div><div class="mem-stat-label">Tiempo</div></div>
        <div class="mem-stat"><div class="mem-stat-num" id="mem-best">${bestLabel}</div><div class="mem-stat-label">Récord</div></div>
      </div>
      <div class="memoria-grid" id="memoria-grid"></div>
      <div id="memoria-win" class="memoria-win" style="display:none"></div>
    </div>`;
  },

  _initMemoria() {
    if (this.state.memoria.timer) { clearInterval(this.state.memoria.timer); }
    this.state.memoria = { flipped: [], matched: 0, moves: 0, locked: false, timer: null, secs: 0, started: false };
    const movesEl = document.getElementById('mem-moves');
    const pairsEl = document.getElementById('mem-pairs');
    const timeEl = document.getElementById('mem-time');
    if (movesEl) movesEl.textContent = '0';
    if (pairsEl) pairsEl.textContent = '0/8';
    if (timeEl) timeEl.textContent = '0:00';

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
    if (winEl) { winEl.style.display = 'none'; winEl.innerHTML = ''; }
  },

  _startMemoriaTimer() {
    if (this.state.memoria.started) return;
    this.state.memoria.started = true;
    const timeEl = document.getElementById('mem-time');
    this.state.memoria.timer = setInterval(() => {
      this.state.memoria.secs++;
      if (timeEl) timeEl.textContent = this._fmtTime(this.state.memoria.secs);
    }, 1000);
  },

  _flipCard(card) {
    if (this.state.memoria.locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    this._startMemoriaTimer();
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
    if (this.state.memoria.timer) { clearInterval(this.state.memoria.timer); this.state.memoria.timer = null; }
    const moves = this.state.memoria.moves;
    const secs = this.state.memoria.secs;
    const prevBest = parseInt(localStorage.getItem('ceevs_mem_best') || '0');
    const isRecord = !prevBest || moves < prevBest;
    if (isRecord) localStorage.setItem('ceevs_mem_best', moves);

    giveXP(20, '🃏', '¡Memoria completada!', `${moves} movimientos · +20 XP`);
    giveBadge('memoria');
    const winEl = document.getElementById('memoria-win');
    if (winEl) {
      winEl.style.display = 'block';
      winEl.innerHTML = `
        <div class="memoria-win-title">🎉 ¡Completado!</div>
        <div class="memoria-win-sub">${moves} movimientos · ${this._fmtTime(secs)} · +20 XP${isRecord ? ' · 🏅 ¡Nuevo récord!' : ''}</div>
        <button class="trivia-btn-again" data-replay="memoria">🔄 Jugar de nuevo</button>`;
    }
    const bestEl = document.getElementById('mem-best');
    if (bestEl) bestEl.textContent = localStorage.getItem('ceevs_mem_best') + ' mov.';
    this._celebrate(document.getElementById('memoria-grid'));
  },

  // ── ORDENA EL VERSÍCULO (nuevo) ──────────────────────────────────

  _VERSE_BUILD: [
    { ref: 'Juan 3:16',        text: 'Porque de tal manera amó Dios al mundo' },
    { ref: 'Salmos 23:1',      text: 'El Señor es mi pastor nada me faltará' },
    { ref: 'Filipenses 4:13',  text: 'Todo lo puedo en Cristo que me fortalece' },
    { ref: 'Mateo 22:39',      text: 'Amarás a tu prójimo como a ti mismo' },
    { ref: 'Salmos 119:105',   text: 'Lámpara es a mis pies tu palabra' },
    { ref: 'Josué 1:9',        text: 'Esfuérzate y sé valiente no temas' },
    { ref: 'Proverbios 3:5',   text: 'Fíate de Jehová de todo tu corazón' },
    { ref: 'Salmos 46:10',     text: 'Estad quietos y conoced que yo soy Dios' },
    { ref: 'Mateo 6:33',       text: 'Buscad primeramente el reino de Dios' },
    { ref: '1 Juan 4:8',       text: 'Dios es amor el que ama conoce a Dios' },
    { ref: 'Hebreos 11:1',     text: 'La fe es la certeza de lo que se espera' },
    { ref: 'Salmos 118:24',    text: 'Este es el día que hizo Jehová' },
  ],

  _buildOrdenaHTML() {
    return `<div id="ordena-wrap">
      <div class="game-modal-title">📜 Ordena el Versículo</div>
      <div class="game-modal-sub">Toca las palabras en el orden correcto para reconstruir el versículo.</div>
      <div class="vs-topbar">
        <span class="vs-round" id="vs-round">Versículo 1 / 5</span>
        <span class="vs-ref" id="vs-ref"></span>
      </div>
      <div class="vs-answer" id="vs-answer"></div>
      <div class="vs-pool" id="vs-pool"></div>
      <div class="vs-feedback" id="vs-feedback"></div>
      <div class="vs-actions">
        <button class="vs-clear">↺ Reiniciar</button>
        <button class="vs-check" disabled>Comprobar ✓</button>
      </div>
    </div>`;
  },

  _initOrdena() {
    const content = document.getElementById('game-content');
    if (content) content.innerHTML = this._buildOrdenaHTML();
    const all = [...this._VERSE_BUILD].sort(() => Math.random() - 0.5);
    this.state.ordena = {
      verses: all.slice(0, 5),
      round: 0,
      total: 5,
      correct: 0,
      pool: [],
      placed: [],
      checked: false,
    };
    this._loadOrdenaRound();
  },

  _loadOrdenaRound() {
    const st = this.state.ordena;
    if (st.round >= st.total) { this._endOrdena(); return; }
    const verse = st.verses[st.round];
    st.answer = verse.text.split(' ');
    st.placed = [];
    // pool con índice para barajar de forma estable
    st.pool = verse.text.split(' ')
      .map((w, i) => ({ w, i }))
      .sort(() => Math.random() - 0.5);
    st.checked = false;

    const roundEl = document.getElementById('vs-round');
    const refEl = document.getElementById('vs-ref');
    if (roundEl) roundEl.textContent = `Versículo ${st.round + 1} / ${st.total}`;
    if (refEl) refEl.textContent = verse.ref;
    this._renderOrdena();
  },

  _renderOrdena() {
    const st = this.state.ordena;
    const answerEl = document.getElementById('vs-answer');
    const poolEl = document.getElementById('vs-pool');
    const checkBtn = document.querySelector('.vs-check');
    const fb = document.getElementById('vs-feedback');
    if (!answerEl || !poolEl) return;

    answerEl.innerHTML = st.placed.length
      ? st.placed.map((it, idx) => `<button class="vs-chip vs-placed" data-zone="placed" data-i="${idx}">${it.w}</button>`).join('')
      : '<span class="vs-answer-hint">Toca abajo para construir el versículo…</span>';

    poolEl.innerHTML = st.pool.map((it, idx) =>
      `<button class="vs-chip" data-zone="pool" data-i="${idx}">${it.w}</button>`
    ).join('');

    if (checkBtn) checkBtn.disabled = st.pool.length !== 0;
    if (fb) { fb.className = 'vs-feedback'; fb.innerHTML = ''; }
  },

  _onOrdenaChip(chip) {
    const st = this.state.ordena;
    if (st.checked) return;
    const zone = chip.dataset.zone;
    const i = +chip.dataset.i;
    if (zone === 'pool') {
      const [item] = st.pool.splice(i, 1);
      st.placed.push(item);
    } else {
      const [item] = st.placed.splice(i, 1);
      st.pool.push(item);
    }
    this._renderOrdena();
  },

  _resetOrdenaRound() {
    const st = this.state.ordena;
    if (st.checked) return;
    st.pool = st.pool.concat(st.placed).sort(() => Math.random() - 0.5);
    st.placed = [];
    this._renderOrdena();
  },

  _checkOrdena() {
    const st = this.state.ordena;
    if (st.pool.length !== 0 || st.checked) return;
    const attempt = st.placed.map(it => it.w).join(' ');
    const target = st.answer.join(' ');
    const fb = document.getElementById('vs-feedback');
    const answerEl = document.getElementById('vs-answer');

    if (attempt === target) {
      st.checked = true;
      st.correct++;
      giveXP(6, '📜', '¡Versículo correcto!', '+6 XP');
      if (answerEl) answerEl.querySelectorAll('.vs-chip').forEach(c => c.classList.add('ok'));
      const verse = st.verses[st.round];
      const isLast = st.round >= st.total - 1;
      if (fb) {
        fb.className = 'vs-feedback show ok';
        fb.innerHTML = `<div class="vs-fb-head">✅ ¡Bien hecho! <em>${verse.ref}</em></div>
          <button class="vs-next">${isLast ? 'Ver resultados →' : 'Siguiente versículo →'}</button>`;
      }
      this._celebrate(answerEl);
    } else {
      // marcar las palabras mal colocadas, permitir corregir
      if (answerEl) {
        answerEl.querySelectorAll('.vs-chip').forEach((c, idx) => {
          if (st.placed[idx] && st.placed[idx].w !== st.answer[idx]) c.classList.add('bad');
        });
        answerEl.classList.add('vs-shake');
        setTimeout(() => answerEl.classList.remove('vs-shake'), 500);
      }
      if (fb) {
        fb.className = 'vs-feedback show no';
        fb.innerHTML = '<div class="vs-fb-head">❌ Aún no. Revisa las palabras en rojo e inténtalo de nuevo.</div>';
      }
    }
  },

  _nextOrdena() {
    this.state.ordena.round++;
    this._loadOrdenaRound();
  },

  _endOrdena() {
    const st = this.state.ordena;
    const wrap = document.getElementById('ordena-wrap');
    if (!wrap) return;
    const bonus = 12;
    giveXP(bonus, '🏆', '¡Versículos completados!', `${st.correct}/${st.total} · +${bonus} XP`);
    giveBadge('versebuilder');
    wrap.innerHTML = `
      <div class="game-modal-title">📜 Ordena el Versículo</div>
      <div class="game-modal-sub">¡Completado!</div>
      <div class="trivia-score-wrap">
        <div class="trivia-score-num">${st.correct}<span style="font-size:1.59375rem;opacity:.5">/${st.total}</span></div>
        <div class="trivia-score-sub">¡Versículos reconstruidos! +${st.correct * 6 + bonus} XP ganados</div>
      </div>
      <button class="trivia-btn-again" data-replay="ordena">🔄 Jugar de nuevo</button>`;
    this._celebrate(wrap);
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
