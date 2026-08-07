/**
 * admin.js — Panel de administración CEEVS
 * Gestión de imágenes con controles de posición, ajuste y zoom.
 * El login y la publicación al servidor los maneja admin-sync.js (api/).
 */

(function () {
  'use strict';

  // Contraseña de EMERGENCIA solo para "modo local" (sitio abierto sin PHP).
  // Con el sitio publicado, la contraseña real se crea y verifica en el servidor.
  var ADMIN_PASS = 'ceevs2026';

  /* Catálogo completo de imágenes editables del sitio.
     Cada key corresponde a un data-img-key en el HTML (aplicado por image-manager.js). */

  var WP = 'https://virginiasapp.edu.hn/wp-content/uploads/';
  var UNSPLASH = 'https://images.unsplash.com/';

  function albumSection(num, title, urls) {
    return {
      page: '📸 Recuerdos — ' + title,
      images: urls.map(function (u, i) {
        return {
          key: 'album-' + num + '-' + (i + 1),
          label: i === 0 ? 'Foto 1 (grande, principal)' : 'Foto ' + (i + 1),
          defaultUrl: u
        };
      })
    };
  }

  var IMAGE_CATALOG = [
    {
      page: '🌐 Global (todas las páginas)',
      images: [
        { key: 'nav-logo', label: 'Logo de la barra de navegación', defaultUrl: 'assets/logo-institucional.png' },
        { key: 'footer-logo', label: 'Logo del pie de página', defaultUrl: 'assets/logo.jpg' },
        { key: 'page-hero-bg', label: 'Fondo del encabezado en páginas internas (admisiones, quiénes somos, contacto, recuerdos, etc.)', defaultUrl: UNSPLASH + 'photo-1580582932707-520aed937b7b?w=1600&q=75&auto=format', type: 'bg' }
      ]
    },
    {
      page: '🏠 Inicio (index.html)',
      images: [
        { key: 'hero-bg', label: 'Hero — Fondo (imagen parallax y portada del video)', defaultUrl: UNSPLASH + 'photo-1580582932707-520aed937b7b?w=1600&q=75&auto=format', type: 'bg' },
        { key: 'hero-slide-1', label: 'Galería del hero — Foto 1: Vida escolar', defaultUrl: WP + '2025/10/IMG_1816-1400x786.jpg' },
        { key: 'hero-slide-2', label: 'Galería del hero — Foto 2: Aula dinámica', defaultUrl: WP + '2026/01/IMG_5896.jpg' },
        { key: 'hero-slide-3', label: 'Galería del hero — Foto 3: Momentos de estudio', defaultUrl: WP + '2025/12/IMG_4411.jpg' },
        { key: 'hero-slide-4', label: 'Galería del hero — Foto 4: Campus y comunidad', defaultUrl: WP + '2025/12/IMG_2006.jpg' },
        { key: 'hero-slide-5', label: 'Galería del hero — Foto 5: Biblioteca', defaultUrl: WP + '2026/03/IMG_7464.JPG-712x400.jpeg' },
        { key: 'hero-slide-6', label: 'Galería del hero — Foto 6: Aula activa', defaultUrl: WP + '2026/01/IMG_8171.jpg' }
      ]
    },
    {
      page: '🎓 Admisiones (admisiones.html)',
      images: [
        { key: 'nivel-preescolar', label: 'Nivel Preescolar — Foto tarjeta', defaultUrl: UNSPLASH + 'photo-1503676260728-1c00da094a0b?w=700&q=70&auto=format' },
        { key: 'nivel-primaria', label: 'Nivel Primaria — Foto tarjeta', defaultUrl: UNSPLASH + 'photo-1497633762265-9d179a990aa6?w=700&q=70&auto=format' },
        { key: 'nivel-secundaria', label: 'Nivel Secundaria — Foto tarjeta', defaultUrl: UNSPLASH + 'photo-1524178232363-1fb2b075b655?w=700&q=70&auto=format' }
      ]
    },
    {
      page: '🏛️ Quiénes Somos (quienes-somos.html)',
      images: [
        { key: 'qs-bienvenida-estudiantes', label: 'Bienvenida — Estudiantes en clase', defaultUrl: WP + '2026/01/IMG_5958.jpg' },
        { key: 'qs-bienvenida-docentes', label: 'Bienvenida — Docentes', defaultUrl: WP + '2026/01/IMG_9784.jpg' },
        { key: 'qs-bienvenida-comunidad', label: 'Bienvenida — Comunidad educativa', defaultUrl: WP + '2025/10/WhatsApp-Image-2025-10-22-at-3.37.19-PM-2-533x400.jpeg' },
        { key: 'qs-bienvenida-ninos', label: 'Bienvenida — Niños', defaultUrl: WP + '2026/01/IMG_5896.jpg' },
        { key: 'qs-historia-1962-a', label: 'Historia 1962 — Campus en sus primeros años', defaultUrl: 'assets/images/timeline/Imagen%201.jpg' },
        { key: 'qs-historia-1962-b', label: 'Historia 1962 — Fachada y lema fundacional', defaultUrl: 'assets/images/timeline/45.jpg' },
        { key: 'qs-historia-7080-a', label: 'Historia 70–80 — Bus escolar y pabellones', defaultUrl: 'assets/images/timeline/33.jpg' },
        { key: 'qs-historia-7080-b', label: 'Historia 70–80 — Laboratorio de cómputo', defaultUrl: 'assets/images/timeline/55.jpg' },
        { key: 'qs-historia-hoy-a', label: 'Historia hoy — Plaza central del campus', defaultUrl: 'assets/images/timeline/556.jpg' },
        { key: 'qs-historia-hoy-b', label: 'Historia hoy — Ampliación de instalaciones', defaultUrl: 'assets/images/timeline/888.jpg' },
        { key: 'qs-mision-foto', label: 'Misión — Foto de la tarjeta', defaultUrl: WP + '2026/01/IMG_5958.jpg' },
        { key: 'qs-vision-foto', label: 'Visión — Foto de la tarjeta', defaultUrl: WP + '2025/10/IMG_1816-1400x786.jpg' },
        { key: 'qs-acsi-cert', label: 'Acordeón ACSI — Certificación', defaultUrl: WP + '2026/03/IMG_7464.JPG-712x400.jpeg' },
        { key: 'qs-declaracion-logo', label: 'Declaración institucional — Logo', defaultUrl: 'assets/logo principal.png' }
      ]
    },
    {
      page: '✝️ Misión Evangelística (mision-evangelistica.html)',
      images: [
        { key: 'me-portada-estudiantes', label: 'Portada — Estudiantes en clase', defaultUrl: WP + '2026/01/IMG_5958.jpg' },
        { key: 'me-portada-docentes', label: 'Portada — Docentes (flotante)', defaultUrl: WP + '2026/01/IMG_9784.jpg' },
        { key: 'me-momento-1', label: 'Momentos — Foto 1: Actividades escolares', defaultUrl: WP + '2025/10/IMG_1816-1400x786.jpg' },
        { key: 'me-momento-2', label: 'Momentos — Foto 2: Niños', defaultUrl: WP + '2026/01/IMG_5896.jpg' },
        { key: 'me-momento-3', label: 'Momentos — Foto 3: Campus', defaultUrl: WP + '2025/12/IMG_2006.jpg' }
      ]
    },
    albumSection(1, 'Graduación 2023 (11vo B y C Bilingüe)', [
      UNSPLASH + 'photo-1523580846011-d3a5bc25702b?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1540575467063-178a50c2df87?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1559223607-a43c990c692c?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1564981797816-1043664bf78d?w=500&q=70&auto=format'
    ]),
    albumSection(2, 'Graduación 2023 (Prom. Dr. Juan Almendares)', [
      UNSPLASH + 'photo-1627556704302-624286467c65?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1607453998774-d533f65dac99?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1525921429824-6b2f5e936ebc?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1541339907198-e08756dedf3f?w=500&q=70&auto=format'
    ]),
    albumSection(3, 'Honor Roll 2023 (Primaria)', [
      UNSPLASH + 'photo-1577896851231-70ef18881754?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1503676260728-1c00da094a0b?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1580582932707-520aed937b7b?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1546410531-bb4caa6b424d?w=500&q=70&auto=format'
    ]),
    albumSection(4, 'Clausura Noveno Grado 2023', [
      UNSPLASH + 'photo-1529390079861-591de354faf5?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1497633762265-9d179a990aa6?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1509062522246-3755977927d7?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1427504494785-3a9ca7044f45?w=500&q=70&auto=format'
    ]),
    albumSection(5, 'Día del Estudiante', [
      UNSPLASH + 'photo-1511578314322-379afb476865?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1524178232363-1fb2b075b655?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1590650153855-d9e808231d41?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1588072432836-e10032774350?w=500&q=70&auto=format'
    ]),
    albumSection(6, 'Festival Cultural', [
      UNSPLASH + 'photo-1513364776144-60967b0f800f?w=800&q=75&auto=format',
      UNSPLASH + 'photo-1598488035139-bdbb2231ce04?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1514320291840-2e0a9bf2a9ae?w=500&q=70&auto=format',
      UNSPLASH + 'photo-1505236858219-8359eb29e329?w=500&q=70&auto=format'
    ])
  ];

  /* ─── Login ─── */
  function sync() { return window.ceevsSync || null; }

  function enterDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderDashboard();
    updateSecurityCard();
    renderAudit();
    // Carga la bandeja de pre-inscripciones para que el globo del menú
    // muestre cuántas solicitudes nuevas hay sin tener que abrir la pestaña.
    if (window.ceevsPreins) window.ceevsPreins.precargar();
  }

  function showLoginError(msg) {
    var errorEl = document.getElementById('login-error');
    var passInput = document.getElementById('admin-pass');
    var loginForm = document.getElementById('login-form');
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    if (loginForm && !loginForm.hidden) {
      passInput.value = '';
      passInput.focus();
    }
  }

  function showLoginNotice(msg) {
    var hint = document.getElementById('login-hint');
    if (!hint) return;
    hint.textContent = msg;
    hint.style.display = 'block';
  }

  /** Ajusta el texto de la pantalla de login según el estado del servidor. */
  function refreshLoginScreen() {
    var s = sync();
    var hint = document.getElementById('login-hint');
    if (!hint || !s) return;
    if (s.state.available === false) {
      hint.textContent = 'Aviso: no se encontró el servidor (PHP). Entrarás en modo local y los cambios solo se verán en este navegador.';
      hint.style.display = 'block';
    } else {
      hint.style.display = 'none';
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    var email = (document.getElementById('admin-email').value || '').trim();
    var passInput = document.getElementById('admin-pass');
    var pass = passInput.value;
    var s = sync();

    // Login real contra el servidor (sesión PHP, correo + contraseña)
    if (s && s.state.available) {
      s.login(email, pass).then(function (res) {
        if (res.ok) {
          enterDashboard();
          s.pull();
        } else {
          showLoginError(res.error || 'Correo o contraseña incorrectos');
        }
      });
      return;
    }

    // Modo local (sin PHP): los cambios solo se ven en este navegador.
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem('ceevs_admin', '1');
      enterDashboard();
    } else {
      showLoginError('Contraseña incorrecta');
    }
  }

  /* ─── Recuperación de contraseña ─── */

  function toggleRecovery(show) {
    var loginForm = document.getElementById('login-form');
    var recForm = document.getElementById('recovery-form');
    var toggleBtn = document.getElementById('btn-toggle-recovery');
    if (!loginForm || !recForm) return;
    var showRec = (typeof show === 'boolean') ? show : recForm.hidden;
    recForm.hidden = !showRec;
    loginForm.hidden = showRec;
    if (toggleBtn) toggleBtn.textContent = showRec ? '← Volver a iniciar sesión' : '¿Olvidaste tu contraseña?';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-hint').style.display = 'none';
    if (showRec) {
      var recEmail = document.getElementById('rec-email');
      if (recEmail && !recEmail.value) recEmail.value = document.getElementById('admin-email').value;
    }
  }

  function handleSendCode() {
    var s = sync();
    var email = (document.getElementById('rec-email').value || '').trim();
    if (!s || !s.state.available) { showLoginError('La recuperación solo funciona con el sitio publicado (con PHP).'); return; }
    if (!email) { showLoginError('Escribe el correo del administrador.'); return; }
    var btn = document.getElementById('btn-send-code');
    if (btn) btn.disabled = true;
    s.forgot(email).then(function (res) {
      if (btn) btn.disabled = false;
      if (res.ok) {
        showLoginNotice(res.message || 'Si el correo es correcto, recibirás un código en unos minutos.');
      } else {
        showLoginError(res.error || 'No se pudo solicitar el código.');
      }
    });
  }

  function handleReset(e) {
    e.preventDefault();
    var s = sync();
    if (!s || !s.state.available) { showLoginError('La recuperación solo funciona con el sitio publicado (con PHP).'); return; }
    var email = (document.getElementById('rec-email').value || '').trim();
    var code = (document.getElementById('rec-code').value || '').trim();
    var pass = document.getElementById('rec-pass').value;
    if (!email || !code) { showLoginError('Escribe el correo y el código (o tu clave maestra).'); return; }
    if (pass.length < 8) { showLoginError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    s.resetPassword(email, code, pass).then(function (res) {
      if (!res.ok) { showLoginError(res.error || 'No se pudo restablecer la contraseña.'); return; }
      document.getElementById('rec-code').value = '';
      document.getElementById('rec-pass').value = '';
      toggleRecovery(false);
      document.getElementById('admin-email').value = email;
      showLoginNotice(res.newRecoveryKey
        ? 'Contraseña restablecida. Tu NUEVA clave maestra es: ' + res.newRecoveryKey + ' — cópiala ahora, no se volverá a mostrar. Ya puedes iniciar sesión.'
        : 'Contraseña restablecida. Ya puedes iniciar sesión con tu nueva contraseña.');
    });
  }

  function checkSession() {
    var s = sync();
    if (s) {
      s.checkStatus().then(function (st) {
        refreshLoginScreen();
        if (st.available && st.authed) {
          enterDashboard();
          s.pull();
        } else if (st.available === false && sessionStorage.getItem('ceevs_admin') === '1') {
          enterDashboard();
        }
      });
      return;
    }
    if (sessionStorage.getItem('ceevs_admin') === '1') enterDashboard();
  }

  function logout() {
    if (sync()) sync().logout();
    sessionStorage.removeItem('ceevs_admin');
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    refreshLoginScreen();
  }

  /* ─── Seguridad de la cuenta y bitácora ─── */

  function updateSecurityCard() {
    var s = sync();
    var el = document.getElementById('sec-current-email');
    if (!el) return;
    if (s && s.state.email) el.textContent = s.state.email;
    else el.textContent = (s && s.state.available === false) ? 'modo local (sin servidor)' : '—';
  }

  var AUDIT_LABELS = {
    login_ok: '✅ Inicio de sesión',
    login_fail: '⛔ Intento de acceso fallido',
    logout: '👋 Cierre de sesión',
    password_changed: '🔑 Contraseña cambiada',
    password_change_fail: '⛔ Cambio de contraseña rechazado',
    email_changed: '📧 Correo del administrador cambiado',
    email_change_fail: '⛔ Cambio de correo rechazado',
    recovery_requested: '📨 Solicitud de recuperación',
    recovery_ok: '🔓 Contraseña restablecida',
    recovery_fail: '⛔ Intento de recuperación fallido',
    recovery_key_new: '🗝️ Clave maestra nueva',
    recovery_key_fail: '⛔ Clave maestra rechazada',
    config_saved: '📝 Cambios publicados en el sitio',
    file_uploaded: '🖼️ Archivo subido',
    preins_correo_enviado: '📨 Solicitud enviada al correo institucional',
    preins_correo_fallo: '⚠️ Falló el envío de una solicitud por correo'
  };

  var AUDIT_KEY_LABELS = {
    ceevs_images: 'Imágenes del sitio',
    ceevs_image_settings: 'Ajustes de imagen (posición/zoom)',
    ceevs_gallery: 'Galería',
    ceevs_video_settings: 'Videos',
    ceevs_hub_video: 'Video del portal',
    ceevs_theme: 'Paleta de colores',
    ceevs_inventory: 'Inventario',
    ceevs_mision_aula: 'Aula virtual (Misión Evangelística)'
  };

  function friendlyAuditDetail(d) {
    var out = String(d || '');
    Object.keys(AUDIT_KEY_LABELS).forEach(function (k) {
      out = out.split(k).join(AUDIT_KEY_LABELS[k]);
    });
    return out;
  }

  function renderAudit() {
    var list = document.getElementById('audit-list');
    if (!list) return;
    var s = sync();

    function message(msg) {
      list.textContent = '';
      var p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = msg;
      list.appendChild(p);
    }

    if (!s || !s.state.available) { message('La bitácora solo está disponible con el sitio publicado (con PHP).'); return; }
    if (!s.state.authed) { message('Inicia sesión para ver la bitácora.'); return; }

    s.getAudit(100).then(function (res) {
      if (!res.ok) { message(res.error || 'No se pudo leer la bitácora.'); return; }
      var entries = res.entries || [];
      if (!entries.length) { message('Aún no hay movimientos registrados.'); return; }
      // Se construye con textContent (nunca innerHTML): la bitácora puede
      // contener texto escrito por atacantes (correos de intentos fallidos).
      list.textContent = '';
      entries.forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'audit-row' + (entry.ok === false ? ' audit-row--bad' : '');

        var top = document.createElement('div');
        top.className = 'audit-row-top';
        var action = document.createElement('span');
        action.className = 'audit-action';
        action.textContent = AUDIT_LABELS[entry.a] || entry.a;
        var when = document.createElement('span');
        when.className = 'audit-when';
        var dt = new Date(entry.t);
        when.textContent = isNaN(dt.getTime())
          ? String(entry.t || '')
          : dt.toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short' });
        top.appendChild(action);
        top.appendChild(when);
        row.appendChild(top);

        if (entry.d) {
          var det = document.createElement('div');
          det.className = 'audit-detail';
          det.textContent = friendlyAuditDetail(entry.d);
          row.appendChild(det);
        }

        var meta = document.createElement('div');
        meta.className = 'audit-meta';
        meta.textContent = (entry.u ? entry.u + ' · ' : '') + 'IP: ' + (entry.ip || '—');
        row.appendChild(meta);

        list.appendChild(row);
      });
    });
  }

  /* ─── Helpers ─── */
  function mgr() { return window.ceevsImageManager || {}; }

  /** Acepta URLs externas (http/https) y rutas del propio sitio (uploads/, assets/). */
  function isMediaUrl(u) {
    return /^https?:\/\//i.test(u) || /^(uploads|assets)\//i.test(u);
  }

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

  // Secciones abiertas (se conserva al re-renderizar). La primera inicia abierta.
  var openSections = {};
  openSections[IMAGE_CATALOG[0].page] = true;

  function rememberOpenState() {
    document.querySelectorAll('#images-grid details.admin-section').forEach(function (d) {
      openSections[d.getAttribute('data-page')] = d.open;
    });
  }

  function renderDashboard() {
    var container = document.getElementById('images-grid');
    container.innerHTML = '';
    var saved = mgr().getSavedImages ? mgr().getSavedImages() : {};

    IMAGE_CATALOG.forEach(function (section) {
      var customCount = section.images.filter(function (img) { return saved[img.key]; }).length;

      var sectionEl = document.createElement('details');
      sectionEl.className = 'admin-section';
      sectionEl.setAttribute('data-page', section.page);
      if (openSections[section.page]) sectionEl.open = true;

      var summary = document.createElement('summary');
      summary.className = 'admin-section-title';
      summary.innerHTML = '<span class="admin-section-name">' + section.page + '</span>' +
        '<span class="admin-section-count">' + section.images.length + ' foto' + (section.images.length !== 1 ? 's' : '') +
        (customCount ? ' · ' + customCount + ' personalizada' + (customCount !== 1 ? 's' : '') : '') + '</span>';
      sectionEl.appendChild(summary);

      section.images.forEach(function (img) {
        var currentUrl = saved[img.key] || img.defaultUrl;
        var isCustom = !!saved[img.key];
        var s = getSettingFor(img.key);

        var card = document.createElement('div');
        card.className = 'admin-card';
        card.setAttribute('data-search', normalizeText(section.page + ' ' + img.label + ' ' + img.key));

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

          /* URL input + subida */
          '<div class="admin-input-group">' +
            '<label class="admin-input-label">Imagen (sube un archivo o pega su URL)</label>' +
            '<div class="admin-input-row">' +
              '<input type="text" class="admin-input" id="input-' + img.key + '" value="' + (saved[img.key] || '') + '" placeholder="https://ejemplo.com/foto.jpg">' +
              '<button type="button" class="admin-btn-upload" data-upload-key="' + img.key + '" title="Subir una imagen desde tu computadora">📤 Subir</button>' +
            '</div>' +
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

    bindGridEvents(container);
    applySearchFilter();
    updateStats(saved);
  }

  /* ─── Event delegation (se vincula una sola vez) ─── */
  function bindGridEvents(container) {
    if (container.dataset.gridBound) return;
    container.dataset.gridBound = 'true';

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

    container.addEventListener('toggle', function (e) {
      var d = e.target;
      if (d.tagName === 'DETAILS' && d.hasAttribute('data-page') && !isSearching()) {
        openSections[d.getAttribute('data-page')] = d.open;
      }
    }, true);

    container.addEventListener('click', function (e) {
      var btn = e.target;

      // Subir imagen desde la computadora → guarda y publica automáticamente
      if (btn.classList.contains('admin-btn-upload')) {
        var upKey = btn.getAttribute('data-upload-key');
        if (!upKey || !window.ceevsSync) return;
        window.ceevsSync.pickAndUpload('image/*', function (res) {
          if (!res.ok) { showToast(res.error); return; }
          var inp = document.getElementById('input-' + upKey);
          if (inp) inp.value = res.url;
          var saveBtn = document.querySelector('.admin-btn-save[data-key="' + upKey + '"]');
          if (saveBtn) saveBtn.click();
          else showToast('Imagen subida');
        }, function () { showToast('Subiendo archivo…'); });
        return;
      }

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
        if (!key) return;
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
        rememberOpenState();
        renderDashboard();
      }

      // Reset
      if (btn.classList.contains('admin-btn-reset')) {
        var key2 = btn.getAttribute('data-key');
        if (!key2) return;
        if (mgr().resetImage) mgr().resetImage(key2);
        showToast('Imagen restaurada al original');
        rememberOpenState();
        renderDashboard();
      }
    });
  }

  /* ─── Buscador de imágenes ─── */

  // Minúsculas y sin tildes, para que "álbum" encuentre "album"
  function normalizeText(str) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function isSearching() {
    var input = document.getElementById('img-search');
    return !!(input && input.value.trim());
  }

  function applySearchFilter() {
    var input = document.getElementById('img-search');
    if (!input) return;
    var term = normalizeText(input.value.trim());
    var sections = document.querySelectorAll('#images-grid details.admin-section');

    sections.forEach(function (d) {
      var cards = d.querySelectorAll('.admin-card[data-search]');
      if (!term) {
        cards.forEach(function (c) { c.style.display = ''; });
        d.style.display = '';
        d.open = !!openSections[d.getAttribute('data-page')];
        return;
      }
      var matches = 0;
      cards.forEach(function (c) {
        var hit = c.getAttribute('data-search').indexOf(term) !== -1;
        c.style.display = hit ? '' : 'none';
        if (hit) matches++;
      });
      d.style.display = matches ? '' : 'none';
      if (matches) d.open = true;
    });
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

  /* ─── Tab System ─── */
  function initTabSystem() {
    var tabBtns = document.querySelectorAll('.admin-tab-btn');
    var panels = document.querySelectorAll('.admin-tab-panel');

    tabBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tabName = btn.getAttribute('data-tab');
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = document.getElementById('panel-' + tabName);
        if (panel) panel.classList.add('active');
        if (tabName === 'paleta') renderPalettePanel();
        if (tabName === 'inventario') renderInventoryList();
        if (tabName === 'mision' && window.ceevsMisionAula && window.ceevsMisionAula.renderAdmin) window.ceevsMisionAula.renderAdmin();
        if (tabName === 'preinscripciones' && window.ceevsPreins) window.ceevsPreins.render();
        if (tabName === 'galeria') renderGalleryPanel();
        if (tabName === 'video') { loadVideoSettings(); loadHubVideoSettings(); }
        if (tabName === 'respaldo') renderBackupStatus();
      });
    });
  }

  /* ─── Palette Panel ─── */
  function getPaletteCatalog() {
    return (window.ceevsThemes && window.ceevsThemes.PALETTES) || {
      cafe_dorado: {
        label: 'Cafe Dorado',
        description: 'La combinacion mas institucional para comunicar legado, cercania y sobriedad cristiana.',
        swatches: ['#6A2407', '#D7AF4A', '#F57C00', '#3BA6E0', '#FFFFFF']
      }
    };
  }

  function renderPalettePanel() {
    var grid = document.getElementById('palette-grid');
    if (!grid) return;
    var palettes = getPaletteCatalog();
    var current = window.ceevsThemes ? window.ceevsThemes.getCurrent() : 'institucional_balanceado';
    var footerNote = document.getElementById('palette-global-note');
    if (footerNote) {
      footerNote.textContent = 'La paleta elegida se publica junto con el resto de la configuración: con el sitio en línea, todos los visitantes la verán.';
    }
    var html = '';
    Object.keys(palettes).forEach(function(id) {
      var palette = palettes[id];
      var swatches = palette.swatches || [palette.forest, palette.gold, palette.gold2, palette.cream];
      var isActive = id === current;
      html += '<div class="palette-card' + (isActive ? ' palette-card--active' : '') + '" data-palette-id="' + id + '">' +
        '<div class="palette-preview">' +
          swatches.map(function(c) { return '<div class="palette-swatch" style="background:' + c + '"></div>'; }).join('') +
        '</div>' +
        '<div class="palette-info">' +
          '<h3>' + palette.label + '</h3>' +
          '<p class="palette-description">' + (palette.description || '') + '</p>' +
          (isActive ? '<p class="palette-active-badge">✓ Paleta activa</p>' : '') +
          '<button class="palette-apply-btn" data-apply-palette="' + id + '"' + (isActive ? ' disabled' : '') + '>' + (isActive ? 'Activa' : 'Aplicar') + '</button>' +
        '</div>' +
      '</div>';
    });
    grid.innerHTML = html;

    if (!grid.dataset.paletteBound) {
      grid.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-apply-palette]');
        if (!btn || btn.disabled) return;
        var paletteId = btn.getAttribute('data-apply-palette');
        if (window.ceevsThemes) {
          window.ceevsThemes.save(paletteId);
          showToast('Paleta "' + palettes[paletteId].label + '" aplicada');
          renderPalettePanel();
        }
      });
      grid.dataset.paletteBound = 'true';
    }
  }

  /* ─── Video Panel ─── */
  function loadVideoSettings() {
    try {
      var settings = JSON.parse(localStorage.getItem('ceevs_video_settings')) || {};
      var urlInput = document.getElementById('video-url-input');
      var check = document.getElementById('video-enabled-check');
      var statusBox = document.getElementById('video-status-box');
      if (urlInput) urlInput.value = settings.url || '';
      if (check) check.checked = !!settings.enabled;
      if (statusBox) {
        if (settings.url && settings.enabled) {
          statusBox.innerHTML = '<p>✅ Video <strong>activo</strong>. URL: <code>' + settings.url.substring(0, 60) + '...</code></p>';
        } else if (settings.url && !settings.enabled) {
          statusBox.innerHTML = '<p>⏸ Video configurado pero <strong>desactivado</strong>.</p>';
        } else {
          statusBox.innerHTML = '<p>Sin video configurado. El hero usa la imagen de fondo.</p>';
        }
      }
    } catch(e) {}
  }

  function saveVideoSettings() {
    var url = (document.getElementById('video-url-input') || {}).value || '';
    var enabled = (document.getElementById('video-enabled-check') || {}).checked || false;
    if (url && !isMediaUrl(url)) {
      showToast('Ingresa una URL válida o sube el archivo con el botón 📤');
      return;
    }
    if (window.ceevsVideoLoader) {
      window.ceevsVideoLoader.save(url, enabled);
    } else {
      try {
        localStorage.setItem('ceevs_video_settings', JSON.stringify({ url: url, enabled: enabled }));
      } catch(e) {}
    }
    showToast('Configuración de video guardada');
    loadVideoSettings();
  }

  function resetVideoSettings() {
    var urlInput = document.getElementById('video-url-input');
    var check = document.getElementById('video-enabled-check');
    if (urlInput) urlInput.value = '';
    if (check) check.checked = false;
    if (window.ceevsVideoLoader) {
      window.ceevsVideoLoader.reset();
    } else {
      try { localStorage.removeItem('ceevs_video_settings'); } catch(e) {}
    }
    showToast('Configuración de video limpiada');
    loadVideoSettings();
  }

  /* ─── Video de presentación (hub) ─── */
  function getHubConfig() {
    if (window.ceevsVideoLoader && window.ceevsVideoLoader.getHub) return window.ceevsVideoLoader.getHub();
    try { return JSON.parse(localStorage.getItem('ceevs_hub_video')) || {}; } catch (e) { return {}; }
  }

  function loadHubVideoSettings() {
    var cfg = getHubConfig();
    var urlInput = document.getElementById('hub-video-url-input');
    var posterInput = document.getElementById('hub-video-poster-input');
    var box = document.getElementById('hub-video-status-box');
    if (urlInput) urlInput.value = cfg.url || '';
    if (posterInput) posterInput.value = cfg.poster || '';
    if (box) {
      if (cfg.url || cfg.poster) {
        box.innerHTML = '<p>✅ Personalizado. ' +
          (cfg.url ? 'Video: <code>' + cfg.url.substring(0, 55) + '…</code>' : 'Video: archivo local del sitio.') +
          (cfg.poster ? '<br>Portada personalizada configurada.' : '') + '</p>';
      } else {
        box.innerHTML = '<p>Usando el video local del sitio (<code>assets/videos/presentacion-virginia-sapp-2026.mp4</code>).</p>';
      }
    }
  }

  function saveHubVideoSettings() {
    var url = (document.getElementById('hub-video-url-input') || {}).value || '';
    var poster = (document.getElementById('hub-video-poster-input') || {}).value || '';
    url = url.trim(); poster = poster.trim();
    if ((url && !isMediaUrl(url)) || (poster && !isMediaUrl(poster))) {
      showToast('Ingresa URLs válidas o sube los archivos con el botón 📤');
      return;
    }
    if (window.ceevsVideoLoader && window.ceevsVideoLoader.saveHub) {
      window.ceevsVideoLoader.saveHub(url, poster);
    } else {
      try { localStorage.setItem('ceevs_hub_video', JSON.stringify({ url: url, poster: poster })); } catch (e) {}
    }
    showToast('Video de presentación guardado');
    loadHubVideoSettings();
  }

  function resetHubVideoSettings() {
    if (window.ceevsVideoLoader && window.ceevsVideoLoader.resetHub) {
      window.ceevsVideoLoader.resetHub();
    } else {
      try { localStorage.removeItem('ceevs_hub_video'); } catch (e) {}
    }
    showToast('Restaurado al video local del sitio');
    loadHubVideoSettings();
  }

  /* ─── Galería de Recuerdos (fotos y álbumes extra) ─── */
  function gal() { return window.ceevsGalleryExtra || null; }

  function renderGalleryPanel() {
    var api = gal();
    if (!api) return;
    var data = api.getData();

    // Poblar el selector de álbum destino (fijos + personalizados)
    var select = document.getElementById('gal-album-select');
    if (select) {
      var current = select.value;
      var html = '';
      api.FIXED_ALBUMS.forEach(function (a) {
        html += '<option value="' + a.id + '">Álbum ' + a.id + ' — ' + a.title + '</option>';
      });
      data.albums.forEach(function (a) {
        html += '<option value="' + a.id + '">Álbum nuevo — ' + escapeHtml(a.title) + '</option>';
      });
      select.innerHTML = html;
      if (current) select.value = current;
    }

    // Contador
    var countEl = document.getElementById('gal-count');
    if (countEl) {
      countEl.textContent = data.photos.length + ' foto' + (data.photos.length !== 1 ? 's' : '') +
        (data.albums.length ? ' · ' + data.albums.length + ' álbum' + (data.albums.length !== 1 ? 'es' : '') + ' nuevo' + (data.albums.length !== 1 ? 's' : '') : '');
    }

    // Lista agrupada
    var list = document.getElementById('gal-extra-list');
    if (!list) return;

    if (!data.photos.length && !data.albums.length) {
      list.innerHTML = '<p class="empty-state">Aún no has agregado fotos ni álbumes.</p>';
      return;
    }

    var out = '';

    api.FIXED_ALBUMS.forEach(function (album) {
      var photos = data.photos.filter(function (p) { return p.album === album.id; });
      if (!photos.length) return;
      out += '<div class="gal-group">' +
        '<div class="gal-group-title">Álbum ' + album.id + ' — ' + album.title + ' <span>(' + photos.length + ' agregada' + (photos.length !== 1 ? 's' : '') + ')</span></div>' +
        galThumbs(photos) + '</div>';
    });

    data.albums.forEach(function (album) {
      var photos = data.photos.filter(function (p) { return p.album === album.id; });
      out += '<div class="gal-group gal-group--custom">' +
        '<div class="gal-group-title">🗂️ ' + escapeHtml(album.title) +
          (album.date ? ' <span>· ' + escapeHtml(album.date) + '</span>' : '') +
          ' <span>(' + photos.length + ' foto' + (photos.length !== 1 ? 's' : '') + ')</span>' +
          '<button class="admin-btn-danger gal-del-album" data-gal-del-album="' + album.id + '">Eliminar álbum</button>' +
        '</div>' +
        (photos.length ? galThumbs(photos) : '<p class="gal-empty">Sin fotos aún — agrégalas con el formulario de arriba.</p>') +
        '</div>';
    });

    list.innerHTML = out;
  }

  function galThumbs(photos) {
    var h = '<div class="gal-thumbs">';
    photos.forEach(function (p) {
      h += '<div class="gal-thumb">' +
        '<img src="' + escapeHtml(p.url) + '" alt="" loading="lazy" onerror="this.style.opacity=.25">' +
        (p.caption ? '<div class="gal-thumb-caption">' + escapeHtml(p.caption) + '</div>' : '') +
        '<button class="gal-thumb-del" data-gal-del-photo="' + p.id + '" title="Eliminar esta foto">✕</button>' +
        '</div>';
    });
    return h + '</div>';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function galAddPhoto() {
    var api = gal();
    if (!api) return;
    var select = document.getElementById('gal-album-select');
    var urlInput = document.getElementById('gal-photo-url');
    var captionInput = document.getElementById('gal-photo-caption');
    var url = (urlInput && urlInput.value || '').trim();
    if (!url || !isMediaUrl(url)) {
      showToast('Ingresa la URL de la foto o súbela con el botón 📤');
      return;
    }
    api.addPhoto(select.value, url, (captionInput && captionInput.value || '').trim());
    if (urlInput) urlInput.value = '';
    if (captionInput) captionInput.value = '';
    showToast('Foto agregada a la galería');
    renderGalleryPanel();
  }

  function galAddAlbum() {
    var api = gal();
    if (!api) return;
    var titleInput = document.getElementById('gal-album-title');
    var dateInput = document.getElementById('gal-album-date');
    var title = (titleInput && titleInput.value || '').trim();
    if (!title) {
      showToast('Escribe el título del álbum');
      return;
    }
    var id = api.addAlbum(title, (dateInput && dateInput.value || '').trim());
    if (titleInput) titleInput.value = '';
    if (dateInput) dateInput.value = '';
    showToast('Álbum "' + title + '" creado');
    renderGalleryPanel();
    // Dejar el nuevo álbum seleccionado para agregarle fotos de inmediato
    var select = document.getElementById('gal-album-select');
    if (select) select.value = id;
  }

  function bindGalleryEvents() {
    var addPhotoBtn = document.getElementById('btn-gal-add-photo');
    if (addPhotoBtn) addPhotoBtn.addEventListener('click', galAddPhoto);

    var addAlbumBtn = document.getElementById('btn-gal-add-album');
    if (addAlbumBtn) addAlbumBtn.addEventListener('click', galAddAlbum);

    var list = document.getElementById('gal-extra-list');
    if (list && !list.dataset.galBound) {
      list.dataset.galBound = 'true';
      list.addEventListener('click', function (e) {
        var delPhoto = e.target.closest('[data-gal-del-photo]');
        if (delPhoto) {
          gal().removePhoto(delPhoto.getAttribute('data-gal-del-photo'));
          showToast('Foto eliminada');
          renderGalleryPanel();
          return;
        }
        var delAlbum = e.target.closest('[data-gal-del-album]');
        if (delAlbum) {
          if (!confirm('¿Eliminar este álbum y todas sus fotos?')) return;
          gal().removeAlbum(delAlbum.getAttribute('data-gal-del-album'));
          showToast('Álbum eliminado');
          renderGalleryPanel();
        }
      });
    }
  }

  /* ─── Respaldo (exportar / importar / borrar) ─── */
  var CONFIG_KEYS = [
    { key: 'ceevs_images', label: 'Imágenes personalizadas (URLs)' },
    { key: 'ceevs_image_settings', label: 'Ajustes de posición y zoom de imágenes' },
    { key: 'ceevs_gallery', label: 'Fotos y álbumes extra de la galería' },
    { key: 'ceevs_video_settings', label: 'Video de fondo del hero' },
    { key: 'ceevs_hub_video', label: 'Video de presentación' },
    { key: 'ceevs_theme', label: 'Paleta de colores' },
    { key: 'ceevs_inventory', label: 'Inventario de productos' },
    { key: 'ceevs_mision_aula', label: 'Aula virtual de la Misión Evangelística' }
  ];

  function exportBackup() {
    var payload = { app: 'ceevs-admin', version: 1, exportedAt: new Date().toISOString(), data: {} };
    CONFIG_KEYS.forEach(function (item) {
      var raw = localStorage.getItem(item.key);
      if (raw !== null) payload.data[item.key] = raw;
    });
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ceevs-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast('Respaldo descargado');
  }

  function importBackup() {
    var fileInput = document.getElementById('backup-file-input');
    var file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) {
      showToast('Selecciona primero un archivo de respaldo (.json)');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        if (!payload || payload.app !== 'ceevs-admin' || typeof payload.data !== 'object') {
          showToast('El archivo no es un respaldo válido del panel CEEVS');
          return;
        }
        var applied = 0;
        CONFIG_KEYS.forEach(function (item) {
          var val = payload.data[item.key];
          if (val === undefined || val === null) return;
          localStorage.setItem(item.key, typeof val === 'string' ? val : JSON.stringify(val));
          applied++;
        });
        showToast('Respaldo importado (' + applied + ' apartados)');
        fileInput.value = '';
        renderBackupStatus();
        renderDashboard();
        renderGalleryPanel();
        loadVideoSettings();
        loadHubVideoSettings();
      } catch (e) {
        showToast('No se pudo leer el archivo: ¿es un respaldo válido?');
      }
    };
    reader.readAsText(file);
  }

  function renderBackupStatus() {
    var list = document.getElementById('backup-status-list');
    if (!list) return;
    var html = '<ul class="backup-status">';
    CONFIG_KEYS.forEach(function (item) {
      var raw = localStorage.getItem(item.key);
      var detail = '';
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (item.key === 'ceevs_images' || item.key === 'ceevs_image_settings') {
            detail = ' (' + Object.keys(parsed).length + ')';
          } else if (item.key === 'ceevs_inventory' && Array.isArray(parsed)) {
            detail = ' (' + parsed.length + ' productos)';
          } else if (item.key === 'ceevs_gallery') {
            detail = ' (' + ((parsed.photos || []).length) + ' fotos, ' + ((parsed.albums || []).length) + ' álbumes)';
          } else if (item.key === 'ceevs_mision_aula') {
            detail = ' (' + ((parsed.cursos || []).length) + ' cursos, ' + ((parsed.avisos || []).length) + ' avisos)';
          }
        } catch (e) {}
      }
      html += '<li class="' + (raw ? 'has-data' : 'no-data') + '">' +
        (raw ? '✅ ' : '▫️ ') + item.label +
        (raw ? ' — <strong>personalizado' + detail + '</strong>' : ' — sin cambios') + '</li>';
    });
    html += '</ul>';
    list.innerHTML = html;
  }

  function wipeConfig() {
    if (!confirm('¿Borrar TODA la personalización del sitio?\n\nImágenes, videos, paleta e inventario volverán a sus valores originales. Si el sitio está publicado, el cambio lo verán TODOS los visitantes.')) return;
    if (!confirm('Última confirmación: esta acción NO se puede deshacer.\n\n¿Deseas continuar?')) return;
    CONFIG_KEYS.forEach(function (item) {
      try { localStorage.removeItem(item.key); } catch (e) {}
    });
    showToast('Configuración borrada — el sitio usa los valores originales');
    renderBackupStatus();
    renderDashboard();
    renderGalleryPanel();
    loadVideoSettings();
    loadHubVideoSettings();
  }

  /* ─── Inventory Panel ─── */
  var currentEditingId = null;
  var invListFilter = { q: '', cat: '' };

  function invEsc(value) {
    if (window.ceevsInventory && window.ceevsInventory.escapeHtml) {
      return window.ceevsInventory.escapeHtml(value);
    }
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function invNorm(value) {
    if (window.ceevsInventory && window.ceevsInventory.normalize) {
      return window.ceevsInventory.normalize(value);
    }
    return String(value || '').toLowerCase();
  }

  function renderInventoryList() {
    var list = document.getElementById('inv-list');
    var countEl = document.getElementById('inv-count');
    if (!list || !window.ceevsInventory) return;

    var all = window.ceevsInventory.getAll();
    var q = invNorm(invListFilter.q);
    var isFiltered = !!(q || invListFilter.cat);
    var products = !isFiltered ? all : all.filter(function (p) {
      if (invListFilter.cat && p.categoria !== invListFilter.cat) return false;
      if (q) {
        var hay = invNorm([p.nombre, p.descripcion, p.categoria, p.talla, p.color, p.precio].join(' '));
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = (isFiltered ? products.length + ' de ' : '') +
        all.length + ' producto' + (all.length !== 1 ? 's' : '');
    }

    if (all.length === 0) {
      list.innerHTML = '<p class="empty-state">No hay productos. Crea uno con el formulario.</p>';
      return;
    }
    if (products.length === 0) {
      list.innerHTML = '<p class="empty-state">Ningún producto coincide con la búsqueda o el filtro.</p>';
      return;
    }

    var placeholder = window.ceevsInventory.PLACEHOLDER || '';
    var html = '<table class="inventory-table"><thead><tr>' +
      '<th>Orden</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Disponibilidad</th><th>Activo</th><th>Acciones</th>' +
      '</tr></thead><tbody>';

    products.forEach(function(p, i) {
      var statusLabel = p.disponibilidad === 'disponible' ? 'Disponible' :
                        p.disponibilidad === 'agotado' ? 'Agotado' : 'Próximamente';
      var thumb = (p.imagenUrl || '').trim() || placeholder;
      var id = invEsc(p.id);

      // Reordenar solo tiene sentido viendo la lista completa
      var orderCell = isFiltered
        ? '<span class="inv-order-num" title="Quita la búsqueda o el filtro para reordenar">' +
            (typeof p.orden === 'number' ? (p.orden + 1) : '—') + '</span>'
        : '<div class="inv-order-btns">' +
            '<button type="button" class="action-btn btn-move" data-inv-up="' + id + '"' + (i === 0 ? ' disabled' : '') + ' title="Subir en el catálogo">▲</button>' +
            '<button type="button" class="action-btn btn-move" data-inv-down="' + id + '"' + (i === products.length - 1 ? ' disabled' : '') + ' title="Bajar en el catálogo">▼</button>' +
          '</div>';

      html += '<tr' + (p.activo ? '' : ' class="inv-row-inactive"') + '>' +
        '<td class="inv-order-cell">' + orderCell + '</td>' +
        '<td><div class="inv-cell-product">' +
          '<img class="inv-thumb" src="' + invEsc(thumb) + '" alt="" loading="lazy">' +
          '<span class="product-name">' + invEsc(p.nombre) + '</span>' +
        '</div></td>' +
        '<td><span class="product-category">' + invEsc(p.categoria) + '</span></td>' +
        '<td class="inv-price-cell">' + (p.precio ? invEsc(p.precio) : '—') + '</td>' +
        '<td><span class="product-status status-' + invEsc(p.disponibilidad) + '">' + statusLabel + '</span></td>' +
        '<td>' + (p.activo ? '✓' : '✗') + '</td>' +
        '<td><div class="inventory-actions">' +
          '<button class="action-btn btn-edit" data-inv-edit="' + id + '">Editar</button>' +
          '<button class="action-btn btn-deactivate" data-inv-deactivate="' + id + '">' + (p.activo ? 'Desactivar' : 'Activar') + '</button>' +
          '<button class="action-btn btn-delete" data-inv-delete="' + id + '">Eliminar</button>' +
        '</div></td>' +
      '</tr>';
    });

    html += '</tbody></table>';
    list.innerHTML = html;

    // Miniaturas rotas → imagen de respaldo local
    list.querySelectorAll('.inv-thumb').forEach(function (img) {
      img.addEventListener('error', function () {
        if (this.dataset.fbk || !placeholder) return;
        this.dataset.fbk = '1';
        this.src = placeholder;
      });
    });

    // Event delegation on the list (se vincula una sola vez)
    if (!list.dataset.invBound) {
      list.dataset.invBound = 'true';
      list.addEventListener('click', function(e) {
        var editBtn = e.target.closest('[data-inv-edit]');
        var deactivateBtn = e.target.closest('[data-inv-deactivate]');
        var deleteBtn = e.target.closest('[data-inv-delete]');
        var upBtn = e.target.closest('[data-inv-up]');
        var downBtn = e.target.closest('[data-inv-down]');
        if (editBtn) { editInventoryProduct(editBtn.getAttribute('data-inv-edit')); }
        if (deactivateBtn) { toggleInventoryProduct(deactivateBtn.getAttribute('data-inv-deactivate')); }
        if (deleteBtn) { deleteInventoryProduct(deleteBtn.getAttribute('data-inv-delete')); }
        if (upBtn && !upBtn.disabled) { window.ceevsInventory.move(upBtn.getAttribute('data-inv-up'), 'up'); renderInventoryList(); }
        if (downBtn && !downBtn.disabled) { window.ceevsInventory.move(downBtn.getAttribute('data-inv-down'), 'down'); renderInventoryList(); }
      });
    }
  }

  /* Vista previa de la imagen en el formulario de producto */
  function updateInvImagePreview() {
    var input = document.getElementById('inv-imagen');
    var box = document.getElementById('inv-img-preview');
    var img = document.getElementById('inv-img-preview-img');
    if (!input || !box || !img) return;
    var url = (input.value || '').trim();
    if (!url) {
      box.hidden = true;
      img.removeAttribute('src');
      return;
    }
    delete img.dataset.fbk;
    img.src = url;
    box.hidden = false;
  }

  function getInventoryFormValues() {
    return {
      nombre: (document.getElementById('inv-nombre') || {}).value || '',
      categoria: (document.getElementById('inv-categoria') || {}).value || '',
      descripcion: (document.getElementById('inv-descripcion') || {}).value || '',
      imagenUrl: (document.getElementById('inv-imagen') || {}).value || '',
      disponibilidad: (document.getElementById('inv-disponibilidad') || {}).value || 'disponible',
      talla: (document.getElementById('inv-talla') || {}).value || '',
      color: (document.getElementById('inv-color') || {}).value || '',
      precio: (document.getElementById('inv-precio') || {}).value || ''
    };
  }

  function populateInventoryForm(product) {
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    set('inv-product-id', product.id);
    set('inv-nombre', product.nombre);
    set('inv-categoria', product.categoria);
    set('inv-descripcion', product.descripcion);
    set('inv-imagen', product.imagenUrl);
    set('inv-disponibilidad', product.disponibilidad);
    set('inv-talla', product.talla);
    set('inv-color', product.color);
    set('inv-precio', product.precio);
    var title = document.getElementById('inv-form-title');
    if (title) title.textContent = 'Editar: ' + product.nombre;
    currentEditingId = product.id;
    updateInvImagePreview();
  }

  function resetInventoryForm() {
    var form = document.getElementById('inv-form');
    if (form) form.reset();
    var idEl = document.getElementById('inv-product-id');
    if (idEl) idEl.value = '';
    var title = document.getElementById('inv-form-title');
    if (title) title.textContent = 'Agregar Nuevo Producto';
    currentEditingId = null;
    updateInvImagePreview();
  }

  function handleInventoryFormSubmit(e) {
    e.preventDefault();
    if (!window.ceevsInventory) return;
    var product = getInventoryFormValues();
    if (!product.nombre || !product.categoria) {
      showToast('Nombre y categoría son obligatorios');
      return;
    }
    var id = (document.getElementById('inv-product-id') || {}).value || '';
    if (id) {
      window.ceevsInventory.update(id, product);
      showToast('Producto actualizado');
    } else {
      window.ceevsInventory.create(product);
      showToast('Producto creado');
    }
    resetInventoryForm();
    renderInventoryList();
  }

  function editInventoryProduct(id) {
    if (!window.ceevsInventory) return;
    var products = window.ceevsInventory.getAll();
    var product = products.filter(function(p) { return p.id === id; })[0];
    if (!product) return;
    populateInventoryForm(product);
    var panel = document.getElementById('panel-inventario');
    if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleInventoryProduct(id) {
    if (!window.ceevsInventory) return;
    var products = window.ceevsInventory.getAll();
    var product = products.filter(function(p) { return p.id === id; })[0];
    if (!product) return;
    if (product.activo) {
      window.ceevsInventory.deactivate(id);
      showToast('Producto desactivado');
    } else {
      window.ceevsInventory.update(id, { activo: true });
      showToast('Producto activado');
    }
    renderInventoryList();
  }

  function deleteInventoryProduct(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    if (window.ceevsInventory) {
      window.ceevsInventory.deleteProduct(id);
      showToast('Producto eliminado');
    }
    renderInventoryList();
  }

  /* ─── Init ─── */
  document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    var recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) recoveryForm.addEventListener('submit', handleReset);

    var toggleRecoveryBtn = document.getElementById('btn-toggle-recovery');
    if (toggleRecoveryBtn) toggleRecoveryBtn.addEventListener('click', function () { toggleRecovery(); });

    var sendCodeBtn = document.getElementById('btn-send-code');
    if (sendCodeBtn) sendCodeBtn.addEventListener('click', handleSendCode);

    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    var resetAllBtn = document.getElementById('btn-reset-all');
    if (resetAllBtn) resetAllBtn.addEventListener('click', resetAllImages);

    var resetThemeBtn = document.getElementById('btn-reset-theme');
    if (resetThemeBtn) resetThemeBtn.addEventListener('click', function() {
      if (window.ceevsThemes) window.ceevsThemes.reset();
      showToast('Preset local restaurado al predeterminado');
      renderPalettePanel();
    });

    var saveVideoBtn = document.getElementById('btn-save-video');
    if (saveVideoBtn) saveVideoBtn.addEventListener('click', saveVideoSettings);

    var resetVideoBtn = document.getElementById('btn-reset-video');
    if (resetVideoBtn) resetVideoBtn.addEventListener('click', resetVideoSettings);

    var saveHubBtn = document.getElementById('btn-save-hub-video');
    if (saveHubBtn) saveHubBtn.addEventListener('click', saveHubVideoSettings);

    var resetHubBtn = document.getElementById('btn-reset-hub-video');
    if (resetHubBtn) resetHubBtn.addEventListener('click', resetHubVideoSettings);

    var searchInput = document.getElementById('img-search');
    if (searchInput) searchInput.addEventListener('input', applySearchFilter);

    var exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) exportBtn.addEventListener('click', exportBackup);

    var importBtn = document.getElementById('btn-import-backup');
    if (importBtn) importBtn.addEventListener('click', importBackup);

    var wipeBtn = document.getElementById('btn-wipe-config');
    if (wipeBtn) wipeBtn.addEventListener('click', wipeConfig);

    bindGalleryEvents();

    var invForm = document.getElementById('inv-form');
    if (invForm) invForm.addEventListener('submit', handleInventoryFormSubmit);

    var invResetBtn = document.getElementById('btn-inv-reset-form');
    if (invResetBtn) invResetBtn.addEventListener('click', resetInventoryForm);

    // Vista previa de imagen del producto
    var invImgInput = document.getElementById('inv-imagen');
    if (invImgInput) invImgInput.addEventListener('input', updateInvImagePreview);

    var invPrevImg = document.getElementById('inv-img-preview-img');
    if (invPrevImg) invPrevImg.addEventListener('error', function () {
      if (this.dataset.fbk || !window.ceevsInventory) return;
      this.dataset.fbk = '1';
      this.src = window.ceevsInventory.PLACEHOLDER;
    });

    // Búsqueda y filtro de la lista de productos
    var invSearch = document.getElementById('inv-admin-search');
    if (invSearch) invSearch.addEventListener('input', function () {
      invListFilter.q = invSearch.value.trim();
      renderInventoryList();
    });

    var invCatSel = document.getElementById('inv-admin-cat');
    if (invCatSel) invCatSel.addEventListener('change', function () {
      invListFilter.cat = invCatSel.value;
      renderInventoryList();
    });

    // Botones "Subir" junto a los campos de URL fijos (galería, inventario, videos)
    document.querySelectorAll('[data-upload-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.ceevsSync) return;
        var target = document.getElementById(btn.getAttribute('data-upload-target'));
        window.ceevsSync.pickAndUpload(btn.getAttribute('data-upload-accept') || 'image/*', function (res) {
          if (!res.ok) { showToast(res.error); return; }
          if (target) {
            target.value = res.url;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
          showToast('Archivo subido — ahora haz clic en Guardar/Agregar');
        }, function () { showToast('Subiendo archivo…'); });
      });
    });

    // Seguridad de la cuenta (pestaña Respaldo)
    var changePassBtn = document.getElementById('btn-change-pass');
    if (changePassBtn) changePassBtn.addEventListener('click', function () {
      var s = window.ceevsSync;
      var curEl = document.getElementById('pass-current');
      var nextEl = document.getElementById('pass-new');
      var cur = (curEl && curEl.value) || '';
      var next = (nextEl && nextEl.value) || '';
      if (!s || !s.state.available) { showToast('Disponible solo con el sitio publicado (con PHP)'); return; }
      if (!cur) { showToast('Escribe tu contraseña actual'); return; }
      if (next.length < 8) { showToast('La nueva contraseña debe tener al menos 8 caracteres'); return; }
      s.changePassword(cur, next).then(function (res) {
        if (res.ok) {
          showToast('Contraseña actualizada');
          if (curEl) curEl.value = '';
          if (nextEl) nextEl.value = '';
          renderAudit();
        } else {
          showToast(res.error);
        }
      });
    });

    var changeEmailBtn = document.getElementById('btn-change-email');
    if (changeEmailBtn) changeEmailBtn.addEventListener('click', function () {
      var s = window.ceevsSync;
      var curEl = document.getElementById('pass-current');
      var emailEl = document.getElementById('email-new');
      var cur = (curEl && curEl.value) || '';
      var next = ((emailEl && emailEl.value) || '').trim();
      if (!s || !s.state.available) { showToast('Disponible solo con el sitio publicado (con PHP)'); return; }
      if (!cur) { showToast('Escribe tu contraseña actual'); return; }
      if (!next) { showToast('Escribe el nuevo correo del administrador'); return; }
      s.changeEmail(cur, next).then(function (res) {
        if (res.ok) {
          showToast('Correo del administrador actualizado');
          if (curEl) curEl.value = '';
          if (emailEl) emailEl.value = '';
          updateSecurityCard();
          renderAudit();
        } else {
          showToast(res.error);
        }
      });
    });

    var newRecoveryBtn = document.getElementById('btn-new-recovery');
    if (newRecoveryBtn) newRecoveryBtn.addEventListener('click', function () {
      var s = window.ceevsSync;
      var curEl = document.getElementById('pass-current');
      var cur = (curEl && curEl.value) || '';
      if (!s || !s.state.available) { showToast('Disponible solo con el sitio publicado (con PHP)'); return; }
      if (!cur) { showToast('Escribe tu contraseña actual'); return; }
      if (!confirm('¿Generar una clave maestra de recuperación nueva? La anterior dejará de servir.')) return;
      s.newRecoveryKey(cur).then(function (res) {
        if (res.ok) {
          var box = document.getElementById('recovery-key-box');
          var keyEl = document.getElementById('recovery-key-value');
          if (keyEl) keyEl.textContent = res.key;
          if (box) box.hidden = false;
          if (curEl) curEl.value = '';
          showToast('Clave maestra generada — guárdala ahora');
          renderAudit();
        } else {
          showToast(res.error);
        }
      });
    });

    var auditRefreshBtn = document.getElementById('btn-audit-refresh');
    if (auditRefreshBtn) auditRefreshBtn.addEventListener('click', renderAudit);

    // Al abrir la pestaña Respaldo, refrescar la bitácora
    var respaldoTab = document.querySelector('.admin-tab-btn[data-tab="respaldo"]');
    if (respaldoTab) respaldoTab.addEventListener('click', renderAudit);

    // Cuando llega configuración nueva del servidor, refrescar los paneles
    document.addEventListener('ceevs:remote-config', function (e) {
      if (!e.detail || !e.detail.changed) return;
      var dash = document.getElementById('admin-dashboard');
      if (!dash || dash.style.display !== 'block') return;
      rememberOpenState();
      renderDashboard();
      renderGalleryPanel();
      loadVideoSettings();
      loadHubVideoSettings();
      renderBackupStatus();
      renderInventoryList();
      renderPalettePanel();
      if (window.ceevsMisionAula && window.ceevsMisionAula.renderAdmin) window.ceevsMisionAula.renderAdmin();
    });

    initTabSystem();
    checkSession();
  });
})();
