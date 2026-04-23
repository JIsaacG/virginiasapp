# PLAN DE IMPLEMENTACIÓN — Instrucciones para el modelo IA

> **Propósito:** Guía paso a paso para que Claude ejecute cada mejora de arquitectura
> en este proyecto. Cada tarea incluye archivos exactos, patrones a buscar y qué escribir.
>
> **Regla de trabajo:** Leer solo los archivos indicados en cada tarea.
> No explorar el proyecto de nuevo — este documento tiene toda la información necesaria.

---

## ESTADO DEL PROYECTO (referencia rápida)

```
CSS:  COMPLETO ✅ — css/main.css orquesta 30 archivos modulares
JS:   HÍBRIDO ⚠️  — js/core/ (moderno) + js/*.js legacy (funciones globales)
HTML: BUENO   ⚠️  — inline onclick= y style= pendientes de eliminar
BUILD: NO EXISTE ❌ — sin minificación, sin bundler
```

**Archivos del núcleo moderno (NO tocar, son la base correcta):**
- `js/core/app.js` — Registry de módulos (App.register / App.init)
- `js/core/dom.js` — Utilidades DOM (DOM.select / DOM.on / DOM.addClass...)
- `js/core/storage.js` — Wrapper localStorage (Storage.get / Storage.set)
- `js/core/hud.js` — Componente HUD (incompleto, Fase 3)

---

## FASE 1 — LIMPIEZA INMEDIATA
> Sin riesgo de romper nada. No afecta funcionalidad.

---

### TAREA 1.1 — Eliminar css/styles.css legacy

**Por qué:** 2,301 líneas que no importa ninguna página. Genera confusión sobre qué CSS está activo.

**Verificación previa (ejecutar esto primero):**
```bash
grep -r "styles.css" --include="*.html" .
```
Si el resultado está vacío → seguro eliminar.

**Acción:** Eliminar el archivo `css/styles.css`.

**Verificación posterior:** Abrir cualquier página en el navegador y confirmar que se ve igual.

---

### TAREA 1.2 — Eliminar archivos .backup

**Por qué:** Confunden al leer el proyecto. El historial está en git.

**Archivos a eliminar:**
- `admin.html.backup`
- `quienes-somos.html.backup`

**Acción:** Borrar ambos archivos directamente.

---

### TAREA 1.3 — Agregar README.md al proyecto

**Por qué:** No existe documentación de entrada para el proyecto.

**Acción:** Crear `README.md` en la raíz con:
- Nombre y propósito del proyecto
- Stack tecnológico (HTML5, CSS3 modular, Vanilla JS ES6+)
- Estructura de carpetas con descripción breve de cada una
- Cómo hacer cambios comunes: "Para editar el navbar → css/3-layout/navbar.css"
- Nota sobre el sistema modular JS: registrar módulos en App

---

## FASE 2 — ELIMINAR INLINE STYLES Y ONCLICK EN HTML
> Afecta: index.html, admisiones.html, quienes-somos.html, contactenos.html, interactivo.html

---

### TAREA 2.1 — Crear clase utilitaria para imagen circular en CSS

**Por qué:** En el HTML hay 20+ instancias de `style="width:44px; height:44px; border-radius:50%"`

**Buscar en todos los HTML:**
```
style="width:44px; height:44px; border-radius:50%"
style="width:44px;height:44px;border-radius:50%"
```

**Acción en `css/2-components/cards.css`** — agregar al final:
```css
.img-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}
```

**Luego en cada HTML:** reemplazar el atributo `style="..."` por `class="img-avatar"`.

**Verificación:** `grep -r 'style="width:44px' --include="*.html" .` → debe dar 0 resultados.

---

### TAREA 2.2 — Mover estilo del botón de quiz result a CSS

**Ubicación:** `admisiones.html` línea ~378

**Buscar:**
```html
<button onclick="submitQuizLead()" style="width:100%;padding:13px;background:var(--gold);color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:background .2s" onmouseover="this.style.background='#c77a2a'" onmouseout="this.style.background='var(--gold)'">
```

