/**
 * admin.js — Panel de administración CEEVS
 * Gestión de imágenes del sitio por URL (hipervínculo)
 */

(function () {
  'use strict';

  /* ─── Contraseña provisional ─── */
  var ADMIN_PASS = 'ceevs2026';

  /* ─── Catálogo de imágenes editables ─── */
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

  /* ─── Dashboard ─── */
  function renderDashboard() {
    var container = document.getElementById('images-grid');
    container.innerHTML = '';
    var saved = window.ceevsImageManager ? window.ceevsImageManager.getSavedImages() : {};

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

        var card = document.createElement('div');
        card.className = 'admin-card';

        card.innerHTML =
          '<div class="admin-card-header">' +
            '<span class="admin-card-label">' + img.label + '</span>' +
            (isCustom ? '<span class="admin-badge-custom">Personalizada</span>' : '<span class="admin-badge-default">Por defecto</span>') +
          '</div>' +
          '<div class="admin-preview-wrap">' +
            (currentUrl ? '<img class="admin-preview" src="' + currentUrl + '" alt="Vista previa" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' : '') +
            '<div class="admin-preview-empty" style="' + (currentUrl ? 'display:none' : 'display:flex') + '">Sin imagen</div>' +
          '</div>' +
          '<div class="admin-input-group">' +
            '<label class="admin-input-label">URL de la imagen (hipervínculo)</label>' +
            '<input type="url" class="admin-input" id="input-' + img.key + '" value="' + (saved[img.key] || '') + '" placeholder="https://ejemplo.com/foto.jpg">' +
          '</div>' +
          '<div class="admin-card-actions">' +
            '<button class="admin-btn-save" data-key="' + img.key + '">Guardar</button>' +
            '<button class="admin-btn-reset" data-key="' + img.key + '" ' + (!isCustom ? 'disabled' : '') + '>Restaurar original</button>' +
          '</div>';

        sectionEl.appendChild(card);
      });

      container.appendChild(sectionEl);
    });

    // Event delegation para botones
    container.addEventListener('click', function (e) {
      var btn = e.target;
      if (btn.classList.contains('admin-btn-save')) {
        var key = btn.getAttribute('data-key');
        var input = document.getElementById('input-' + key);
        var url = input.value.trim();
        if (window.ceevsImageManager) {
          window.ceevsImageManager.saveImage(key, url);
        }
        showToast(url ? 'Imagen guardada correctamente' : 'Imagen eliminada');
        renderDashboard();
      }
      if (btn.classList.contains('admin-btn-reset')) {
        var key2 = btn.getAttribute('data-key');
        if (window.ceevsImageManager) {
          window.ceevsImageManager.resetImage(key2);
        }
        showToast('Imagen restaurada al valor original');
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
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  function resetAllImages() {
    if (confirm('¿Estás seguro? Esto restaurará TODAS las imágenes a sus valores originales (stock).')) {
      if (window.ceevsImageManager) {
        window.ceevsImageManager.resetAll();
      }
      showToast('Todas las imágenes han sido restauradas');
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
