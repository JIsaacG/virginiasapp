# FASE 2 — Implementación: Admisiones, EDUBOX, WhatsApp y Quiz automático

**Proyecto:** Sitio web CEEVS
**Rama:** `feature/fase-1-nav-identidad` (continuación)
**Fecha:** 2026-05-20
**Estado:** COMPLETADO — Validación: PASS

---

## Contratos SDD implementados

| Contrato | Descripción | Estado |
|----------|-------------|--------|
| SDD-F2-ADM-001 | URL única oficial de EDUBOX en CTAs | ✅ |
| SDD-F2-ADM-002 | Mapa único de redirecciones (`data/redirects.json`) | ✅ |
| SDD-F2-ADM-003 | Niveles educativos con CTA no vacío | ✅ |
| SDD-F2-ADM-004 | Quiz automático sin botón "Continuar" | ✅ |
| SDD-F2-ADM-005 | Resultado del quiz con CTAs concretos | ✅ |
| SDD-F2-ADM-006 | Proceso de admisión centrado y jerárquico | ✅ |

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `data/redirects.json` | Fuente de verdad de EDUBOX, WhatsApp, jobs y sugerencias |
| `docs/sdd/FASE_2_ADMISIONES_EDUBOX_WHATSAPP.md` | Este documento |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `admisiones.html` | CTAs normalizados a EDUBOX; quiz sin botones "Continuar"/"Ver resultado"; formulario simulado de captura eliminado; proceso con encabezado "El proceso en 4 pasos"; paso 4 → "Matrícula en línea / EDUBOX" |
| `js/quiz.js` | Reescrito: auto-avance al seleccionar opción (350 ms); resultado automático tras la pregunta 4; CTAs concretos por nivel; eliminada la captura de leads en `localStorage` |
| `css/4-sections/valores.css` | `.quiz-nav` solo con "Atrás"; `.quiz-result-action-hint`; estilos de CTAs dinámicos |
| `css/4-sections/quiz.css` | `.proceso-intro` (encabezado del proceso); `.steps-row` centrado |
| `css/2-components/utils.css` | Eliminado CSS muerto del formulario de captura (`.btn-quiz-lead`, `.quiz-lead-input`) |
| `index.html` + 6 páginas | Número WhatsApp placeholder `50422000000` → WhatsApp general real `+504 9221-5752` |
| `generate-pages.py` | Validaciones Fase 2: `redirects.json`, placeholder WhatsApp, URL EDUBOX alternativa, enlaces WhatsApp seguros, quiz sin "Continuar"/formulario falso |

---

## SDD-F2-ADM-001 — Normalización de CTAs a EDUBOX

URL oficial única: `https://portal.edubox.app/login/virginiasapp` (siempre con `target="_blank"` y `rel="noopener"`).

CTAs corregidos en `admisiones.html`:

| Ubicación | Antes | Después |
|-----------|-------|---------|
| Niveles (3 cards) | `#admisiones` "Ver admisiones" | EDUBOX "Solicitar admisión" |
| Proceso — "Empezar el proceso" | `#contacto` | EDUBOX |
| CTA block — "Solicitar admisión ahora" | `#contacto` | EDUBOX |
| CTA block — botón secundario | `virginiasapp.edubox.app/core_sc/...` | WhatsApp general "Consultar por WhatsApp" |
| Portal — "Ir a matrícula" | `virginiasapp.edubox.app/core_sc/...` | EDUBOX oficial |
| Portal — "Solicitar admisión" | `#contacto` | EDUBOX |

La URL alternativa `virginiasapp.edubox.app/core_sc/control_matricula_login/` quedó eliminada del sitio (no estaba documentada en `redirects.json`).

---

## SDD-F2-ADM-004 — Quiz automático

- Eliminados los botones "Continuar →" de los pasos 1, 2 y 3 (`quiz-btn-next`).
- Eliminado el botón "Ver mi resultado 🎯" del paso 4 (`data-show-result`).
- Al seleccionar una opción: se marca, se guarda y tras 350 ms avanza solo.
- En la pregunta 4, al seleccionar se muestra el resultado automáticamente.
- Se conserva el botón "← Atrás" en los pasos 2–4 y "Repetir quiz" en el resultado.
- Funciona con mouse y teclado (las opciones son `<button>`).

---

## SDD-F2-ADM-005 — Resultado con CTAs concretos

El formulario simulado de captura de leads (`#quiz-lead-form`, que guardaba datos en
`localStorage` mostrando "Nuestro equipo te contactará") fue **eliminado** por ser un
envío falso. En su lugar, `js/quiz.js` inyecta CTAs reales según el resultado:

| Resultado | CTA 1 | CTA 2 |
|-----------|-------|-------|
| Preescolar | EDUBOX | WhatsApp Primaria |
| Primaria | EDUBOX | WhatsApp Primaria |
| Secundaria | EDUBOX | WhatsApp Secundaria |
| Inseguro | WhatsApp general | Ver niveles educativos (`#niveles`) |

Todos los enlaces EDUBOX/WhatsApp se abren con `target="_blank"` y `rel="noopener"`.

---

## Validación

```
python generate-pages.py
CEEVS — Validador de páginas (Fases 1 y 2)
=======================================================
[OK  ] Archivos de configuración (data/)
[OK  ] mision-evangelistica.html existe
[OK  ] index.html ... mision-evangelistica.html
=======================================================
OK Todas las paginas pasaron la validacion (Fases 1 y 2).
```

---

## Pendientes (fuera del alcance de Fase 2)

| Pendiente | Fase responsable |
|-----------|------------------|
| Teléfono placeholder `+504 2200-0000` en `contactenos.html`, `interactivo.html`, `recuerdos.html` | Fase 4 (SDD-F4-CONTACT-001) |
| Enlaces `href="#"` en footer (Exalumnos, Empleos, Noticias) | Fases 4 y 5 |
| Footer "Contacto" apunta a `#contacto` inexistente en `admisiones.html` | Fase 4 |
| Formulario de contacto real en `contactenos.html` | Fase 4 |
| `PENDING_DECISION_HR_EMAIL` / `PENDING_DECISION_SUGGESTIONS_EMAIL` en `redirects.json` | Fase 4 |
| Imágenes de niveles son stock de Unsplash, no institucionales | Fase 5/6 |

---

## Fases siguientes

```
FASE 3 — Quiénes somos institucional (tabs/acordeones).
FASE 4 — Contacto, empleos y sugerencias sin formularios falsos.
FASE 5 — Galería, comunicados, actividades, misión evangelística.
FASE 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue.
```