**Reemplazar con:**
```html
<button id="quiz-lead-btn" class="btn-quiz-lead">Solicitar información ahora</button>
```

**Agregar en `css/4-sections/quiz.css`:**
```css
.btn-quiz-lead {
  width: 100%;
  padding: 13px;
  background: var(--gold);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: background .2s;
}
.btn-quiz-lead:hover { background: #c77a2a; }
```

**Eliminar los `onmouseover` y `onmouseout`** — el hover queda en CSS.

**Agregar en `js/quiz.js`** (en la función `submitQuizLead` existente o al final):
```javascript
const quizLeadBtn = document.getElementById('quiz-lead-btn');
if (quizLeadBtn) {
  quizLeadBtn.addEventListener('click', submitQuizLead);
}
```

---

### TAREA 2.3 — Reemplazar onclick del HUD toggle

**Patrón a buscar en TODOS los HTML:**
```
onclick="toggleHUD()"
```

**En cada HTML que lo tenga:**
1. Eliminar el atributo `onclick="toggleHUD()"` del botón `id="hud-toggle"`
2. El botón ya tiene `id="hud-toggle"` → el event listener va en JS

**En `js/gamification.js`**, al final del archivo (antes del cierre), agregar:
```javascript
// Conectar botón HUD sin inline handler
const hudToggleBtn = document.getElementById('hud-toggle');
if (hudToggleBtn) hudToggleBtn.addEventListener('click', toggleHUD);
```

**Verificación:** `grep -r 'onclick="toggleHUD' --include="*.html" .` → 0 resultados.

---

### TAREA 2.4 — Reemplazar onclick del menú móvil

**Patrón a buscar:**
```
onclick="toggleMobileMenu()"
```

**Contexto:** El botón hamburger (`id="nav-hamburger"`) y el botón cerrar (`.mm-close`) tienen este handler. Los links del menú móvil también lo tienen para cerrar el menú al navegar.

**Plan:**
1. En cada HTML, eliminar `onclick="toggleMobileMenu()"` del botón `id="nav-hamburger"`
2. Eliminar `onclick="toggleMobileMenu()"` del botón `.mm-close`
3. Para los `<a>` del menú móvil: eliminar los `onclick="toggleMobileMenu()"` — usar delegación

**En `js/main.js`**, reemplazar la sección `// ── MOBILE MENU ──` existente con:
```javascript
// ── MOBILE MENU ──
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('nav-hamburger');
  if (!menu || !btn) return;
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

const navHamburger = document.getElementById('nav-hamburger');
if (navHamburger) navHamburger.addEventListener('click', toggleMobileMenu);

const mmClose = document.querySelector('.mm-close');
if (mmClose) mmClose.addEventListener('click', toggleMobileMenu);

// Cierra menú al hacer clic en cualquier link del menú móvil
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenu) {
  mobileMenu.addEventListener('click', function(e) {
    if (e.target === this || e.target.tagName === 'A') toggleMobileMenu();
  });
}
```

**Verificación:** `grep -r 'onclick="toggleMobileMenu' --include="*.html" .` → 0 resultados.

---

### TAREA 2.5 — Reemplazar onclick="dismissToast(event)"

**Patrón a buscar:**
```
onclick="dismissToast(event)"
```

**En cada HTML:** eliminar el atributo `onclick` del div `id="toast"`.

**En `js/gamification.js`**, al final del archivo, agregar:
```javascript
const toastEl = document.getElementById('toast');
if (toastEl) toastEl.addEventListener('click', dismissToast);
```

**Verificación:** `grep -r 'onclick="dismissToast' --include="*.html" .` → 0 resultados.

---

### TAREA 2.6 — Reemplazar onclick de los valores (selectValor)

**Patrón a buscar en index.html:**
```
onclick="selectValor(this,
```

**Análisis:** Las tarjetas de valores tienen `onclick="selectValor(this,'badge-id')"`. La función necesita la tarjeta y el ID del badge.

