# FASE 5 — Implementación: Contenido, galería, actividades y misión

**Proyecto:** Sitio web CEEVS
**Rama:** `feature/fase-1-nav-identidad` (continuación)
**Fecha:** 2026-05-20
**Estado:** COMPLETADO — Validación: PASS

---

## Contratos SDD implementados

| Contrato | Descripción | Estado |
|----------|-------------|--------|
| SDD-F5-HOME-001 | Misión evangelística visible en inicio | ✅ |
| SDD-F5-MISION-001 | Página completa de misión evangelística | ✅ (ya creada en Fase 1) |
| SDD-F5-GAL-001 | Galería institucional | ✅ (ya cumplía el contrato) |
| SDD-F5-NEWS-001 | Comunicados y noticias | ✅ NUEVO |
| SDD-F5-CALENDAR-001 | Calendario escolar | ✅ NUEVO |
| SDD-F5-ACT-001 | Actividades y juegos | ✅ (ya cumplía el contrato) |
| SDD-F5-ACT-002 | Sopa de letras configurable | ✅ |
| SDD-F5-CAP-001 | Capacítate con nosotros | ✅ NUEVO |

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `comunicados.html` | Página de comunicados, noticias y calendario escolar |
| `capacitate.html` | Página de capacitación y formación continua |
| `data/word-search.json` | Palabras de la sopa de letras (fuente de verdad) |
| `data/content-comunicados.json` | Contrato de contenido de comunicados y calendario |
| `css/4-sections/home-mision.css` | Banda de misión evangelística en inicio |
| `css/4-sections/comunicados.css` | Estilos de comunicados y calendario |
| `css/4-sections/capacitate.css` | Estilos de la página de capacitación |
| `docs/sdd/FASE_5_CONTENIDO_GALERIA_ACTIVIDADES_MISION.md` | Este documento |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `index.html` | Nueva banda de misión evangelística tras el hero (antes de Historia) con CTA a `mision-evangelistica.html` |
| `js/games.js` | Sopa de letras carga las palabras desde `data/word-search.json` (con listado por defecto de respaldo); contador de palabras dinámico |
| `css/main.css` | Imports de `home-mision.css`, `comunicados.css`, `capacitate.css` |
| `generate-pages.py` | Validaciones Fase 5 + páginas y data files nuevos |

---

## SDD-F5-HOME-001 — Misión evangelística en inicio

Se añadió una banda `.home-mision` justo después del hero de `index.html`
(antes de las secciones largas), con texto institucional, un versículo destacado
y CTA a `mision-evangelistica.html`. Texto marcado `PENDING_CONTENT_MISION_EVANGELISTICA`.

## SDD-F5-MISION-001 — Página de misión evangelística

`mision-evangelistica.html` (creada en Fase 1) ya contiene las secciones requeridas:
propósito evangelístico, versículo/devocional, recursos/artículos, video y CTA a
admisiones/contacto, con metadatos SEO y placeholders `PENDING_CONTENT_*`. Contrato
cumplido sin cambios adicionales.

## SDD-F5-GAL-001 — Galería

La galería de `index.html` ya cumple el contrato: carrusel + filmstrip con
`loading="lazy"` y `alt` en las imágenes, `onerror` con imágenes de respaldo,
filtros por categoría (Académico, Deportes, Cultural, Graduaciones) y enlace a
Facebook oficial. No requería cambios; se verificó.

## SDD-F5-ACT-001 — Actividades

`interactivo.html` ya presenta los juegos categorizados por audiencia
(Padres / Alumnos / Docentes / Todos vía `data-audiences`), cada uno con título,
audiencia, instrucciones y botón. Contenido vigente (trivia bíblica, sopa de letras
de valores, memoria cristiana, versículo). Contrato cumplido; se verificó.

## SDD-F5-ACT-002 — Sopa de letras configurable

Se creó `data/word-search.json` con el listado de palabras (valores y conceptos de
la fe cristiana) y un `status`. `js/games.js` ahora carga las palabras desde ese
archivo (`_loadWordSearch`), con el listado embebido como respaldo si la carga
falla. El contador de palabras es dinámico según el listado cargado.

## SDD-F5-NEWS-001 / CALENDAR-001 — Comunicados y calendario

Nueva página `comunicados.html` con sección de comunicados (tarjetas placeholder
con estructura título/fecha/categoría/resumen/actualización, marcadas
`PENDING_CONTENT_COMUNICADOS`) y sección de calendario escolar
(`PENDING_CONTENT_CALENDARIO`, sin fechas inventadas). `data/content-comunicados.json`
documenta el esquema de datos para un futuro CMS.

## SDD-F5-CAP-001 — Capacítate con nosotros

Nueva página `capacitate.html` con hero, descripción, programas disponibles
(placeholders `PENDING_CONTENT_CAPACITATE`, sin inventar programas) y CTA de contacto.

---

## Decisiones técnicas

1. **Sopa de letras:** las palabras (con sus posiciones) se externalizan a
   `data/word-search.json`; el juego conserva un listado de respaldo embebido para
   seguir funcionando si el `fetch` falla (p. ej. apertura por `file://`).
2. **Comunicados/calendario:** sin contenido oficial, las páginas muestran la
   estructura con placeholders marcados; no se inventaron noticias ni fechas.
3. **Galería y actividades:** se verificó que ya cumplían sus contratos; no se
   modificaron para no introducir riesgo en componentes complejos que ya funcionan.

---

## Pendientes (fuera del alcance de Fase 5)

| Pendiente | Responsable |
|-----------|-------------|
| Enlazar `comunicados.html` y `capacitate.html` en navbar/footers | Fase 6 / aprobación institucional |
| Contenido oficial de comunicados, calendario y programas de capacitación | Confirmación institucional |
| Fotos institucionales reales en la galería (hoy usa imágenes de Facebook/stock) | Confirmación institucional |

---

## Validación

```
python generate-pages.py
CEEVS — Validador de páginas (Fases 1 a 5)
=======================================================
OK Todas las paginas pasaron la validacion (Fases 1 a 5).
```

---

## Fase siguiente

```
FASE 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue.
```
