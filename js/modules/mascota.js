/**
 * MASCOTA — León animado que recorre la página
 *
 * Da sensación de dinamismo sin cansar: el león aparece cada cierto tiempo
 * con un comportamiento ALEATORIO (cruza, saluda, se asoma y se devuelve...),
 * se mueve LENTO y con suavidad (acelera y frena), y si le das CLIC saluda
 * con un brinquito y luego se va.
 *
 * Frames (assets/animacion/):
 *   1, 4, 2  → ciclo de carrera
 *   5, 6     → saludo (mano arriba)
 *   3        → pose en reposo
 *
 * Todos miran a la DERECHA; al ir a la izquierda se voltea con scaleX(-1).
 */

const Mascota = (function () {
  const BASE = 'assets/animacion/';
  const RUN = ['1', '4', '2'];
  const WAVE = ['5', '6'];
  const IDLE = '3';

  const BASE_SPEED = 0.085;     // px por ms — LENTO (antes 0.34)
  const RUN_FRAME_MS = 150;     // cambio de frame al correr
  const WAVE_FRAME_MS = 300;    // cambio de frame al saludar
  const FIRST_DELAY = 900;      // espera inicial
  const PAUSE_MIN = 9000;       // pausa mínima entre apariciones
  const PAUSE_MAX = 20000;      // pausa máxima

  let wrap, inner, img, bubble;
  let raf = null, frameTimer = null, waveTimer = null, nextTimer = null;
  let token = 0;                // testigo de cancelación
  let curX = 0, curDir = 1;     // posición/dirección actuales
  let speed = BASE_SPEED;       // velocidad de la escena en curso
  let started = false;

  const ASSET_VER = '2';   // súbelo si vuelves a editar los PNG (rompe caché)
  const rnd = (a, b) => a + Math.random() * (b - a);
  const src = (n) => BASE + n + '.png?v=' + ASSET_VER;

  // Curvas de aceleración para que no se vea robótico
  const ease = {
    linear: (t) => t,
    in:     (t) => t * t,
    out:    (t) => 1 - (1 - t) * (1 - t),
    inOut:  (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  };

  function preload() {
    [...RUN, ...WAVE, IDLE].forEach((n) => { const i = new Image(); i.src = src(n); });
  }

  function build() {
    wrap = document.createElement('div');
    wrap.className = 'mascota';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.title = '¡Hola! 🦁';

    inner = document.createElement('div');
    inner.className = 'mascota__inner';

    img = document.createElement('img');
    img.className = 'mascota__img';
    img.alt = '';
    img.decoding = 'async';
    img.src = src(IDLE);

    bubble = document.createElement('div');
    bubble.className = 'mascota__bubble';
    bubble.textContent = 'Bienvenido al portal Virginia Sapp';

    inner.appendChild(img);
    inner.appendChild(bubble);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);

    wrap.addEventListener('click', onClick);
  }

  function setStart(x) { curX = x; setX(x); }
  function setX(x) { wrap.style.transform = 'translateX(' + x + 'px)'; }
  function face(dir) { inner.style.transform = dir < 0 ? 'scaleX(-1)' : 'scaleX(1)'; }
  function setBubble(visible) { if (bubble) bubble.classList.toggle('is-visible', visible); }

  function startFrames(frames, ms) {
    stopFrames();
    let i = 0;
    img.src = src(frames[0]);
    frameTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      img.src = src(frames[i]);
    }, ms);
  }
  function stopFrames() { if (frameTimer) { clearInterval(frameTimer); frameTimer = null; } }

  function stopMotion() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (waveTimer) { clearTimeout(waveTimer); waveTimer = null; }
    stopFrames();
    setBubble(false);
  }

  const vw = () => window.innerWidth;
  const offW = () => wrap.offsetWidth || 95;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Mueve de la posición actual a x1; devuelve false si fue cancelado
  function moveTo(x1, spd, easing) {
    return new Promise((resolve) => {
      const my = token;
      const x0 = curX;
      const dir = x1 >= x0 ? 1 : -1;
      const dur = Math.max(Math.abs(x1 - x0) / spd, 1);
      curDir = dir;
      face(dir);
      setBubble(false);
      wrap.classList.add('is-running');
      startFrames(RUN, RUN_FRAME_MS);

      let start = null;
      function step(t) {
        if (my !== token) { resolve(false); return; }
        if (start === null) start = t;
        const p = Math.min((t - start) / dur, 1);
        curX = x0 + (x1 - x0) * easing(p);
        setX(curX);
        if (p >= 1) {
          wrap.classList.remove('is-running');
          stopFrames();
          raf = null;
          resolve(true);
          return;
        }
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    });
  }

  // Saluda durante ms; devuelve false si fue cancelado
  function doWave(ms) {
    return new Promise((resolve) => {
      const my = token;
      setBubble(true);
      startFrames(WAVE, WAVE_FRAME_MS);
      waveTimer = setTimeout(() => {
        waveTimer = null;
        stopFrames();
        if (my !== token) { resolve(false); return; }
        img.src = src(IDLE);
        resolve(true);
      }, ms);
    });
  }

  // Pausa en reposo "mirando alrededor"; devuelve false si fue cancelado
  async function idle(ms) {
    const my = token;
    stopFrames();
    img.src = src(IDLE);
    setBubble(true);
    await sleep(ms);
    if (my === token) setBubble(false);
    return my === token;
  }

  // ── Comportamientos (todos parten desde fuera de pantalla) ──────────────

  // Cruza de lado a lado sin detenerse
  async function cross(fromLeft) {
    const w = offW();
    setStart(fromLeft ? -w - 40 : vw() + 40);
    await moveTo(fromLeft ? vw() + 40 : -w - 40, speed * 1.15, ease.inOut);
  }

  // Entra, frena, saluda y sigue su camino hacia el lado contrario
  async function greet(fromLeft) {
    const w = offW();
    const stopX = fromLeft ? rnd(vw() * 0.18, vw() * 0.5)
                           : rnd(vw() * 0.5 - w, vw() * 0.78 - w);
    setStart(fromLeft ? -w - 40 : vw() + 40);
    if (!await moveTo(stopX, speed, ease.out)) return;
    if (Math.random() < 0.5 && !await idle(rnd(400, 1100))) return;
    if (!await doWave(rnd(2400, 3800))) return;
    if (!await idle(rnd(200, 600))) return;
    await moveTo(fromLeft ? vw() + 40 : -w - 40, speed, ease.in);
  }

  // Se asoma un poco, saluda y se devuelve por donde entró
  async function peek(fromLeft) {
    const w = offW();
    const stopX = fromLeft ? rnd(vw() * 0.1, vw() * 0.26)
                           : rnd(vw() * 0.74 - w, vw() * 0.9 - w);
    setStart(fromLeft ? -w - 40 : vw() + 40);
    if (!await moveTo(stopX, speed, ease.out)) return;
    if (!await doWave(rnd(2200, 3400))) return;
    if (!await idle(rnd(150, 500))) return;
    await moveTo(fromLeft ? -w - 40 : vw() + 40, speed * 1.1, ease.in);
  }

  // Pasea: entra, se detiene, avanza otro tramo, saluda y sale
  async function wander(fromLeft) {
    const w = offW();
    const x1 = fromLeft ? rnd(vw() * 0.18, vw() * 0.34) : rnd(vw() * 0.6 - w, vw() * 0.78 - w);
    const x2 = fromLeft ? rnd(vw() * 0.42, vw() * 0.6)  : rnd(vw() * 0.22 - w, vw() * 0.4 - w);
    setStart(fromLeft ? -w - 40 : vw() + 40);
    if (!await moveTo(x1, speed, ease.out)) return;
    if (!await idle(rnd(500, 1300))) return;
    if (!await moveTo(x2, speed * 0.9, ease.inOut)) return;
    if (!await doWave(rnd(2200, 3400))) return;
    await moveTo(fromLeft ? vw() + 40 : -w - 40, speed, ease.in);
  }

  // Selección ponderada de comportamiento
  function pickBehavior() {
    const r = Math.random();
    if (r < 0.40) return greet;
    if (r < 0.65) return cross;
    if (r < 0.85) return peek;
    return wander;
  }

  // ── Bucle principal ─────────────────────────────────────────────────────

  async function runScene() {
    const my = ++token;            // nueva escena cancela la anterior
    setBubble(false);
    wrap.classList.add('is-active');
    speed = BASE_SPEED * rnd(0.8, 1.3);
    const fromLeft = Math.random() < 0.5;   // lado aleatorio
    await pickBehavior()(fromLeft);
    if (my !== token) return;      // un clic tomó el control
    wrap.classList.remove('is-active');
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(nextTimer);
    nextTimer = setTimeout(runScene, rnd(PAUSE_MIN, PAUSE_MAX));
  }

  // Clic: interrumpe, saluda con brinquito y se va
  async function onClick() {
    if (!wrap.classList.contains('is-active')) return;
    const my = ++token;            // cancela lo que estuviera haciendo
    stopMotion();

    wrap.classList.add('is-happy');
    const ok = await doWave(rnd(2000, 2800));
    wrap.classList.remove('is-happy');
    if (!ok || my !== token) return;

    // Sale por el borde más cercano
    const w = offW();
    const goLeft = (curX + w / 2) < vw() / 2;
    await moveTo(goLeft ? -w - 40 : vw() + 40, speed * 1.1, ease.in);
    if (my !== token) return;
    setBubble(false);
    wrap.classList.remove('is-active');
    scheduleNext();
  }

  return {
    name: 'Mascota',
    init() {
      if (started) return;
      started = true;
      if (!document.querySelector('.mascota')) { preload(); build(); }
      console.log('🦁 Mascota lista. Clic = saluda · forzar: Mascota.test()');
      nextTimer = setTimeout(runScene, FIRST_DELAY);
    },
    // Disparo manual desde la consola
    test() {
      if (!document.querySelector('.mascota')) { preload(); build(); }
      runScene();
    },
  };
})();

// Registro en el sistema de módulos
if (typeof App !== 'undefined' && App.register) {
  App.register(Mascota);
}

// Auto-arranque de respaldo por si App.init() no lo ejecuta
(function () {
  const start = () => Mascota.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

window.Mascota = Mascota;
