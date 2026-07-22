'use strict';

/* ═══════════════════════════════════════
   PRE-INSCRIPCIÓN — Asistente de la solicitud de admisión

   Página: preinscripcion.html · Estilos: css/4-sections/preinscripcion.css
   Envía a api/preinscripcion.php, que guarda la solicitud en el servidor y
   avisa al área de admisiones. El panel la lee en la pestaña "Pre-inscripciones".

   Ideas de diseño (para que las familias terminen de llenarla):
    - 7 pasos cortos en lugar de una hoja larga.
    - Borrador guardado solo: si cierran el navegador, retoman donde quedaron.
    - Se valida al avanzar, nunca todo junto al final.
    - La foto se reduce en el navegador antes de subirla (ahorra datos móviles).
═══════════════════════════════════════ */

const Preinscripcion = {
  name: 'Preinscripcion',

  API: 'api/preinscripcion.php',
  DRAFT_KEY: 'ceevs_preins_draft',
  TOTAL_PASOS: 7,

  FOTO_MAX_LADO: 900,      // px del lado mayor tras redimensionar
  FOTO_MAX_BYTES: 2000000, // tope duro que también valida el servidor

  data: null,
  enviada: null,           // solicitud ya enviada, para la copia en PDF
  paso: 1,
  maxPaso: 1,
  enviando: false,
  saveTimer: null,

  /* ─── Arranque ─── */

  init() {
    this.form = document.getElementById('preins-form');
    if (!this.form) return;

    this.data = this._vacio();
    this._cacheEls();
    this._bind();
    this._consultarEstado();
  },

  _cacheEls() {
    const id = x => document.getElementById(x);
    this.el = {
      wizard:   id('preins-wizard'),
      closed:   id('preins-closed'),
      done:     id('preins-done'),
      doneNum:  id('preins-done-num'),
      donePdf:  id('preins-done-pdf'),
      donePdfMsg: id('preins-done-pdf-msg'),
      fill:     id('preins-fill'),
      pct:      id('preins-pct'),
      stepLbl:  id('preins-step-label'),
      dots:     id('preins-dots'),
      back:     id('preins-back'),
      next:     id('preins-next'),
      send:     id('preins-send'),
      error:    id('preins-error'),
      saved:    id('preins-saved'),
      review:   id('pi-review'),
      draft:    id('preins-draft'),
      draftWhen: id('preins-draft-when'),
      hermanos: id('pi-hermanos-list'),
    };
  },

  _vacio() {
    return {
      alumno: {
        nombre: '', fechaNac: '', edad: '', sexo: '', identidad: '', nacionalidad: 'Hondureña',
        pais: 'Honduras', departamento: 'Francisco Morazán', ciudad: 'Tegucigalpa',
        viveCon: '', viveConOtro: '', escuela: '', escuelaLugar: '', escuelaTel: '', grado: ''
      },
      padre: { aplica: true },
      madre: { aplica: true },
      hermanos: [],
      medio: '', medioOtro: '', motivo: [],
      familiares: '', parentesco: '', nivel: '',
      firma: '', foto: ''
    };
  },

  /* ─── ¿El formulario está recibiendo solicitudes? ─── */

  _consultarEstado() {
    fetch(this.API + '?action=estado', { cache: 'no-store', credentials: 'same-origin' })
      .then(r => r.json())
      .then(res => {
        if (res && res.ok && res.abierto === false) {
          this.el.closed.hidden = false;
          return;
        }
        this._abrirAsistente();
      })
      // Sin PHP (abriendo el archivo local) el asistente igual se puede recorrer.
      .catch(() => this._abrirAsistente());
  },

  _abrirAsistente() {
    this.el.wizard.hidden = false;
    this._toggleHermanos();   // deja lista una fila de hermano, para no llegar al paso 6 en blanco
    this._ofrecerBorrador();
    this._irAPaso(1, true);
  },

  /* ─── Borrador guardado ─── */

  _ofrecerBorrador() {
    let raw = null;
    try { raw = localStorage.getItem(this.DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;

    let draft;
    try { draft = JSON.parse(raw); } catch (e) { return; }
    if (!draft || !draft.data) return;

    // Un borrador sin nada escrito no se le ofrece a nadie: solo confundiría.
    if (!this._tieneContenido(draft.data)) { this._borrarBorrador(); return; }

    const nombre = (draft.data.alumno && draft.data.alumno.nombre) || '';
    this.el.draftWhen.textContent = nombre
      ? 'Era la solicitud de ' + nombre + '.'
      : 'La guardamos en este dispositivo.';
    this.el.draft.hidden = false;

    document.getElementById('preins-draft-continue').addEventListener('click', () => {
      this.data = Object.assign(this._vacio(), draft.data);
      this._aplicarAlFormulario();
      this.maxPaso = Math.min(this.TOTAL_PASOS, Math.max(1, draft.paso || 1));
      this.el.draft.hidden = true;
      this._irAPaso(this.maxPaso, true);
      this._aviso('Retomamos donde quedaste ✓');
    });

    document.getElementById('preins-draft-new').addEventListener('click', () => {
      this._borrarBorrador();
      this.el.draft.hidden = true;
    });
  },

  /** ¿La familia ya escribió algo que valga la pena conservar? */
  _tieneContenido(d) {
    if (!d) return false;
    const a = d.alumno || {};
    return !!(a.nombre || a.fechaNac || a.grado || a.identidad || d.foto
      || (d.padre && d.padre.nombre) || (d.madre && d.madre.nombre)
      || (d.hermanos && d.hermanos.length));
  },

  _guardarBorrador() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this._recolectar();
      // Abrir la página y no escribir nada no debe dejar rastro.
      if (!this._tieneContenido(this.data)) return;
      try {
        localStorage.setItem(this.DRAFT_KEY, JSON.stringify({
          data: this.data, paso: this.paso, t: Date.now()
        }));
        this._aviso('Guardado ✓');
      } catch (e) {
        // Si no cabe (foto grande + almacenamiento lleno), se guarda sin la foto.
        try {
          const sinFoto = JSON.parse(JSON.stringify(this.data));
          sinFoto.foto = '';
          localStorage.setItem(this.DRAFT_KEY, JSON.stringify({ data: sinFoto, paso: this.paso, t: Date.now() }));
        } catch (e2) { /* sin borrador: el formulario sigue funcionando */ }
      }
    }, 700);
  },

  _borrarBorrador() {
    try { localStorage.removeItem(this.DRAFT_KEY); } catch (e) {}
  },

  _aviso(txt) {
    this.el.saved.textContent = txt;
    clearTimeout(this._avisoTimer);
    this._avisoTimer = setTimeout(() => { this.el.saved.textContent = ''; }, 2600);
  },

  /* ─── Lectura y escritura de los campos ─── */

  _set(path, val) {
    const partes = path.split('.');
    let obj = this.data;
    for (let i = 0; i < partes.length - 1; i++) {
      if (typeof obj[partes[i]] !== 'object' || obj[partes[i]] === null) obj[partes[i]] = {};
      obj = obj[partes[i]];
    }
    obj[partes[partes.length - 1]] = val;
  },

  _get(path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), this.data);
  },

  /** Vuelca el formulario completo al objeto `data`. */
  _recolectar() {
    this.form.querySelectorAll('[data-pi]').forEach(inp => {
      const path = inp.getAttribute('data-pi');
      if (path === 'sitio_web') return;              // campo trampa: se lee aparte
      this._set(path, (inp.value || '').trim());
    });

    this.form.querySelectorAll('[data-pi-radio]:checked').forEach(inp => {
      this._set(inp.getAttribute('data-pi-radio'), inp.value);
    });

    this.data.padre.aplica = !document.getElementById('pi-padre-na').checked;
    this.data.madre.aplica = !document.getElementById('pi-madre-na').checked;

    this.data.motivo = Array.from(this.form.querySelectorAll('[data-pi-motivo]:checked')).map(c => c.value);

    this.data.hermanos = document.getElementById('pi-sin-hermanos').checked ? [] : this._leerHermanos();
  },

  _leerHermanos() {
    return Array.from(this.el.hermanos.querySelectorAll('.preins-hermano'))
      .map(fila => ({
        nombre:  (fila.querySelector('[data-h="nombre"]').value || '').trim(),
        edad:    (fila.querySelector('[data-h="edad"]').value || '').trim(),
        estudia: fila.querySelector('[data-h="estudia"]').checked,
        trabaja: fila.querySelector('[data-h="trabaja"]').checked
      }))
      .filter(h => h.nombre !== '');
  },

  /** Vuelve a pintar en el formulario lo que hay en `data` (al recuperar un borrador). */
  _aplicarAlFormulario() {
    this.form.querySelectorAll('[data-pi]').forEach(inp => {
      const path = inp.getAttribute('data-pi');
      if (path === 'sitio_web') return;
      const v = this._get(path);
      if (v !== undefined && v !== null) inp.value = v;
    });

    this.form.querySelectorAll('[data-pi-radio]').forEach(inp => {
      inp.checked = this._get(inp.getAttribute('data-pi-radio')) === inp.value;
    });

    document.getElementById('pi-padre-na').checked = this.data.padre.aplica === false;
    document.getElementById('pi-madre-na').checked = this.data.madre.aplica === false;
    this._toggleParent('padre');
    this._toggleParent('madre');

    const motivos = this.data.motivo || [];
    this.form.querySelectorAll('[data-pi-motivo]').forEach(c => { c.checked = motivos.indexOf(c.value) !== -1; });

    this.el.hermanos.innerHTML = '';
    (this.data.hermanos || []).forEach(h => this._addHermano(h));
    document.getElementById('pi-sin-hermanos').checked = (this.data.hermanos || []).length === 0;
    this._toggleHermanos();

    if (this.data.foto) this._pintarFoto(this.data.foto);
    this._toggleCondicionales();
    this._calcularEdad();
  },

  /* ─── Eventos ─── */

  _bind() {
    this.el.next.addEventListener('click', () => this._siguiente());
    this.el.back.addEventListener('click', () => this._irAPaso(this.paso - 1));
    this.form.addEventListener('submit', e => { e.preventDefault(); this._enviar(); });

    // Cualquier cambio actualiza el borrador y limpia el error visible.
    this.form.addEventListener('input', e => {
      if (e.target.id === 'pi-fechanac') this._calcularEdad();
      e.target.classList.remove('invalid');
      this._ocultarError();
      this._guardarBorrador();
    });

    this.form.addEventListener('change', e => {
      if (e.target.matches('[data-pi-radio]')) this._toggleCondicionales();
      if (e.target.id === 'pi-padre-na') this._toggleParent('padre');
      if (e.target.id === 'pi-madre-na') this._toggleParent('madre');
      if (e.target.id === 'pi-sin-hermanos') this._toggleHermanos();
      if (e.target.hasAttribute('data-pi-motivo')) this._exclusivaTodas(e.target);
      this._guardarBorrador();
    });

    // Enter avanza en vez de enviar a medias.
    this.form.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
      if (this.paso < this.TOTAL_PASOS) { e.preventDefault(); this._siguiente(); }
    });

    document.getElementById('pi-add-hermano').addEventListener('click', () => {
      this._addHermano();
      const ultima = this.el.hermanos.querySelector('.preins-hermano:last-child [data-h="nombre"]');
      if (ultima) ultima.focus();
    });

    this.el.hermanos.addEventListener('click', e => {
      const btn = e.target.closest('.preins-hermano-del');
      if (!btn) return;
      btn.closest('.preins-hermano').remove();
      this._guardarBorrador();
    });

    // Volver a un paso desde la revisión final o desde los puntos de progreso.
    this.el.review.addEventListener('click', e => {
      const btn = e.target.closest('[data-goto]');
      if (btn) this._irAPaso(parseInt(btn.getAttribute('data-goto'), 10));
    });

    this.el.dots.addEventListener('click', e => {
      const li = e.target.closest('li[data-step]');
      if (!li) return;
      const destino = parseInt(li.getAttribute('data-step'), 10);
      if (destino <= this.maxPaso) this._irAPaso(destino);
    });

    this._bindFoto();
    if (this.el.donePdf) this.el.donePdf.addEventListener('click', () => this._descargarPDF());
  },

  /** "Todas las anteriores" no convive con las opciones sueltas. */
  _exclusivaTodas(cambiado) {
    const todas = this.form.querySelector('[data-pi-motivo][value="todas"]');
    if (!todas) return;
    if (cambiado === todas && todas.checked) {
      this.form.querySelectorAll('[data-pi-motivo]').forEach(c => { if (c !== todas) c.checked = false; });
    } else if (cambiado !== todas && cambiado.checked) {
      todas.checked = false;
    }
  },

  _toggleCondicionales() {
    const vive = this.form.querySelector('[data-pi-radio="alumno.viveCon"]:checked');
    document.getElementById('pi-vivecon-otro-wrap').hidden = !(vive && vive.value === 'otro');

    const medio = this.form.querySelector('[data-pi-radio="medio"]:checked');
    document.getElementById('pi-medio-otro-wrap').hidden = !(medio && medio.value === 'otro');
  },

  _toggleParent(quien) {
    const na = document.getElementById('pi-' + quien + '-na').checked;
    document.getElementById('pi-' + quien + '-fields').classList.toggle('off', na);
  },

  _toggleHermanos() {
    const sin = document.getElementById('pi-sin-hermanos').checked;
    document.getElementById('pi-hermanos-wrap').classList.toggle('off', sin);
    if (!sin && !this.el.hermanos.querySelector('.preins-hermano')) this._addHermano();
  },

  _calcularEdad() {
    const f = document.getElementById('pi-fechanac').value;
    const out = document.getElementById('pi-edad');
    const hint = document.getElementById('pi-edad-calc');
    if (!f) { out.value = ''; hint.textContent = 'La edad se calcula sola.'; return; }

    const nac = new Date(f + 'T00:00:00');
    if (isNaN(nac.getTime())) return;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;

    if (edad < 0 || edad > 30) { out.value = ''; hint.textContent = 'Revisa la fecha: no parece correcta.'; return; }
    out.value = edad;
    hint.textContent = 'Tiene ' + edad + (edad === 1 ? ' año.' : ' años.');
  },

  /* ─── Hermanos ─── */

  _addHermano(datos) {
    const h = datos || { nombre: '', edad: '', estudia: true, trabaja: false };
    const fila = document.createElement('div');
    fila.className = 'preins-hermano';
    fila.innerHTML =
      '<input type="text" data-h="nombre" placeholder="Nombre completo del hermano(a)" maxlength="120">' +
      '<input type="number" data-h="edad" placeholder="Edad" min="0" max="60" inputmode="numeric">' +
      '<label class="preins-hermano-flag"><input type="checkbox" data-h="estudia"> Estudia</label>' +
      '<label class="preins-hermano-flag"><input type="checkbox" data-h="trabaja"> Trabaja</label>' +
      '<button type="button" class="preins-hermano-del" aria-label="Quitar este hermano">✕</button>';
    fila.querySelector('[data-h="nombre"]').value = h.nombre || '';
    fila.querySelector('[data-h="edad"]').value = h.edad || '';
    fila.querySelector('[data-h="estudia"]').checked = !!h.estudia;
    fila.querySelector('[data-h="trabaja"]').checked = !!h.trabaja;
    this.el.hermanos.appendChild(fila);
  },

  /* ─── Foto del alumno ─── */

  _bindFoto() {
    const galeria = document.getElementById('pi-foto-input');
    const camara = document.getElementById('pi-foto-camara-input');
    const btnCamara = document.getElementById('pi-foto-camara');

    // El botón de cámara solo tiene sentido donde el aparato la puede abrir
    // (celulares y tabletas). En computadora se deja solo "Subir una foto".
    if ('capture' in document.createElement('input') && this._esTactil()) {
      btnCamara.hidden = false;
      document.getElementById('pi-foto-btn-txt').textContent = 'Elegir de la galería';
    }

    btnCamara.addEventListener('click', () => camara.click());
    document.getElementById('pi-foto-btn').addEventListener('click', () => galeria.click());

    document.getElementById('pi-foto-clear').addEventListener('click', () => {
      this.data.foto = '';
      galeria.value = '';
      camara.value = '';
      document.getElementById('pi-foto-preview').hidden = true;
      document.getElementById('pi-foto-empty').hidden = false;
      document.getElementById('pi-foto-clear').hidden = true;
      document.getElementById('pi-foto-status').textContent = '';
      this._guardarBorrador();
    });

    [galeria, camara].forEach(input => {
      input.addEventListener('change', () => this._recibirFoto(input));
    });
  },

  _esTactil() {
    return (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  },

  _recibirFoto(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const status = document.getElementById('pi-foto-status');
    status.className = 'preins-hint';
    status.textContent = 'Preparando la foto…';

    this._reducirImagen(file)
      .then(dataUrl => {
        this.data.foto = dataUrl;
        this._pintarFoto(dataUrl);
        status.textContent = 'Foto lista ✓ (' + Math.round(dataUrl.length * 0.73 / 1024) + ' KB)';
        this._guardarBorrador();
      })
      .catch(() => {
        status.className = 'preins-hint err';
        status.textContent = 'No pudimos leer esa imagen. Intenta con otra foto.';
      });
  },

  _pintarFoto(dataUrl) {
    const img = document.getElementById('pi-foto-preview');
    img.src = dataUrl;
    img.hidden = false;
    document.getElementById('pi-foto-empty').hidden = true;
    document.getElementById('pi-foto-clear').hidden = false;
  },

  /**
   * Reduce la foto en el navegador antes de enviarla: la familia gasta menos
   * datos móviles y el servidor recibe siempre un archivo manejable.
   */
  _reducirImagen(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { reject(); return; }

      const procesar = bitmapOImg => {
        const w = bitmapOImg.width, h = bitmapOImg.height;
        if (!w || !h) { reject(); return; }
        const escala = Math.min(1, this.FOTO_MAX_LADO / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * escala);
        canvas.height = Math.round(h * escala);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmapOImg, 0, 0, canvas.width, canvas.height);

        let calidad = 0.85;
        let out = canvas.toDataURL('image/jpeg', calidad);
        while (out.length * 0.73 > this.FOTO_MAX_BYTES && calidad > 0.4) {
          calidad -= 0.12;
          out = canvas.toDataURL('image/jpeg', calidad);
        }
        resolve(out);
      };

      // createImageBitmap respeta la orientación EXIF (fotos de celular acostadas).
      if (window.createImageBitmap) {
        createImageBitmap(file, { imageOrientation: 'from-image' })
          .then(procesar)
          .catch(() => this._leerConImagen(file).then(procesar).catch(reject));
        return;
      }
      this._leerConImagen(file).then(procesar).catch(reject);
    });
  },

  _leerConImagen(file) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = lector.result;
      };
      lector.onerror = reject;
      lector.readAsDataURL(file);
    });
  },

  /* ─── Navegación entre pasos ─── */

  _siguiente() {
    if (!this._validarPaso(this.paso)) return;
    if (this.paso >= this.TOTAL_PASOS) return;
    this._irAPaso(this.paso + 1);
  },

  _irAPaso(n, silencioso) {
    n = Math.max(1, Math.min(this.TOTAL_PASOS, n));
    this._recolectar();

    this.form.querySelectorAll('.preins-step').forEach(s => {
      s.classList.toggle('active', parseInt(s.getAttribute('data-step'), 10) === n);
    });

    this.paso = n;
    this.maxPaso = Math.max(this.maxPaso, n);
    if (n === this.TOTAL_PASOS) this._pintarRevision();

    // Pasado el primer paso, el encabezado de presentación se encoge: en el
    // celular estorbaba y obligaba a bajar en cada paso para ver los campos.
    if (this.maxPaso > 1) document.getElementById('preins').classList.add('avanzado');

    this._pintarProgreso();
    this._ocultarError();
    this._guardarBorrador();

    if (!silencioso) {
      this._subirALaTarjeta();
      this._premiar(n);
    }
  },

  /** Deja el formulario justo debajo de la barra de progreso, sin saltos raros. */
  _subirALaTarjeta() {
    const barra = document.getElementById('preins-progress');
    const navAlto = window.innerWidth <= 720 ? 66 : 76;
    const y = barra.getBoundingClientRect().top + window.pageYOffset - navAlto - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  },

  _pintarProgreso() {
    const etiquetas = ['El alumno', 'Residencia', 'Grado y escuela', 'Datos del padre', 'Datos de la madre', 'Familia', 'Revisar y enviar'];
    const pct = Math.round(((this.paso - 1) / (this.TOTAL_PASOS - 1)) * 100);

    this.el.fill.style.width = pct + '%';
    this.el.pct.textContent = pct + '%';
    this.el.stepLbl.textContent = 'Paso ' + this.paso + ' de ' + this.TOTAL_PASOS + ' · ' + etiquetas[this.paso - 1];

    this.el.dots.querySelectorAll('li').forEach(li => {
      const n = parseInt(li.getAttribute('data-step'), 10);
      li.classList.toggle('current', n === this.paso);
      li.classList.toggle('done', n < this.paso);
    });

    this.el.back.hidden = this.paso === 1;
    this.el.next.hidden = this.paso === this.TOTAL_PASOS;
    this.el.send.hidden = this.paso !== this.TOTAL_PASOS;
  },

  /** Un empujoncito de ánimo: XP del sitio al ir completando pasos. */
  _premiar(paso) {
    if (typeof addXP !== 'function' || paso <= 1) return;
    const mensajes = {
      2: ['🎒', '¡Buen inicio!', 'Ya registramos al alumno'],
      4: ['📚', 'Vas a la mitad', 'Falta poco para terminar'],
      7: ['📝', '¡Última revisión!', 'Solo confirma y envía']
    };
    const m = mensajes[paso];
    if (m) addXP(5, m[0], m[1], m[2]);
  },

  /* ─── Validación ─── */

  _validarPaso(n) {
    this._recolectar();
    const a = this.data.alumno;

    if (n === 1) {
      if (a.nombre.length < 5 || a.nombre.split(' ').filter(Boolean).length < 2) {
        return this._fallar('Escribe el nombre y los apellidos del alumno(a).', 'pi-nombre');
      }
      if (!a.fechaNac) return this._fallar('Necesitamos la fecha de nacimiento del alumno(a).', 'pi-fechanac');
      if (!document.getElementById('pi-edad').value) {
        return this._fallar('La fecha de nacimiento no parece correcta. Revísala, por favor.', 'pi-fechanac');
      }
      if (!a.sexo) return this._fallar('Indica el sexo del alumno(a).');
    }

    if (n === 2) {
      if (!a.viveCon) return this._fallar('Indica con quién vive el alumno(a).');
      if (a.viveCon === 'otro' && !a.viveConOtro) {
        return this._fallar('Escribe con quién vive el alumno(a).', 'pi-vivecon-otro');
      }
    }

    if (n === 3 && !a.grado) {
      return this._fallar('Elige el grado que va a cursar.', 'pi-grado');
    }

    if (n === 4 && this.data.padre.aplica && !(this.data.padre.nombre || '').trim()) {
      return this._fallar('Escribe el nombre del padre, o marca "No aplica" si no cuentas con esos datos.', 'pi-padre-nombre');
    }

    if (n === 5) {
      if (this.data.madre.aplica && !(this.data.madre.nombre || '').trim()) {
        return this._fallar('Escribe el nombre de la madre, o marca "No aplica" si no cuentas con esos datos.', 'pi-madre-nombre');
      }
      if (!this._contacto()) {
        return this._fallar('Necesitamos al menos un teléfono o correo del padre o de la madre para poder comunicarnos con ustedes.', 'pi-madre-celular');
      }
    }

    if (n === 7) {
      if ((this.data.firma || '').trim().length < 5) {
        return this._fallar('Escribe el nombre de quien llena la solicitud.', 'pi-firma');
      }
      if (!document.getElementById('pi-declara').checked) {
        return this._fallar('Marca la casilla de declaración para poder enviar la solicitud.');
      }
    }

    return true;
  },

  /** Primer dato de contacto disponible entre madre y padre. */
  _contacto() {
    return [this.data.madre, this.data.padre].reduce((acc, p) => {
      if (acc || !p || !p.aplica) return acc;
      return (p.celular || '').trim() || (p.telFijo || '').trim() || (p.correo || '').trim() || '';
    }, '');
  },

  _fallar(msg, focusId) {
    this.el.error.textContent = msg;
    this.el.error.hidden = false;
    if (focusId) {
      const campo = document.getElementById(focusId);
      if (campo) {
        campo.classList.add('invalid');
        campo.focus({ preventScroll: true });
        campo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    return false;
  },

  _ocultarError() {
    this.el.error.hidden = true;
    this.el.error.textContent = '';
  },

  /* ─── Revisión final ─── */

  _pintarRevision() {
    const a = this.data.alumno;
    const viveCon = { ambos: 'Ambos padres', madre: 'La madre', padre: 'El padre', otro: a.viveConOtro || 'Otro' };
    const medios = { pariente: 'Un pariente', amigo: 'Un amigo', redes: 'Redes sociales', otro: this.data.medioOtro || 'Otro' };
    const motivos = {
      cristiana: 'Por su impacto en educación cristiana',
      academico: 'Por su enfoque académico',
      instalaciones: 'Por sus instalaciones',
      todas: 'Todas las anteriores'
    };

    const bloques = [
      { titulo: 'El alumno', paso: 1, filas: [
        ['Nombre completo', a.nombre],
        ['Fecha de nacimiento', this._fechaLegible(a.fechaNac)],
        ['Edad', a.edad ? a.edad + ' años' : ''],
        ['Sexo', a.sexo],
        ['N° de identidad', a.identidad],
        ['Nacionalidad', a.nacionalidad],
        ['Foto', this.data.foto ? 'Adjunta ✓' : 'Sin foto']
      ] },
      { titulo: 'Residencia', paso: 2, filas: [
        ['País', a.pais],
        ['Departamento', a.departamento],
        ['Ciudad', a.ciudad],
        ['Vive con', viveCon[a.viveCon] || '']
      ] },
      { titulo: 'Grado y escuela', paso: 3, filas: [
        ['Grado que va a cursar', a.grado],
        ['Escuela de procedencia', a.escuela],
        ['Lugar', a.escuelaLugar],
        ['Teléfono', a.escuelaTel]
      ] },
      { titulo: 'Datos del padre', paso: 4, filas: this._filasPadre(this.data.padre) },
      { titulo: 'Datos de la madre', paso: 5, filas: this._filasPadre(this.data.madre) },
      { titulo: 'Familia y referencia', paso: 6, filas: [
        ['Hermanos', this.data.hermanos.length
          ? this.data.hermanos.map(h => h.nombre + (h.edad ? ' (' + h.edad + ')' : '')).join(' · ')
          : 'Sin hermanos registrados'],
        ['Se enteró por', medios[this.data.medio] || ''],
        ['Eligió la institución', (this.data.motivo || []).map(m => motivos[m]).join(' · ')],
        ['Familiares en la institución', this.data.familiares],
        ['Parentesco', this.data.parentesco],
        ['Nivel del familiar', this.data.nivel]
      ] }
    ];

    this.el.review.innerHTML = bloques.map(b =>
      '<div class="preins-review-card">' +
        '<div class="preins-review-head">' +
          '<h3>' + b.titulo + '</h3>' +
          '<button type="button" class="preins-review-edit" data-goto="' + b.paso + '">Corregir</button>' +
        '</div>' +
        '<div class="preins-review-list">' +
          b.filas.map(f =>
            '<div><span class="k">' + this._esc(f[0]) + '</span>' +
            '<span class="v' + (f[1] ? '' : ' empty') + '">' + this._esc(f[1] || 'Sin llenar') + '</span></div>'
          ).join('') +
        '</div>' +
      '</div>'
    ).join('');
  },

  _filasPadre(p) {
    if (!p || !p.aplica) return [['Información', 'No proporcionada']];
    return [
      ['Nombre completo', p.nombre],
      ['Profesión', p.profesion],
      ['Ocupación', p.ocupacion],
      ['Dirección', p.direccion],
      ['Teléfono fijo', p.telFijo],
      ['Celular', p.celular],
      ['Correo electrónico', p.correo],
      ['Centro de trabajo', p.centroTrabajo],
      ['Iglesia que asiste', p.iglesia],
      ['Líder espiritual', p.lider],
      ['Ingreso mensual', p.ingreso]
    ];
  },

  _fechaLegible(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                   'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
  },

  _esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  /* ─── Envío ─── */

  _enviar() {
    if (this.enviando) return;
    if (!this._validarPaso(7)) return;

    this.enviando = true;
    this.el.send.disabled = true;
    this.el.send.textContent = 'Enviando…';

    const trampa = document.getElementById('pi-sitio-web');
    const cuerpo = Object.assign({}, this.data, { sitio_web: trampa ? trampa.value : '' });

    fetch(this.API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(cuerpo)
    })
      .then(r => r.json().then(d => ({ status: r.status, data: d })))
      .then(res => {
        if (res.status !== 200 || !res.data || !res.data.ok) {
          throw new Error((res.data && res.data.error) || 'No se pudo enviar la solicitud.');
        }
        this._borrarBorrador();

        // Se guarda lo enviado para que la familia pueda bajarse su copia en PDF
        // desde esta misma pantalla (el borrador ya se borró).
        this.enviada = Object.assign({}, JSON.parse(JSON.stringify(this.data)), {
          num: res.data.num,
          t: new Date().toISOString()
        });

        this.el.wizard.hidden = true;
        this.el.done.hidden = false;
        this.el.doneNum.textContent = '#' + res.data.num;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (typeof addXP === 'function') addXP(30, '🏫', '¡Solicitud enviada!', 'Bienvenida a la familia CEEVS');
        if (typeof unlockBadge === 'function') unlockBadge('contact');
      })
      .catch(err => {
        this._fallar(err && err.message
          ? err.message
          : 'No pudimos enviar la solicitud. Revisa tu conexión e intenta de nuevo — no perderás lo que escribiste.');
        this.enviando = false;
        this.el.send.disabled = false;
        this.el.send.textContent = 'Enviar solicitud';
      });
  },

  /* ─── Copia en PDF para la familia ─── */

  /**
   * Baja la solicitud ya enviada en el formato de la hoja oficial. La arma
   * js/solicitud-hoja.js, el mismo módulo que usa el panel: así la copia de la
   * familia y la del colegio son idénticas.
   */
  _descargarPDF() {
    if (!this.enviada || !window.ceevsHoja) return;

    const btn = this.el.donePdf;
    const msg = this.el.donePdfMsg;
    const texto = btn.textContent;

    btn.disabled = true;
    btn.textContent = '⏳ Preparando tu PDF…';
    msg.className = 'preins-hint';
    msg.textContent = 'Esto puede tardar unos segundos.';

    window.ceevsHoja.descargar(this.enviada, { fotoSrc: this.enviada.foto || '' })
      .then(() => { msg.textContent = 'Listo ✓ Busca el archivo en tus descargas.'; })
      .catch(err => {
        msg.className = 'preins-hint err';
        msg.textContent = (err && err.message)
          || 'No pudimos generar el PDF. Intenta de nuevo o pídelo por WhatsApp.';
      })
      .then(() => {
        btn.disabled = false;
        btn.textContent = texto;
      });
  }
};

App.register(Preinscripcion);
