/**
 * solicitud-hoja.js — La hoja oficial de solicitud de admisión, compartida.
 *
 * Arma el marcado de la hoja (réplica del formulario en papel) y ofrece las dos
 * salidas que la usan:
 *   - imprimir(): manda la hoja a la impresora / diálogo del navegador,
 *   - descargar(): genera y baja el PDF tamaño oficio, sin pasar por el diálogo.
 *
 * Lo usan dos páginas:
 *   - admin.html  → pestaña de pre-inscripciones (una solicitud recibida),
 *   - preinscripcion.html → la familia se baja su propia solicitud al terminar.
 *
 * La presentación vive en css/pages/solicitud-print.css; el PDF se genera con
 * js/vendor/html2pdf.bundle.min.js, que se carga solo cuando se pide (pesa ~900 KB
 * y no debe retrasar la carga de ninguna página).
 */

(function () {
  'use strict';

  var LIB = 'js/vendor/html2pdf.bundle.min.js';

  var LOGOS = {
    izq:   'assets/images/formulario/logovirginiasapp.png',
    acsi:  'assets/images/formulario/logo asci.png',
    // Escudo dorado del león (esquina superior derecha de la hoja).
    // Si el archivo no existe todavía, el hueco se oculta solo.
    der:   'assets/images/formulario/lion_logo.png'
  };

  var VISION = 'Ser una institución líder en servicios educativos, culturales y sociales fundamentada en principios '
    + 'bíblicos evangélicos que contribuyen a la salvación y formación del hombre, egresando profesionales con '
    + 'potencial de impulsar el desarrollo integral para la transformación de la sociedad.';

  var MISION = 'Somos una institución educativa evangélica Cristocéntrica que brinda servicios de calidad, integrando '
    + 'aspectos de orden espiritual, moral, académico, social y físico que glorifican a Dios contribuyendo al '
    + 'desarrollo de la sociedad.';

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  /* Papel oficio (Legal, 8½×14"), el único tamaño en que el formulario sale igual
     que en papel: sus dos partes ocupan exactamente dos páginas. En carta la
     primera parte se pasa de largo y se derrama a una tercera hoja. */
  var PAPEL = { jsPDF: 'legal', css: 'legal portrait' };

  /* Márgenes del PDF en mm: arriba, izquierda, abajo, derecha.
     Ojo con los laterales: html2pdf arma la hoja dentro de un contenedor del ancho
     útil de la página y recorta lo que sobre. La hoja mide 194 mm, así que
     215.9 − 10 − 10 = 195.9 mm es el margen más grande que la deja entrar entera. */
  var MARGEN = [10, 10, 10, 10];

  /* ─── Utilidades ─── */

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  function fechaISOaCorta(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  /* ─── Marcado de la hoja ─── */

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

  function opcion(texto, activo) {
    return '<li><span class="txt">' + texto + '</span><span class="hoja-cx">' + (activo ? 'X' : '') + '</span></li>';
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

  /**
   * @param {Object} rec  Solicitud (misma forma que guarda api/preinscripcion.php).
   * @param {Object} [opts]  `fotoSrc`: de dónde sale la foto del alumno. En el panel
   *   es una URL del API; en el formulario público, la propia foto en base64.
   */
  function hojaHTML(rec, opts) {
    rec = rec || {};
    opts = opts || {};

    var al = rec.alumno || {};
    var f = fechaLarga(rec.t);
    var motivos = rec.motivo || [];
    var herm = (rec.hermanos || []).slice();

    // La hoja de papel trae cuatro renglones para hermanos: se respetan.
    while (herm.length < 4) herm.push({ nombre: '', edad: '', estudia: null, trabaja: null });

    var src = opts.fotoSrc
      || (typeof rec.foto === 'string' && rec.foto.indexOf('data:') === 0 ? rec.foto : '');
    var foto = src ? '<img src="' + esc(src) + '" alt="Foto del alumno">' : 'Foto<br>Alumno(a)';

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
          + fechaCorta(rec.t)
          + (rec.id ? ' · Registro interno ' + esc(String(rec.id).slice(0, 8)) : '') + '</p>'
      + '</div>'

    + '</div>';
  }

  /* ─── Salidas: impresión y PDF ─── */

  /** El @page se pone al momento de imprimir: fuera de la hoja no debe estorbar. */
  function fijarPapel() {
    var st = document.getElementById('ceevs-hoja-papel');
    if (!st) {
      st = document.createElement('style');
      st.id = 'ceevs-hoja-papel';
      document.head.appendChild(st);
    }
    st.textContent = '@media print { @page { size: ' + PAPEL.css + '; margin: 10mm; } }';
  }

  /** Si un escudo aún no se ha subido al servidor, se oculta en lugar de dejar un icono roto. */
  function ocultarLogosFaltantes(cont) {
    var imgs = cont.querySelectorAll('.hoja-top img');
    Array.prototype.forEach.call(imgs, function (img) {
      img.addEventListener('error', function () { img.hidden = true; });
      // Si la imagen ya había fallado antes de enganchar el evento (caché del navegador).
      if (img.complete && img.naturalWidth === 0) img.hidden = true;
    });
  }

  /** Nadie quiere una hoja a medio dibujar: se espera a que carguen logos y foto. */
  function esperarImagenes(cont) {
    var imgs = Array.prototype.slice.call(cont.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete) {
        if (img.naturalWidth === 0) img.hidden = true;
        return Promise.resolve();
      }
      return new Promise(function (resolve) {
        var listo = function (ok) {
          if (!ok) img.hidden = true;
          resolve();
        };
        img.addEventListener('load', function () { listo(true); });
        img.addEventListener('error', function () { listo(false); });
        setTimeout(function () { listo(img.naturalWidth > 0); }, 6000);
      });
    }));
  }

  function cargarLib() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (cargarLib._espera) return cargarLib._espera;

    cargarLib._espera = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = LIB;
      s.onload = function () {
        if (window.html2pdf) resolve(window.html2pdf);
        else reject(new Error('No se pudo preparar el generador de PDF.'));
      };
      s.onerror = function () {
        cargarLib._espera = null;
        reject(new Error('No se pudo cargar el generador de PDF. Revisa tu conexión.'));
      };
      document.head.appendChild(s);
    });
    return cargarLib._espera;
  }

  /** Nombre de archivo amable: Solicitud-12-Ana-Maria-Lopez.pdf */
  function nombreArchivo(rec) {
    var alumno = (rec.alumno && rec.alumno.nombre) || '';
    // Sin tildes ni eñes: hay computadoras y correos que se atragantan con ellas.
    if (alumno.normalize) alumno = alumno.normalize('NFD').replace(/[̀-ͯ]/g, '');
    alumno = alumno.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/\s+/g, '-');

    var num = rec.num ? '-' + String(rec.num).replace(/[^0-9A-Za-z]/g, '') : '';
    return 'Solicitud' + num + (alumno ? '-' + alumno : '') + '.pdf';
  }

  /**
   * Manda la hoja a la impresora. La página que llama solo pone los datos.
   * @param {Object} rec
   * @param {Object} [opts] `fotoSrc`
   */
  function imprimir(rec, opts) {
    opts = opts || {};
    fijarPapel();

    var host = document.getElementById('ceevs-hoja-print');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ceevs-hoja-print';
      document.body.appendChild(host);
    }
    host.innerHTML = hojaHTML(rec, opts);
    ocultarLogosFaltantes(host);

    var limpiar = function () {
      document.body.classList.remove('ceevs-imprimiendo');
      host.innerHTML = '';
      window.removeEventListener('afterprint', limpiar);
    };
    window.addEventListener('afterprint', limpiar);

    return esperarImagenes(host).then(function () {
      document.body.classList.add('ceevs-imprimiendo');
      // Un respiro para que el navegador maquete la hoja antes de abrir el diálogo.
      return new Promise(function (resolve) {
        setTimeout(function () {
          window.print();
          setTimeout(limpiar, 1500);   // respaldo si el navegador no avisa
          resolve();
        }, 120);
      });
    });
  }

  /**
   * Genera el PDF y lo baja de una vez, sin pasar por el diálogo de impresión.
   * @param {Object} rec
   * @param {Object} [opts] `fotoSrc`, `archivo`
   * @returns {Promise}
   */
  function descargar(rec, opts) {
    opts = opts || {};

    // La hoja se arma fuera de la vista: se necesita en el documento para que
    // el navegador calcule medidas y cargue las imágenes antes de fotografiarla.
    var host = document.createElement('div');
    host.className = 'ceevs-hoja-pdf';
    host.innerHTML = hojaHTML(rec, opts);
    document.body.appendChild(host);
    ocultarLogosFaltantes(host);

    var quitar = function () {
      if (host.parentNode) host.parentNode.removeChild(host);
    };

    return Promise.all([cargarLib(), esperarImagenes(host)])
      .then(function (r) {
        return r[0]().set({
          margin:     MARGEN,
          filename:   opts.archivo || nombreArchivo(rec),
          image:      { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
          jsPDF:      { unit: 'mm', format: PAPEL.jsPDF, orientation: 'portrait' },
          // La segunda parte arranca en página nueva y ninguna fila se parte a la mitad.
          pagebreak:  { mode: ['css', 'legacy'], before: '.hoja-p2', avoid: ['tr', '.hoja-vm', '.hoja-numrow'] }
        }).from(host.querySelector('.hoja')).save();
      })
      .then(function () { quitar(); })
      .catch(function (err) {
        quitar();
        throw err;
      });
  }

  window.ceevsHoja = {
    html: hojaHTML,
    imprimir: imprimir,
    descargar: descargar,
    ocultarLogosFaltantes: ocultarLogosFaltantes,
    nombreArchivo: nombreArchivo
  };
})();
