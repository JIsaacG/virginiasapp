/**
 * MASCOTA — León animado que recorre la página
 *
 * Reproduce los frames de assets/animacion/ para dar sensación de
 * dinamismo: el león ENTRA corriendo por un lado, se detiene a SALUDAR
 * y SALE corriendo por el otro extremo. En el siguiente ciclo reaparece
 * por el lado contrario, simulando que cruza entre las páginas del sitio.
 *
 * Frames:
 *   1, 4, 2  → ciclo de carrera
 *   5, 6     → saludo (mano arriba)
 *   3        → pose en reposo
 *
 * Todos los frames miran hacia la DERECHA; al ir hacia la izquierda se
 * voltea con scaleX(-1).
 */

const Mascota = (function () {
  const BASE = 'assets/animacion/';
  const RUN = ['1', '4', '2'];   // ciclo de carrera
  const WAVE = ['5', '6'];        // saludo
  const IDLE = '3';

  const SPEED = 0.34;             // px por ms (velocidad de carrera)
  const RUN_FRAME_MS = 100;       // cambio de frame al correr
  const WAVE_FRAME_MS = 320;      // cambio de frame al saludar
  const WAVE_DURATION = 2600;     // cuánto saluda (ms)
  const FIRST_DELAY = 800;        // espera inicial tras cargar
  const PAUSE_MIN = 7000;         // pausa entre apariciones
  const PAUSE_RANGE = 6000;

  let started = false;

  let wrap, inner, img;
  let raf = null;
  let frameTimer = null;
  let waveTimer = null;
  let fromLeft = true;

  function src(n) { return BASE + n + '.png'; }

  function preload() {
    [...RUN, ...WAVE, IDLE].forEach((n) => { const i = new Image(); i.src = src(n); });
  }

  function build() {
    wrap = document.createElement('div');
    wrap.className = 'mascota';
    wrap.setAttribute('aria-hidden', 'true');

    inner = document.createElement('div');
    inner.className = 'mascota__inner';

    img = document.createElement('img');
    img.className = 'mascota__img';
    img.alt = '';
    img.decoding = 'async';
    img.src = src(IDLE);

    inner.appendChild(img);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
  }

  function setX(x) { wrap.style.transform = 'translateX(' + x + 'px)'; }
  function face(dir) { inner.style.transform = dir < 0 ? 'scaleX(-1)' : 'scaleX(1)'; }

  function startFrames(frames, ms) {
    stopFrames();
    let i = 0;
    img.src = src(frames[0]);
    frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      img.src = src(frames[i]);
    }, ms);
  }

  function stopFrames() {
    if (frameTimer) { clearInterval(frameTimer); frameTimer = null; }
  }

  // Corre de x0 a x1 y luego ejecuta done()
  function run(x0, x1, done) {
    const dir = x1 >= x0 ? 1 : -1;
    face(dir);
    wrap.classList.add('is-running');
    startFrames(RUN, RUN_FRAME_MS);

    let x = x0;
    let last = null;
    setX(x);

    function step(t) {
      if (last === null) last = t;
      const dt = Math.min(t - last, 48); // limita saltos al cambiar de pestaña
      last = t;
      x += dir * SPEED * dt;

      const arrived = dir > 0 ? x >= x1 : x <= x1;
      if (arrived) {
        setX(x1);
        wrap.classList.remove('is-running');
        stopFrames();
        raf = null;
        if (done) done();
        return;
      }
      setX(x);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  // Saluda mirando hacia faceDir durante WAVE_DURATION
  function wave(faceDir, done) {
    face(faceDir);
    startFrames(WAVE, WAVE_FRAME_MS);
    waveTimer = setTimeout(() => {
      stopFrames();
      img.src = src(IDLE);
      if (done) done();
    }, WAVE_DURATION);
  }

  function vw() { return window.innerWidth; }
  function offW() { return wrap.offsetWidth || 150; }

  // Una escena completa: entra → saluda → sale
  function scene(left, done) {
    const w = offW();
    const margin = Math.min(vw() * 0.14, 180);
    wrap.classList.add('is-active');

    if (left) {
      const startX = -w - 30;
      const stopX = margin;
      const endX = vw() + 30;
      run(startX, stopX, () => wave(1, () => run(stopX, endX, () => {
        wrap.classList.remove('is-active');
        if (done) done();
      })));
    } else {
      const startX = vw() + 30;
      const stopX = vw() - margin - w;
      const endX = -w - 30;
      run(startX, stopX, () => wave(-1, () => run(stopX, endX, () => {
        wrap.classList.remove('is-active');
        if (done) done();
      })));
    }
  }

  function loop() {
    scene(fromLeft, () => {
      fromLeft = !fromLeft; // la próxima vez entra por el lado contrario
      setTimeout(loop, PAUSE_MIN + Math.random() * PAUSE_RANGE);
    });
  }

  const reducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    name: 'Mascota',
    init() {
      if (started) return;          // evita doble arranque (App + fallback)
      started = true;

      if (reducedMotion()) {
        console.warn('🦁 Mascota desactivada: el sistema tiene "reducir movimiento" activado.');
        return;
      }
      if (!document.querySelector('.mascota')) {
        preload();
        build();
      }
      console.log('🦁 Mascota lista. Forzar aparición: Mascota.test()');
      setTimeout(loop, FIRST_DELAY);
    },

    // Disparo manual desde la consola para depurar
    test() {
      if (!document.querySelector('.mascota')) { preload(); build(); }
      if (raf) cancelAnimationFrame(raf);
      stopFrames();
      if (waveTimer) clearTimeout(waveTimer);
      scene(true, () => console.log('🦁 Escena de prueba terminada'));
    }
  };
})();

// Registro en el sistema de módulos
if (typeof App !== 'undefined' && App.register) {
  App.register(Mascota);
}

// Auto-arranque de respaldo: si App.init() no lo ejecuta, arranca solo
(function () {
  const start = () => Mascota.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

// Accesible desde la consola del navegador
window.Mascota = Mascota;
