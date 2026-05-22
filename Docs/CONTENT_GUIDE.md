# Guía de contenido — Sitio web CEEVS

Cómo actualizar el contenido del sitio sin conocimientos técnicos avanzados.
El sitio es estático: los cambios se hacen editando archivos de texto.

---

## 1. Datos centrales (`data/`)

| Archivo | Qué controla |
|---------|--------------|
| `data/site-config.json` | Nombre oficial, logo, colores, idiomas |
| `data/navigation.json` | Estructura del menú de navegación |
| `data/contacts.json` | Correos y números de WhatsApp |
| `data/redirects.json` | EDUBOX, WhatsApp, correos de empleos y sugerencias |
| `data/word-search.json` | Palabras del juego Sopa de Letras |
| `data/content-comunicados.json` | Esquema de comunicados y calendario |

Al editar un JSON, conservar las comillas y las comas. Validar el archivo en
un comprobador de JSON antes de publicar.

---

## 2. Marcadores de contenido pendiente

Buscar en el código estos comentarios para encontrar lo que falta confirmar:

- `PENDING_CONTENT_*` — texto institucional por aprobar (misión, ACSI, LAES,
  equipo directivo, junta directiva, comunicados, calendario, capacitación…).
- `PENDING_ASSET_*` — archivos por proveer (logo oficial, imagen Open Graph).
- `PENDING_DECISION_*` — decisiones institucionales (correos de RRHH/sugerencias).
- `PENDING_URL_*` — enlaces por confirmar (Google Maps, redes sociales).
- `PENDING_DOMAIN_OFFICIAL` — dominio oficial del sitio.

Cada marcador indica exactamente qué reemplazar.

---

## 3. Tareas frecuentes

### Cambiar el logo
Colocar el logo oficial en `assets/logo principal.png`. Si no existe, el sitio
usa `assets/logo.jpg` como respaldo automático.

### Cambiar un texto de una sección
Editar directamente el archivo `.html` de la página. El texto está entre las
etiquetas HTML; no modificar las etiquetas, solo el texto.

### Cambiar un estilo (color, tamaño, espaciado)
Editar el archivo correspondiente en `css/4-sections/`. Los colores
institucionales están en `css/1-base/tokens.css` (variables `--ceevs-*`).

### Publicar un comunicado
Por ahora las tarjetas de `comunicados.html` son de ejemplo (marcadas como
placeholder). Reemplazar el texto de cada tarjeta por el comunicado real y
quitar la clase `comunicado-placeholder`.

### Actualizar el calendario escolar
Editar la sección "Calendario escolar" en `comunicados.html` con las fechas
oficiales. No publicar fechas sin confirmar.

---

## 4. Reglas importantes

- No simular envíos: los formularios usan `mailto:` o WhatsApp reales.
- No usar enlaces vacíos (`href="#"`) en navegación ni botones.
- No publicar fotos de alumnos sin autorización institucional.
- No inventar contenido doctrinal, académico ni de personal.
- Tras cualquier cambio, ejecutar `python generate-pages.py` y revisar
  `docs/QA_CHECKLIST.md`.

---

## 5. Evolución futura (Fase 7 — CMS)

Los archivos `data/*.json` están preparados para migrar a un gestor de
contenidos (CMS) que permita a personal no técnico actualizar comunicados,
galería y calendario sin editar código.