**Plan:**
1. En `index.html`, reemplazar el atributo `onclick` de cada `.valor-card` por un atributo `data-badge="badge-id"`
2. Ejemplo: `onclick="selectValor(this,'explorer')"` → `data-badge="explorer"`

**En `js/main.js`**, reemplazar la sección `// ── VALORES SELECTION ──` con:
```javascript
// ── VALORES SELECTION ──
let valorCount = 0;
function selectValor(card, badgeId) {
  const wasActive = card.classList.contains('active');
  card.classList.toggle('active');
  if (!wasActive && typeof addXP === 'function') {
    valorCount++;
    if (valorCount === 1) addXP(5, '✦', '¡Explorando valores!', 'Conociste el primer valor +5 XP');
    if (valorCount === 5) { addXP(10, '🌟', '¡Medio camino!', 'Exploraste 5 valores +10 XP'); unlockBadge('knower'); }
    if (valorCount === 10) { addXP(15, '💎', '¡Conoces todos los valores!', '¡Explorador completo! +15 XP'); }
  }
}

// Conectar sin inline handlers
document.querySelectorAll('.valor-card[data-badge]').forEach(card => {
  card.addEventListener('click', () => selectValor(card, card.dataset.badge));
});
```

**Verificación:** `grep -r 'onclick="selectValor' --include="*.html" .` → 0 resultados.

---

### TAREA 2.7 — Reemplazar onclick del formulario de contacto

**Patrón a buscar en contactenos.html:**
```
onclick="submitForm(this)"
```

**Plan:**
1. En `contactenos.html`, al botón de submit: eliminar `onclick="submitForm(this)"`, agregar `id="contact-submit-btn"`
2. En `js/main.js`, agregar al final:
```javascript
const contactSubmitBtn = document.getElementById('contact-submit-btn');
if (contactSubmitBtn) {
  contactSubmitBtn.addEventListener('click', function() { submitForm(this); });
}
```

---

## FASE 3 — MIGRAR JAVASCRIPT LEGACY AL SISTEMA MODULAR
> Objetivo: envolver funciones globales en objetos con nombre.
> NO cambiar la lógica interna — solo el contenedor.
> El sistema App.register() en js/core/app.js ya existe y funciona.

---

### TAREA 3.1 — Convertir gamification.js en módulo Gamification

**Archivo:** `js/gamification.js`

**Patrón de conversión:** Envolver todo en un objeto `const Gamification = { ... }` con `name` e `init`.

**Estructura del módulo resultado:**
```javascript
const Gamification = {
  name: 'Gamification',

  // Estado
  xp: 0,
  earnedBadges: new Set(),
  sectionEarned: new Set(),
  hudMinimized: false,

  // Constantes (sacar magic numbers)
  MAX_XP: 200,
  MOBILE_BREAKPOINT: 600,
  TOAST_DELAY_DESKTOP: 3000,
  TOAST_DELAY_MOBILE: 2000,

  init() {
    this.xp = parseInt(localStorage.getItem('ceevs_xp') || '0');
    this.earnedBadges = new Set(JSON.parse(localStorage.getItem('ceevs_badges') || '[]'));
    this.sectionEarned = new Set(JSON.parse(localStorage.getItem('ceevs_sections') || '[]'));
    this._bindButtons();
    this._observeSections();
    this.updateHUD();
    this._welcomeXP();
    this._autoMinimizeMobile();
  },

  // ... todos los métodos actuales convertidos a this.metodo()

  _bindButtons() {
    const hudToggleBtn = document.getElementById('hud-toggle');
    if (hudToggleBtn) hudToggleBtn.addEventListener('click', () => this.toggleHUD());

    const toastEl = document.getElementById('toast');
    if (toastEl) toastEl.addEventListener('click', (e) => this.dismissToast(e));
  },
};

// Mantener compatibilidad temporal con funciones globales que otros archivos usan:
function addXP(pts, icon, title, desc) { Gamification.addXP(pts, icon, title, desc); }
function unlockBadge(id) { Gamification.unlockBadge(id); }

App.register(Gamification);
```

