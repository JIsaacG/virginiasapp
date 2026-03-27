/**
 * admin.js — Panel de administración CEEVS
 * Gestión de imágenes con controles de posición, ajuste y zoom.
 */

(function () {
  'use strict';

  var ADMIN_PASS = 'ceevs2026';

  var IMAGE_CATALOG = [
    {
      page: 'Inicio (index.html)',
      images: [
        { key: 'hero-bg', label: 'Hero — Fondo parallax', defaultUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=75&auto=format', type: 'bg' },
        { key: 'hero-main', label: 'Hero — Foto principal (derecha)', defaultUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=75&auto=format' },
        { key: 'hero-float', label: 'Hero — Foto secundaria (flotante)', defaultUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=75&auto=format' },
        { key: 'index-historia', label: 'Sección Historia — Foto', defaultUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=75&auto=format' },
        { key: 'testi-featured', label: 'Testimonios — Foto destacada', defaultUrl: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=400&q=75&auto=format' },
        { key: 'footer-logo', label: 'Footer — Logo del colegio', defaultUrl: '', type: 'logo' }
      ]
    },
    {
      page: 'Admisiones (admisiones.html)',
      images: [
        { key: 'nivel-preescolar', label: 'Nivel Preescolar — Foto tarjeta', defaultUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=70&auto=format' },
        { key: 'nivel-primaria', label: 'Nivel Primaria — Foto tarjeta', defaultUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=700&q=70&auto=format' },
        { key: 'nivel-secundaria', label: 'Nivel Secundaria — Foto tarjeta', defaultUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&q=70&auto=format' }
      ]
    },
    {
      page: 'Quiénes Somos (quienes-somos.html)',
      images: [
        { key: 'qs-historia', label: 'Historia — Foto principal', defaultUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&q=75&auto=format' }
      ]
    },
    {
      page: 'Páginas Internas (hero compartido)',
      images: [
        { key: 'page-hero-bg', label: 'Hero interno — Fondo (admisiones, quiénes somos, contacto)', defaultUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=75&auto=format', type: 'bg' }
      ]
    }
  ];

  /* ─── Login ─── */
  function handleLogin(e) {
    e.preventDefault();
    var passInput = document.getElementById('admin-pass');
    var errorEl = document.getElementById('login-error');
    if (passInput.value === ADMIN_PASS) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      sessionStorage.setItem('ceevs_admin', '1');
      renderDashboard();
    } else {
      errorEl.textContent = 'Contraseña incorrecta';
      errorEl.style.display = 'block';
      passInput.value = '';
      passInput.focus();
    }
  }

  function checkSession() {
    if (sessionStorage.getItem('ceevs_admin') === '1') {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      renderDashboard();
    }
  }

  function logout() {
    sessionStorage.removeItem('ceevs_admin');
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }

  /* ─── Helpers ─── */
  function mgr() { return window.ceevsImageManager || {}; }

  function getSettingFor(key) {
    var all = mgr().getSettings ? mgr().getSettings() : {};
    return all[key] || { posX: 50, posY: 50, fit: 'cover', zoom: 100 };
  }

  /** Actualiza la vista previa en vivo mientras se mueven los controles */
  function livePreview(key) {
    var previewImg = document.getElementById('preview-' + key);
    if (!previewImg) return;

    var posX = parseInt(document.getElementById('posX-' + key).value, 10);
    var posY = parseInt(document.getElementById('posY-' + key).value, 10);
    var fit = document.getElementById('fit-' + key).value;
    var zoom = parseInt(document.getElementById('zoom-' + key).value, 10);

    previewImg.style.objectPosition = posX + '% ' + posY + '%';
    previewImg.style.objectFit = fit;
    if (zoom !== 100) {
      previewImg.style.transform = 'scale(' + (zoom / 100) + ')';
      previewImg.style.transformOrigin = posX + '% ' + posY + '%';
    } else {
      previewImg.style.transform = 'none';
    }

    // Update labels
    var lx = document.getElementById('posX-val-' + key);
    var ly = document.getElementById('posY-val-' + key);
    var lz = document.getElementById('zoom-val-' + key);
    if (lx) lx.textContent = posX + '%';
    if (ly) ly.textContent = posY + '%';
    if (lz) lz.textContent = zoom + '%';
  }

  /* ─── Render ─── */
  function renderDashboard() {
    var container = document.getElementById('images-grid');
    container.innerHTML = '';
    var saved = mgr().getSavedImages ? mgr().getSavedImages() : {};

    IMAGE_CATALOG.forEach(function (section) {
      var sectionEl = document.createElement('div');
      sectionEl.className = 'admin-section';

      var sectionTitle = document.createElement('h3');
      sectionTitle.className = 'admin-section-title';
      sectionTitle.textContent = section.page;
      sectionEl.appendChild(sectionTitle);

      section.images.forEach(function (img) {
        var currentUrl = saved[img.key] || img.defaultUrl;
        var isCustom = !!saved[img.key];
        var s = getSettingFor(img.key);

        var card = document.createElement('div');
        card.className = 'admin-card';

        card.innerHTML =
          /* Header */
          '<div class="admin-card-header">' +
            '<span class="admin-card-label">' + img.label + '</span>' +
            (isCustom ? '<span class="admin-badge-custom">Personalizada</span>' : '<span class="admin-badge-default">Por defecto</span>') +
          '</div>' +

          /* Preview */
          '<div class="admin-preview-wrap">' +
            (currentUrl
              ? '<img class="admin-preview" id="preview-' + img.key + '" src="' + currentUrl + '" alt="Vista previa"' +
                ' style="object-position:' + s.posX + '% ' + s.posY + '%;object-fit:' + s.fit + ';' +
                (s.zoom !== 100 ? 'transform:scale(' + (s.zoom / 100) + ');transform-origin:' + s.posX + '% ' + s.posY + '%' : '') + '"' +
                ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
              : '') +
            '<div class="admin-preview-empty" style="' + (currentUrl ? 'display:none' : 'display:flex') + '">Sin imagen</div>' +
          '</div>' +

          /* URL input */
          '<div class="admin-input-group">' +
            '<label class="admin-input-label">URL de la imagen (hipervínculo)</label>' +
            '<input type="url" class="admin-input" id="input-' + img.key + '" value="' + (saved[img.key] || '') + '" placeholder="https://ejemplo.com/foto.jpg">' +
          '</div>' +

          /* Position controls */
          '<div class="admin-controls">' +
            '<div class="admin-control-row">' +
              '<div class="admin-control-item">' +
                '<label class="admin-control-label">↕ Vertical <span id="posY-val-' + img.key + '">' + s.posY + '%</span></label>' +
                '<div class="admin-slider-wrap">' +
                  '<span class="admin-slider-hint">Arriba</span>' +
                  '<input type="range" class="admin-slider" id="posY-' + img.key + '" min="0" max="100" value="' + s.posY + '" data-key="' + img.key + '">' +
                  '<span class="admin-slider-hint">Abajo</span>' +
                '</div>' +
              '</div>' +
              '<div class="admin-control-item">' +
                '<label class="admin-control-label">↔ Horizontal <span id="posX-val-' + img.key + '">' + s.posX + '%</span></label>' +
                '<div class="admin-slider-wrap">' +
                  '<span class="admin-slider-hint">Izq</span>' +
                  '<input type="range" class="admin-slider" id="posX-' + img.key + '" min="0" max="100" value="' + s.posX + '" data-key="' + img.key + '">' +
                  '<span class="admin-slider-hint">Der</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="admin-control-row">' +
              '<div class="admin-control-item">' +
                '<label class="admin-control-label">Ajuste</label>' +
                '<select class="admin-select" id="fit-' + img.key + '" data-key="' + img.key + '">' +
                  '<option value="cover"' + (s.fit === 'cover' ? ' selected' : '') + '>Cubrir (recorta para llenar)</option>' +
                  '<option value="contain"' + (s.fit === 'contain' ? ' selected' : '') + '>Contener (muestra toda la foto)</option>' +
                  '<option value="fill"' + (s.fit === 'fill' ? ' selected' : '') + '>Estirar (deforma para llenar)</option>' +
                '</select>' +
              '</div>' +
              '<div class="admin-control-item">' +
                '<label class="admin-control-label">Zoom <span id="zoom-val-' + img.key + '">' + s.zoom + '%</span></label>' +
                '<div class="admin-slider-wrap">' +
                  '<span class="admin-slider-hint">50%</span>' +
                  '<input type="range" class="admin-slider" id="zoom-' + img.key + '" min="50" max="200" value="' + s.zoom + '" data-key="' + img.key + '">' +
                  '<span class="admin-slider-hint">200%</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:6px">' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="top" title="Enfocar arriba">↑ Arriba</button>' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="center" title="Centrar">◎ Centro</button>' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="bottom" title="Enfocar abajo">↓ Abajo</button>' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="left" title="Enfocar izquierda">← Izq</button>' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="right" title="Enfocar derecha">→ Der</button>' +
              '<button class="admin-btn-quick" data-key="' + img.key + '" data-pos="reset-zoom" title="Zoom 100%">1:1</button>' +
            '</div>' +
          '</div>' +

          /* Actions */
          '<div class="admin-card-actions">' +
            '<button class="admin-btn-save" data-key="' + img.key + '">Guardar todo</button>' +
            '<button class="admin-btn-reset" data-key="' + img.key + '" ' + (!isCustom && s.posX === 50 && s.posY === 50 && s.zoom === 100 ? 'disabled' : '') + '>Restaurar original</button>' +
          '</div>';

        sectionEl.appendChild(card);
      });

      container.appendChild(sectionEl);
    });

    // ─── Event delegation ───
    container.addEventListener('input', function (e) {
      var el = e.target;
      if (el.classList.contains('admin-slider') || el.tagName === 'SELECT') {
        var k = el.getAttribute('data-key');
        if (k) livePreview(k);
      }
    });

    container.addEventListener('change', function (e) {
      var el = e.target;
      if (el.classList.contains('admin-select')) {
        var k = el.getAttribute('data-key');
        if (k) livePreview(k);
      }
    });

    container.addEventListener('click', function (e) {
      var btn = e.target;

      // Quick position buttons
      if (btn.classList.contains('admin-btn-quick')) {
        var k = btn.getAttribute('data-key');
        var pos = btn.getAttribute('data-pos');
        var slX = document.getElementById('posX-' + k);
        var slY = document.getElementById('posY-' + k);
        var slZ = document.getElementById('zoom-' + k);
        if (pos === 'top') { slY.value = 0; }
        else if (pos === 'bottom') { slY.value = 100; }
        else if (pos === 'center') { slX.value = 50; slY.value = 50; }
        else if (pos === 'left') { slX.value = 0; }
        else if (pos === 'right') { slX.value = 100; }
        else if (pos === 'reset-zoom') { slZ.value = 100; }
        livePreview(k);
        return;
      }

      // Save
      if (btn.classList.contains('admin-btn-save')) {
        var key = btn.getAttribute('data-key');
        var input = document.getElementById('input-' + key);
        var url = input.value.trim();

        if (mgr().saveImage) mgr().saveImage(key, url);

        var setting = {
          posX: parseInt(document.getElementById('posX-' + key).value, 10),
          posY: parseInt(document.getElementById('posY-' + key).value, 10),
          fit: document.getElementById('fit-' + key).value,
          zoom: parseInt(document.getElementById('zoom-' + key).value, 10)
        };
        if (mgr().saveSetting) mgr().saveSetting(key, setting);

        showToast('Imagen y ajustes guardados');
        renderDashboard();
      }

      // Reset
      if (btn.classList.contains('admin-btn-reset')) {
        var key2 = btn.getAttribute('data-key');
        if (mgr().resetImage) mgr().resetImage(key2);
        showToast('Imagen restaurada al original');
        renderDashboard();
      }
    });

    updateStats(saved);
  }

  function updateStats(saved) {
    var total = 0;
    var customized = 0;
    IMAGE_CATALOG.forEach(function (s) {
      s.images.forEach(function (img) {
        total++;
        if (saved[img.key]) customized++;
      });
    });
    var statsEl = document.getElementById('admin-stats');
    if (statsEl) {
      statsEl.textContent = customized + ' de ' + total + ' imágenes personalizadas';
    }
  }

  function showToast(msg) {
    var toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  function resetAllImages() {
    if (confirm('¿Estás seguro? Esto restaurará TODAS las imágenes y ajustes a sus valores originales.')) {
      if (mgr().resetAll) mgr().resetAll();
      showToast('Todo restaurado');
      renderDashboard();
    }
  }

  /* ─── Init ─── */
  document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    var resetAllBtn = document.getElementById('btn-reset-all');
    if (resetAllBtn) resetAllBtn.addEventListener('click', resetAllImages);

    checkSession();
  });
})();
