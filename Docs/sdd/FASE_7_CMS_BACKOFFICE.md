# FASE 7 — CMS / back-office (hoja de ruta futura)

**Proyecto:** Sitio web CEEVS
**Estado:** ESPECIFICADA — **no implementada** (fuera del alcance de la entrega actual)

> El SDD (SDD-F7-CMS-001) define esta fase como **opcional**: "No implementar en
> fase actual si no está presupuestado". Este documento deja la especificación
> lista para una contratación futura. No hay código de Fase 7 en el repositorio.

---

## Objetivo

Permitir que personal **no técnico** de la institución actualice el contenido
frecuente del sitio sin depender de un desarrollador.

---

## Contenido editable previsto

```
Noticias y comunicados
Galería (fotos y videos)
Calendario escolar
Devocional / versículo
Videos
Actividades
```

---

## Preparación ya realizada (Fases 1–6)

El sitio ya quedó preparado para una migración a CMS:

- **Datos en JSON** — la configuración y el contenido están centralizados en
  `data/`, listos para ser servidos/editados por un CMS:
  - `data/site-config.json` — marca e identidad
  - `data/navigation.json` — navegación
  - `data/contacts.json` — contactos
  - `data/redirects.json` — EDUBOX, WhatsApp, correos
  - `data/word-search.json` — juego sopa de letras
  - `data/content-comunicados.json` — esquema de comunicados y calendario
- **Estructura de contenido documentada** — `data/content-comunicados.json`
  incluye `itemSchema`, el esquema de cada comunicado.
- **Marcadores `PENDING_*`** — todo el contenido pendiente está señalizado en el
  código para una carga ordenada.

---

## Opciones recomendadas

| Opción | Cuándo conviene |
|--------|-----------------|
| **Decap CMS** (git-based) | Sitio estático en GitHub; edición visual sin backend |
| **Git-based CMS** genérico | Control de versiones del contenido |
| **Google Sheets como fuente temporal** | Solución rápida y de bajo costo |
| **Backend ligero** | Si se requiere lógica o autenticación propia |
| **Headless CMS externo** | Contentful, Sanity, Strapi… para mayor escala |

Recomendación inicial: **Decap CMS**, por integrarse con el repositorio actual
sin introducir backend ni cambiar el stack estático.

---

## Criterios de aceptación (para la fase futura)

- Personal no técnico puede actualizar contenido.
- Los cambios quedan publicados con control de versiones.
- Se incluye capacitación al personal.

---

## Requisitos previos antes de contratar Fase 7

1. Resolver los `PENDING_*` de contenido institucional.
2. Confirmar dominio y hosting (`PENDING_DOMAIN_OFFICIAL`).
3. Definir presupuesto y responsables de edición.