**Pasos detallados:**
1. Leer `js/gamification.js` completo
2. Crear la estructura del objeto con todos los métodos actuales
3. Cambiar `function addXP(...)` → `addXP(pts, icon, title, desc) { ... }` (dentro del objeto)
4. Reemplazar todas las referencias `xp` por `this.xp`, `earnedBadges` por `this.earnedBadges`, etc.
5. Mover la lógica de init (las llamadas del final) al método `init()`
6. Agregar los stubs de compatibilidad al final (función global que llama al módulo)
7. Agregar `App.register(Gamification)` al final

**Verificación:** Abrir index.html, las secciones deben seguir dando XP al hacer scroll.

---

### TAREA 3.2 — Convertir quiz.js en módulo Quiz

**Archivo:** `js/quiz.js`

**Estructura del módulo resultado:**
```javascript
const Quiz = {
  name: 'Quiz',
  answers: {},
  currentStep: 1,

  init() {
    this._bindButtons();
  },

  _bindButtons() {
    // Conectar todos los botones del quiz usando delegación
    const quizContainer = document.getElementById('quiz-section');
    if (!quizContainer) return;
    quizContainer.addEventListener('click', e => {
      if (e.target.classList.contains('quiz-opt')) this.selectOpt(e.target);
    });
  },

  selectOpt(btn) { /* lógica actual de selectOpt */ },
  goStep(step) { /* lógica actual */ },
  showResult() { /* lógica actual */ },
};

// Compatibilidad temporal
function selectOpt(btn, q, val) { Quiz.selectOpt(btn, q, val); }
function goStep(step) { Quiz.goStep(step); }
function showQuizResult() { Quiz.showResult(); }

App.register(Quiz);
```

**Pasos:**
1. Leer `js/quiz.js` completo
2. Identificar todas las funciones globales (startQuiz, nextQuestion, prevQuestion, etc.)
3. Convertirlas a métodos del objeto Quiz
4. Mover estado a propiedades del objeto (`this.answers`, `this.currentStep`)
5. Agregar stubs de compatibilidad + App.register(Quiz)

---

### TAREA 3.3 — Dividir games.js en archivos separados

**Archivo actual:** `js/games.js` (630 líneas — 3 juegos + devocional)

**Plan:** Separar en 3 archivos, cada uno con su propio módulo.

**Archivos a crear:**
- `js/games-wordsearch.js` → módulo `WordSearch`
- `js/games-memory.js` → módulo `MemoryGame`
- `js/games-trivia.js` → módulo `Trivia`

**En `interactivo.html`:** reemplazar `<script src="js/games.js">` por los 3 scripts.

**Estructura de cada módulo:**
```javascript
const WordSearch = {
  name: 'WordSearch',
  init() {
    // Solo inicializar si el elemento existe en esta página
    if (!document.getElementById('word-search-container')) return;
    this._generate();
    this._bindEvents();
  },
  // ... métodos del juego
};
App.register(WordSearch);
```

**Pasos:**
1. Leer `js/games.js` completo
2. Identificar las secciones de cada juego (buscar comentarios separadores)
3. Crear `js/games-wordsearch.js` con las funciones del juego de palabras
4. Crear `js/games-memory.js` con las funciones del juego de memoria
5. Crear `js/games-trivia.js` con las funciones de trivia y devocional
6. En `interactivo.html`: reemplazar el script único por los 3
7. Mantener `js/games.js` como re-export vacío con un comentario hasta confirmar que funciona, luego eliminar

---

### TAREA 3.4 — Completar js/core/hud.js

**Archivo:** `js/core/hud.js` (89 líneas, incompleto)

**Acción:** Leer el archivo actual y completar el método `update()` con la lógica que actualmente está en `Gamification.updateHUD()` (después de la Tarea 3.1).

