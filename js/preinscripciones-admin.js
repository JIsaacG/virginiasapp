/**
 * preinscripciones-admin.js — Bandeja de pre-inscripciones del panel.
 *
 * Lee api/preinscripciones.php (requiere sesión de administrador) y arma:
 *  - la lista de solicitudes con su estado,
 *  - la ficha completa en el formato de la hoja oficial impresa,
 *  - la impresión / "Guardar como PDF" de esa hoja,
 *  - los ajustes del formulario público (correo de aviso, abierto/cerrado…).
 *
 * El marcado de la hoja se genera aquí; su presentación vive en
 * css/pages/solicitud-print.css. Debe cargarse antes de admin.js.
 */

(function () {
  'use strict';

  var API = 'api/preinscripciones.php';

  var LOGOS = {
    izq:   'assets/images/formulario/logovirginiasapp.png',
    acsi:  'assets/images/formulario/logo asci.png',
    // Escudo dorado del león (esquina superior derecha de la hoja).
    // Si el archivo no existe todavía, el hueco se oculta solo.
    der:   'assets/images/formulario/logo-lions.png'
  };

  var VISION = 'Ser una institución líder en servicios educativos, culturales y sociales fundamentada en principios '
    + 'bíblicos evangélicos que contribuyen a la salvación y formación del hombre, egresando profesionales con '
    + 'potencial de impulsar el desarrollo integral para la transformación de la sociedad.';

  var MISION = 'Somos una institución educativa evangélica Cristocéntrica que brinda servicios de calidad, integrando '
    + 'aspectos de orden espiritual, moral, académico, social y físico que glorifican a Dios contribuyendo al '
    + 'desarrollo de la sociedad.';

  var ESTADOS = {
    nueva:      { icon: '🔵', label: 'Nueva' },
    leida:      { icon: '👁️', label: 'Leída' },
    contactada: { icon: '✅', label: 'Contactada' },
    archivada:  { icon: '📁', label: 'Archivada' }
  };

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var state = {
    items: [],
    settings: null,
    next: 0,
    cargado: false,
    abierta: null   // solicitud abierta en el detalle
  };

  /* ─── Utilidades ─── */

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg) {
    var t = el('admin-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function csrf() {
    return (window.ceevsSync && window.ceevsSync.state && window.ceevsSync.state.csrf) || '';
  }

  function get(qs) {
    return fetch(API + '?' + qs, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
      .then(function (res) {
        if (res.status === 200 && res.data && res.data.ok) return res.data;
        throw new Error((res.data && res.data.error) || 'No se pudo leer del servidor');
      });
  }

  function post(body) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CEEVS-CSRF': csrf() },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
      .then(function (res) {
        if (res.status === 200 && res.data && res.data.ok) return res.data;
        throw new Error((res.data && res.data.error) || 'No se pudo guardar el cambio');
      });
  }

  function fechaCorta(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  function fechaLarga(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return { dia: '____', mes: '____________', anio: '202__' };
    return { dia: String(d.getDate()), mes: MESES[d.getMonth()], anio: String(d.getFullYear()) };
  }

  function soloDigitos(tel) {
    return String(tel || '').replace(/\D/g, '');
  }

  /* ─── Carga y pintado de la bandeja ─── */

  function cargar() {
    var lista = el('preins-lista');
    if (!lista) return Promise.resolve();

    return get('action=list')
      .then(function (d) {
        state.items = d.items || [];
        state.settings = d.settings || {};
        state.next = d.next || 1;
        state.cargado = true;
        pintarAjustes();
        pintarStats(d.stats || {});
        pintarLista();
      })
      .catch(function (err) {
        lista.innerHTML = '<p class="empty-state">' + esc(err.message)
          + '<br><small>Si acabas de entrar, recarga la página. Sin PHP (modo local) esta pestaña no funciona.</small></p>';
        el('preins-count').textContent = '—';
      });
  }

  function pintarStats(stats) {
    var cont = el('preins-stats');
    if (!cont) return;
    var cajas = [
      { k: 'total', label: 'Solicitudes recibidas', icon: '📋', clase: 'total' },
      { k: 'nueva', label: 'Sin revisar', icon: '🔵', clase: 'nueva' },
      { k: 'contactada', label: 'Ya contactadas', icon: '✅', clase: 'contactada' },
      { k: 'archivada', label: 'Archivadas', icon: '📁', clase: 'archivada' }
    ];
    cont.innerHTML = cajas.map(function (c) {
      return '<div class="preins-stat preins-stat--' + c.clase + '">'
        + '<span class="preins-stat-icon">' + c.icon + '</span>'
        + '<strong>' + (stats[c.k] || 0) + '</strong>'
        + '<small>' + c.label + '</small>'
        + '</div>';
    }).join('');

    var badge = el('preins-tab-badge');
    if (badge) {
      badge.textContent = stats.nueva || 0;
      badge.hidden = !stats.nueva;
    }
  }

  function filtradas() {
    var q = (el('preins-buscar').value || '').trim().toLowerCase();
    var estado = el('preins-filtro').value;
    return state.items.filter(function (it) {
      if (estado && it.estado !== estado) return false;
      if (!q) return true;
      return [it.alumno, it.encargado, it.grado, it.correo, it.tel, '#' + it.num]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function pintarLista() {
    var lista = el('preins-lista');
    var items = filtradas();

    el('preins-count').textContent = state.items.length === 0
      ? 'Sin solicitudes'
      : items.length + ' de ' + state.items.length + ' solicitud' + (state.items.length === 1 ? '' : 'es');

    if (!state.items.length) {
      lista.innerHTML = '<p class="empty-state">Todavía no llega ninguna solicitud.<br>'
        + '<small>Cuando una familia envíe el formulario aparecerá aquí y te llegará un aviso al correo de admisiones.</small></p>';
      return;
    }
    if (!items.length) {
      lista.innerHTML = '<p class="empty-state">Ninguna solicitud coincide con la búsqueda.</p>';
      return;
    }

    lista.innerHTML = items.map(function (it) {
      var e = ESTADOS[it.estado] || ESTADOS.nueva;
      return '<article class="preins-fila preins-fila--' + esc(it.estado) + '" data-preins-id="' + esc(it.id) + '">'
        + '<div class="preins-fila-num">#' + esc(it.num) + '</div>'
        + '<div class="preins-fila-datos">'
          + '<h4>' + esc(it.alumno || 'Sin nombre') + '</h4>'
          + '<p>' + esc(it.grado || 'Grado sin indicar')
            + (it.encargado ? ' · Encargado: ' + esc(it.encargado) : '') + '</p>'
          + '<p class="preins-fila-contacto">'
            + (it.tel ? '<span>📞 ' + esc(it.tel) + '</span>' : '')
            + (it.correo ? '<span>✉️ ' + esc(it.correo) + '</span>' : '')
            + (it.foto ? '<span>📷 Con foto</span>' : '')
          + '</p>'
        + '</div>'
        + '<div class="preins-fila-meta">'
          + '<span class="preins-chip preins-chip--' + esc(it.estado) + '">' + e.icon + ' ' + e.label + '</span>'
          + '<small>' + fechaCorta(it.t) + '</small>'
        + '</div>'
        + '<button type="button" class="preins-fila-btn" data-preins-ver="' + esc(it.id) + '">Ver solicitud →</button>'
        + '</article>';
    }).join('');
  }

  function pintarAjustes() {
    var s = state.settings || {};
    el('preins-set-correo').value = s.correo || '';
    el('preins-set-ciclo').value = s.ciclo || '';
    el('preins-set-proximo').value = state.next || 1;
    el('preins-set-abierto').checked = s.abierto !== false;
    el('preins-set-notificar').checked = s.notificar !== false;
  }

  /* ─── Detalle de una solicitud ─── */

  function abrir(id) {
    get('action=get&id=' + encodeURIComponent(id))
      .then(function (d) {
        state.abierta = d.rec;
        state.abierta._texto = d.texto || '';
        pintarDetalle(d.rec);
        el('preins-modal').hidden = false;
        document.body.classList.add('preins-modal-open');

        // Al abrirla por primera vez queda marcada como leída.
        if (d.rec.estado === 'nueva') cambiarEstado(id, 'leida', true);
      })
      .catch(function (err) { toast(err.message); });
  }

  function cerrar() {
    el('preins-modal').hidden = true;
    document.body.classList.remove('preins-modal-open');
    state.abierta = null;
  }

  function pintarDetalle(rec) {
    var al = rec.alumno || {};
    el('preins-modal-title').textContent = 'Solicitud #' + rec.num + ' · ' + (al.nombre || 'Sin nombre');
    el('preins-modal-sub').textContent = 'Recibida el ' + fechaCorta(rec.t)
      + ' · ' + (al.grado || 'grado sin indicar')
      + (rec.ciclo ? ' · ciclo ' + rec.ciclo : '');

    el('preins-estado').value = rec.estado || 'nueva';
    el('preins-notas').value = rec.notas || '';

    // Atajos de contacto con la familia.
    var tel = '', correo = '';
    [rec.madre, rec.padre].forEach(function (p) {
      if (!p || !p.aplica) return;
      if (!tel) tel = p.celular || p.telFijo || '';
      if (!correo) correo = p.correo || '';
    });

    var wa = el('preins-wa');
    var digitos = soloDigitos(tel);
    if (digitos) {
      if (digitos.length === 8) digitos = '504' + digitos;   // Honduras
      wa.href = 'https://wa.me/' + digitos + '?text=' + encodeURIComponent(
        'Buen día, le saludamos del Centro Educativo Evangélico Virginia Sapp. Recibimos su solicitud de pre-inscripción #'
        + rec.num + ' para ' + (al.nombre || '') + '.');
      wa.hidden = false;
    } else {
      wa.hidden = true;
    }

    var mail = el('preins-mail');
    if (correo) {
      mail.href = 'mailto:' + correo + '?subject=' + encodeURIComponent('Solicitud de pre-inscripción #' + rec.num + ' — CEEVS');
      mail.hidden = false;
    } else {
      mail.hidden = true;
    }

    el('preins-hoja-wrap').innerHTML = hojaHTML(rec);
    ocultarLogosFaltantes(el('preins-hoja-wrap'));
  }

  /** Si un escudo aún no se ha subido al servidor, se oculta en lugar de mostrar un icono roto. */
  function ocultarLogosFaltantes(cont) {
    cont.querySelectorAll('.hoja-top img').forEach(function (img) {
      img.addEventListener('error', function () { img.hidden = true; });
      // Si la imagen ya había fallado antes de enganchar el evento (caché del navegador).
      if (img.complete && img.naturalWidth === 0) img.hidden = true;
    });
  }

  /* ─── La hoja oficial ─── */

  function celdaVal(v, span) {
    var vacio = !v && v !== 0;
    return '<td class="val' + (vacio ? ' vacio' : '') + '"' + (span ? ' colspan="' + span + '"' : '') + '>'
      + esc(vacio ? '' : v) + '</td>';
  }

  function celdaLbl(txt, span) {
    return '<td class="lbl"' + (span ? ' colspan="' + span + '"' : '') + '>' + txt + '</td>';
  }

  function marca(activo) {
    return '<td class="cx"><span class="hoja-cx">' + (activo ? 'X' : '') + '</span></td>';
  }

  function cols(n) {
    var c = '';
    for (var i = 0; i < n; i++) c += '<col>';
    return '<colgroup>' + c + '</colgroup>';
  }

  function tablaPadre(p, titulo) {
    p = p || {};
    var vivo = !!p.aplica;
    var v = function (k) { return vivo ? (p[k] || '') : ''; };

    return '<tr><th colspan="12">' + titulo + '</th></tr>'
      + '<tr>' + celdaLbl('Nombre completo', 3) + celdaVal(v('nombre'), 9) + '</tr>'
      + '<tr>' + celdaLbl('Profesión', 3) + celdaVal(v('profesion'), 3)
              + celdaLbl('Ocupación', 2) + celdaVal(v('ocupacion'), 4) + '</tr>'
      + '<tr>' + celdaLbl('Dirección completa', 3) + celdaVal(v('direccion'), 9) + '</tr>'
      + '<tr>' + celdaLbl('Teléfono fijo', 3) + celdaVal(v('telFijo'), 3)
              + celdaLbl('Celular:', 2) + celdaVal(v('celular'), 4) + '</tr>'
      + '<tr>' + celdaLbl('Correo electrónico', 3) + celdaVal(v('correo'), 9) + '</tr>'
      + '<tr>' + celdaLbl('Centro de trabajo', 3) + celdaVal(v('centroTrabajo'), 9) + '</tr>'
      + '<tr>' + celdaLbl('Iglesia que asiste', 3) + celdaVal(v('iglesia'), 3)
              + celdaLbl('Nombre del líder espiritual', 3) + celdaVal(v('lider'), 3) + '</tr>'
      + '<tr>' + celdaLbl('Ingreso mensual', 3) + celdaVal(v('ingreso'), 9) + '</tr>';
  }

  function hojaHTML(rec) {
    var al = rec.alumno || {};
    var f = fechaLarga(rec.t);
    var motivos = rec.motivo || [];
    var herm = (rec.hermanos || []).slice();

    // La hoja de papel trae cuatro renglones para hermanos: se respetan.
    while (herm.length < 4) herm.push({ nombre: '', edad: '', estudia: null, trabaja: null });

    var foto = rec.foto
      ? '<img src="' + API + '?action=foto&id=' + esc(rec.id) + '" alt="Foto del alumno">'
      : 'Foto<br>Alumno(a)';

    return '<div class="hoja">'

      /* Encabezado */
      + '<div class="hoja-top">'
        + '<div class="hoja-top-izq"><img src="' + LOGOS.izq + '" alt="Instituto Educativo Evangélico Virginia Sapp"></div>'
        + '<div class="hoja-top-acsi"><img src="' + encodeURI(LOGOS.acsi) + '" alt="Acreditado por ACSI"></div>'
        + '<div class="hoja-top-der"><img src="' + LOGOS.der + '" alt="Virginia Sapp Lions"></div>'
      + '</div>'

      + '<h1 class="hoja-titulo">SOLICITUD DE ADMISIÓN PARA PRIMER INGRESO<br>'
        + 'JARDÍN, ESCUELA E INSTITUTO “EVANGÉLICO VIRGINIA SAPP”</h1>'

      /* Visión y misión */
      + '<div class="hoja-vm">'
        + '<h3>VISIÓN</h3><p>' + VISION + '</p>'
        + '<h3>MISIÓN</h3><p>' + MISION + '</p>'
      + '</div>'

      /* Número de solicitud y foto */
      + '<div class="hoja-numrow">'
        + '<div class="hoja-num"><span>Número de solicitud</span><b>' + esc(rec.num) + '</b></div>'
        + '<div class="hoja-foto">' + foto + '</div>'
      + '</div>'

      /* Datos del alumno */
      + '<h2 class="hoja-h2">DATOS DEL ALUMNO:</h2>'
      + '<table class="hoja-t">' + cols(12) + '<tbody>'
        + '<tr>' + celdaLbl('Nombre completo', 3) + celdaVal(al.nombre, 9) + '</tr>'
        + '<tr>' + celdaLbl('Edad') + celdaVal(al.edad)
                + celdaLbl('N.º Identidad', 2) + celdaVal(al.identidad, 4)
                + celdaLbl('Nacionalidad', 2) + celdaVal(al.nacionalidad, 2) + '</tr>'
        + '<tr>' + celdaLbl('Sexo') + celdaVal(al.sexo, 2)
                + celdaLbl('Fecha de Nacimiento', 3) + celdaVal(fechaISOaCorta(al.fechaNac), 6) + '</tr>'
        + '<tr>' + celdaLbl('País') + celdaVal(al.pais, 2)
                + celdaLbl('Departamento', 2) + celdaVal(al.departamento, 3)
                + celdaLbl('Ciudad', 2) + celdaVal(al.ciudad, 2) + '</tr>'
        + '<tr>' + celdaLbl('Vive con:', 2)
                + celdaLbl('Ambos Padres', 2) + marca(al.viveCon === 'ambos')
                + celdaLbl('La Madre') + marca(al.viveCon === 'madre')
                + celdaLbl('El Padre') + marca(al.viveCon === 'padre')
                + celdaLbl('Otro (especifique)', 2) + celdaVal(al.viveCon === 'otro' ? (al.viveConOtro || 'Sí') : '') + '</tr>'
        + '<tr><td class="inline-lbl" colspan="12">Escuela de procedencia: <b>' + esc(al.escuela || '') + '</b>'
                + '&nbsp;&nbsp;&nbsp;&nbsp;Lugar: <b>' + esc(al.escuelaLugar || '') + '</b>'
                + '&nbsp;&nbsp;&nbsp;&nbsp;Teléfono: <b>' + esc(al.escuelaTel || '') + '</b></td></tr>'
        + '<tr><td class="inline-lbl" colspan="12">¿Grado que va a cursar? <b>' + esc(al.grado || '') + '</b></td></tr>'
      + '</tbody></table>'

      /* Datos de los padres */
      + '<h2 class="hoja-h2">DATOS DE LOS PADRES</h2>'
      + '<table class="hoja-t">' + cols(12) + '<tbody>'
        + tablaPadre(rec.padre, 'PADRE')
        + '<tr class="hoja-sep"><td colspan="12"></td></tr>'
        + tablaPadre(rec.madre, 'MADRE')
      + '</tbody></table>'

      /* ─── Segunda página ─── */
      + '<div class="hoja-p2">'
        + '<h2 class="hoja-h2">DATOS DE LOS HERMANOS</h2>'
        + '<table class="hoja-t hoja-t--herm">' + cols(12) + '<tbody>'
          + '<tr><th colspan="7">Nombre completo</th><th colspan="2">Edad</th>'
            + '<th colspan="2">Estudia</th><th>Trabaja</th></tr>'
          + herm.map(function (h) {
              return '<tr>' + celdaVal(h.nombre, 7) + celdaVal(h.edad, 2)
                + (h.estudia === null ? '<td colspan="2"></td>' : '<td class="cx" colspan="2"><span class="hoja-cx">' + (h.estudia ? 'X' : '') + '</span></td>')
                + (h.trabaja === null ? '<td></td>' : marca(h.trabaja))
                + '</tr>';
            }).join('')
        + '</tbody></table>'

        + '<p class="hoja-pregunta">¿Por qué medio se enteró de nuestro centro educativo?</p>'
        + '<ul class="hoja-lista">'
          + opcion('Pariente', rec.medio === 'pariente')
          + opcion('Amigo', rec.medio === 'amigo')
          + opcion('Redes Sociales', rec.medio === 'redes')
          + opcion('Otro' + (rec.medio === 'otro' && rec.medioOtro ? ': ' + esc(rec.medioOtro) : ''), rec.medio === 'otro')
        + '</ul>'

        + '<p class="hoja-pregunta">¿Por qué eligió la institución para matricular a su hijo(a)?</p>'
        + '<ul class="hoja-lista">'
          + opcion('Por su impacto en educación <u>Cristiana</u>', motivos.indexOf('cristiana') !== -1)
          + opcion('Por su enfoque académico', motivos.indexOf('academico') !== -1)
          + opcion('Por sus instalaciones', motivos.indexOf('instalaciones') !== -1)
          + opcion('Todas las anteriores', motivos.indexOf('todas') !== -1)
        + '</ul>'

        + '<p class="hoja-linea">Tiene familiares en la Institución <u>' + esc(rec.familiares || '') + '</u></p>'
        + '<div class="hoja-linea hoja-dosfilas">'
          + '<span>Parentesco <u>' + esc(rec.parentesco || '') + '</u></span>'
          + '<span>Nivel <u>' + esc(rec.nivel || '') + '</u></span>'
        + '</div>'

        + '<p class="hoja-nota">Esta solicitud no significa reservación de cupo.</p>'

        + '<p class="hoja-fecha">Tegucigalpa M.D.C. a los <u>' + f.dia + '</u> días del mes de <u>'
          + f.mes + '</u> de <u>' + f.anio + '</u></p>'

        + '<div class="hoja-firma">'
          + '<span class="hoja-firma-nombre">' + esc(rec.firma || '') + '</span>'
          + 'Firma del Padre o Encargado'
        + '</div>'

        + '<p class="hoja-origen">Solicitud recibida en línea a través de virginiasapp.edu.hn el '
          + fechaCorta(rec.t) + ' · Registro interno ' + esc(rec.id.slice(0, 8)) + '</p>'
      + '</div>'

    + '</div>';
  }

  function opcion(texto, activo) {
    return '<li><span class="txt">' + texto + '</span><span class="hoja-cx">' + (activo ? 'X' : '') + '</span></li>';
  }

  function fechaISOaCorta(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  /* ─── Impresión ─── */

  function imprimir() {
    if (!state.abierta) return;
    var host = el('preins-print-host');
    host.innerHTML = el('preins-hoja-wrap').innerHTML;

    var limpiar = function () {
      document.body.classList.remove('ceevs-imprimiendo');
      host.innerHTML = '';
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);

    document.body.classList.add('ceevs-imprimiendo');
    // Un respiro para que el navegador maquete la hoja antes de abrir el diálogo.
    setTimeout(function () {
      window.print();
      setTimeout(limpiar, 1500);   // respaldo si el navegador no avisa
    }, 120);
  }

  /* ─── Acciones ─── */

  function cambiarEstado(id, estado, silencioso) {
    return post({ action: 'estado', id: id, estado: estado })
      .then(function (d) {
        if (state.abierta && state.abierta.id === id) state.abierta.estado = d.rec.estado;
        var fila = state.items.filter(function (i) { return i.id === id; })[0];
        if (fila) fila.estado = estado;
        el('preins-estado').value = estado;
        pintarLista();
        recontar();
        if (!silencioso) toast('Marcada como ' + (ESTADOS[estado] || {}).label);
      })
      .catch(function (err) { toast(err.message); });
  }

  function recontar() {
    var stats = { total: state.items.length, nueva: 0, leida: 0, contactada: 0, archivada: 0 };
    state.items.forEach(function (i) { if (stats[i.estado] !== undefined) stats[i.estado]++; });
    pintarStats(stats);
  }

  function guardarNotas() {
    if (!state.abierta) return;
    post({ action: 'notas', id: state.abierta.id, notas: el('preins-notas').value })
      .then(function () { toast('Notas guardadas'); })
      .catch(function (err) { toast(err.message); });
  }

  function eliminar() {
    if (!state.abierta) return;
    var rec = state.abierta;
    if (!confirm('¿Eliminar definitivamente la solicitud #' + rec.num + ' de '
        + ((rec.alumno && rec.alumno.nombre) || 'este alumno') + '?\n\nNo se puede deshacer.')) return;

    post({ action: 'eliminar', id: rec.id })
      .then(function () {
        state.items = state.items.filter(function (i) { return i.id !== rec.id; });
        cerrar();
        pintarLista();
        recontar();
        toast('Solicitud eliminada');
      })
      .catch(function (err) { toast(err.message); });
  }

  function copiar() {
    if (!state.abierta) return;
    var texto = state.abierta._texto || '';
    var ok = function () { toast('Datos copiados al portapapeles'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { copiarViejo(texto, ok); });
    } else {
      copiarViejo(texto, ok);
    }
  }

  function copiarViejo(texto, ok) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { toast('No se pudo copiar'); }
    ta.remove();
  }

  function guardarAjustes() {
    post({
      action: 'ajustes',
      correo: el('preins-set-correo').value,
      ciclo: el('preins-set-ciclo').value,
      proximo: parseInt(el('preins-set-proximo').value, 10) || 0,
      abierto: el('preins-set-abierto').checked,
      notificar: el('preins-set-notificar').checked
    })
      .then(function (d) {
        state.settings = d.settings;
        state.next = d.next;
        pintarAjustes();
        toast('Ajustes guardados');
      })
      .catch(function (err) { toast(err.message); });
  }

  /* ─── Enlace de eventos ─── */

  function bind() {
    if (!el('panel-preinscripciones')) return;

    el('preins-lista').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-preins-ver]');
      var fila = e.target.closest('[data-preins-id]');
      if (btn) { abrir(btn.getAttribute('data-preins-ver')); return; }
      if (fila) abrir(fila.getAttribute('data-preins-id'));
    });

    el('preins-buscar').addEventListener('input', pintarLista);
    el('preins-filtro').addEventListener('change', pintarLista);
    el('preins-refrescar').addEventListener('click', function () { cargar().then(function () { toast('Bandeja actualizada'); }); });

    el('preins-modal-close').addEventListener('click', cerrar);
    el('preins-modal').addEventListener('click', function (e) {
      if (e.target === el('preins-modal')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el('preins-modal').hidden) cerrar();
    });

    el('preins-imprimir').addEventListener('click', imprimir);
    el('preins-estado').addEventListener('change', function () {
      if (state.abierta) cambiarEstado(state.abierta.id, this.value);
    });
    el('preins-notas-save').addEventListener('click', guardarNotas);
    el('preins-eliminar').addEventListener('click', eliminar);
    el('preins-copiar').addEventListener('click', copiar);
    el('preins-set-guardar').addEventListener('click', guardarAjustes);
  }

  /* ─── API pública (la usa admin.js al cambiar de pestaña) ─── */

  window.ceevsPreins = {
    render: function () { if (!state.cargado) cargar(); },
    recargar: cargar,
    /** Trae el contador de nuevas sin abrir la pestaña (para el globo del menú). */
    precargar: function () { if (!state.cargado) cargar(); },
    /** Marcado de la hoja oficial a partir de una solicitud (útil para previsualizar). */
    hoja: hojaHTML
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
