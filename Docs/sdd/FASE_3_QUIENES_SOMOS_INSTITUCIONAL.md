# FASE 3 — Implementación: Quiénes somos institucional

**Proyecto:** Sitio web CEEVS
**Rama:** `feature/fase-1-nav-identidad` (continuación)
**Fecha:** 2026-05-20
**Estado:** COMPLETADO — Validación: PASS

---

## Contratos SDD implementados

| Contrato | Descripción | Estado |
|----------|-------------|--------|
| SDD-F3-QS-001 | Estructura con navegación interna por secciones | ✅ |
| SDD-F3-QS-002 | Misión y visión (anclas dedicadas) | ✅ |
| SDD-F3-QS-003 | Valores fundamentales (cards interactivas) | ✅ (ya existía) |
| SDD-F3-QS-004 | Declaración de fe (cards) | ✅ (ya existía) |
| SDD-F3-QS-005 | Acreditación ACSI | ✅ NUEVO |
| SDD-F3-QS-006 | Perfil del egresado | ✅ (ya existía) |
| SDD-F3-QS-007 | LAES | ✅ NUEVO |
| SDD-F3-QS-008 | Equipo directivo | ✅ NUEVO |
| SDD-F3-QS-009 | Junta directiva | ✅ NUEVO |

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `css/4-sections/quienes-somos.css` | Navegación interna (pills), ACSI, LAES, equipo, junta, acordeones |
| `js/quienes-somos.js` | Scroll-spy de la navegación interna + acordeones accesibles |
| `docs/sdd/FASE_3_QUIENES_SOMOS_INSTITUCIONAL.md` | Este documento |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `quienes-somos.html` | Navegación interna (11 pills); anclas `#mision` y `#vision`; secciones nuevas ACSI, LAES, Equipo directivo y Junta directiva; carga de `js/quienes-somos.js` |
| `css/main.css` | Import de `4-sections/quienes-somos.css` |
| `generate-pages.py` | Validaciones Fase 3 (qs-nav, secciones requeridas, script) |

---

## SDD-F3-QS-001 — Navegación interna

Se añadió una barra de navegación interna tipo *pills*, **sticky** bajo el navbar
y con desplazamiento horizontal en móvil. Enlaza por ancla a las 11 secciones:

`#historia · #mision · #vision · #filosofia · #declaracion-fe · #acsi ·
#valores · #perfil-egresado · #laes · #equipo-directivo · #junta-directiva`

`js/quienes-somos.js` resalta automáticamente (scroll-spy con IntersectionObserver)
la sección visible. Las secciones tienen `scroll-margin-top` para no quedar ocultas
bajo el navbar + pills.

---

## SDD-F3-QS-005 — Acreditación ACSI

Sección nueva con el texto base permitido por el SDD. Menciona: Association of
Christian Schools International, educación cristiana de excelencia, estándares
internacionales, formación espiritual y mejora continua. Incluye un acordeón
ampliable (`PENDING_CONTENT_ACSI_AMPLIADO`). No se incluye logo externo de ACSI
(requiere autorización institucional).

---

## SDD-F3-QS-008 — Equipo directivo

7 tarjetas tipo acordeón, cada una con avatar de iniciales (placeholder, sin fotos
no autorizadas), nombre, cargo y panel expandible accesible (teclado + `aria-expanded`):

- Sara Corrales — Directora Ejecutiva
- Dessiré Hulse — Directora de Secundaria
- Ana Ávila — Directora de Primaria
- Diana Vásquez — Administradora General
- Nadia Irula — Coordinadora de Talento Humano
- Martha López — Coordinadora de Pastoral
- Rosa Armijo — Especialista de Español

Las reseñas profesionales quedan como `PENDING_CONTENT_EQUIPO_*` (no se inventan).

---

## Contenido marcado como pendiente

- `PENDING_CONTENT_ACSI_AMPLIADO` — detalle ampliado de la acreditación
- `PENDING_CONTENT_LAES` — descripción oficial del programa LAES
- `PENDING_CONTENT_EQUIPO_*` (×7) — reseñas del equipo directivo
- `PENDING_CONTENT_JUNTA_DIRECTIVA` — nombres y cargos de la junta directiva

---

## Validación

```
python generate-pages.py
CEEVS — Validador de páginas (Fases 1, 2 y 3)
=======================================================
OK Todas las paginas pasaron la validacion (Fases 1, 2 y 3).
```

---

## Decisiones técnicas

1. **Pills + anclas en vez de tabs JS:** se eligió navegación por anclas con
   scroll-spy en lugar de tabs que ocultan contenido. Todo el contenido queda
   accesible, indexable por SEO y funcional sin JavaScript. Es el patrón
   recomendado por el SDD para móvil ("tabs scrollables").
2. **Secciones existentes conservadas:** Historia, Misión/Visión, Filosofía,
   Declaración de fe, Valores y Perfil del egresado ya cumplían los contratos
   (cards, contenido legible). Solo se les añadieron anclas.
3. **Perfil del egresado:** se mantiene la estructura actual de 6 rasgos. La
   reagrupación en las 4 categorías sugeridas (Conocimientos, Actitudes,
   Habilidades, Logros) queda como refinamiento futuro para no remapear contenido
   institucional sin confirmación.

---

## Pendientes (fuera del alcance de Fase 3)

| Pendiente | Fase responsable |
|-----------|------------------|
| Enlaces `href="#"` y `virginiasapp.edubox.app/` en el footer | Fases 4 y 5 |
| Reseñas oficiales del equipo directivo y junta directiva | Confirmación institucional |
| Reagrupación del perfil del egresado en 4 categorías | Refinamiento futuro |

---

## Fases siguientes

```
FASE 4 — Contacto, empleos y sugerencias sin formularios falsos.
FASE 5 — Galería, comunicados, actividades, misión evangelística.
FASE 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue.
```
