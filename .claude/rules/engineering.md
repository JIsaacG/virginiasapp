# Reglas de ingeniería — CEEVS

Reglas compartidas por todos los agentes y por la sesión principal. Se cargan en cada
sesión junto a `CLAUDE.md`. A diferencia de `CLAUDE.md` — que está en `.gitignore` y por
tanto es local —, este archivo **sí se versiona**, así que es la fuente de verdad
compartida del equipo.

---

## REGLA CERO — pregunta antes de encender el pipeline

**El pipeline completo NO es el modo por defecto.** Por defecto se hace el trabajo y se
ejecuta el gate mínimo. Nada más.

Antes de invocar más de un agente de revisión, o de ejecutar `verify:medium` / `verify:high`,
**pregúntale al usuario** con qué profundidad quiere trabajar. Una sola pregunta, con estas
opciones:

| Opción | Qué se ejecuta | Cuánto tarda |
|---|---|---|
| **Rápido** (por defecto) | El cambio + `npm run verify:low` | segundos |
| **Normal** | + Web Quality + Adversarial Reviewer + Quality Gate | minutos |
| **Completo** | Los 7 agentes + Lighthouse + Security Reviewer | varios minutos |

Excepciones en las que **no** hace falta preguntar:

- El usuario ya dijo el nivel ("hazlo rápido", "revísalo a fondo", "pipeline completo").
- El cambio toca `api/`, autenticación, formularios, base de datos, solicitudes de
  admisión o `.htaccess`: ahí se asume **Completo** y se avisa, no se pregunta. Son datos
  de familias reales.
- Es una pregunta, no un cambio: no se ejecuta ningún gate.

Corregir un texto, un color o un enlace **no** justifica siete agentes. Si el usuario pide
algo simple, hazlo, ejecuta `verify:low` y entrega. El sistema es proporcional al riesgo o
no sirve: un gate que estorba en lo trivial se acaba desactivando en lo importante.

---

## PRIME DIRECTIVE

**No optimizamos para producir código rápidamente. Optimizamos para producir cambios verificables.**

Un cambio que parece correcto y no se ha comprobado vale menos que un cambio pequeño con
evidencia de que funciona. Eso no significa aplicar el máximo rigor a todo: significa que
el rigor aplicado se declare y que nada se dé por bueno sin comprobarlo.

---

## Las cinco reglas

1. **Ningún agente puede aprobar su propia implementación.** Quien escribe el código no
   decide si el código está bien. La aprobación viene del Adversarial Reviewer y del
   Quality Gate.

2. **Ninguna tarea está DONE sin evidencia suficiente.** Si falta evidencia, el estado es
   `UNVERIFIED` o `PARTIALLY VERIFIED`. Nunca `DONE`.

3. **Nunca debilitar un test o un quality gate solo para que un cambio pase.** Bajar un
   umbral de Lighthouse, borrar una regla de `generate-pages.py`, relajar `seo-check.mjs`
   o cambiar la expectativa de un test para conseguir verde es un BLOCKER automático. Si
   el check es de verdad incorrecto, párate y dilo; no lo edites de paso.

4. **Prefiere el cambio correcto más pequeño.** Sin refactors no pedidos, sin renombrados
   masivos, sin dependencias nuevas que no estén justificadas en el plan.

5. **Preserva el comportamiento existente salvo que el requisito lo cambie explícitamente.**
   Este sitio está en producción y lo usan familias reales para solicitar admisión.

---

## Evidencia, no opinión

Estas frases están prohibidas como evidencia:

> "looks good" · "should work" · "seems correct" · "probably works" · "the implementation appears solid"

Son opiniones. Conviértelas en verificaciones:

| En vez de | Escribe |
|---|---|
| "The page should render correctly." | "Smoke test ejecutado: PASS." |
| "SEO looks correct." | "`npm run seo:check`: PASS (12 páginas)." |
| "Performance should be good." | "Lighthouse ejecutado: resultados documentados." |
| "No rompe nada." | "`npm run verify:medium`: PASS." |

## Regla de honestidad

**Nunca afirmes que ejecutaste un test, un build, un audit, un scanner, un validador,
Lighthouse o cualquier comando si no lo ejecutaste.** Distingue siempre entre:

- **VERIFIED** — ejecutado, con salida real.
- **RECOMMENDED BUT NOT EXECUTED** — hace falta, no se pudo ejecutar aquí (di por qué).
- **NOT AVAILABLE** — la herramienta no existe en este entorno.
- **NOT APPLICABLE** — no aplica a este cambio (di por qué).

