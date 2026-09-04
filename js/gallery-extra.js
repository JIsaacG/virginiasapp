/**
 * gallery-extra.js — Fotos, álbumes y nombres de la galería (recuerdos.html)
 *
 * Permite, desde el panel admin y sin tocar el HTML:
 *   · agregar más fotos a los 6 álbumes fijos,
 *   · crear álbumes nuevos,
 *   · cambiar el nombre y la fecha de cualquier álbum (fijo o nuevo).
 * Todo se guarda en localStorage (clave ceevs_gallery) y se aplica al cargar
 * la página.
 *
 * Auto-actualización: escucha el evento 'storage', así que si el panel
 * admin guarda cambios en otra pestaña, la galería abierta se refresca sola.
 *
 * Estructura de datos:
 *   {
 *     photos: [ { id, album: '1'..'6' | 'c<n>', url, caption } ],
 *     albums: [ { id: 'c<n>', title, date } ],
 *     titles: { '1': { title, date } }   // renombres de los álbumes fijos
 *   }
 */

(function () {
  'use strict';

  var KEY = 'ceevs_gallery';

  // Álbumes fijos del HTML (título y fecha originales de recuerdos.html).
  // Sirven de valor por defecto en el panel admin y para restaurar el nombre.
  var FIXED_ALBUMS = [
    { id: '1', title: 'Graduación 2023 — 11vo B y C Bilingüe', date: '28 de noviembre, 2023' },
    { id: '2', title: 'Graduación 2023 — Promoción Dr. Juan Almendares', date: '28 de noviembre, 2023' },
    { id: '3', title: 'Honor Roll 2023 — Primaria 1ro a 6to', date: '27 de noviembre, 2023' },
    { id: '4', title: 'Clausura Noveno Grado 2023', date: '27 de noviembre, 2023' },
    { id: '5', title: 'Día del Estudiante', date: '15 de septiembre, 2023' },
    { id: '6', title: 'Festival Cultural', date: '20 de octubre, 2023' }
  ];

  function getData() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY)) || {};
      return {
        photos: d.photos || [],
        albums: d.albums || [],
        titles: d.titles || {}
      };
    } catch (e) {
      return { photos: [], albums: [], titles: {} };
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    apply();
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function findFixed(id) {
    for (var i = 0; i < FIXED_ALBUMS.length; i++) {
      if (FIXED_ALBUMS[i].id === id) return FIXED_ALBUMS[i];
    }
    return null;
  }

  function addPhoto(albumId, url, caption) {
    var data = getData();
    data.photos.push({ id: uid('p'), album: String(albumId), url: url, caption: caption || '' });
    save(data);
  }

  function removePhoto(photoId) {
    var data = getData();
    data.photos = data.photos.filter(function (p) { return p.id !== photoId; });
    save(data);
  }

  function addAlbum(title, date) {
    var data = getData();
    var id = uid('c');
    data.albums.push({ id: id, title: title, date: date || '' });
    save(data);
    return id;
  }

  function removeAlbum(albumId) {
    var data = getData();
    data.albums = data.albums.filter(function (a) { return a.id !== albumId; });
    data.photos = data.photos.filter(function (p) { return p.album !== albumId; });
    delete data.titles[String(albumId)];
    save(data);
  }

  /* ─── Nombres de los álbumes ─── */

  /** Lista unificada (fijos + nuevos) con el nombre y la fecha vigentes. */
  function getAlbums() {
    var data = getData();
    var out = [];
    FIXED_ALBUMS.forEach(function (a) {
      var ov = data.titles[a.id] || {};
      out.push({
        id: a.id,
        fixed: true,
        title: ov.title || a.title,
        date: ov.date || a.date,
        defaultTitle: a.title,
        defaultDate: a.date,
        renamed: !!(ov.title || ov.date)
      });
    });
    data.albums.forEach(function (a) {
      out.push({
        id: a.id,
        fixed: false,
        title: a.title,
        date: a.date || '',
        defaultTitle: a.title,
        defaultDate: a.date || '',
        renamed: false
      });
    });
    return out;
  }

  /**
   * Cambia el nombre (y la fecha) de un álbum.
   * En los fijos se guarda solo lo que difiere del original, de modo que
   * dejar el texto original equivale a no tener renombre.
   */
  function renameAlbum(albumId, title, date) {
    var data = getData();
    var id = String(albumId);
    title = String(title == null ? '' : title).trim();
    date = String(date == null ? '' : date).trim();

    var custom = null;
    data.albums.forEach(function (a) { if (a.id === id) custom = a; });
    if (custom) {
      if (!title) return false;      // un álbum nuevo siempre necesita título
      custom.title = title;
      custom.date = date;
      save(data);
      return true;
    }

    var fixed = findFixed(id);
    if (!fixed) return false;

    var ov = {};
    if (title && title !== fixed.title) ov.title = title;
    if (date && date !== fixed.date) ov.date = date;
    if (ov.title || ov.date) data.titles[id] = ov;
    else delete data.titles[id];
    save(data);
    return true;
  }

  /** Devuelve un álbum fijo a su nombre y fecha originales. */
  function resetAlbumName(albumId) {
    var data = getData();
    delete data.titles[String(albumId)];
    save(data);
  }

  /* ─── Render en recuerdos.html ─── */

  function buildPhotoDiv(photo) {
    var div = document.createElement('div');
    div.className = 'album-photo';
    var img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.caption || 'Foto de la galería';
    img.loading = 'lazy';
    div.appendChild(img);
    return div;
  }

  /** Vacía un nodo y le devuelve los hijos originales guardados al inicio. */
  function restoreNode(el, original) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var clone = original.cloneNode(true);
    while (clone.firstChild) el.appendChild(clone.firstChild);
  }

  /**
   * Escribe el título respetando el estilo de la página: lo que va después
   * del guion largo (—) se muestra en cursiva dorada, igual que en el HTML.
   */
  function fillTitle(h2, text) {
    while (h2.firstChild) h2.removeChild(h2.firstChild);
    var parts = String(text).split('—');
    if (parts.length > 1) {
      h2.appendChild(document.createTextNode(parts[0].trim() + ' — '));
      var em = document.createElement('em');
      em.textContent = parts.slice(1).join('—').trim();
      h2.appendChild(em);
    } else {
      h2.textContent = text;
    }
  }

  function fillDate(el, text) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var dot = document.createElement('div');
    dot.className = 'album-date-dot';
    el.appendChild(dot);
    el.appendChild(document.createTextNode(text));
  }

  /** Aplica los renombres a los 6 álbumes del HTML (y restaura si se quitan). */
  function applyNames(data) {
    FIXED_ALBUMS.forEach(function (a) {
      var block = document.getElementById('album-' + a.id);
      if (!block) return;
      var ov = data.titles[a.id] || {};

      var h2 = block.querySelector('.album-title');
      if (h2) {
        if (!h2._recOriginal) h2._recOriginal = h2.cloneNode(true);
        if (ov.title) fillTitle(h2, ov.title);
        else restoreNode(h2, h2._recOriginal);
      }

      var dateEl = block.querySelector('.album-date');
      if (dateEl) {
        if (!dateEl._recOriginal) dateEl._recOriginal = dateEl.cloneNode(true);
        if (ov.date) fillDate(dateEl, ov.date);
        else restoreNode(dateEl, dateEl._recOriginal);
      }
    });
  }

  function apply() {
    var wrap = document.querySelector('.albums-wrap');
    if (!wrap) return; // no estamos en recuerdos.html

    // Idempotente: quitar lo inyectado antes y volver a renderizar
    document.querySelectorAll('[data-gallery-extra]').forEach(function (el) { el.remove(); });

    var data = getData();

    // 0) Nombres y fechas de los álbumes fijos
    applyNames(data);

    // 1) Fotos extra en los álbumes fijos → cuadrícula fluida bajo el mosaico
    FIXED_ALBUMS.forEach(function (album) {
      var photos = data.photos.filter(function (p) { return p.album === album.id; });
      if (!photos.length) return;
      var block = document.getElementById('album-' + album.id);
      if (!block) return;
      var grid = document.createElement('div');
      grid.className = 'album-photos album-photos--flat';
      grid.setAttribute('data-gallery-extra', '');
      photos.forEach(function (p) { grid.appendChild(buildPhotoDiv(p)); });
      block.appendChild(grid);
    });

    // 2) Álbumes personalizados → bloque completo al final
    data.albums.forEach(function (album) {
      var block = document.createElement('div');
      // 'in' directo: el IntersectionObserver del reveal ya corrió y no los conoce
      block.className = 'album-block in';
      block.id = 'album-' + album.id;
      block.setAttribute('data-gallery-extra', '');

      var header = document.createElement('div');
      header.className = 'album-header';
      var title = document.createElement('h2');
      title.className = 'album-title';
      fillTitle(title, album.title);
      header.appendChild(title);
      if (album.date) {
        var date = document.createElement('div');
        date.className = 'album-date';
        fillDate(date, album.date);
        header.appendChild(date);
      }
      block.appendChild(header);

      var photos = data.photos.filter(function (p) { return p.album === album.id; });

      if (!photos.length) {
        var emptyGrid = document.createElement('div');
        emptyGrid.className = 'album-photos album-photos--flat';
        var empty = document.createElement('p');
        empty.className = 'album-empty-note';
        empty.textContent = 'Este álbum aún no tiene fotos.';
        emptyGrid.appendChild(empty);
        block.appendChild(emptyGrid);
      } else if (photos.length >= 4) {
        // Mismo mosaico de 4 celdas que los álbumes originales (foto grande +
        // mediana + 2 medianas); de la 5ta foto en adelante, cuadrícula fluida debajo.
        var mosaic = document.createElement('div');
        mosaic.className = 'album-photos';
        photos.slice(0, 4).forEach(function (p) { mosaic.appendChild(buildPhotoDiv(p)); });
        block.appendChild(mosaic);
        if (photos.length > 4) {
          var extra = document.createElement('div');
          extra.className = 'album-photos album-photos--flat';
          photos.slice(4).forEach(function (p) { extra.appendChild(buildPhotoDiv(p)); });
          block.appendChild(extra);
        }
      } else {
        // Menos de 4 fotos: el mosaico dejaría celdas vacías, se usa la cuadrícula fluida.
        var flat = document.createElement('div');
        flat.className = 'album-photos album-photos--flat';
        photos.forEach(function (p) { flat.appendChild(buildPhotoDiv(p)); });
        block.appendChild(flat);
      }

      wrap.appendChild(block);
    });
  }

  /* ─── API pública (usada por admin.js) ─── */
  window.ceevsGalleryExtra = {
    FIXED_ALBUMS: FIXED_ALBUMS,
    getData: getData,
    getAlbums: getAlbums,
    addPhoto: addPhoto,
    removePhoto: removePhoto,
    addAlbum: addAlbum,
    removeAlbum: removeAlbum,
    renameAlbum: renameAlbum,
    resetAlbumName: resetAlbumName,
    apply: apply
  };

  // Render inicial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  // Auto-actualización si el admin guarda cambios en otra pestaña
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) apply();
  });
})();
