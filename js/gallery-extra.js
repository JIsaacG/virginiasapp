/**
 * gallery-extra.js — Fotos y álbumes adicionales de la galería (recuerdos.html)
 *
 * Permite agregar desde el panel admin más fotos a los 6 álbumes fijos
 * y crear álbumes nuevos, sin tocar el HTML. Todo se guarda en
 * localStorage (clave ceevs_gallery) y se renderiza al cargar la página.
 *
 * Auto-actualización: escucha el evento 'storage', así que si el panel
 * admin guarda cambios en otra pestaña, la galería abierta se refresca sola.
 *
 * Estructura de datos:
 *   {
 *     photos: [ { id, album: '1'..'6' | 'c<n>', url, caption } ],
 *     albums: [ { id: 'c<n>', title, date } ]
 *   }
 */

(function () {
  'use strict';

  var KEY = 'ceevs_gallery';

  // Álbumes fijos del HTML (id → título legible, usado por el panel admin)
  var FIXED_ALBUMS = [
    { id: '1', title: 'Graduación 2023 — 11vo B y C Bilingüe' },
    { id: '2', title: 'Graduación 2023 — Promoción Dr. Juan Almendares' },
    { id: '3', title: 'Honor Roll 2023 — Primaria 1ro a 6to' },
    { id: '4', title: 'Clausura Noveno Grado 2023' },
    { id: '5', title: 'Día del Estudiante' },
    { id: '6', title: 'Festival Cultural' }
  ];

  function getData() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY)) || {};
      return { photos: d.photos || [], albums: d.albums || [] };
    } catch (e) {
      return { photos: [], albums: [] };
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    apply();
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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

  function apply() {
    var wrap = document.querySelector('.albums-wrap');
    if (!wrap) return; // no estamos en recuerdos.html

    // Idempotente: quitar lo inyectado antes y volver a renderizar
    document.querySelectorAll('[data-gallery-extra]').forEach(function (el) { el.remove(); });

    var data = getData();

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
      title.textContent = album.title;
      header.appendChild(title);
      if (album.date) {
        var date = document.createElement('div');
        date.className = 'album-date';
        var dot = document.createElement('div');
        dot.className = 'album-date-dot';
        date.appendChild(dot);
        date.appendChild(document.createTextNode(album.date));
        header.appendChild(date);
      }
      block.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'album-photos album-photos--flat';
      var photos = data.photos.filter(function (p) { return p.album === album.id; });
      photos.forEach(function (p) { grid.appendChild(buildPhotoDiv(p)); });
      if (!photos.length) {
        var empty = document.createElement('p');
        empty.className = 'album-empty-note';
        empty.textContent = 'Este álbum aún no tiene fotos.';
        grid.appendChild(empty);
      }
      block.appendChild(grid);

      wrap.appendChild(block);
    });
  }

  /* ─── API pública (usada por admin.js) ─── */
  window.ceevsGalleryExtra = {
    FIXED_ALBUMS: FIXED_ALBUMS,
    getData: getData,
    addPhoto: addPhoto,
    removePhoto: removePhoto,
    addAlbum: addAlbum,
    removeAlbum: removeAlbum,
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
