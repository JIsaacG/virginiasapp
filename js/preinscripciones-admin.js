/**
 * preinscripciones-admin.js — Bandeja de pre-inscripciones del panel.
 *
 * Lee api/preinscripciones.php (requiere sesión de administrador) y arma:
 *  - la lista de solicitudes con su estado,
 *  - la ficha completa en el formato de la hoja oficial impresa,
 *  - la descarga en PDF (carta u oficio) y la impresión de esa hoja,
 *  - los ajustes del formulario público (correo de aviso, abierto/cerrado…).
 *
 * La hoja en sí (marcado, impresión y PDF) vive en js/solicitud-hoja.js, que
 * comparte con el formulario público; su presentación, en
 * css/pages/solicitud-print.css. Debe cargarse antes de admin.js.
 */

(function () {
  'use strict';

  var API = 'api/preinscripciones.php';

  var ESTADOS = {
    nueva:      { icon: '🔵', label: 'Nueva' },
    leida:      { icon: '👁️', label: 'Leída' },
    contactada: { icon: '✅', label: 'Contactada' },
    archivada:  { icon: '📁', label: 'Archivada' }
  };

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
        + '<small>Cuando una familia envíe el formulario aparecerá aquí y llegará completo al correo institucional.</small></p>';
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

    el('preins-hoja-wrap').innerHTML = window.ceevsHoja.html(rec, opcionesHoja(rec));
    window.ceevsHoja.ocultarLogosFaltantes(el('preins-hoja-wrap'));
  }

  /** Cómo debe armarse la hoja de esta solicitud: la foto la sirve el API. */
  function opcionesHoja(rec) {
    return {
      fotoSrc: rec.foto ? API + '?action=foto&id=' + encodeURIComponent(rec.id) : ''
    };
  }

  /* ─── Descargar en PDF / imprimir ─── */

  /** Baja el PDF de una vez, sin pasar por el diálogo de impresión. */
  function descargar() {
    if (!state.abierta) return;
    var btn = el('preins-descargar');
    var original = btn.textContent;

    btn.disabled = true;
    btn.textContent = '⏳ Preparando el PDF…';

    window.ceevsHoja.descargar(state.abierta, opcionesHoja(state.abierta))
      .then(function () { toast('PDF descargado (tamaño oficio)'); })
      .catch(function (err) { toast((err && err.message) || 'No se pudo generar el PDF.'); })
      .then(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
  }

  function imprimir() {
    if (!state.abierta) return;
    window.ceevsHoja.imprimir(state.abierta, opcionesHoja(state.abierta));
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

    el('preins-descargar').addEventListener('click', descargar);
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
    hoja: function (rec) { return window.ceevsHoja.html(rec, opcionesHoja(rec)); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
