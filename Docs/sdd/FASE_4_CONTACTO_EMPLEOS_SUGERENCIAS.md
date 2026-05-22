# FASE 4 — Implementación: Contacto, empleos y sugerencias

**Proyecto:** Sitio web CEEVS
**Rama:** `feature/fase-1-nav-identidad` (continuación)
**Fecha:** 2026-05-20
**Estado:** COMPLETADO — Validación: PASS

---

## Contratos SDD implementados

| Contrato | Descripción | Estado |
|----------|-------------|--------|
| SDD-F4-CONTACT-001 | Contacto sin formulario falso | ✅ |
| SDD-F4-CONTACT-002 | WhatsApp por nivel con mensaje prellenado | ✅ |
| SDD-F4-CONTACT-003 | Google Maps (enlace funcional + PENDING) | ✅ |
| SDD-F4-JOBS-001 | Empleos con `mailto` a RRHH | ✅ |
| SDD-F4-FEEDBACK-001 | Página de sugerencias con `mailto` | ✅ NUEVO |
| SDD-F4-EXALUMNOS-001 | Comunidad de egresados sin BD falsa | ✅ |

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `sugerencias.html` | Página de oportunidades de mejora (formulario → `mailto`) |
| `js/sugerencias.js` | Construye el `mailto` con los campos del formulario |
| `css/4-sections/contacto-canales.css` | Estilos del bloque de canales directos |
| `css/4-sections/sugerencias.css` | Estilos de la página de sugerencias |
| `docs/sdd/FASE_4_CONTACTO_EMPLEOS_SUGERENCIAS.md` | Este documento |

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `contactenos.html` | Formulario simulado eliminado y reemplazado por **canales directos** (WhatsApp Primaria/Secundaria, correo, Google Maps); ubicación enlazada a Maps; redes sociales sin enlaces falsos; exalumnos → WhatsApp; empleos → `mailto` a RRHH |
| `js/main.js` | Eliminado `_setupContactForm()` (simulaba el envío) y el stub global `submitForm()` |
| `interactivo.html`, `recuerdos.html` | Teléfono placeholder `+504 2200-0000` → `+504 9221-5752` |
| `css/main.css` | Import de `contacto-canales.css` y `sugerencias.css` |
| `generate-pages.py` | Validaciones Fase 4 + `sugerencias.html` añadida |

---

## SDD-F4-CONTACT-001 — Eliminación del formulario falso

El formulario de contacto simulaba un envío: al pulsar "Enviar solicitud" mostraba
"✓ ¡Solicitud enviada!" sin enviar nada (lógica en `_setupContactForm`).

Se eliminó por completo y se reemplazó por un bloque de **canales directos** con
acciones reales:

- 💬 WhatsApp Primaria — `wa.me/50492215752` con mensaje prellenado
- 💬 WhatsApp Secundaria — `wa.me/50492700210` con mensaje prellenado
- ✉️ Correo de admisiones — `mailto:admisiones@virginiasapp.edu.hn`
- 📍 Cómo llegar — búsqueda en Google Maps

Los datos de horario (columna izquierda) y redes sociales completan los canales
pedidos por el contrato.

---

## SDD-F4-CONTACT-003 — Google Maps

Se usa una URL de búsqueda de Google Maps funcional
(`google.com/maps/search/?api=1&query=...`) que localiza la institución por nombre.
Marcado con `PENDING_URL_GOOGLE_MAPS` para sustituir por la ubicación oficial fijada
cuando la institución la proporcione. No se incrustó iframe (evita peso innecesario).

---

## SDD-F4-JOBS-001 — Empleos

El botón "Enviar hoja de vida" ya no apunta a `#contacto`: ahora abre un `mailto`
a `rrhh@virginiasapp.edu.hn` con asunto y cuerpo prellenados. Se añadió una nota
explicativa de qué enviar. Marcado `PENDING_DECISION_HR_EMAIL`.

---

## SDD-F4-FEEDBACK-001 — Sugerencias

Nueva página `sugerencias.html` con formulario de campos: Nombre, Área, Grado,
Nivel, Mensaje y "¿Cómo contactarte?". Al enviar, `js/sugerencias.js` construye un
`mailto:` a `administracion.general@virginiasapp.edu.hn` con asunto
`OPORTUNIDAD DE MEJORA CEEVS` y abre el cliente de correo del usuario. **No simula
envíos ni guarda datos.** Marcado `PENDING_DECISION_SUGGESTIONS_EMAIL`.

La página es accesible desde el bloque de canales de `contactenos.html`.

---

## Decisiones técnicas

1. **Canales directos en vez de formulario:** sin backend, un formulario "real"
   no puede enviarse. Se priorizan WhatsApp y `mailto` (acciones verificables) en
   lugar de simular un envío.
2. **Redes sociales:** los enlaces `href="#"` se convirtieron en elementos no
   interactivos (`soc-disabled`) con `PENDING_URL_REDES_SOCIALES`, en vez de
   enlaces muertos. Las redes se integran en Fase 5.
3. **Sugerencias por `mailto`:** cumple "no simular base de datos"; el usuario
   confirma el envío desde su propio correo.

---

## Contenido marcado como pendiente

- `PENDING_URL_GOOGLE_MAPS` — ubicación oficial fijada en Maps
- `PENDING_URL_REDES_SOCIALES` — redes sociales oficiales
- `PENDING_CONFIRMATION_EMAIL` — correo de admisiones
- `PENDING_CONFIRMATION` — números de WhatsApp
- `PENDING_DECISION_HR_EMAIL` — correo oficial de Recursos Humanos
- `PENDING_DECISION_SUGGESTIONS_EMAIL` — correo oficial de sugerencias

---

## Validación

```
python generate-pages.py
CEEVS — Validador de páginas (Fases 1 a 4)
=======================================================
OK Todas las paginas pasaron la validacion (Fases 1 a 4).
```

---

## Pendientes (fuera del alcance de Fase 4)

| Pendiente | Fase responsable |
|-----------|------------------|
| Enlaces `href="#"` en footers (Exalumnos, Empleos, Noticias) | Fase 5 |
| CSS muerto del formulario eliminado (`.f-input`, `.f-submit`…) en `galeria.css` | Limpieza futura |
| Integración de redes sociales reales | Fase 5 |

---

## Fases siguientes

```
FASE 5 — Galería, comunicados, actividades, misión evangelística.
FASE 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue.
```
