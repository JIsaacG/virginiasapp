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
    abierta: null,  // solicitud abierta en el detalle
    bd: null        // estado de la base de datos (ver pintarBd)
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
        pintarBotonPdf();
        pintarSalud();
      })
      .catch(function (err) {
        lista.innerHTML = '<p class="empty-state">' + esc(err.message)
          + '<br><small>Si acabas de entrar, recarga la página. Sin PHP (modo local) esta pestaña no funciona.</small></p>';
        el('preins-count').textContent = '—';
        pintarBd(null);
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
            + (it.pdf ? '' : '<span class="preins-sinpdf">📄 Sin PDF</span>')
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

  /**
   * Dónde guarda PHP las solicitudes, de verdad.
   *
   * Con base de datos se informa de ella; sin base de datos, de la carpeta del
   * servidor y su ruta absoluta, para poder compararla con la que se ve en el
   * Administrador de archivos del hosting sin tener que adivinar.
   */
  function pintarSalud() {
    var cont = el('preins-salud');
    if (!cont) return;
    get('action=salud')
      .then(function (d) {
        pintarBd(d.bd);

        var kb = d.pdfBytes ? ' · ' + Math.round(d.pdfBytes / 1024) + ' KB' : '';
        var datos = d.recs + ' solicitud' + (d.recs === 1 ? '' : 'es')
          + ' · ' + d.pdfs + ' PDF' + (d.pdfs === 1 ? '' : 's') + ' archivado' + (d.pdfs === 1 ? '' : 's') + kb
          + (d.sinPdf ? ' · <strong>' + d.sinPdf + ' sin PDF</strong>' : '');

        if (d.bd && d.bd.conectada) {
          cont.innerHTML = '<p class="preins-salud-ruta"><span>🗄️ Guardadas en la base de datos:</span>'
            + '<code>' + esc(d.bd.nombre) + '</code></p>'
            + '<p class="preins-salud-datos">' + datos + '</p>'
            + copiaCarpeta(d);
        } else {
          var problema = !d.existe
            ? '<strong class="preins-salud-mal">La carpeta no existe.</strong>'
            : (!d.escribible ? '<strong class="preins-salud-mal">La carpeta no permite escribir.</strong>' : '');
          cont.innerHTML = '<p class="preins-salud-ruta"><span>📁 Carpeta de admisiones en el servidor:</span>'
            + '<code>' + esc(d.ruta) + '</code></p>'
            + '<p class="preins-salud-datos">' + datos + ' ' + problema + '</p>';
        }
        cont.hidden = false;
      })
      .catch(function () { cont.hidden = true; });
  }

  /**
   * Segunda línea de la tarjeta: la copia de respaldo en la carpeta del hosting.
   *
   * Solo aparece con base de datos conectada, porque sin ella la carpeta no es
   * una copia sino el almacén, y eso ya lo dice la línea de arriba.
   */
  function copiaCarpeta(d) {
    var esp = (d.bd && d.bd.espejo) || null;
    if (!esp || !esp.activo) return '';
    var disco = d.disco || {};
    var detalle;
    if (!esp.escribible) {
      detalle = '<strong class="preins-salud-mal">no se puede escribir en ella</strong>';
    } else if (esp.pendientes > 0) {
      detalle = disco.recs + ' copiada' + (disco.recs === 1 ? '' : 's')
        + ' · <strong>' + esp.pendientes + ' por copiar</strong>';
    } else {
      detalle = disco.recs + ' copiada' + (disco.recs === 1 ? '' : 's')
        + ' · ' + disco.pdfs + ' PDF' + (disco.pdfs === 1 ? '' : 's') + ' — al día';
    }
    return '<p class="preins-salud-ruta"><span>📁 Copia de respaldo en la carpeta:</span>'
      + '<code>' + esc(esp.ruta) + '</code></p>'
      + '<p class="preins-salud-datos">' + detalle + '</p>';
  }

  /* ─── Base de datos ───
   *
   * Es la tarjeta más importante de la pestaña: mientras las solicitudes vivan
   * solo en archivos del sitio, cada publicación de una versión nueva se las
   * lleva. Por eso el aviso es explícito y no un detalle técnico escondido.
   */

  function pintarBd(bd) {
    var chip = el('preins-bd-chip');
    var aviso = el('preins-bd-aviso');
    if (!chip || !aviso) return;
    if (!bd) {
      chip.textContent = 'No disponible';
      chip.className = 'preins-bd-chip preins-bd-chip--falta';
      return;
    }
    state.bd = bd;

    var estado = bd.conectada ? 'ok' : (bd.configurada ? 'mal' : 'falta');
    chip.className = 'preins-bd-chip preins-bd-chip--' + estado;
    chip.textContent = bd.conectada ? '✅ Conectada' : (bd.configurada ? '⚠️ Sin conexión' : '⚠️ Sin configurar');

    var texto;
    if (!bd.soportada) {
      texto = '<strong>Este servidor no tiene activado el conector MySQL de PHP.</strong> '
        + 'Pídele a soporte del hosting que habilite <code>pdo_mysql</code>; mientras tanto las solicitudes '
        + 'se guardan en archivos y se pierden al actualizar el sitio.';
    } else if (!bd.configurada) {
      texto = '<strong>Las solicitudes se están guardando en archivos del sitio, y por eso desaparecen '
        + 'cada vez que se actualiza el código.</strong> Crea la base de datos en el hosting, escribe aquí sus '
        + 'datos y pulsa "Probar y conectar": las que ya tengas se trasladan solas.';
    } else if (!bd.conectada) {
      texto = '<strong>No se pudo conectar: ' + esc(bd.error || 'error desconocido') + '</strong> '
        + 'Mientras tanto las solicitudes se siguen recibiendo y guardando en archivos; en cuanto la conexión '
        + 'vuelva se subirán solas a la base de datos.';
    } else {
      // Lo que de verdad quiere saber quien acaba de conectar: si esto hay que
      // repetirlo en cada actualización. Se responde con la ruta a la vista.
      var esp = bd.espejo || {};
      texto = 'Las solicitudes se guardan en <code>' + esc(bd.nombre) + '</code>'
        + (esp.activo && esp.escribible
            ? ' y, además, se deja una copia de cada una en la carpeta de admisiones del servidor'
            : '')
        + '. Ya puedes actualizar el sitio cuantas veces quieras: no se borran.'
        + (bd.pendientes ? ' Quedan <strong>' + bd.pendientes + '</strong> por trasladar desde archivos.' : '')
        + (esp.activo && !esp.escribible
            ? ' <strong>La copia en la carpeta está desactivada: el servidor no permite escribir en '
              + '<code>' + esc(esp.ruta || '') + '</code>.</strong>'
            : '')
        + (esp.pendientes ? ' Quedan <strong>' + esp.pendientes + '</strong> por copiar a la carpeta.' : '')
        + '<br><span class="preins-bd-origen">'
        + (bd.permanente
            ? '🔒 Conexión permanente: las credenciales están guardadas fuera del sitio'
              + (bd.origen ? ' (<code>' + esc(bd.origen) + '</code>)' : '')
              + ', así que ninguna actualización las borra. <strong>No hay que volver a escribirlas.</strong>'
            : '⚠️ Atención: las credenciales quedaron <strong>dentro del sitio</strong>'
              + (bd.origen ? ' (<code>' + esc(bd.origen) + '</code>)' : '')
              + ', así que la próxima actualización podría borrarlas y habría que escribirlas otra vez.')
        + '</span>';
    }
    aviso.className = 'preins-bd-aviso preins-bd-aviso--' + estado;
    aviso.innerHTML = texto;
    aviso.hidden = false;

    // Los campos solo se rellenan si el administrador no está escribiendo en ellos.
    ['host', 'nombre', 'usuario'].forEach(function (campo) {
      var input = el('preins-bd-' + campo);
      if (input && document.activeElement !== input) input.value = bd[campo] || '';
    });
    if (!el('preins-bd-host').value) el('preins-bd-host').value = 'localhost';

    var hint = el('preins-bd-clave-hint');
    if (hint) {
      hint.textContent = bd.tieneClave
        ? 'Ya hay una contraseña guardada: déjalo en blanco para conservarla.'
        : 'Se guarda solo en el servidor y nunca vuelve a mostrarse.';
    }

    // Un solo botón para las dos direcciones: subir a la base lo que quedó en
    // archivos y bajar a la carpeta la copia de lo que solo está en la base.
    var btnImp = el('preins-bd-importar');
    if (btnImp) {
      var porCopiar = (bd.espejo && bd.espejo.pendientes) || 0;
      var n = bd.pendientes || porCopiar;
      btnImp.hidden = !(bd.conectada && n > 0);
      btnImp.textContent = bd.pendientes
        ? '⬆️ Trasladar ' + bd.pendientes + ' solicitud' + (bd.pendientes === 1 ? '' : 'es') + ' de archivos'
        : '📁 Copiar ' + porCopiar + ' solicitud' + (porCopiar === 1 ? '' : 'es') + ' a la carpeta';
    }
  }

  function cargarBd() {
    return get('action=bd')
      .then(function (d) { pintarBd(d.bd); })
      .catch(function () { /* la tarjeta se queda como estaba */ });
  }

  function guardarBd() {
    var btn = el('preins-bd-guardar');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Probando la conexión…';

    post({
      action: 'bd',
      host: el('preins-bd-host').value,
      nombre: el('preins-bd-nombre').value,
      usuario: el('preins-bd-usuario').value,
      clave: el('preins-bd-clave').value
    })
      .then(function (d) {
        el('preins-bd-clave').value = '';
        pintarBd(d.bd);
        var imp = d.importado || {};
        toast(imp.importadas
          ? 'Conectada. ' + imp.importadas + ' solicitud' + (imp.importadas === 1 ? '' : 'es') + ' trasladada' + (imp.importadas === 1 ? '' : 's') + '.'
          : 'Base de datos conectada. Las solicitudes ya no se borran al actualizar.');
        return cargar();
      })
      .catch(function (err) {
        toast(err.message);
        return cargarBd();
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
  }

  /**
   * Sincroniza por tandas las dos direcciones: sube a la base lo que quedó en
   * archivos y baja a la carpeta la copia de lo que solo está en la base. El
   * servidor limita el tamaño de cada tanda; aquí solo se repite.
   */
  function importarBd() {
    var btn = el('preins-bd-importar');
    var original = btn.textContent;
    var subidas = 0;
    var copiadas = 0;
    btn.disabled = true;

    function tanda() {
      return post({ action: 'importar' }).then(function (d) {
        var imp = d.importado || {};
        var esp = d.espejado || {};
        subidas += imp.importadas || 0;
        copiadas += esp.copiadas || 0;
        pintarBd(d.bd);
        btn.textContent = '⏳ Sincronizando… (' + (subidas + copiadas) + ')';
        // Si una tanda no consigue mover nada, seguir solo repetiría el error.
        if (imp.pendientes > 0 && imp.importadas > 0) return tanda();
        if (esp.pendientes > 0 && esp.copiadas > 0) return tanda();
      });
    }

    tanda()
      .then(function () {
        var partes = [];
        if (subidas) {
          partes.push(subidas + ' solicitud' + (subidas === 1 ? '' : 'es')
            + ' trasladada' + (subidas === 1 ? '' : 's') + ' a la base de datos');
        }
        if (copiadas) {
          partes.push(copiadas + ' copiada' + (copiadas === 1 ? '' : 's') + ' a la carpeta');
        }
        toast(partes.length ? partes.join(' · ') : 'No quedaba nada por sincronizar');
        return cargar();
      })
      .catch(function (err) { toast(err.message); })
      .then(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
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

  function descargarGuardado(rec) {
    var a = document.createElement('a');
    a.href = API + '?action=pdf&id=' + encodeURIComponent(rec.id);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /** Guarda desde el panel una copia que falte (solicitudes recibidas antes del cambio). */
  function guardarPdfFaltante(rec, blob) {
    return fetch(API + '?action=pdf&id=' + encodeURIComponent(rec.id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-CEEVS-CSRF': csrf()
      },
      credentials: 'same-origin',
      body: blob
    })
      .then(function (r) {
        return r.json().then(function (d) { return { status: r.status, data: d }; });
      })
      .then(function (res) {
        if (res.status !== 200 || !res.data || !res.data.ok) {
          throw new Error((res.data && res.data.error) || 'No se pudo guardar el PDF.');
        }
        rec.pdf = true;
        var fila = state.items.filter(function (it) { return it.id === rec.id; })[0];
        if (fila) fila.pdf = true;
        pintarBotonPdf();
      });
  }

  /* ─── Relleno de las copias PDF que falten ───
   *
   * La copia oficial la arma el navegador, no PHP. Cuando la familia envía la
   * solicitud y cierra la página antes de que termine (o se le cae la conexión),
   * el expediente queda guardado pero sin su PDF. Este barrido lo repone desde
   * el panel: usa el MISMO generador que la familia, así que el archivo es
   * idéntico, y sube con sesión de administrador, sin depender del token de 30
   * minutos que ya venció.
   *
   * Va en serie a propósito: dos html2canvas a la vez consumen memoria de sobra
   * y en equipos modestos tumban la pestaña.
   */

  function pintarProgresoPdf(texto, ocupado) {
    var aviso = el('preins-pdf-estado');
    if (aviso) {
      aviso.textContent = texto || '';
      aviso.hidden = !texto;
    }
    var btn = el('preins-rellenar-pdf');
    if (btn) btn.disabled = !!ocupado;
  }

  /** Refresca el botón de relleno con cuántas copias faltan. */
  function pintarBotonPdf() {
    var btn = el('preins-rellenar-pdf');
    if (!btn) return;
    var faltan = state.items.filter(function (it) { return !it.pdf; }).length;
    btn.hidden = faltan === 0;
    btn.textContent = '📄 Generar PDF faltante' + (faltan === 1 ? '' : 's') + ' (' + faltan + ')';
  }

  function rellenarPdfsFaltantes(auto) {
    if (rellenarPdfsFaltantes._corriendo) return Promise.resolve();
    if (!window.ceevsHoja || typeof window.ceevsHoja.generar !== 'function') return Promise.resolve();

    var pendientes = state.items.filter(function (it) { return !it.pdf; });
    if (!pendientes.length) {
      if (!auto) toast('Todas las solicitudes ya tienen su PDF guardado');
      return Promise.resolve();
    }

    rellenarPdfsFaltantes._corriendo = true;
    var hechos = 0;
    var fallos = 0;
    var seguidos = 0;

    function siguiente(i) {
      // Dos fallos seguidos: algo va mal de fondo (permisos, cuota, sesión
      // vencida). Seguir solo repetiría el error tantas veces como solicitudes.
      if (i >= pendientes.length || seguidos >= 2) return Promise.resolve();

      pintarProgresoPdf('Generando PDF ' + (i + 1) + ' de ' + pendientes.length + '…', true);

      return get('action=get&id=' + encodeURIComponent(pendientes[i].id))
        .then(function (d) {
          var rec = d.rec;
          if (!rec) throw new Error('No se pudo leer la solicitud.');
          return window.ceevsHoja.generar(rec, opcionesHoja(rec))
            .then(function (blob) { return guardarPdfFaltante(rec, blob); });
        })
        .then(function () {
          hechos++;
          seguidos = 0;
        })
        .catch(function () {
          fallos++;
          seguidos++;
        })
        .then(function () {
          // Respiro entre solicitudes: html2canvas deja mucha memoria por liberar.
          return new Promise(function (r) { setTimeout(r, 300); });
        })
        .then(function () { return siguiente(i + 1); });
    }

    return siguiente(0).then(function () {
      rellenarPdfsFaltantes._corriendo = false;
      pintarProgresoPdf('', false);
      pintarLista();
      pintarBotonPdf();
      if (hechos && !fallos) {
        toast(hechos + ' PDF' + (hechos === 1 ? '' : 's') + ' generado' + (hechos === 1 ? '' : 's') + ' y archivado' + (hechos === 1 ? '' : 's'));
      } else if (hechos && fallos) {
        toast(hechos + ' PDF guardados, ' + fallos + ' con error. Revisa la bitácora.');
      } else if (fallos) {
        toast('No se pudieron generar los PDF que faltan. Revisa la bitácora (📜).');
      }
    });
  }

  /** Baja el PDF guardado; si es un registro anterior, primero lo crea y archiva. */
  function descargar() {
    if (!state.abierta) return;
    var btn = el('preins-descargar');
    var original = btn.textContent;

    btn.disabled = true;
    btn.textContent = state.abierta.pdf ? '⏳ Descargando…' : '⏳ Creando y guardando el PDF…';

    var tarea;
    if (state.abierta.pdf) {
      descargarGuardado(state.abierta);
      tarea = Promise.resolve();
    } else {
      tarea = window.ceevsHoja.generar(state.abierta, opcionesHoja(state.abierta))
        .then(function (blob) {
          return guardarPdfFaltante(state.abierta, blob).then(function () {
            window.ceevsHoja.descargarBlob(blob, window.ceevsHoja.nombreArchivo(state.abierta));
          });
        });
    }

    tarea
      .then(function () { toast('PDF guardado y descargado (tamaño oficio)'); })
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
    el('preins-rellenar-pdf').addEventListener('click', function () { rellenarPdfsFaltantes(false); });

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
    el('preins-bd-guardar').addEventListener('click', guardarBd);
    el('preins-bd-importar').addEventListener('click', importarBd);
  }

  /* ─── API pública (la usa admin.js al cambiar de pestaña) ─── */

  window.ceevsPreins = {
    /**
     * Al abrir la pestaña se reponen solas las copias PDF que falten. Es lo que
     * garantiza que la carpeta de admisiones acabe con el PDF de TODAS las
     * solicitudes, aunque la familia cerrara la página antes de que se subiera.
     *
     * Va aquí y no en cargar() a propósito: cargar() también corre para el globo
     * del menú, y no conviene ponerse a generar PDFs mientras el administrador
     * está en otra pestaña.
     */
    render: function () {
      (state.cargado ? Promise.resolve() : cargar()).then(function () {
        rellenarPdfsFaltantes(true);
      });
    },
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