El HUD es un componente de UI puro — no debe manejar XP, solo renderizar lo que se le pase.

**Interfaz correcta:**
```javascript
const HUD = {
  name: 'HUD',
  init() {
    // Crear referencias a elementos DOM una sola vez
    this.fill = document.getElementById('hud-fill');
    this.score = document.getElementById('hud-score');
    this.scoreMin = document.getElementById('hud-score-min');
    this.ptsLabel = document.getElementById('hud-pts-label');
    this.ptsMax = document.getElementById('hud-pts-max');
    this.mainContent = document.getElementById('hud-main-content');
    this.minContent = document.getElementById('hud-min-content');
    this.toggleBtn = document.getElementById('hud-toggle');
    if (this.toggleBtn) this.toggleBtn.addEventListener('click', () => this.toggle());
  },
  update(xp, maxXP, earnedBadges) { /* renderizar */ },
  toggle() { /* minimizar/expandir */ },
};
```

---

### TAREA 3.5 — Refactorizar gallery.js separando responsabilidades

**Archivo:** `js/gallery.js` (556 líneas — UI + API Facebook + config panel mezclados)

**Plan:** Separar en 2 archivos.

**`js/gallery.js`** — Solo UI: grid, lightbox, lazy loading
**`js/gallery-fb.js`** — Solo integración Facebook: fetch API, config panel, token management

**Estructura:**
```javascript
// gallery.js
const Gallery = {
  name: 'Gallery',
  init() {
    if (!document.getElementById('galeria')) return;
    this._initGrid();
    this._initLightbox();
    this._initLazyLoad();
  },
};
App.register(Gallery);

// gallery-fb.js
const GalleryFB = {
  name: 'GalleryFB',
  TOKEN_KEY: 'ceevs_fb_token',
  init() {
    if (!document.getElementById('galeria')) return;
    this._initConfigPanel();
    this._loadPhotos();
  },
};
App.register(GalleryFB);
```

---

### TAREA 3.6 — Centralizar constantes mágicas en archivo de config

**Por qué:** `200`, `600`, `0.3`, `0.12`, `80` están hardcodeados en múltiples archivos.

**Crear:** `js/config.js`

```javascript
const CONFIG = {
  XP_MAX: 200,
  MOBILE_BREAKPOINT: 600,
  PARALLAX_SPEED: 0.3,
  CURSOR_RING_EASING: 0.12,
  STAGGER_DELAY_MS: 80,
  NAVBAR_SCROLL_THRESHOLD: 60,
  TOAST_DELAY_DESKTOP: 3000,
  TOAST_DELAY_MOBILE: 2000,
  WELCOME_XP_DELAY: 2000,
  HUD_MINIMIZE_DELAY: 3500,
};
```

**Agregar el script en todos los HTML antes de los demás JS:**
```html
<script src="js/config.js"></script>
```

**Luego buscar en cada archivo las constantes y reemplazar por `CONFIG.NOMBRE`.**

---

## FASE 4 — BUILD Y AUTOMATIZACIÓN

---

### TAREA 4.1 — Completar generate-pages.py

**Archivo:** `generate-pages.py` (existe pero no ejecuta nada)

**Objetivo:** Script que use los archivos de `components/` para insertar navbar, footer, HUD en cada HTML automáticamente.

**Lógica del script:**
```python
import os, re

COMPONENTS = {
  '<!-- INJECT:head -->': 'components/head.html',
  '<!-- INJECT:navbar -->': 'components/navbar.html',
  '<!-- INJECT:footer -->': 'components/footer.html',
  '<!-- INJECT:hud -->': 'components/gamification-hud.html',
  '<!-- INJECT:toast -->': 'components/toast.html',
  '<!-- INJECT:cursor -->': 'components/custom-cursor.html',
}

HTML_FILES = ['index.html', 'admisiones.html', 'quienes-somos.html',
              'contactenos.html', 'interactivo.html', 'recuerdos.html']

for html_file in HTML_FILES:
  with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()
  for marker, component_path in COMPONENTS.items():
    if marker in content and os.path.exists(component_path):
      with open(component_path, 'r', encoding='utf-8') as cf:
        component_content = cf.read()
      content = content.replace(marker, component_content)
  with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)
  print(f'✓ {html_file} actualizado')
```

