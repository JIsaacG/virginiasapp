/**
 * MISION AULA — Aula virtual de la Misión Evangelística
 *
 * Dual-mode IIFE (mismo patrón que inventory.js):
 * - En mision-evangelistica.html: módulo público que renderiza avisos, cursos
 *   y el visor de lecciones, con progreso local del visitante + XP.
 * - En admin.html: API CRUD + render de la pestaña "Misión" del panel.
 *
 * localStorage key: ceevs_mision_aula → JSON { avisos: [], cursos: [] }.
 * La clave se publica al servidor vía admin-sync.js (lista CONFIG_KEYS).
 * El progreso del visitante vive en ceevs_aula_progress (solo local, NO se publica).
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ceevs_mision_aula';
  var PROGRESS_KEY = 'ceevs_aula_progress';

  var CATEGORIES = ['Niñez', 'Preadolescentes', 'Adolescentes', 'Familias', 'Docentes y líderes'];

  var TIPOS = {
    leccion:   { icon: '📝', label: 'Lección de lectura' },
    video:     { icon: '🎬', label: 'Video' },
    documento: { icon: '📄', label: 'Documento' },
    audio:     { icon: '🎧', label: 'Audio' },
    enlace:    { icon: '🔗', label: 'Enlace' }
  };

  var CAT_EMOJI = {
    'Niñez': '🧸',
    'Preadolescentes': '🌱',
    'Adolescentes': '🔥',
    'Familias': '🏠',
    'Docentes y líderes': '🎓'
  };

  /* Contenido de ejemplo: se muestra mientras el panel no haya guardado nada.
     Al primer cambio desde el admin, se materializa y queda 100% editable. */
  var DEFAULT_DATA = {
    avisos: [
      {
        id: 'a-bienvenida',
        titulo: 'Bienvenidos al aula virtual de la Misión Evangelística',
        texto: 'En este espacio el Centro publicará devocionales, videos, guías y materiales del Evangelio para estudiar en familia. Exploren los cursos disponibles y marquen su avance lección por lección.',
        fecha: '2026-07-01T12:00:00.000Z'
      }
    ],
    cursos: [
      {
        id: 'c-evangelio',
        titulo: 'Fundamentos del Evangelio para la familia',
        categoria: 'Familias',
        descripcion: 'Un recorrido breve por el corazón del mensaje cristiano: qué es el Evangelio, por qué es buena noticia y cómo conversarlo en casa.',
        imagenUrl: '',
        activo: true,
        orden: 0,
        lecciones: [
          {
            id: 'l-ev-1', tipo: 'leccion', titulo: '¿Qué es el Evangelio?', nota: 'Lectura de 5 minutos', url: '',
            texto: 'Evangelio significa "buena noticia". Es el anuncio de que Dios amó tanto al mundo que dio a su Hijo unigénito, para que todo aquel que en Él cree no se pierda, sino que tenga vida eterna (Juan 3:16).\n\nLa Biblia enseña que todos hemos pecado y estamos separados de Dios (Romanos 3:23), pero que Cristo murió por nuestros pecados y resucitó al tercer día (1 Corintios 15:3-4). La salvación no se gana con esfuerzo humano: es un regalo de la gracia de Dios que se recibe por la fe (Efesios 2:8-9).\n\nPara conversar en familia: ¿por qué el Evangelio es una "buena noticia" y no una lista de reglas?'
          },
          {
            id: 'l-ev-2', tipo: 'leccion', titulo: 'Cómo compartir el Evangelio con sus hijos', nota: 'Lectura de 7 minutos', url: '',
            texto: 'Los niños aprenden de la fe primero en casa. Algunas ideas prácticas:\n\n1. Hablen de Dios con naturalidad, en la mesa o en el camino (Deuteronomio 6:6-7), no solo en momentos "religiosos".\n2. Lean juntos historias bíblicas cortas y pregunten: ¿qué nos enseña esto sobre Dios?\n3. Oren en voz alta por cosas concretas de la semana, y celebren cuando Dios responda.\n4. Respondan las preguntas difíciles con honestidad; está bien decir "no lo sé, busquémoslo juntos".\n5. Sobre todo, dejen que sus hijos vean el Evangelio en su forma de perdonar, servir y amar.'
          },
          {
            id: 'l-ev-3', tipo: 'enlace', titulo: 'Lee la Biblia en línea (Reina-Valera 1960)', nota: 'Recurso externo', texto: '',
            url: 'https://www.biblegateway.com/versions/Reina-Valera-1960-RVR1960-Biblia/'
          }
        ]
      },
      {
        id: 'c-devocionales',
        titulo: 'Devocionales para hacer en casa',
        categoria: 'Familias',
        descripcion: 'Devocionales breves para leer en la mesa: un pasaje, una reflexión y preguntas para conversar antes de orar juntos.',
        imagenUrl: '',
        activo: true,
        orden: 1,
        lecciones: [
          {
            id: 'l-dev-1', tipo: 'leccion', titulo: 'Devocional 1 — El amor de Dios (Juan 3:16)', nota: '10 minutos en familia', url: '',
            texto: 'Lean juntos Juan 3:16.\n\nReflexión: el amor de Dios no es una idea lejana: se demostró en una acción concreta, entregar a su Hijo. Nadie en la familia tiene que ganarse ese amor; se recibe.\n\nPara conversar: ¿cómo demostramos en casa que nos amamos? ¿Qué le agradecemos hoy a Dios?\n\nOración sugerida: "Gracias, Padre, porque nos amaste primero. Ayúdanos a amarte y a amarnos como familia. Amén."'
          },
          {
            id: 'l-dev-2', tipo: 'leccion', titulo: 'Devocional 2 — La paz de Dios (Filipenses 4:6-7)', nota: '10 minutos en familia', url: '',
            texto: 'Lean juntos Filipenses 4:6-7.\n\nReflexión: Dios no nos pide fingir que no hay problemas, nos invita a entregárselos en oración, con gratitud. Su paz cuida el corazón como un guardia cuida una puerta.\n\nPara conversar: ¿qué preocupación quiere entregar cada uno a Dios esta semana?\n\nOración sugerida: "Señor, te entregamos nuestras preocupaciones. Danos tu paz que sobrepasa todo entendimiento. Amén."'
          }
        ]
      },
      {
        id: 'c-ninez',
        titulo: 'Historias bíblicas para los más pequeños',
        categoria: 'Niñez',
        descripcion: 'Relatos bíblicos contados de forma sencilla, con una idea central y una actividad para que los niños la recuerden.',
        imagenUrl: '',
        activo: true,
        orden: 2,
        lecciones: [
          {
            id: 'l-nin-1', tipo: 'leccion', titulo: 'La creación — Dios hizo todo bueno', nota: 'Génesis 1', url: '',
            texto: 'Al principio no había nada, y Dios creó todo con su palabra: la luz, el cielo, el mar, las plantas, los animales… y al final creó a las personas, a su imagen. Y vio Dios todo lo que había hecho, y era bueno en gran manera (Génesis 1:31).\n\nIdea central: todo lo que existe lo hizo Dios, y tú eres su creación más especial.\n\nActividad: salgan al patio o miren por la ventana y nombren 5 cosas que Dios creó. Den gracias por cada una.'
          },
          {
            id: 'l-nin-2', tipo: 'leccion', titulo: 'David y Goliat — Dios es nuestra fuerza', nota: '1 Samuel 17', url: '',
            texto: 'Goliat era un gigante que asustaba a todo el ejército, pero David, un joven pastor, no peleó confiando en su tamaño sino en Dios: "Tú vienes contra mí con espada y lanza; mas yo vengo a ti en el nombre de Jehová" (1 Samuel 17:45).\n\nIdea central: con Dios no hay gigante demasiado grande.\n\nActividad: pregunta a tu hijo o hija qué "gigante" le da miedo (un examen, la oscuridad…) y oren juntos por eso.'
          }
        ]
      }
    ]
  };

  /* ─── Utilidades ─── */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /** Solo URLs http(s) o rutas del propio sitio (uploads/, assets/). */
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^https?:\/\//i.test(u) || /^(uploads|assets)\//i.test(u)) return u;
    return '';
  }

  function formatFecha(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return d.toLocaleDateString();
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ─── Datos ─── */

  function getData() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    if (!raw || typeof raw !== 'object') return clone(DEFAULT_DATA);
    return {
      avisos: Array.isArray(raw.avisos) ? raw.avisos : [],
      cursos: Array.isArray(raw.cursos) ? raw.cursos : []
    };
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving aula data:', e);
      return false;
    }
  }

  function sortCursos(cursos) {
    return cursos
      .map(function (c, i) { return { c: c, i: i }; })
      .sort(function (a, b) {
        var oa = typeof a.c.orden === 'number' ? a.c.orden : a.i;
        var ob = typeof b.c.orden === 'number' ? b.c.orden : b.i;
        return (oa - ob) || (a.i - b.i);
      })
      .map(function (x) { return x.c; });
  }

  function getCursos() {
    return sortCursos(getData().cursos);
  }

  function getCursosActivos() {
    return getCursos().filter(function (c) { return c.activo !== false; });
  }

  function getAvisos() {
    // Más recientes primero
    return getData().avisos.slice().sort(function (a, b) {
      return String(b.fecha || '').localeCompare(String(a.fecha || ''));
    });
  }

  /* ─── CRUD de avisos ─── */

  function addAviso(titulo, texto) {
    if (!titulo) return { success: false, error: 'El título es obligatorio' };
    var data = getData();
    data.avisos.push({ id: uid('a'), titulo: titulo, texto: texto || '', fecha: new Date().toISOString() });
    saveData(data);
    return { success: true };
  }

  function removeAviso(id) {
    var data = getData();
    data.avisos = data.avisos.filter(function (a) { return a.id !== id; });
    saveData(data);
    return { success: true };
  }

  /* ─── CRUD de cursos ─── */

  function createCurso(curso) {
    if (!curso.titulo || !curso.categoria) {
      return { success: false, error: 'Título y categoría son obligatorios' };
    }
    var data = getData();
    curso.id = uid('c');
    curso.activo = true;
    curso.orden = data.cursos.length;
    curso.lecciones = [];
    data.cursos.push(curso);
    saveData(data);
    return { success: true, id: curso.id };
  }

  function updateCurso(id, changes) {
    var data = getData();
    var idx = data.cursos.findIndex(function (c) { return c.id === id; });
    if (idx === -1) return { success: false, error: 'Curso no encontrado' };
    var lecciones = data.cursos[idx].lecciones;
    data.cursos[idx] = Object.assign({}, data.cursos[idx], changes);
    if (changes.lecciones === undefined) data.cursos[idx].lecciones = lecciones;
    saveData(data);
    return { success: true };
  }

  function deleteCurso(id) {
    var data = getData();
    data.cursos = sortCursos(data.cursos).filter(function (c) { return c.id !== id; });
    data.cursos.forEach(function (c, i) { c.orden = i; });
    saveData(data);
    return { success: true };
  }

  function moveCurso(id, direction) {
    var data = getData();
    var cursos = sortCursos(data.cursos);
    var idx = cursos.findIndex(function (c) { return c.id === id; });
    if (idx === -1) return { success: false, error: 'Curso no encontrado' };
    var target = idx + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= cursos.length) return { success: false, error: 'Ya está en el extremo' };
    var tmp = cursos[idx];
    cursos[idx] = cursos[target];
    cursos[target] = tmp;
    cursos.forEach(function (c, i) { c.orden = i; });
    data.cursos = cursos;
    saveData(data);
    return { success: true };
  }

  /* ─── CRUD de lecciones (dentro de un curso) ─── */

  function addLeccion(cursoId, leccion) {
    if (!leccion.titulo) return { success: false, error: 'El título es obligatorio' };
    var data = getData();
    var curso = data.cursos.find(function (c) { return c.id === cursoId; });
    if (!curso) return { success: false, error: 'Curso no encontrado' };
    leccion.id = uid('l');
    if (!Array.isArray(curso.lecciones)) curso.lecciones = [];
    curso.lecciones.push(leccion);
    saveData(data);
    return { success: true, id: leccion.id };
  }

  function updateLeccion(cursoId, leccionId, changes) {
    var data = getData();
    var curso = data.cursos.find(function (c) { return c.id === cursoId; });
    if (!curso || !Array.isArray(curso.lecciones)) return { success: false, error: 'Curso no encontrado' };
    var idx = curso.lecciones.findIndex(function (l) { return l.id === leccionId; });
    if (idx === -1) return { success: false, error: 'Lección no encontrada' };
    curso.lecciones[idx] = Object.assign({}, curso.lecciones[idx], changes);
    saveData(data);
    return { success: true };
  }

  function deleteLeccion(cursoId, leccionId) {
    var data = getData();
    var curso = data.cursos.find(function (c) { return c.id === cursoId; });
    if (!curso || !Array.isArray(curso.lecciones)) return { success: false, error: 'Curso no encontrado' };
    curso.lecciones = curso.lecciones.filter(function (l) { return l.id !== leccionId; });
    saveData(data);
    return { success: true };
  }

  function moveLeccion(cursoId, leccionId, direction) {
    var data = getData();
    var curso = data.cursos.find(function (c) { return c.id === cursoId; });
    if (!curso || !Array.isArray(curso.lecciones)) return { success: false, error: 'Curso no encontrado' };
    var idx = curso.lecciones.findIndex(function (l) { return l.id === leccionId; });
    if (idx === -1) return { success: false, error: 'Lección no encontrada' };
    var target = idx + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= curso.lecciones.length) return { success: false, error: 'Ya está en el extremo' };
    var tmp = curso.lecciones[idx];
    curso.lecciones[idx] = curso.lecciones[target];
    curso.lecciones[target] = tmp;
    saveData(data);
    return { success: true };
  }

  /* ─── Progreso del visitante (solo este navegador) ─── */

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function isDone(cursoId, leccionId) {
    var p = getProgress();
    return Array.isArray(p[cursoId]) && p[cursoId].indexOf(leccionId) !== -1;
  }

  function countDone(curso) {
    var p = getProgress();
    var done = Array.isArray(p[curso.id]) ? p[curso.id] : [];
    var lecciones = Array.isArray(curso.lecciones) ? curso.lecciones : [];
    return lecciones.filter(function (l) { return done.indexOf(l.id) !== -1; }).length;
  }

  /** Marca/desmarca una lección. Devuelve { nowDone, courseComplete }. */
  function toggleDone(curso, leccionId) {
    var p = getProgress();
    if (!Array.isArray(p[curso.id])) p[curso.id] = [];
    var idx = p[curso.id].indexOf(leccionId);
    var nowDone = idx === -1;
    if (nowDone) p[curso.id].push(leccionId);
    else p[curso.id].splice(idx, 1);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
    var total = (curso.lecciones || []).length;
    return { nowDone: nowDone, courseComplete: nowDone && total > 0 && countDone(curso) === total };
  }

  /* ─── Bloques de contenido de una lección ─── */

  function videoEmbedHtml(url) {
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,20})/);
    if (yt) {
      return '<div class="aula-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="Video" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    }
    var vimeo = url.match(/vimeo\.com\/(\d{6,12})/);
    if (vimeo) {
      return '<div class="aula-embed"><iframe src="https://player.vimeo.com/video/' + vimeo[1] + '" title="Video" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    }
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url) || /^uploads\//i.test(url)) {
      return '<video class="aula-media" controls preload="metadata" src="' + escapeHtml(url) + '"></video>';
    }
    return '<a class="btn-nav-solid aula-resource-btn" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">🎬 Ver video</a>';
  }

  function leccionContentHtml(leccion) {
    var out = '';
    var texto = String(leccion.texto || '').trim();
    if (texto) {
      out += '<div class="aula-lesson-text">' +
        texto.split(/\n{2,}/).map(function (par) {
          return '<p>' + escapeHtml(par).replace(/\n/g, '<br>') + '</p>';
        }).join('') +
        '</div>';
    }
    var url = safeUrl(leccion.url);
    if (url) {
      if (leccion.tipo === 'video') {
        out += videoEmbedHtml(url);
      } else if (leccion.tipo === 'audio') {
        out += '<audio class="aula-media aula-media-audio" controls preload="metadata" src="' + escapeHtml(url) + '"></audio>';
      } else if (leccion.tipo === 'documento') {
        out += '<a class="btn-nav-solid aula-resource-btn" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">📄 Abrir documento</a>';
      } else {
        out += '<a class="btn-nav-solid aula-resource-btn" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">🔗 Abrir enlace</a>';
      }
    }
    if (!out) out = '<p class="aula-lesson-empty">Esta lección aún no tiene contenido.</p>';
    return out;
  }

  /* ─── API pública ─── */

  window.ceevsMisionAula = {
    CATEGORIES: CATEGORIES,
    TIPOS: TIPOS,
    escapeHtml: escapeHtml,
    getData: getData,
    getCursos: getCursos,
    getCursosActivos: getCursosActivos,
    getAvisos: getAvisos,
    addAviso: addAviso,
    removeAviso: removeAviso,
    createCurso: createCurso,
    updateCurso: updateCurso,
    deleteCurso: deleteCurso,
    moveCurso: moveCurso,
    addLeccion: addLeccion,
    updateLeccion: updateLeccion,
    deleteLeccion: deleteLeccion,
    moveLeccion: moveLeccion,
    renderAdmin: null  // se asigna abajo si estamos en admin.html
  };

  /* ═══════════════════════════════════════
     MÓDULO PÚBLICO (mision-evangelistica.html)
  ═══════════════════════════════════════ */

  if (typeof App !== 'undefined') {
    var AulaPublic = {
      name: 'AulaPublic',
      category: 'todos',
      query: '',
      openCursoId: null,

      init: function () {
        var grid = document.getElementById('aula-grid');
        if (!grid) return; // Página sin aula

        this._renderAvisos();
        this._render();
        this._bindToolbar();
        this._bindGrid();
        this._bindViewer();

        var self = this;
        document.addEventListener('ceevs:remote-config', function (e) {
          if (e.detail && e.detail.changed) {
            self._renderAvisos();
            self._render();
          }
        });
      },

      /* ── Avisos ── */
      _renderAvisos: function () {
        var section = document.getElementById('aula-avisos');
        var list = document.getElementById('aula-avisos-list');
        if (!section || !list) return;
        var avisos = getAvisos();
        if (!avisos.length) {
          section.style.display = 'none';
          return;
        }
        section.style.display = '';
        list.innerHTML = avisos.map(function (a) {
          return '<article class="aula-aviso">' +
            '<span class="aula-aviso-date">📅 ' + escapeHtml(formatFecha(a.fecha)) + '</span>' +
            '<h3>' + escapeHtml(a.titulo) + '</h3>' +
            (a.texto ? '<p>' + escapeHtml(a.texto) + '</p>' : '') +
            '</article>';
        }).join('');
      },

      /* ── Catálogo de cursos ── */
      _getVisible: function () {
        var cursos = getCursosActivos();
        var self = this;
        if (this.category !== 'todos') {
          cursos = cursos.filter(function (c) { return c.categoria === self.category; });
        }
        var q = normalizeText(this.query);
        if (q) {
          cursos = cursos.filter(function (c) {
            var hay = normalizeText([c.titulo, c.descripcion, c.categoria].join(' ') +
              ' ' + (c.lecciones || []).map(function (l) { return l.titulo; }).join(' '));
            return hay.indexOf(q) !== -1;
          });
        }
        return cursos;
      },

      _render: function () {
        var grid = document.getElementById('aula-grid');
        if (!grid) return;
        var cursos = this._getVisible();

        var countEl = document.getElementById('aula-count');
        if (countEl) {
          countEl.textContent = cursos.length === 0 ? '' :
            cursos.length === 1 ? '1 curso disponible' : cursos.length + ' cursos disponibles';
        }

        if (!cursos.length) {
          var hayCursos = getCursosActivos().length > 0;
          grid.innerHTML = '<div class="aula-empty">' +
            '<div class="aula-empty-icon">📖</div>' +
            '<div class="aula-empty-title">' + (hayCursos ? 'Sin resultados' : 'Aún no hay cursos publicados') + '</div>' +
            '<p>' + (hayCursos
              ? 'Prueba con otra categoría u otra palabra de búsqueda.'
              : 'El Centro publicará aquí el contenido del Evangelio. Vuelve pronto.') + '</p>' +
            '</div>';
          return;
        }

        grid.innerHTML = cursos.map(function (c) {
          var lecciones = Array.isArray(c.lecciones) ? c.lecciones : [];
          var done = countDone(c);
          var pct = lecciones.length ? Math.round((done / lecciones.length) * 100) : 0;
          var img = safeUrl(c.imagenUrl);
          var cover = img
            ? '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(c.titulo) + '" loading="lazy">'
            : '<div class="aula-card-cover-ph" aria-hidden="true">' + (CAT_EMOJI[c.categoria] || '📖') + '</div>';
          return '<article class="aula-card' + (pct === 100 && lecciones.length ? ' aula-card--done' : '') + '">' +
            '<div class="aula-card-cover">' + cover +
              '<span class="aula-card-cat">' + escapeHtml(c.categoria) + '</span>' +
            '</div>' +
            '<div class="aula-card-body">' +
              '<h3>' + escapeHtml(c.titulo) + '</h3>' +
              (c.descripcion ? '<p class="aula-card-desc">' + escapeHtml(c.descripcion) + '</p>' : '') +
              '<div class="aula-card-meta">' +
                '<span>📚 ' + lecciones.length + ' ' + (lecciones.length === 1 ? 'lección' : 'lecciones') + '</span>' +
                '<span>' + (pct === 100 && lecciones.length ? '✓ Completado' : done + ' de ' + lecciones.length) + '</span>' +
              '</div>' +
              '<div class="aula-progress"><div class="aula-progress-fill" style="width:' + pct + '%"></div></div>' +
              '<button type="button" class="btn-cta-main aula-card-btn" data-aula-open="' + escapeHtml(c.id) + '">Entrar al curso</button>' +
            '</div>' +
            '</article>';
        }).join('');
      },

      _bindToolbar: function () {
        var self = this;
        var chips = document.querySelectorAll('.aula-chip');
        chips.forEach(function (chip) {
          chip.addEventListener('click', function () {
            chips.forEach(function (c) { c.classList.remove('active'); });
            chip.classList.add('active');
            self.category = chip.getAttribute('data-aula-cat') || 'todos';
            self._render();
          });
        });

        var input = document.getElementById('aula-search');
        if (input) {
          var timer = null;
          input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
              self.query = input.value.trim();
              self._render();
            }, 160);
          });
        }
      },

      _bindGrid: function () {
        var self = this;
        var grid = document.getElementById('aula-grid');
        if (!grid) return;
        grid.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-aula-open]');
          if (btn) self._openCurso(btn.getAttribute('data-aula-open'));
        });
      },

      /* ── Visor de curso (overlay) ── */
      _openCurso: function (id) {
        var curso = getCursosActivos().find(function (c) { return c.id === id; });
        if (!curso) return;
        this.openCursoId = id;
        this._renderViewer(curso);
        var viewer = document.getElementById('aula-viewer');
        if (viewer) {
          viewer.hidden = false;
          document.body.classList.add('aula-viewer-open');
          var panel = viewer.querySelector('.aula-viewer-panel');
          if (panel) panel.scrollTop = 0;
        }
      },

      _closeViewer: function () {
        var viewer = document.getElementById('aula-viewer');
        if (viewer) viewer.hidden = true;
        document.body.classList.remove('aula-viewer-open');
        this.openCursoId = null;
        this._render(); // refresca el progreso en las tarjetas
      },

      _renderViewer: function (curso) {
        var body = document.getElementById('aula-viewer-body');
        if (!body) return;
        var lecciones = Array.isArray(curso.lecciones) ? curso.lecciones : [];
        var done = countDone(curso);
        var pct = lecciones.length ? Math.round((done / lecciones.length) * 100) : 0;

        var html = '<div class="aula-viewer-head">' +
          '<span class="aula-card-cat">' + escapeHtml(curso.categoria) + '</span>' +
          '<h3>' + escapeHtml(curso.titulo) + '</h3>' +
          (curso.descripcion ? '<p>' + escapeHtml(curso.descripcion) + '</p>' : '') +
          '<div class="aula-viewer-progress">' +
            '<div class="aula-progress"><div class="aula-progress-fill" id="aula-viewer-fill" style="width:' + pct + '%"></div></div>' +
            '<span id="aula-viewer-progress-label">' + done + ' de ' + lecciones.length + ' completadas</span>' +
          '</div>' +
          '</div>';

        if (!lecciones.length) {
          html += '<p class="aula-lesson-empty">Este curso aún no tiene lecciones publicadas.</p>';
        } else {
          html += '<ol class="aula-lessons">' + lecciones.map(function (l, i) {
            var tipo = TIPOS[l.tipo] || TIPOS.leccion;
            var completada = isDone(curso.id, l.id);
            return '<li class="aula-lesson' + (completada ? ' is-done' : '') + '" data-lesson-row="' + escapeHtml(l.id) + '">' +
              '<button type="button" class="aula-lesson-toggle" data-aula-lesson="' + escapeHtml(l.id) + '" aria-expanded="false">' +
                '<span class="aula-lesson-num">' + (i + 1) + '</span>' +
                '<span class="aula-lesson-info">' +
                  '<strong>' + escapeHtml(l.titulo) + '</strong>' +
                  '<small>' + tipo.icon + ' ' + tipo.label + (l.nota ? ' · ' + escapeHtml(l.nota) : '') + '</small>' +
                '</span>' +
                '<span class="aula-lesson-state" aria-hidden="true">' + (completada ? '✓' : '›') + '</span>' +
              '</button>' +
              '<div class="aula-lesson-content" hidden>' +
                leccionContentHtml(l) +
                '<label class="aula-done-label">' +
                  '<input type="checkbox" data-aula-done="' + escapeHtml(l.id) + '"' + (completada ? ' checked' : '') + '>' +
                  '<span>Marcar como completada</span>' +
                '</label>' +
              '</div>' +
              '</li>';
          }).join('') + '</ol>';
        }

        body.innerHTML = html;
      },

      _bindViewer: function () {
        var self = this;
        var viewer = document.getElementById('aula-viewer');
        if (!viewer) return;

        viewer.addEventListener('click', function (e) {
          if (e.target.closest('[data-aula-close]')) {
            self._closeViewer();
            return;
          }

          var toggle = e.target.closest('[data-aula-lesson]');
          if (toggle) {
            var row = toggle.closest('.aula-lesson');
            var content = row && row.querySelector('.aula-lesson-content');
            if (content) {
              content.hidden = !content.hidden;
              toggle.setAttribute('aria-expanded', content.hidden ? 'false' : 'true');
              row.classList.toggle('is-open', !content.hidden);
            }
          }
        });

        viewer.addEventListener('change', function (e) {
          var check = e.target.closest('[data-aula-done]');
          if (!check) return;
          var curso = getCursosActivos().find(function (c) { return c.id === self.openCursoId; });
          if (!curso) return;
          var leccionId = check.getAttribute('data-aula-done');
          var result = toggleDone(curso, leccionId);

          // Refrescar la fila y el avance del visor
          var row = viewer.querySelector('[data-lesson-row="' + leccionId + '"]');
          if (row) {
            row.classList.toggle('is-done', result.nowDone);
            var state = row.querySelector('.aula-lesson-state');
            if (state) state.textContent = result.nowDone ? '✓' : '›';
          }
          var lecciones = curso.lecciones || [];
          var done = countDone(curso);
          var pct = lecciones.length ? Math.round((done / lecciones.length) * 100) : 0;
          var fill = document.getElementById('aula-viewer-fill');
          if (fill) fill.style.width = pct + '%';
          var label = document.getElementById('aula-viewer-progress-label');
          if (label) label.textContent = done + ' de ' + lecciones.length + ' completadas';

          // Gamificación: XP al completar (solo al marcar, no al desmarcar)
          if (result.nowDone && typeof Gamification !== 'undefined') {
            if (result.courseComplete) {
              Gamification.addXP(10, '🏆', '¡Curso completado!', curso.titulo + ' · +10 XP');
            } else {
              Gamification.addXP(5, '📖', '¡Lección completada!', '+5 XP');
            }
          }
        });

        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && !viewer.hidden) self._closeViewer();
        });
      }
    };

    App.register(AulaPublic);
  }

  /* ═══════════════════════════════════════
     PANEL ADMIN (admin.html, pestaña Misión)
  ═══════════════════════════════════════ */

  function adminToast(msg) {
    var t = document.getElementById('admin-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(adminToast._timer);
    adminToast._timer = setTimeout(function () { t.classList.remove('show'); }, 2500);
  }

  var adminState = {
    cursoEditId: null,
    lecCursoId: '',
    lecEditId: null
  };

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el) el.value = v || '';
  }

  /* ── Avisos ── */

  function renderAdminAvisos() {
    var list = document.getElementById('ma-avisos-list');
    if (!list) return;
    var avisos = getAvisos();
    if (!avisos.length) {
      list.innerHTML = '<p class="empty-state">No hay avisos publicados.</p>';
      return;
    }
    list.innerHTML = avisos.map(function (a) {
      return '<div class="ma-row">' +
        '<div class="ma-row-main">' +
          '<strong>' + escapeHtml(a.titulo) + '</strong>' +
          '<small>' + escapeHtml(formatFecha(a.fecha)) + (a.texto ? ' — ' + escapeHtml(a.texto) : '') + '</small>' +
        '</div>' +
        '<button type="button" class="action-btn btn-delete" data-ma-del-aviso="' + escapeHtml(a.id) + '">Eliminar</button>' +
        '</div>';
    }).join('');
  }

  /* ── Cursos ── */

  function renderAdminCursos() {
    var list = document.getElementById('ma-cursos-list');
    var countEl = document.getElementById('ma-cursos-count');
    if (!list) return;
    var cursos = getCursos();

    if (countEl) countEl.textContent = cursos.length + ' curso' + (cursos.length !== 1 ? 's' : '');

    if (!cursos.length) {
      list.innerHTML = '<p class="empty-state">No hay cursos. Crea uno con el formulario.</p>';
      return;
    }

    var html = '<table class="inventory-table"><thead><tr>' +
      '<th>Orden</th><th>Curso</th><th>Categoría</th><th>Lecciones</th><th>Visible</th><th>Acciones</th>' +
      '</tr></thead><tbody>';

    cursos.forEach(function (c, i) {
      var id = escapeHtml(c.id);
      var lecCount = (c.lecciones || []).length;
      html += '<tr' + (c.activo === false ? ' class="inv-row-inactive"' : '') + '>' +
        '<td class="inv-order-cell"><div class="inv-order-btns">' +
          '<button type="button" class="action-btn btn-move" data-ma-curso-up="' + id + '"' + (i === 0 ? ' disabled' : '') + ' title="Subir">▲</button>' +
          '<button type="button" class="action-btn btn-move" data-ma-curso-down="' + id + '"' + (i === cursos.length - 1 ? ' disabled' : '') + ' title="Bajar">▼</button>' +
        '</div></td>' +
        '<td><span class="product-name">' + escapeHtml(c.titulo) + '</span></td>' +
        '<td><span class="product-category">' + escapeHtml(c.categoria) + '</span></td>' +
        '<td>' + lecCount + '</td>' +
        '<td>' + (c.activo !== false ? '✓' : '✗') + '</td>' +
        '<td><div class="inventory-actions">' +
          '<button type="button" class="action-btn btn-edit" data-ma-curso-contenido="' + id + '">Contenido</button>' +
          '<button type="button" class="action-btn btn-edit" data-ma-curso-edit="' + id + '">Editar</button>' +
          '<button type="button" class="action-btn btn-deactivate" data-ma-curso-toggle="' + id + '">' + (c.activo !== false ? 'Ocultar' : 'Publicar') + '</button>' +
          '<button type="button" class="action-btn btn-delete" data-ma-curso-del="' + id + '">Eliminar</button>' +
        '</div></td>' +
        '</tr>';
    });

    list.innerHTML = html + '</tbody></table>';
  }

  function resetCursoForm() {
    setVal('ma-curso-id', '');
    setVal('ma-curso-titulo', '');
    setVal('ma-curso-categoria', '');
    setVal('ma-curso-desc', '');
    setVal('ma-curso-imagen', '');
    adminState.cursoEditId = null;
    var title = document.getElementById('ma-curso-form-title');
    if (title) title.textContent = '📘 Crear curso nuevo';
  }

  function submitCursoForm(e) {
    e.preventDefault();
    var curso = {
      titulo: val('ma-curso-titulo'),
      categoria: val('ma-curso-categoria'),
      descripcion: val('ma-curso-desc'),
      imagenUrl: val('ma-curso-imagen')
    };
    if (!curso.titulo || !curso.categoria) {
      adminToast('Título y categoría son obligatorios');
      return;
    }
    var id = val('ma-curso-id');
    var res = id ? updateCurso(id, curso) : createCurso(curso);
    if (!res.success) {
      adminToast(res.error || 'No se pudo guardar el curso');
      return;
    }
    adminToast(id ? 'Curso actualizado' : 'Curso creado');
    resetCursoForm();
    renderAdminCursos();
    renderAdminLecciones();
  }

  function editCursoForm(id) {
    var curso = getCursos().find(function (c) { return c.id === id; });
    if (!curso) return;
    setVal('ma-curso-id', curso.id);
    setVal('ma-curso-titulo', curso.titulo);
    setVal('ma-curso-categoria', curso.categoria);
    setVal('ma-curso-desc', curso.descripcion);
    setVal('ma-curso-imagen', curso.imagenUrl);
    adminState.cursoEditId = curso.id;
    var title = document.getElementById('ma-curso-form-title');
    if (title) title.textContent = '📘 Editar: ' + curso.titulo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Lecciones ── */

  function renderLecCursoSelect() {
    var select = document.getElementById('ma-lec-curso');
    if (!select) return;
    var cursos = getCursos();
    var current = adminState.lecCursoId || select.value;
    select.innerHTML = cursos.length
      ? cursos.map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.titulo) + '</option>';
        }).join('')
      : '<option value="">— Primero crea un curso —</option>';
    if (current && cursos.some(function (c) { return c.id === current; })) select.value = current;
    adminState.lecCursoId = select.value;
  }

  function renderAdminLecciones() {
    renderLecCursoSelect();
    var list = document.getElementById('ma-lecciones-list');
    if (!list) return;
    var curso = getCursos().find(function (c) { return c.id === adminState.lecCursoId; });
    if (!curso) {
      list.innerHTML = '<p class="empty-state">Selecciona un curso para ver sus lecciones.</p>';
      return;
    }
    var lecciones = Array.isArray(curso.lecciones) ? curso.lecciones : [];
    if (!lecciones.length) {
      list.innerHTML = '<p class="empty-state">Este curso no tiene lecciones. Agrégalas con el formulario.</p>';
      return;
    }
    list.innerHTML = lecciones.map(function (l, i) {
      var tipo = TIPOS[l.tipo] || TIPOS.leccion;
      var id = escapeHtml(l.id);
      return '<div class="ma-row">' +
        '<div class="inv-order-btns">' +
          '<button type="button" class="action-btn btn-move" data-ma-lec-up="' + id + '"' + (i === 0 ? ' disabled' : '') + ' title="Subir">▲</button>' +
          '<button type="button" class="action-btn btn-move" data-ma-lec-down="' + id + '"' + (i === lecciones.length - 1 ? ' disabled' : '') + ' title="Bajar">▼</button>' +
        '</div>' +
        '<div class="ma-row-main">' +
          '<strong>' + (i + 1) + '. ' + escapeHtml(l.titulo) + '</strong>' +
          '<small>' + tipo.icon + ' ' + tipo.label + (l.nota ? ' · ' + escapeHtml(l.nota) : '') + (l.url ? ' · 🔗' : '') + '</small>' +
        '</div>' +
        '<div class="inventory-actions">' +
          '<button type="button" class="action-btn btn-edit" data-ma-lec-edit="' + id + '">Editar</button>' +
          '<button type="button" class="action-btn btn-delete" data-ma-lec-del="' + id + '">Eliminar</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function resetLecForm() {
    setVal('ma-lec-id', '');
    setVal('ma-lec-titulo', '');
    setVal('ma-lec-url', '');
    setVal('ma-lec-texto', '');
    setVal('ma-lec-nota', '');
    var tipoSel = document.getElementById('ma-lec-tipo');
    if (tipoSel) tipoSel.value = 'leccion';
    adminState.lecEditId = null;
    var title = document.getElementById('ma-lec-form-title');
    if (title) title.textContent = '➕ Agregar lección o material';
  }

  function submitLecForm(e) {
    e.preventDefault();
    if (!adminState.lecCursoId) {
      adminToast('Primero crea y selecciona un curso');
      return;
    }
    var leccion = {
      tipo: val('ma-lec-tipo') || 'leccion',
      titulo: val('ma-lec-titulo'),
      url: val('ma-lec-url'),
      texto: (document.getElementById('ma-lec-texto') || {}).value || '',
      nota: val('ma-lec-nota')
    };
    if (!leccion.titulo) {
      adminToast('El título de la lección es obligatorio');
      return;
    }
    if (leccion.url && !safeUrl(leccion.url)) {
      adminToast('La URL debe ser https:// o un archivo subido al sitio');
      return;
    }
    var id = val('ma-lec-id');
    var res = id
      ? updateLeccion(adminState.lecCursoId, id, leccion)
      : addLeccion(adminState.lecCursoId, leccion);
    if (!res.success) {
      adminToast(res.error || 'No se pudo guardar la lección');
      return;
    }
    adminToast(id ? 'Lección actualizada' : 'Lección agregada al curso');
    resetLecForm();
    renderAdminLecciones();
    renderAdminCursos();
  }

  function editLecForm(id) {
    var curso = getCursos().find(function (c) { return c.id === adminState.lecCursoId; });
    var leccion = curso && (curso.lecciones || []).find(function (l) { return l.id === id; });
    if (!leccion) return;
    setVal('ma-lec-id', leccion.id);
    setVal('ma-lec-titulo', leccion.titulo);
    setVal('ma-lec-url', leccion.url);
    setVal('ma-lec-nota', leccion.nota);
    var texto = document.getElementById('ma-lec-texto');
    if (texto) texto.value = leccion.texto || '';
    var tipoSel = document.getElementById('ma-lec-tipo');
    if (tipoSel) tipoSel.value = TIPOS[leccion.tipo] ? leccion.tipo : 'leccion';
    adminState.lecEditId = leccion.id;
    var title = document.getElementById('ma-lec-form-title');
    if (title) title.textContent = '✏️ Editar: ' + leccion.titulo;
  }

  function renderAdminPanel() {
    if (!document.getElementById('panel-mision')) return;
    renderAdminAvisos();
    renderAdminCursos();
    renderAdminLecciones();
  }

  window.ceevsMisionAula.renderAdmin = renderAdminPanel;

  function bindAdminPanel() {
    var panel = document.getElementById('panel-mision');
    if (!panel) return;

    // Aviso nuevo
    var avisoBtn = document.getElementById('btn-ma-add-aviso');
    if (avisoBtn) avisoBtn.addEventListener('click', function () {
      var titulo = val('ma-aviso-titulo');
      if (!titulo) { adminToast('Escribe el título del aviso'); return; }
      addAviso(titulo, val('ma-aviso-texto'));
      setVal('ma-aviso-titulo', '');
      setVal('ma-aviso-texto', '');
      adminToast('Aviso publicado');
      renderAdminAvisos();
    });

    // Formularios
    var cursoForm = document.getElementById('ma-curso-form');
    if (cursoForm) cursoForm.addEventListener('submit', submitCursoForm);
    var cursoReset = document.getElementById('btn-ma-curso-reset');
    if (cursoReset) cursoReset.addEventListener('click', resetCursoForm);

    var lecForm = document.getElementById('ma-lec-form');
    if (lecForm) lecForm.addEventListener('submit', submitLecForm);
    var lecReset = document.getElementById('btn-ma-lec-reset');
    if (lecReset) lecReset.addEventListener('click', resetLecForm);

    var lecCursoSel = document.getElementById('ma-lec-curso');
    if (lecCursoSel) lecCursoSel.addEventListener('change', function () {
      adminState.lecCursoId = lecCursoSel.value;
      resetLecForm();
      renderAdminLecciones();
    });

    // Acciones de las listas (delegación)
    panel.addEventListener('click', function (e) {
      var b;

      if ((b = e.target.closest('[data-ma-del-aviso]'))) {
        if (!confirm('¿Eliminar este aviso?')) return;
        removeAviso(b.getAttribute('data-ma-del-aviso'));
        adminToast('Aviso eliminado');
        renderAdminAvisos();
        return;
      }

      if ((b = e.target.closest('[data-ma-curso-edit]'))) { editCursoForm(b.getAttribute('data-ma-curso-edit')); return; }

      if ((b = e.target.closest('[data-ma-curso-contenido]'))) {
        adminState.lecCursoId = b.getAttribute('data-ma-curso-contenido');
        resetLecForm();
        renderAdminLecciones();
        var card = document.getElementById('ma-lecciones-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if ((b = e.target.closest('[data-ma-curso-toggle]'))) {
        var idT = b.getAttribute('data-ma-curso-toggle');
        var curso = getCursos().find(function (c) { return c.id === idT; });
        if (!curso) return;
        updateCurso(idT, { activo: curso.activo === false });
        adminToast(curso.activo === false ? 'Curso publicado' : 'Curso oculto para los visitantes');
        renderAdminCursos();
        return;
      }

      if ((b = e.target.closest('[data-ma-curso-del]'))) {
        if (!confirm('¿Eliminar este curso y todas sus lecciones permanentemente?')) return;
        deleteCurso(b.getAttribute('data-ma-curso-del'));
        adminToast('Curso eliminado');
        renderAdminCursos();
        renderAdminLecciones();
        return;
      }

      if ((b = e.target.closest('[data-ma-curso-up]')) && !b.disabled) { moveCurso(b.getAttribute('data-ma-curso-up'), 'up'); renderAdminCursos(); return; }
      if ((b = e.target.closest('[data-ma-curso-down]')) && !b.disabled) { moveCurso(b.getAttribute('data-ma-curso-down'), 'down'); renderAdminCursos(); return; }

      if ((b = e.target.closest('[data-ma-lec-edit]'))) { editLecForm(b.getAttribute('data-ma-lec-edit')); return; }

      if ((b = e.target.closest('[data-ma-lec-del]'))) {
        if (!confirm('¿Eliminar esta lección?')) return;
        deleteLeccion(adminState.lecCursoId, b.getAttribute('data-ma-lec-del'));
        adminToast('Lección eliminada');
        renderAdminLecciones();
        renderAdminCursos();
        return;
      }

      if ((b = e.target.closest('[data-ma-lec-up]')) && !b.disabled) { moveLeccion(adminState.lecCursoId, b.getAttribute('data-ma-lec-up'), 'up'); renderAdminLecciones(); return; }
      if ((b = e.target.closest('[data-ma-lec-down]')) && !b.disabled) { moveLeccion(adminState.lecCursoId, b.getAttribute('data-ma-lec-down'), 'down'); renderAdminLecciones(); return; }
    });

    renderAdminPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAdminPanel);
  } else {
    bindAdminPanel();
  }
})();
