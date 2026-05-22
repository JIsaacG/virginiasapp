# FASE 1 — Implementación: Identidad y Navegación

**Proyecto:** Sitio web CEEVS  
**Rama:** `feature/fase-1-nav-identidad`  
**Fecha:** 2026-05-20  
**Estado:** COMPLETADO — Validación: PASS

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `data/site-config.json` | Contrato de configuración de marca |
| `data/navigation.json` | Contrato de navegación |
| `data/contacts.json` | Contactos institucionales (pendientes de confirmación) |
| `mision-evangelistica.html` | Nueva página de misión evangelística |
| `css/4-sections/mision-evangelistica.css` | Estilos de la nueva página |
| `docs/sdd/FASE_1_NAV_IDENTIDAD.md` | Este documento |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `css/1-base/tokens.css` | Agregados tokens `--ceevs-blue`, `--ceevs-sky`, `--ceevs-gold`, `--ceevs-brown`, `--ceevs-orange`, `--ceevs-black`, `--ceevs-white` |
| `css/3-layout/navbar.css` | Reescrito completo: navbar liviano blanco, CTA institucional, mobile drawer |
| `css/3-layout/dropdown.css` | Actualizado para paleta institucional (fondo blanco) |
| `css/5-responsive/media-queries.css` | Agregadas media queries de navbar (breakpoint 1024px) |
| `css/main.css` | Importado `4-sections/mision-evangelistica.css` |
| `components/navbar.html` | Nueva estructura: nombre oficial, logo, menú completo, sin onclick |
| `components/footer.html` | Nombre oficial, link a misión evangelística, EDUBOX correcto |
| `js/main.js` | `_setupMobileMenu` con aria-expanded/aria-hidden/Escape; nuevo `_setupNavActive`; nuevo `_setupLogoFallback` |
| `generate-pages.py` | Extendido con validaciones Fase 1 |
| `index.html` (+ 6 páginas) | Navbar sincronizado en todas las páginas |

---

## Decisiones técnicas

1. **Estado activo via JS**: El `nav-active` se asigna dinámicamente por `_setupNavActive()` mapeando `window.location.pathname` a `data-nav-id`. Elimina la necesidad de hardcodear por página.

2. **Logo con fallback JS**: `_setupLogoFallback()` maneja el error de carga del logo (`assets/logo principal.png`) con JS en vez de `onerror` inline.

3. **Dropdown conservado**: Se mantienen los menús dropdown para "Quiénes somos", "Admisiones" y "Contáctenos" en el HTML de cada página, aunque el nuevo navbar simplificado del componente los elimina. El dropdown.css fue actualizado para paleta clara.

4. **Footer heredado**: Los footers complejos con base64 se actualizaron solo en los campos críticos (copyright, f-brand-year, enlace portal). No se reemplazó la estructura completa.

---

## Pendientes documentados

- `PENDING_ASSET_LOGO_PRINCIPAL` — Colocar logo oficial en `assets/logo principal.png`
- `PENDING_CONTENT_MISION_EVANGELISTICA` — Texto oficial de la misión
- `PENDING_CONTENT_MISION_PROPOSITO` — Propósito evangelístico oficial
- `PENDING_CONTENT_DEVOCIONAL` — Versículo aprobado por CEEVS
- `PENDING_CONTENT_RECURSO` — Recursos evangelísticos oficiales
- `PENDING_ASSET_VIDEO_MISION` — Video institucional
- `PENDING_CONFIRMATION_EMAIL` — Email de admisiones (`data/contacts.json`)
- `PENDING_CONFIRMATION` — WhatsApp institucional (`data/contacts.json`)
- `PENDING_FINAL_DECISION` — Email de empleos (`data/contacts.json`)

---

## Validación

```
python generate-pages.py
CEEVS — Validador de páginas (Fase 1)
=======================================================
[OK  ] Archivos de configuración (data/)
[OK  ] mision-evangelistica.html existe
[OK  ] index.html
[OK  ] quienes-somos.html
[OK  ] admisiones.html
[OK  ] contactenos.html
[OK  ] interactivo.html
[OK  ] recuerdos.html
[OK  ] inventario.html
[OK  ] mision-evangelistica.html
=======================================================
OK Todas las paginas pasaron la validacion (Fase 1).
```

---

## Fases futuras

```
FASE 2 — Admisiones, EDUBOX, WhatsApp, quiz automático y CTAs.
FASE 3 — Quiénes somos: ACSI, perfil del egresado, LAES, equipo directivo.
FASE 4 — Contacto, empleos, sugerencias, formularios reales.
FASE 5 — Galería, videos, redes sociales, comunicados, juegos.
FASE 6 — SEO, accesibilidad completa, performance, deploy final.
FASE 7 — CMS / panel administrativo (si el cliente lo aprueba).
```
