# PLAN SDD — Corrección del conmutador de idioma ES/EN

**Proyecto:** Sitio web CEEVS
**Fecha:** 2026-05-22
**Motivo:** El conmutador de idioma no funciona en Chrome.
**Estado:** ✅ EJECUTADO (2026-05-22) — FIX-001 a 004 aplicados; validación PASS

---

## 1. Diagnóstico (causa raíz)

El motor `js/i18n.js` carga el diccionario de traducción con:

```js
fetch('data/i18n.json')
```

Cuando el sitio se abre **directamente con `file://`** (doble clic en el HTML,
sin servidor web), Chrome **bloquea por seguridad el `fetch` de archivos
locales**. La promesa se rechaza, el diccionario queda vacío y, al pulsar **EN**,
no ocurre nada: los botones aparecen pero no traducen.

> En `http://` (vía XAMPP) el `fetch` sí funcionaría, pero el sitio debe
> funcionar también abierto localmente. La solución debe ser válida en **ambos**
> contextos.

**Causa secundaria detectada:** auditoría de cobertura — 3 fragmentos de oración
(colas de textos partidos por `<strong>`) no están en el diccionario. El resto
(645 entradas) cubre el 99 % de las cadenas.

**Limitación detectada:** el motor recolecta los nodos de texto **solo al
cargar**. El contenido generado por JavaScript después (resultado del quiz,
contenido de juegos) no se traduce.

---

## 2. Contratos SDD de corrección

Ejecución en orden: FIX-001 → FIX-002 → FIX-003 → FIX-004.

---

### SDD-I18N-FIX-001 — Diccionario embebido sin `fetch`

**Tipo:** Bug / compatibilidad (prioridad crítica)

**Input:** El usuario abre cualquier página (en `file://` o `http://`) y pulsa EN.

**Process:** El motor lee el diccionario desde una variable global ya disponible
en la página, sin peticiones de red.

**Output:** Los textos cambian a inglés de forma inmediata y fiable.

**Reglas:**
1. Convertir `data/i18n.json` en `js/i18n-data.js` con el contenido:
   `window.CEEVS_I18N = { "en": { ... } };`
2. Cargar `<script src="js/i18n-data.js"></script>` antes de `js/i18n.js` en
   las 11 páginas públicas.
3. `js/i18n.js` lee `window.CEEVS_I18N` de forma síncrona; se elimina `fetch` y
   `_loadAndApply`.
4. `data/i18n.json` se elimina (fuente única: `js/i18n-data.js`).

**Acceptance Criteria:**
- El conmutador traduce el sitio abriéndolo con `file://` y con `http://`.
- Sin errores en la consola de Chrome.
- La preferencia de idioma persiste al navegar entre páginas.

---

### SDD-I18N-FIX-002 — Cobertura completa de traducciones

**Tipo:** Contenido / completitud

**Process:** Se añaden al diccionario los fragmentos faltantes.

**Reglas:** Agregar las 3 entradas (colas de oración partidas por `<strong>`):
- `, con el apoyo de la Misión Evangélica Mundial y padres de familia.`
- `, con el propósito de brindar a la sociedad hondureña una alternativa diferente de educación Cristocéntrica con excelencia, fundamentada bajo principios y valores cristianos que transforman vidas y comunidades.`
- `, nuestra institución reafirma su compromiso con una educación cristiana de excelencia, basada en estándares internacionales de calidad académica, formación espiritual y mejora continua.`

**Acceptance Criteria:**
- La auditoría de cobertura no reporta cadenas relevantes sin traducir.
- Las páginas Inicio y Quiénes somos se ven completas en inglés.

---

### SDD-I18N-FIX-003 — Traducción del contenido dinámico

**Tipo:** Funcional / robustez

**Input:** Con el idioma en EN, el usuario interactúa con elementos que generan
contenido nuevo (resultado del quiz, etc.).

**Process:** El motor observa cambios en el DOM y traduce los nodos nuevos.

**Reglas:**
1. Añadir un `MutationObserver` en `js/i18n.js` que, cuando el idioma activo sea
   EN, traduzca los nodos de texto recién insertados.
2. Exponer `I18n.refresh()` para reaplicar manualmente si se requiere.
3. Incluir en el diccionario las cadenas del **resultado del quiz** (`js/quiz.js`).

**Acceptance Criteria:**
- Con EN activo, el resultado del quiz se muestra en inglés.
- No se rompe la gamificación ni el quiz.

**Nota / fuera de alcance inmediato:** el banco de preguntas de la trivia y otros
textos largos embebidos en `js/games.js` quedan como punto menor posterior
(`SDD-I18N-FIX-005`), por volumen.

---

### SDD-I18N-FIX-004 — Validación

**Tipo:** Aseguramiento

**Reglas:**
1. Extender `generate-pages.py`: verificar que cada página carga
   `js/i18n-data.js` y `js/i18n.js`; quitar `data/i18n.json` de archivos
   requeridos.
2. Ejecutar una verificación de cobertura del diccionario.
3. Revisión manual: abrir el sitio con `file://` en Chrome y comprobar ES↔EN.

**Acceptance Criteria:**
- `python generate-pages.py` pasa.
- Cobertura de traducción verificada.

---

## 3. Archivos afectados

| Archivo | Acción |
|---------|--------|
| `js/i18n-data.js` | **Nuevo** — diccionario embebido |
| `data/i18n.json` | Eliminado (reemplazado por `js/i18n-data.js`) |
| `js/i18n.js` | Modificado — sin `fetch`; lee variable global; `MutationObserver` |
| 11 páginas HTML | Modificado — cargar `js/i18n-data.js` |
| `generate-pages.py` | Modificado — validaciones i18n actualizadas |
| `docs/sdd/I18N_BILINGUE.md`, `docs/CONTENT_GUIDE.md` | Modificado — nueva ubicación del diccionario |

---

## 4. Resultado esperado

Tras ejecutar el plan: el conmutador **ES/EN funciona al abrir el sitio de
cualquier forma** (archivo local o servidor), traduce todo el contenido estático
y el contenido dinámico cuyas cadenas estén en el diccionario, y la validación
automática pasa.