**Nota:** Para que esto funcione, primero hay que agregar los marcadores `<!-- INJECT:navbar -->` en los HTML donde actualmente está el HTML del navbar copiado.

---

### TAREA 4.2 — Script de minificación simple (sin build tools)

**Objetivo:** Reducir tamaño 20-35% sin instalar webpack/node.

**Crear:** `minify.py`

```python
import os, re

def minify_css(content):
  content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
  content = re.sub(r'\s+', ' ', content)
  content = re.sub(r'\s*([{};:,>~+])\s*', r'\1', content)
  return content.strip()

def minify_js(content):
  content = re.sub(r'//.*?\n', '\n', content)
  content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
  content = re.sub(r'\n\s*\n', '\n', content)
  return content.strip()

os.makedirs('dist', exist_ok=True)

# Minificar CSS (copiar main.css y todos sus imports como uno)
# Minificar JS (concatenar en orden correcto)
```

**Orden correcto de concatenación JS:**
```
1. js/config.js
2. js/core/app.js
3. js/core/dom.js
4. js/core/storage.js
5. js/gamification.js
6. js/main.js
7. js/quiz.js
8. js/gallery.js
9. js/games-wordsearch.js
10. js/games-memory.js
11. js/games-trivia.js
```

---

### TAREA 4.3 — Agregar linting básico con .editorconfig

**Crear:** `.editorconfig` en la raíz

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true

[*.html]
indent_size = 2

[*.css]
indent_size = 2

[*.js]
indent_size = 2

[*.py]
indent_size = 4
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

| Prioridad | Tarea | Tiempo estimado | Riesgo |
|-----------|-------|-----------------|--------|
| 1 | 1.1 Eliminar styles.css | 2 min | Ninguno |
| 2 | 1.2 Eliminar .backup | 1 min | Ninguno |
| 3 | 2.3 onclick HUD toggle | 10 min | Bajo |
| 4 | 2.4 onclick menú móvil | 15 min | Bajo |
| 5 | 2.5 onclick dismissToast | 5 min | Bajo |
| 6 | 2.1 inline img avatar | 20 min | Bajo |
| 7 | 2.2 inline quiz button | 10 min | Bajo |
| 8 | 3.6 CONFIG constants | 15 min | Bajo |
| 9 | 3.4 Completar hud.js | 20 min | Medio |
| 10 | 3.1 Módulo Gamification | 45 min | Medio |
| 11 | 3.2 Módulo Quiz | 30 min | Medio |
| 12 | 3.3 Dividir games.js | 40 min | Medio |
| 13 | 3.5 Separar gallery.js | 30 min | Medio |
| 14 | 4.1 generate-pages.py | 45 min | Bajo |
| 15 | 4.2 minify.py | 30 min | Bajo |
| 16 | 1.3 README.md | 15 min | Ninguno |
| 17 | 4.3 .editorconfig | 5 min | Ninguno |

---

## REGLAS PARA EL MODELO AL EJECUTAR CADA TAREA

1. **Leer antes de editar** — siempre usar Read antes de Edit en el archivo objetivo
2. **Una tarea a la vez** — no combinar tareas de diferentes fases en una sesión
3. **Verificar después** — ejecutar el grep de verificación indicado en cada tarea
4. **No cambiar lógica** — en Fase 3 solo cambiar el contenedor, no el algoritmo interno
5. **Stubs de compatibilidad** — al convertir a módulo, mantener las funciones globales como stubs hasta confirmar que funciona, luego eliminarlos en una segunda sesión
6. **Páginas a revisar tras cada cambio:** index.html en el navegador es suficiente para Fases 1-2; interactivo.html para Fase 3 (juegos)
