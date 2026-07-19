/**
 * admin-sync.js — Publicación de los cambios del panel al servidor (api/).
 *
 * Convierte el panel de un editor local (localStorage) en uno real:
 *  - login contra el servidor (sesión PHP),
 *  - al entrar descarga la configuración publicada,
 *  - cada cambio local se publica automáticamente (con debounce),
 *  - permite subir imágenes/videos al servidor (uploads/).
 *
 * Si la API no está disponible (sitio abierto sin PHP), el panel sigue
 * funcionando en "modo local" y avisa que los cambios no se publican.
 * Debe cargarse ANTES de image-manager.js en admin.html.
 */

(function () {
  'use strict';

  // Señal para image-manager.js: en el panel la sincronización la dirige este módulo.
  window.CEEVS_ADMIN_PAGE = true;

  var API = 'api/';
  var CONFIG_KEYS = [
    'ceevs_images', 'ceevs_image_settings', 'ceevs_gallery',
    'ceevs_video_settings', 'ceevs_hub_video', 'ceevs_theme', 'ceevs_inventory',
    'ceevs_mision_aula'
  ];

  var state = {
    available: null,   // null = sin comprobar; true/false tras checkStatus()
    authed: false,
    email: '',         // correo del administrador con sesión activa
    csrf: '',          // token anti-CSRF exigido por el servidor en toda escritura
    pending: false     // hay cambios locales sin publicar
  };

  var pushTimer = null;

  /* ─── HTTP ─── */

  function postJSON(url, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (state.csrf) headers['X-CEEVS-CSRF'] = state.csrf;
    return fetch(url, {
      method: 'POST',
      headers: headers,
      credentials: 'same-origin',
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json()
        .catch(function () { throw new Error('Respuesta inválida del servidor'); })
        .then(function (data) { return { status: r.status, data: data }; });
    });
  }

  /* ─── Indicador visual (chip en la barra superior del panel) ─── */

  function setChip(kind, text) {
    var el = document.getElementById('sync-chip');
    if (!el) return;
    el.className = 'sync-chip sync-chip--' + kind;
    el.textContent = text;
  }

  /* ─── Estado local ─── */

  function collectLocal() {
    var out = {};
    for (var i = 0; i < CONFIG_KEYS.length; i++) {
      var v = null;
      try { v = localStorage.getItem(CONFIG_KEYS[i]); } catch (e) {}
      if (v !== null) out[CONFIG_KEYS[i]] = v;
    }
    return out;
  }

  function hasLocalData() {
    return Object.keys(collectLocal()).length > 0;
  }

  /* ─── Publicación ─── */

  function schedulePush() {
    state.pending = true;
    if (!state.available || !state.authed) {
      setChip('warn', state.available === false
        ? 'Modo local — los cambios no se publican'
        : 'Cambios sin publicar');
      return;
    }
    setChip('busy', 'Publicando…');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 900);
  }

  function pushNow() {
    if (!state.authed) return Promise.resolve(false);
    return postJSON(API + 'save.php', { data: collectLocal() })
      .then(function (res) {
        if (res.status === 200 && res.data && res.data.ok) {
          state.pending = false;
          setChip('ok', '✓ Publicado en el sitio');
          return true;
        }
        if (res.status === 401) {
          state.authed = false;
          setChip('error', 'Sesión expirada — recarga y entra de nuevo');
          return false;
        }
        setChip('error', (res.data && res.data.error) || 'Error al publicar');
        return false;
      })
      .catch(function () {
        setChip('error', 'Sin conexión con el servidor — reintentando');
        clearTimeout(pushTimer);
        pushTimer = setTimeout(pushNow, 5000);
        return false;
      });
  }

  /* ─── Descarga de la configuración publicada ─── */

  function pull() {
    return fetch(API + 'config.php', { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(function (cfg) {
        if (!cfg || cfg.app !== 'ceevs-admin') throw new Error();
        var mgr = window.ceevsImageManager || {};
        if (cfg.updatedAt) {
          // Ya hay configuración publicada: el servidor manda.
          var changed = mgr.applyRemoteData ? mgr.applyRemoteData(cfg.data) : false;
          if (changed && mgr.reapplyAll) mgr.reapplyAll();
          document.dispatchEvent(new CustomEvent('ceevs:remote-config', { detail: { changed: changed } }));
          setChip('ok', '✓ Publicado en el sitio');
        } else if (hasLocalData() && state.authed) {
          // Primera publicación: subir lo que este navegador ya tenía configurado.
          schedulePush();
        } else {
          setChip('ok', 'Conectado — sin cambios publicados aún');
        }
        return true;
      })
      .catch(function () {
        setChip('error', 'No se pudo leer la configuración del servidor');
        return false;
      });
  }

  /* ─── Autenticación ─── */

  function checkStatus() {
    return postJSON(API + 'auth.php', { action: 'status' })
      .then(function (res) {
        if (res.status !== 200 || !res.data || res.data.ok !== true) throw new Error();
        state.available = true;
        state.authed = !!res.data.authenticated;
        state.email = res.data.email || '';
        state.csrf = res.data.csrf || '';
        return state;
      })
      .catch(function () {
        state.available = false;
        state.authed = false;
        setChip('warn', 'Modo local — los cambios no se publican');
        return state;
      });
  }

  function handleAuthResult(res) {
    if (res.status === 200 && res.data && res.data.ok) {
      state.authed = true;
      state.email = res.data.email || state.email;
      state.csrf = res.data.csrf || state.csrf;
      return { ok: true };
    }
    return { ok: false, error: (res.data && res.data.error) || 'Error del servidor' };
  }

  /** Respuesta genérica { ok, error?, ...data } para las acciones del panel. */
  function simpleResult(res) {
    if (res.status === 200 && res.data && res.data.ok) return res.data;
    return { ok: false, error: (res.data && res.data.error) || 'Error del servidor' };
  }

  function login(email, password) {
    return postJSON(API + 'auth.php', { action: 'login', email: email, password: password }).then(handleAuthResult);
  }

  function logout() {
    state.authed = false;
    state.email = '';
    state.csrf = '';
    return postJSON(API + 'auth.php', { action: 'logout' }).catch(function () {});
  }

  function changePassword(current, next) {
    return postJSON(API + 'auth.php', { action: 'change', password: current, newPassword: next }).then(simpleResult);
  }

  function changeEmail(password, newEmail) {
    return postJSON(API + 'auth.php', { action: 'change_email', password: password, newEmail: newEmail })
      .then(function (res) {
        var out = simpleResult(res);
        if (out.ok && out.email) state.email = out.email;
        return out;
      });
  }

  /** Pide al servidor enviar un código de recuperación al correo del administrador. */
  function forgot(email) {
    return postJSON(API + 'auth.php', { action: 'forgot', email: email }).then(simpleResult);
  }

  /** Restablece la contraseña con el código del correo o la clave maestra. */
  function resetPassword(email, code, newPassword) {
    return postJSON(API + 'auth.php', { action: 'reset', email: email, code: code, newPassword: newPassword }).then(simpleResult);
  }

  /** Genera una clave maestra de recuperación nueva (requiere la contraseña actual). */
  function newRecoveryKey(password) {
    return postJSON(API + 'auth.php', { action: 'recovery_key', password: password }).then(simpleResult);
  }

  /** Últimos movimientos de la bitácora del servidor (más recientes primero). */
  function getAudit(limit) {
    return fetch(API + 'audit.php?limit=' + (limit || 100), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) {
        return r.json().then(function (d) { return { status: r.status, data: d }; });
      })
      .then(simpleResult)
      .catch(function () {
        return { ok: false, error: 'No se pudo leer la bitácora del servidor' };
      });
  }

  /* ─── Subida de archivos ─── */

  var fileInput = null;

  /**
   * Abre el selector de archivos y sube el elegido al servidor.
   * onDone recibe { ok, url } o { ok: false, error }. onStart (opcional)
   * se llama cuando el usuario eligió archivo y comienza la subida.
   */
  function pickAndUpload(accept, onDone, onStart) {
    if (!state.available || !state.authed) {
      onDone({
        ok: false,
        error: state.available === false
          ? 'La subida de archivos solo funciona con el sitio publicado (con PHP).'
          : 'Inicia sesión en el servidor para subir archivos.'
      });
      return;
    }
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
    }
    fileInput.accept = accept || 'image/*';
    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (onStart) onStart(file);
      uploadFile(file, onDone);
      fileInput.value = '';
    };
    fileInput.click();
  }

  function uploadFile(file, onDone) {
    var fd = new FormData();
    fd.append('file', file);
    var headers = {};
    if (state.csrf) headers['X-CEEVS-CSRF'] = state.csrf;
    fetch(API + 'upload.php', { method: 'POST', body: fd, headers: headers, credentials: 'same-origin' })
      .then(function (r) {
        return r.json().then(function (d) { return { status: r.status, data: d }; });
      })
      .then(function (res) {
        if (res.status === 200 && res.data && res.data.ok) {
          onDone({ ok: true, url: res.data.url });
        } else {
          onDone({ ok: false, error: (res.data && res.data.error) || 'No se pudo subir el archivo' });
        }
      })
      .catch(function () {
        onDone({ ok: false, error: 'No se pudo conectar con el servidor para subir el archivo' });
      });
  }

  /* ─── Interceptar cambios en localStorage (claves ceevs_*) ───
     admin.js y los módulos del sitio guardan con localStorage.setItem;
     al interceptarlo aquí, cualquier cambio del panel se publica solo. */

  var origSet = Storage.prototype.setItem;
  var origRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    origSet.call(this, key, value);
    maybeSchedule(this, key);
  };

  Storage.prototype.removeItem = function (key) {
    origRemove.call(this, key);
    maybeSchedule(this, key);
  };

  function maybeSchedule(store, key) {
    if (store !== window.localStorage) return;
    if (window.__ceevsApplyingRemote) return;
    if (CONFIG_KEYS.indexOf(String(key)) === -1) return;
    schedulePush();
  }

  // Aviso al salir con cambios sin publicar (la publicación tarda ~1 segundo).
  window.addEventListener('beforeunload', function (e) {
    if (state.pending && state.authed) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ─── API pública (usada por admin.js) ─── */
  window.ceevsSync = {
    state: state,
    checkStatus: checkStatus,
    login: login,
    logout: logout,
    changePassword: changePassword,
    changeEmail: changeEmail,
    forgot: forgot,
    resetPassword: resetPassword,
    newRecoveryKey: newRecoveryKey,
    getAudit: getAudit,
    pull: pull,
    pushNow: pushNow,
    schedulePush: schedulePush,
    pickAndUpload: pickAndUpload
  };
})();