---

## Clasificación de riesgo — el sistema es proporcional

No conviertas un cambio de una palabra en una operación de treinta minutos.

### LOW RISK
Corrección de texto, copy, un color, un `alt`, un enlace.

**Pipeline:** Implementer → `npm run verify:low` → Adversarial Reviewer (rápido).
Sin Planner formal, sin Lighthouse, sin Quality Gate completo.

### MEDIUM RISK
Layout, navegación, CSS compartido, JavaScript de interfaz, contenido nuevo con i18n.

**Pipeline:** Planner → Implementer → Test Engineer → Web Quality → Adversarial Reviewer →
Quality Gate. `npm run verify:medium`.

### HIGH RISK
Formularios, autenticación, `api/`, base de datos, solicitudes de admisión, panel admin,
claves `ceevs_*`, i18n masivo, `.htaccess`, seguridad.

**Pipeline completo**, incluido Security Reviewer y Lighthouse. `npm run verify:high`.
Prueba de regresión obligatoria si es un bug.

Ante la duda entre dos niveles, sube al mayor.

---

## Orquestación

```
USER REQUEST
   ↓
PLANNER              (criterios de aceptación Given/When/Then)
   ↓
IMPLEMENTER          (cambio mínimo; NO aprueba su trabajo)
   ↓
TEST ENGINEER        (intenta demostrar que está mal)
   ↓
WEB QUALITY          (SEO, Lighthouse, accesibilidad, HTML, enlaces)
   ↓
SECURITY REVIEWER    (secretos, XSS, PHP, dependencias)
   ↓
ADVERSARIAL REVIEWER (revisa el DIFF, no los informes)
   ↓
QUALITY GATE         (árbitro final)
   ↓
PASS / CONDITIONAL PASS / FAIL
```

Cuando aparece un problema:

```
REVIEWER → IMPLEMENTER → TESTS → REVIEWER → QUALITY GATE
```

Nunca:

```
IMPLEMENTER → IMPLEMENTER DICE DONE → MERGE
```

---

## Verificación disponible en este repositorio

```bash
npm run verify:low      # secretos, sintaxis JS/PHP, validador, SEO
npm run verify:medium   # + auditoría de dependencias
npm run verify:high     # + Lighthouse CI

npm run check:js        # node --check sobre todo js/ y scripts/ (sin vendor ni dist)
npm run check:php       # php -l sobre api/ — NOT AVAILABLE si PHP no está en PATH
npm run check:secrets   # archivos sensibles versionados + patrones de credenciales
npm run seo:check       # metadatos, sitemap, robots, JSON-LD, enlaces internos rotos
npm run seo:lighthouse  # Lighthouse CI (requiere Chrome)
npm run seo:production  # comprobación del sitio ya publicado
python generate-pages.py
npm audit --omit=dev    # solo lo que llega a producción
```

**Estado del tooling, para no inventar comandos:**

- No hay runner de tests (`npm test` no existe). No lo cites como si existiera.
- No hay linter (ESLint/Prettier) ni validador W3C ni axe. La accesibilidad automatizada
  disponible es la categoría de Lighthouse.
- Mutation testing: **NOT APPLICABLE** mientras el repositorio siga siendo mayoritariamente
  contenido y presentación sin suite de tests.
- Build: **NOT APPLICABLE** salvo que el cambio toque `dist/` o `minify.py`.
- Las 8 vulnerabilidades de `npm audit` viven en la cadena de `@lhci/cli` (devDependencies).
  `npm audit --omit=dev` da 0. No se sirve nada de eso al público.

---

## Convenciones del proyecto que los agentes deben respetar

- Sin `style="..."` ni `onclick="..."` en HTML: `generate-pages.py` los rechaza.
- Colores, espaciado y tipografía desde `css/1-base/tokens.css`.
- `DOM.*` y `Storage.*` (`js/core/`) en vez de `document.querySelector` y `localStorage`.
- Texto visible nuevo ⇒ entrada ES→EN en `js/i18n-data.js`.
- Clave `ceevs_*` nueva ⇒ 4 listas: `admin.js`, `admin-sync.js`, `image-manager.js`,
  `api/bootstrap.php`.
- `data/` = contenido público versionado. `server-data/` y `uploads/` = estado del servidor,
  nunca versionados. No confundirlos.
- **No desactivar animaciones con `prefers-reduced-motion`**: el dueño del sitio navega con
  movimiento reducido activado y dejaría de verlas.
- No hacer commit, push ni abrir PR salvo petición explícita del usuario.
