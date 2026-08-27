'use strict';

/* ═══════════════════════════════════════
   VERSÍCULO DEL DÍA — rotación diaria desde una API bíblica

   La sección #devocional de la portada mostraba siempre el mismo pasaje.
   Ahora la referencia se elige por la fecha del calendario —el mismo día da
   siempre el mismo versículo, así que todos los visitantes ven el mismo— y el
   texto se pide a la API pública de bolls.life:

     https://bolls.life/get-verse/RV1960/20/22/6/   → Reina-Valera 1960
     https://bolls.life/get-verse/WEB/20/22/6/      → World English Bible

   Sin clave, sin registro y con CORS abierto (Access-Control-Allow-Origin: *).
   Se consulta una sola vez al día: la respuesta queda en localStorage
   (ceevs_versiculo_dia) y el resto de visitas de esa jornada se pintan sin red.

   Si la API no responde, el HTML de index.html conserva su versículo escrito a
   mano, así que la sección nunca se ve vacía ni con un mensaje de error.

   Estilos: los de siempre (.devocional-*, css/5-responsive/media-queries.css).
═══════════════════════════════════════ */

const VersiculoDia = {
  name: 'VersiculoDia',

  API: 'https://bolls.life/get-verse/',
  CLAVE: 'versiculo_dia',   // Storage antepone 'ceevs_'
  ESPERA_MS: 8000,

  // Versión bíblica por idioma. La sigla es la que se imprime en la cita.
  VERSIONES: {
    es: { codigo: 'RV1960', sigla: 'RVR1960' },
    en: { codigo: 'WEB', sigla: 'WEB' },
  },

  // Nombre del libro para la cita, en español e inglés. La clave es el número
  // de libro del canon (1 = Génesis … 66 = Apocalipsis), que es lo que espera
  // la API.
  LIBROS: {
    5: ['Deuteronomio', 'Deuteronomy'],
    6: ['Josué', 'Joshua'],
    9: ['1 Samuel', '1 Samuel'],
    14: ['2 Crónicas', '2 Chronicles'],
    16: ['Nehemías', 'Nehemiah'],
    18: ['Job', 'Job'],
    19: ['Salmos', 'Psalm'],
    20: ['Proverbios', 'Proverbs'],
    21: ['Eclesiastés', 'Ecclesiastes'],
    23: ['Isaías', 'Isaiah'],
    24: ['Jeremías', 'Jeremiah'],
    25: ['Lamentaciones', 'Lamentations'],
    27: ['Daniel', 'Daniel'],
    33: ['Miqueas', 'Micah'],
    36: ['Sofonías', 'Zephaniah'],
    40: ['Mateo', 'Matthew'],
    41: ['Marcos', 'Mark'],
    42: ['Lucas', 'Luke'],
    43: ['Juan', 'John'],
    44: ['Hechos', 'Acts'],
    45: ['Romanos', 'Romans'],
    46: ['1 Corintios', '1 Corinthians'],
    47: ['2 Corintios', '2 Corinthians'],
    48: ['Gálatas', 'Galatians'],
    49: ['Efesios', 'Ephesians'],
    50: ['Filipenses', 'Philippians'],
    51: ['Colosenses', 'Colossians'],
    52: ['1 Tesalonicenses', '1 Thessalonians'],
    54: ['1 Timoteo', '1 Timothy'],
    55: ['2 Timoteo', '2 Timothy'],
    56: ['Tito', 'Titus'],
    58: ['Hebreos', 'Hebrews'],
    59: ['Santiago', 'James'],
    60: ['1 Pedro', '1 Peter'],
    61: ['2 Pedro', '2 Peter'],
    62: ['1 Juan', '1 John'],
    66: ['Apocalipsis', 'Revelation'],
  },

  // Lista curada de referencias apropiadas para el Centro: sabiduría, familia,
  // enseñanza, servicio y fe. Están barajadas a propósito para que dos días
  // seguidos no caigan en el mismo libro. Añadir o quitar entradas cambia la
  // rotación a partir del día siguiente; no hay nada más que tocar.
  REFERENCIAS: [
    [43,15,5], [20,21,21], [20,1,7], [20,3,6], [19,139,14], [21,4,9],
    [50,1,6], [5,31,6], [66,3,20], [24,29,11], [46,10,31], [40,5,14],
    [19,119,9], [45,15,13], [42,6,38], [49,4,2], [51,3,16], [59,1,5],
    [19,111,10], [46,13,13], [19,46,1], [60,4,10], [59,1,17], [42,6,31],
    [47,5,17], [20,17,17], [19,90,12], [23,54,13], [21,12,1], [54,4,12],
    [16,8,10], [43,16,33], [19,1,1], [40,22,37], [43,3,16], [20,3,5],
    [19,100,4], [45,12,2], [19,143,8], [45,8,28], [27,1,17], [14,15,7],
    [19,23,1], [20,23,12], [19,78,4], [18,19,25], [19,145,18], [43,13,34],
    [6,1,9], [19,119,105], [51,3,23], [19,136,1], [47,12,9], [43,8,12],
    [19,71,17], [52,5,18], [19,27,1], [20,2,6], [5,6,5], [19,121,1],
    [20,13,20], [43,1,12], [55,2,15], [24,17,7], [49,2,8], [9,16,7],
    [20,4,23], [19,62,8], [50,4,6], [19,34,8], [55,1,7], [60,5,7],
    [45,12,10], [40,6,33], [23,41,10], [20,22,6], [58,11,1], [40,22,39],
    [41,11,24], [62,4,7], [56,2,7], [49,4,32], [48,5,22], [44,20,35],
    [49,6,10], [61,3,18], [20,12,1], [21,3,1], [41,9,23], [20,19,20],
    [49,4,29], [40,7,12], [25,3,23], [19,51,10], [49,6,1], [62,3,18],
    [50,4,8], [20,15,1], [47,9,7], [48,6,9], [50,2,3], [19,91,1],
    [23,43,2], [5,6,7], [42,2,52], [58,12,1], [20,31,26], [23,26,3],
    [51,3,17], [50,4,13], [19,127,3], [33,6,8], [19,19,14], [58,10,24],
    [55,3,16], [46,16,14], [59,2,17], [52,5,11], [20,9,10], [23,40,31],
    [40,19,14], [58,13,8], [20,27,17], [27,12,3], [24,33,3], [59,1,19],
    [40,5,16], [19,133,1], [20,16,9], [36,3,17], [23,55,11], [43,14,6],
    [19,37,5], [46,13,4], [45,12,12], [20,11,25], [25,3,22], [20,16,3],
    [62,4,19], [19,55,22], [40,11,28], [45,5,8], [40,28,20], [19,118,24],
    [20,18,10],
  ],

  texto: null,
  cita: null,
  fecha: '',
  ref: null,
  cache: null,
  pidiendo: '',

  init() {
    this.texto = DOM.select('[data-versiculo-texto]');
    this.cita = DOM.select('[data-versiculo-cita]');
    if (!this.texto || !this.cita) return;   // la sección solo existe en la portada

    this.fecha = this._fechaLocal();
    this.ref = this.REFERENCIAS[this._indiceDelDia(this.fecha)];
    this.cache = this._leerCache();

    this._mostrar();

    // El conmutador ES/EN avisa por este evento (js/i18n.js): al cambiar de
    // idioma se repinta el versículo en la versión que corresponde.
    DOM.on(document, 'ceevs:lang', () => this._mostrar());
  },

  // ── Pintar lo que ya se tenga; si falta, pedirlo ──
  _mostrar() {
    const idioma = this._idioma();
    const guardado = this.cache && this.cache[idioma];
    if (guardado) this._pintar(guardado, idioma);
    else this._pedir(idioma);
  },

  _pedir(idioma) {
    if (this.pidiendo === idioma) return;
    this.pidiendo = idioma;

    const version = this.VERSIONES[idioma];
    const url = this.API + version.codigo + '/' + this.ref.join('/') + '/';
    const control = ('AbortController' in window) ? new AbortController() : null;
    const corte = control ? setTimeout(() => control.abort(), this.ESPERA_MS) : 0;

    fetch(url, control ? { signal: control.signal } : undefined)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
      })
      .then((datos) => {
        const limpio = this._limpiar(datos && datos.text);
        if (!limpio) throw new Error('respuesta sin texto');
        this._guardar(idioma, limpio);
        if (this._idioma() === idioma) this._pintar(limpio, idioma);
      })
      .catch((error) => {
        // Sin red o API caída: se queda el versículo escrito en el HTML.
        console.warn('Versículo del día: no se pudo consultar la API.', error);
      })
      .then(() => {
        clearTimeout(corte);
        if (this.pidiendo === idioma) this.pidiendo = '';
      });
  },

  _pintar(cuerpo, idioma) {
    DOM.text(this.texto, '«' + cuerpo + '»');
    DOM.text(this.cita, '— ' + this._referencia(idioma) + ' (' + this.VERSIONES[idioma].sigla + ')');
  },

  _referencia(idioma) {
    const nombres = this.LIBROS[this.ref[0]];
    const libro = nombres ? nombres[idioma === 'en' ? 1 : 0] : '';
    return (libro + ' ' + this.ref[1] + ':' + this.ref[2]).trim();
  },

  // ── Texto de la API → texto plano ──
  // RV1960 trae saltos de verso (<br>) y dobles espacios; las versiones en
  // inglés pueden traer números de Strong (<S>…</S>) y notas al margen
  // (<sup>…</sup>), que sobran en una cita. DOMParser decodifica las entidades
  // sin ejecutar nada: el documento que crea es inerte.
  _limpiar(bruto) {
    if (typeof bruto !== 'string') return '';
    const sinNotas = bruto
      .replace(/<S>[\s\S]*?<\/S>/gi, '')
      .replace(/<sup>[\s\S]*?<\/sup>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '');
    const plano = new DOMParser().parseFromString(sinNotas, 'text/html').body.textContent || '';
    return plano.replace(/\s+/g, ' ').replace(/\s+([,;.:!?])/g, '$1').trim();
  },

  // ── Caché de la jornada ──
  _leerCache() {
    const guardado = Storage.get(this.CLAVE);
    if (!guardado || typeof guardado !== 'object') return null;
    // Otro día, u otra lista de referencias: se vuelve a pedir.
    if (guardado.fecha !== this.fecha || guardado.ref !== this.ref.join(':')) return null;
    return guardado;
  },

  _guardar(idioma, cuerpo) {
    const dato = this.cache || { fecha: this.fecha, ref: this.ref.join(':') };
    dato[idioma] = cuerpo;
    this.cache = dato;
    Storage.set(this.CLAVE, dato);
  },

  // ── Fecha e índice ──
  // Fecha local del visitante: el versículo cambia a su medianoche.
  _fechaLocal() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();
    return hoy.getFullYear() + '-' + (mes < 10 ? '0' : '') + mes + '-' + (dia < 10 ? '0' : '') + dia;
  },

  // Días transcurridos desde 1970 módulo el tamaño de la lista: la misma fecha
  // da el mismo versículo en cualquier navegador, y cada día uno distinto.
  _indiceDelDia(fecha) {
    const partes = fecha.split('-');
    const dias = Math.floor(Date.UTC(+partes[0], +partes[1] - 1, +partes[2]) / 86400000);
    const total = this.REFERENCIAS.length;
    return ((dias % total) + total) % total;
  },

  _idioma() {
    if (typeof I18n !== 'undefined' && I18n && I18n.lang) return I18n.lang === 'en' ? 'en' : 'es';
    try {
      return localStorage.getItem('ceevs_lang') === 'en' ? 'en' : 'es';
    } catch (error) {
      return 'es';
    }
  },
};

App.register(VersiculoDia);
