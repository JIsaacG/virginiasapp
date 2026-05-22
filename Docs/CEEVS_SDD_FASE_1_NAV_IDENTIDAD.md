# SDD FASE 1 - Remodelacion inicial del sitio web CEEVS
## Identidad institucional, estructura base y menu de navegacion

**Proyecto:** Sitio web institucional del Centro Educativo Evangelico Virginia Sapp  
**Repositorio objetivo:** `JIsaacG/virginiasapp`  
**Documento para:** Claude Code  
**Modo de trabajo:** Spec-Driven Development (SDD)  
**Fase:** 1 de la remodelacion  
**Prioridad:** Alta  
**Tipo de entrega:** Implementacion tecnica directa sobre el repositorio actual  

---

## 0. Instruccion principal para Claude Code

Implementa exactamente la **FASE 1** de la remodelacion del sitio CEEVS.

Esta fase debe enfocarse en:

1. Actualizar la identidad institucional global.
2. Reestructurar el menu de navegacion superior.
3. Agregar la opcion **Mision evangelistica** al menu.
4. Crear la pagina base `mision-evangelistica.html`.
5. Aplicar la paleta institucional inicial.
6. Preparar la estructura para idioma espanol/ingles sin traducir todo el sitio todavia.
7. Reparar enlaces criticos del menu.
8. Mantener el sitio como HTML/CSS/JavaScript estatico.
9. No introducir frameworks.
10. No crear backend.
11. No implementar todavia toda la remodelacion; solo la base global de identidad y navegacion.

---

## 1. Contexto del proyecto

El sitio actual es un boceto funcional del sitio institucional del Centro Educativo Evangelico Virginia Sapp. La institucion solicito una remodelacion visual, estructural y funcional. La primera necesidad es ordenar la cabecera, el branding y la navegacion superior para que el sitio pueda crecer ordenadamente en las siguientes fases.

Los requerimientos existentes indican que el sitio actual requiere ajustes importantes en:

- Identidad institucional.
- Navegacion.
- Integracion con EDUBOX.
- Reduccion de referencias repetitivas a "TGU" o "Tegucigalpa".
- Incorporacion destacada de la mision evangelica.
- Header menos pesado visualmente.
- Contraste accesible.
- Enlaces funcionales.
- Estructura mas clara, menos dependiente de scroll largo.

Esta fase implementa solamente la primera capa estructural.

---

## 2. Estado tecnico actual del repositorio

### 2.1 Stack actual

El repositorio actual usa:

```txt
HTML estatico
CSS modular
JavaScript vanilla
Sin backend
Sin framework frontend
Sin sistema de build obligatorio
```

### 2.2 Archivos relevantes existentes

```txt
index.html
quienes-somos.html
admisiones.html
contactenos.html
interactivo.html
inventario.html
recuerdos.html
components/navbar.html
components/footer.html
css/main.css
css/1-base/tokens.css
css/3-layout/navbar.css
css/3-layout/dropdown.css
css/3-layout/footer.css
css/5-responsive/media-queries.css
js/config.js
js/core/app.js
js/main.js
generate-pages.py
```

### 2.3 Fortalezas actuales

- El CSS ya esta modularizado.
- Existe `css/main.css` como entrada global.
- Existe un inicializador JS central `App`.
- Ya existen paginas HTML principales.
- Ya existe una estructura de navbar, menu movil y footer.
- Existe un archivo `components/navbar.html`, aunque no necesariamente esta sincronizado con todos los HTML.

### 2.4 Problemas actuales que esta fase debe corregir

- El navbar actual usa texto institucional anterior.
- El navbar menciona "Tegucigalpa" como parte repetitiva del branding.
- La navegacion no incluye "Mision evangelistica".
- Los enlaces de admision no estan completamente normalizados.
- El header visual actual es pesado y oscuro.
- Hay duplicacion de navbar entre archivos HTML y componente.
- En algunos componentes existen manejadores inline como `onclick`.
- Falta estructura central de configuracion para marca y navegacion.
- No existe pagina `mision-evangelistica.html`.

---

## 3. Fuentes de requerimiento aplicables

### 3.1 Requerimientos institucionales base

La institucion solicito:

1. Agregar mision evangelistica.
2. Usar texto en mayuscula.
3. Usar logo principal.
4. Mostrar el nombre oficial:

```txt
CENTRO EDUCATIVO EVANGELICO VIRGINIA SAPP
```

5. Soportar idioma ingles y espanol.
6. Aplicar paleta institucional:

```txt
Azul institucional: #0B67A5
Celeste: #3BA6E0
Dorado: #D7AF4A
Cafe oscuro: #6A2407
Naranja fuego: #F57C00
Negro suave: #1E1E1E
Blanco: #FFFFFF
```

7. Menu visible con la estructura:

```txt
Contactenos | Galeria | Actividades | Mision evangelistica
```

La implementacion debe corregir ortografia y tildes:

```txt
Contactenos -> Contactenos o Contáctenos segun estilo final del sitio.
Mision evangelistica -> Mision evangelistica o Misión evangelística segun estilo final del sitio.
```

Para esta implementacion, usar en la interfaz:

```txt
Contáctenos
Galería
Actividades
Misión evangelística
```

### 3.2 Requerimientos del documento previo aplicables a Fase 1

Esta fase atiende parcialmente:

```txt
RC-IDE-01: Eliminar referencias innecesarias a "TGU" / "Tegucigalpa".
RC-IDE-02: Agregar mision evangelica destacada.
RC-IDE-03: Revision ortografica inicial de elementos globales.
RC-VIS-02: Asegurar contraste WCAG 2.1 AA.
RC-VIS-03: Reducir peso visual del menu y header oscuro.
RC-VIS-04: Aplicar jerarquia tipografica consistente.
RC-NAV-01: Reparar enlaces de navegacion.
RC-NAV-02: Preparar estructura para dividir secciones largas.
RC-FUN-01: Usar EDUBOX oficial en CTAs principales.
RC-FUN-02: Definir mapa unico de redirecciones.
RM-UX-01: Menu sticky.
RM-UX-02: Breadcrumbs base en paginas internas.
RM-ACC-01: Accesibilidad inicial en navbar.
RM-SEO-01: Metadatos unicos iniciales para nueva pagina.
```

---

## 4. Objetivo de la Fase 1

Implementar una base global nueva para el sitio con identidad y navegacion institucional correcta.

### 4.1 Resultado esperado

Al finalizar esta fase, el sitio debe tener:

- Navbar actualizado en todas las paginas.
- Logo oficial referenciado como `assets/logo principal.png`.
- Nombre oficial en mayusculas.
- Menu con opcion "Mision evangelistica".
- Pagina nueva `mision-evangelistica.html`.
- Botones `Portal` y `Solicitar admision` apuntando a EDUBOX oficial.
- Menu movil sincronizado con menu escritorio.
- Paleta institucional declarada en tokens CSS.
- Header mas liviano y profesional.
- Validacion automatica basica actualizada.

---

## 5. Alcance de Fase 1

### 5.1 Incluido

Implementar:

1. Nueva identidad global.
2. Nuevo menu principal.
3. Nueva opcion "Mision evangelistica".
4. Pagina base de mision evangelistica.
5. Configuracion central de marca.
6. Configuracion central de navegacion.
7. Paleta institucional como tokens CSS.
8. Correccion inicial de links globales.
9. Menu responsive.
10. Accesibilidad basica del navbar.
11. Metadatos basicos de pagina nueva.
12. Validaciones automaticas de estructura.

### 5.2 Excluido

No implementar en esta fase:

```txt
CMS
Backend
Base de datos
Formularios reales
Traduccion completa al ingles
Rediseño completo de todas las paginas
Nueva galeria completa
Noticias y comunicados completos
Juegos actualizados
Sopa de letras actualizada
Equipo directivo completo
ACSI completo
LAES completo
Perfil de egresado completo
SEO avanzado
Google Analytics
Google Search Console
Deploy final
Optimizacion total de imagenes
```

---

## 6. Decisiones tecnicas obligatorias

### 6.1 Mantener stack actual

No instalar ni migrar a:

```txt
React
Vue
Angular
Next.js
Astro
Vite
Tailwind
Bootstrap
Svelte
Laravel
Express
```

### 6.2 Mantener estructura estatica

No crear:

```txt
server.js
api/
database/
auth/
cms/
admin backend
```

### 6.3 Mantener CSS modular

Usar y actualizar:

```txt
css/main.css
css/1-base/tokens.css
css/3-layout/navbar.css
css/3-layout/dropdown.css
css/5-responsive/media-queries.css
```

No colocar estilos extensos inline dentro de HTML.

### 6.4 Mantener JS modular actual

Usar el patron existente:

```js
App.register(Main);
App.init();
```

No romper `js/core/app.js`.

### 6.5 No usar manejadores inline

No usar:

```html
onclick=""
onmouseover=""
onmouseout=""
onfocus=""
onblur=""
```

Usar `addEventListener` en JavaScript.

### 6.6 No dejar enlaces muertos

Prohibido en navegacion principal:

```html
href="#"
href=""
href="javascript:void(0)"
```

### 6.7 No inventar contenido institucional final

Cuando falte texto oficial, usar comentarios pendientes:

```html
<!-- PENDING_CONTENT_MISION_EVANGELISTICA: Reemplazar con texto oficial aprobado por CEEVS. -->
```

---

## 7. Arquitectura objetivo para Fase 1

### 7.1 Archivos nuevos

Crear:

```txt
data/site-config.json
data/navigation.json
data/contacts.json
docs/sdd/FASE_1_NAV_IDENTIDAD.md
mision-evangelistica.html
```

### 7.2 Archivos a modificar

Modificar:

```txt
index.html
quienes-somos.html
admisiones.html
contactenos.html
interactivo.html
inventario.html
recuerdos.html
components/navbar.html
components/footer.html
css/1-base/tokens.css
css/3-layout/navbar.css
css/3-layout/dropdown.css
css/5-responsive/media-queries.css
js/main.js
generate-pages.py
```

### 7.3 Fuente de verdad

La fuente de verdad documental para marca y navegacion sera:

```txt
data/site-config.json
data/navigation.json
```

Aunque el sitio no renderice dinamicamente desde JSON en esta fase, estos archivos deben existir como contrato tecnico para evitar ambiguedad.

---

## 8. Contrato de configuracion global

### 8.1 Archivo requerido: `data/site-config.json`

Crear el archivo con este contenido base:

```json
{
  "institution": {
    "officialName": "CENTRO EDUCATIVO EVANGELICO VIRGINIA SAPP",
    "officialNameDisplay": "CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP",
    "shortName": "CEEVS",
    "legacyName": "Instituto Evangélico Virginia Sapp",
    "location": "Tegucigalpa, Honduras"
  },
  "branding": {
    "logo": "assets/logo principal.png",
    "logoFallback": "assets/logo.png",
    "logoAlt": "Logo del Centro Educativo Evangélico Virginia Sapp",
    "colors": {
      "blue": "#0B67A5",
      "sky": "#3BA6E0",
      "gold": "#D7AF4A",
      "brown": "#6A2407",
      "orange": "#F57C00",
      "black": "#1E1E1E",
      "white": "#FFFFFF"
    }
  },
  "urls": {
    "edubox": "https://portal.edubox.app/login/virginiasapp"
  },
  "languages": {
    "default": "es",
    "supported": ["es", "en"],
    "phase1Behavior": "show-selector-disabled-or-prepared"
  },
  "phase": {
    "current": "FASE_1_NAV_IDENTIDAD",
    "notes": "Fase inicial de identidad y navegacion. No implementar backend ni CMS todavia."
  }
}
```

### 8.2 Acceptance Criteria

- El archivo existe.
- Contiene EDUBOX oficial.
- Contiene nombre oficial.
- Contiene logo oficial.
- Contiene colores institucionales.
- Contiene estructura preparada para idiomas.

---

## 9. Contrato de navegacion global

### 9.1 Archivo requerido: `data/navigation.json`

Crear el archivo con este contenido:

```json
{
  "main": [
    {
      "id": "quienes-somos",
      "label": "Quiénes somos",
      "href": "quienes-somos.html",
      "type": "internal"
    },
    {
      "id": "admisiones",
      "label": "Admisiones",
      "href": "admisiones.html",
      "type": "internal"
    },
    {
      "id": "contactenos",
      "label": "Contáctenos",
      "href": "contactenos.html",
      "type": "internal"
    },
    {
      "id": "galeria",
      "label": "Galería",
      "href": "index.html#galeria",
      "type": "anchor"
    },
    {
      "id": "actividades",
      "label": "Actividades",
      "href": "interactivo.html",
      "type": "internal"
    },
    {
      "id": "mision-evangelistica",
      "label": "Misión evangelística",
      "href": "mision-evangelistica.html",
      "type": "internal"
    }
  ],
  "actions": [
    {
      "id": "portal",
      "label": "Portal",
      "href": "https://portal.edubox.app/login/virginiasapp",
      "type": "external",
      "target": "_blank",
      "rel": "noopener",
      "variant": "secondary"
    },
    {
      "id": "solicitar-admision",
      "label": "Solicitar admisión",
      "href": "https://portal.edubox.app/login/virginiasapp",
      "type": "external",
      "target": "_blank",
      "rel": "noopener",
      "variant": "primary"
    }
  ],
  "mobile": [
    {
      "id": "inicio",
      "label": "Inicio",
      "href": "index.html",
      "type": "internal"
    },
    {
      "id": "quienes-somos",
      "label": "Quiénes somos",
      "href": "quienes-somos.html",
      "type": "internal"
    },
    {
      "id": "admisiones",
      "label": "Admisiones",
      "href": "admisiones.html",
      "type": "internal"
    },
    {
      "id": "contactenos",
      "label": "Contáctenos",
      "href": "contactenos.html",
      "type": "internal"
    },
    {
      "id": "galeria",
      "label": "Galería",
      "href": "index.html#galeria",
      "type": "anchor"
    },
    {
      "id": "actividades",
      "label": "Actividades",
      "href": "interactivo.html",
      "type": "internal"
    },
    {
      "id": "mision-evangelistica",
      "label": "Misión evangelística",
      "href": "mision-evangelistica.html",
      "type": "internal"
    },
    {
      "id": "portal",
      "label": "Portal",
      "href": "https://portal.edubox.app/login/virginiasapp",
      "type": "external",
      "target": "_blank",
      "rel": "noopener"
    },
    {
      "id": "solicitar-admision",
      "label": "Solicitar admisión",
      "href": "https://portal.edubox.app/login/virginiasapp",
      "type": "external",
      "target": "_blank",
      "rel": "noopener"
    }
  ]
}
```

### 9.2 Acceptance Criteria

- El archivo existe.
- El menu HTML coincide con este contrato.
- No existe item principal con `href="#"`.
- `Portal` y `Solicitar admision` apuntan a EDUBOX oficial.
- `Mision evangelistica` apunta a `mision-evangelistica.html`.

---

## 10. Contrato de contactos iniciales

### 10.1 Archivo requerido: `data/contacts.json`

Crear:

```json
{
  "admissions": {
    "edubox": "https://portal.edubox.app/login/virginiasapp",
    "email": "admisiones@virginiasapp.edu.hn",
    "status": "PENDING_CONFIRMATION_EMAIL"
  },
  "whatsapp": {
    "primary": {
      "label": "WhatsApp Primaria",
      "number": "+50492215752",
      "url": "https://wa.me/50492215752",
      "status": "PENDING_CONFIRMATION"
    },
    "secondary": {
      "label": "WhatsApp Secundaria",
      "number": "+50492700210",
      "url": "https://wa.me/50492700210",
      "status": "PENDING_CONFIRMATION"
    }
  },
  "jobs": {
    "email": "rrhh@virginiasapp.edu.hn",
    "alternateEmailFromScreenshots": "empleosaideeds@gmail.com",
    "status": "PENDING_FINAL_DECISION"
  },
  "feedback": {
    "email": "administracion.general@virginiasapp.edu.hn",
    "subject": "OPORTUNIDAD DE MEJORA CEEVS",
    "status": "PENDING_CONFIRMATION"
  }
}
```

### 10.2 Acceptance Criteria

- El archivo existe.
- Mantiene pendientes marcados.
- No cambia todavia la logica completa de formularios.
- Solo documenta datos para fases futuras.

---

## 11. Contratos SDD

---

# SDD-F1-BRAND-001 - Nombre institucional oficial

## Objetivo

Actualizar la identidad global para mostrar el nombre institucional oficial.

## Input

Usuario carga cualquier pagina publica del sitio.

## Process

El sitio renderiza el nombre institucional oficial en la cabecera global.

## Output

Debe mostrarse:

```txt
CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP
```

## Reglas

1. En navbar debe mostrarse el nombre oficial en mayusculas.
2. El nombre anterior puede mantenerse solo en contenido historico si es necesario, no como branding principal.
3. No usar "TGU" en navbar.
4. No usar "Tegucigalpa" como subtitulo repetitivo en navbar.
5. "Tegucigalpa" solo debe aparecer como dato de ubicacion en contacto o footer.

## Archivos a modificar

```txt
components/navbar.html
index.html
quienes-somos.html
admisiones.html
contactenos.html
interactivo.html
inventario.html
recuerdos.html
components/footer.html
```

## Acceptance Criteria

- Navbar muestra `CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP`.
- Navbar no muestra `Centro Educativo CEEVS · Tegucigalpa`.
- Navbar no muestra `TGU`.
- Footer puede mostrar ubicacion.
- No se altera la navegabilidad actual.

---

# SDD-F1-BRAND-002 - Logo principal institucional

## Objetivo

Preparar el uso del logo oficial.

## Input

Usuario carga navbar o footer.

## Process

El sitio referencia el logo oficial en el componente de marca.

## Output

El logo debe apuntar a:

```txt
assets/logo principal.png
```

## Reglas

1. Usar `assets/logo principal.png`.
2. Si no existe fisicamente, dejar fallback a `assets/logo.png`.
3. Agregar comentario `PENDING_ASSET_LOGO_PRINCIPAL`.
4. No usar base64 para logo principal.
5. `alt` debe ser:

```txt
Logo del Centro Educativo Evangélico Virginia Sapp
```

## HTML sugerido

```html
<img
  src="assets/logo principal.png"
  alt="Logo del Centro Educativo Evangélico Virginia Sapp"
  class="nav-logo-image"
  onerror="this.onerror=null;this.src='assets/logo.png';"
/>
```

## Nota

Si el proyecto mantiene prohibicion de inline handlers, reemplazar el `onerror` con CSS/JS o eliminar fallback visual. La regla principal es no usar `onclick` inline. Para estricta consistencia, preferir no usar `onerror` y validar existencia del asset.

## Acceptance Criteria

- Logo principal referenciado en navbar.
- Logo principal referenciado o preparado en footer.
- Alt correcto.
- No hay logo principal en base64.
- Si no existe el archivo, queda documentado como pendiente.

---

# SDD-F1-BRAND-003 - Paleta institucional inicial

## Objetivo

Agregar tokens de color institucional sin romper estilos existentes.

## Input

El navegador carga `css/main.css`.

## Process

`css/1-base/tokens.css` define colores institucionales.

## Output

Tokens nuevos disponibles:

```css
:root {
  --ceevs-blue: #0B67A5;
  --ceevs-sky: #3BA6E0;
  --ceevs-gold: #D7AF4A;
  --ceevs-brown: #6A2407;
  --ceevs-orange: #F57C00;
  --ceevs-black: #1E1E1E;
  --ceevs-white: #FFFFFF;
}
```

## Reglas

1. No eliminar todos los tokens antiguos si eso rompe el sitio.
2. Agregar nuevos tokens como capa institucional.
3. Aplicar nuevos tokens por lo menos al navbar, CTA y estado activo.
4. El header debe verse mas liviano que el actual.
5. El contraste debe ser suficiente.

## Acceptance Criteria

- `tokens.css` contiene los tokens nuevos.
- `navbar.css` usa al menos `--ceevs-blue`, `--ceevs-gold`, `--ceevs-brown`, `--ceevs-white` o `--ceevs-black`.
- El texto del navbar es legible.
- El CTA `Solicitar admisión` destaca visualmente.

---

# SDD-F1-NAV-001 - Menu principal de escritorio

## Objetivo

Implementar estructura de navegacion solicitada.

## Input

Usuario carga el sitio en viewport de escritorio.

## Process

El sitio renderiza navbar global.

## Output

El navbar muestra:

```txt
Quiénes somos
Admisiones
Contáctenos
Galería
Actividades
Misión evangelística
Portal
Solicitar admisión
```

## Rutas

```txt
Quiénes somos -> quienes-somos.html
Admisiones -> admisiones.html
Contáctenos -> contactenos.html
Galería -> index.html#galeria
Actividades -> interactivo.html
Misión evangelística -> mision-evangelistica.html
Portal -> https://portal.edubox.app/login/virginiasapp
Solicitar admisión -> https://portal.edubox.app/login/virginiasapp
```

## Reglas

1. El menu debe ser igual en todas las paginas.
2. `Portal` debe abrir en pestana nueva.
3. `Solicitar admision` debe abrir en pestana nueva.
4. Ambos enlaces externos deben tener `rel="noopener"`.
5. No usar `href="#"`.
6. No usar `javascript:void(0)`.
7. No usar `onclick` inline.
8. Mantener estado activo por pagina.

## Acceptance Criteria

- Todos los items estan visibles en escritorio.
- `Misión evangelística` existe.
- No hay enlace vacio.
- EDUBOX es unico y correcto.
- El menu no se desborda horizontalmente en desktop comun.

---

# SDD-F1-NAV-002 - Menu movil equivalente

## Objetivo

Actualizar menu movil para que tenga los mismos destinos que escritorio.

## Input

Usuario toca boton hamburguesa.

## Process

El sitio abre el menu movil.

## Output

Menu movil muestra:

```txt
Inicio
Quiénes somos
Admisiones
Contáctenos
Galería
Actividades
Misión evangelística
Portal
Solicitar admisión
```

## Reglas

1. Usar `addEventListener`.
2. No usar `onclick`.
3. Boton hamburguesa debe tener:
   - `aria-label`
   - `aria-controls`
   - `aria-expanded`
4. Al abrir:
   - agregar clase `open`
   - `aria-expanded="true"`
   - bloquear scroll del body si ya se hacia antes.
5. Al cerrar:
   - quitar clase `open`
   - `aria-expanded="false"`
   - restaurar scroll.
6. Al hacer click en cualquier enlace del menu, cerrar menu.

## Acceptance Criteria

- Menu movil abre.
- Menu movil cierra.
- Menu movil contiene `Misión evangelística`.
- Menu movil contiene `Portal`.
- Menu movil contiene `Solicitar admisión`.
- No se pierde ningun destino del menu de escritorio.
- No hay scroll horizontal.

---

# SDD-F1-NAV-003 - Pagina Mision evangelistica

## Objetivo

Crear pagina base para la nueva seccion solicitada.

## Input

Usuario hace click en `Misión evangelística`.

## Process

El sitio navega a `mision-evangelistica.html`.

## Output

La pagina carga correctamente.

## Estructura minima

La pagina debe contener:

```txt
1. Navbar global
2. Hero de pagina
3. Seccion de proposito evangelistico
4. Seccion de versiculo/devocional destacado
5. Seccion de recursos/articulos
6. Seccion de video evangelistico
7. CTA hacia admisiones o contacto
8. Footer global
```

## HTML base sugerido

```html
<main id="main-content">
  <section class="page-hero mission-hero">
    <div class="page-hero-content">
      <div class="section-label"><span>Misión evangelística</span></div>
      <h1>Misión evangelística</h1>
      <p>
        <!-- PENDING_CONTENT_MISION_EVANGELISTICA: Reemplazar con texto oficial aprobado por CEEVS. -->
        Formación cristiana integral, valores bíblicos y servicio con propósito.
      </p>
    </div>
  </section>

  <section class="mission-section mission-purpose">
    <div class="container">
      <h2>Propósito evangelístico</h2>
      <p>
        <!-- PENDING_CONTENT_MISION_PROPOSITO -->
        Este espacio presentará el propósito evangelístico oficial del Centro Educativo Evangélico Virginia Sapp.
      </p>
    </div>
  </section>

  <section class="mission-section mission-devotional">
    <div class="container">
      <h2>Versículo o devocional destacado</h2>
      <article class="mission-card">
        <p><!-- PENDING_CONTENT_DEVOCIONAL --></p>
      </article>
    </div>
  </section>

  <section class="mission-section mission-resources">
    <div class="container">
      <h2>Recursos y artículos</h2>
      <div class="mission-grid">
        <article class="mission-card">
          <h3>Recurso evangelístico</h3>
          <p><!-- PENDING_CONTENT_RECURSO --></p>
        </article>
      </div>
    </div>
  </section>

  <section class="mission-section mission-video">
    <div class="container">
      <h2>Video destacado</h2>
      <div class="mission-video-placeholder">
        <!-- PENDING_ASSET_VIDEO_MISION -->
        Video pendiente de confirmación institucional.
      </div>
    </div>
  </section>
</main>
```

## Metadatos requeridos

```html
<title>Misión evangelística | Centro Educativo Evangélico Virginia Sapp</title>
<meta name="description" content="Conoce la misión evangelística del Centro Educativo Evangélico Virginia Sapp y su compromiso con la formación cristiana integral.">
<meta property="og:title" content="Misión evangelística | Centro Educativo Evangélico Virginia Sapp">
<meta property="og:description" content="Formación cristiana integral, valores bíblicos y propósito evangelístico en CEEVS.">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_HN">
```

## Reglas

1. No inventar contenido doctrinal final.
2. Usar comentarios `PENDING_CONTENT`.
3. Cargar `css/main.css`.
4. Cargar JS global igual que las otras paginas.
5. Incluir navbar y footer.
6. Usar `lang="es"`.
7. Usar `id="main-content"`.

## Acceptance Criteria

- Existe `mision-evangelistica.html`.
- El navbar enlaza a esta pagina.
- La pagina carga sin error.
- Tiene titulo.
- Tiene description.
- Tiene estructura minima.
- Tiene contenido pendiente marcado.
- Tiene footer.

---

# SDD-F1-NAV-004 - Estado activo

## Objetivo

Indicar visualmente la pagina actual.

## Input

Usuario navega a una pagina.

## Process

El navbar asigna clase activa al enlace correspondiente.

## Output

El enlace actual tiene clase:

```txt
nav-active
```

## Reglas

```txt
index.html -> Inicio si existe en movil; ninguna opcion principal obligatoria en desktop.
quienes-somos.html -> Quiénes somos
admisiones.html -> Admisiones
contactenos.html -> Contáctenos
interactivo.html -> Actividades
mision-evangelistica.html -> Misión evangelística
index.html#galeria -> Galería cuando aplique
```

## Acceptance Criteria

- Solo un item principal aparece activo.
- El activo no depende solo de color.
- Debe tener subrayado, borde inferior, cambio de peso o fondo.
- El estado activo es visible con contraste suficiente.

---

# SDD-F1-NAV-005 - Header sticky y liviano

## Objetivo

Reducir peso visual del header oscuro y hacerlo mas profesional.

## Input

Usuario carga cualquier pagina y hace scroll.

## Process

El navbar permanece visible y cambia estado visual si corresponde.

## Output

Navbar sticky/fixed con fondo claro o institucional equilibrado.

## Reglas visuales

1. No usar un bloque completamente pesado en cafe oscuro como unica base dominante.
2. Usar contraste claro.
3. Altura maxima escritorio: 76px.
4. Altura maxima movil: 68px.
5. Agregar borde inferior o sombra sutil.
6. Evitar que tape contenido al navegar por anchors.

## CSS sugerido

```css
#navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 72px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ceevs-black);
  border-bottom: 1px solid rgba(11, 103, 165, 0.12);
  box-shadow: 0 8px 24px rgba(30, 30, 30, 0.06);
  backdrop-filter: blur(12px);
}

#navbar.scrolled {
  box-shadow: 0 10px 30px rgba(30, 30, 30, 0.10);
}
```

## Nota de diseño

Si el diseño actual depende de header oscuro, aplicar transicion gradual. Esta fase prioriza estructura y legibilidad sobre rediseño total.

## Acceptance Criteria

- Navbar permanece visible.
- Navbar no tapa contenido de forma critica.
- Header se percibe menos pesado.
- Texto legible.
- CTA visible.

---

# SDD-F1-I18N-001 - Preparacion de idioma espanol/ingles

## Objetivo

Preparar el sitio para soporte bilingue sin traducir todo todavia.

## Input

Usuario ve navbar.

## Process

El sitio muestra una opcion visual o estructura preparada para idioma.

## Output

Debe existir preparacion tecnica para:

```txt
Español
English
```

## Reglas

1. No traducir todo el sitio en esta fase.
2. Agregar estructura de configuracion en `site-config.json`.
3. Opcional: mostrar selector pequeño en navbar o footer.
4. Si se muestra selector, puede estar deshabilitado o marcado como proximo.
5. No crear paginas `/en/` completas todavia.

## Opcion recomendada para Fase 1

Agregar en navbar o footer:

```html
<div class="language-switcher" aria-label="Selector de idioma">
  <span class="language-current">ES</span>
  <span class="language-separator">|</span>
  <span class="language-option language-disabled" title="English version pending">EN</span>
</div>
```

## Acceptance Criteria

- `site-config.json` contiene `"supported": ["es", "en"]`.
- Si hay selector visual, no rompe layout.
- No hay enlaces falsos a paginas en ingles inexistentes.
- Si no se implementa visualmente, queda documentado como preparado en configuracion.

---

# SDD-F1-ACCESS-001 - Accesibilidad del navbar

## Objetivo

Asegurar que la navegacion principal sea accesible.

## Input

Usuario navega con mouse, teclado o lector de pantalla.

## Process

El navbar expone estructura semantica.

## Output

Navegacion usable y clara.

## Reglas

1. `<nav>` debe tener:

```html
<nav id="navbar" aria-label="Navegación principal">
```

2. Boton hamburguesa:

```html
<button
  class="nav-hamburger"
  id="nav-hamburger"
  aria-label="Abrir menú principal"
  aria-controls="mobile-menu"
  aria-expanded="false"
>
```

3. Menu movil:

```html
<div id="mobile-menu" aria-hidden="true">
```

4. Al abrir:

```txt
aria-expanded="true"
aria-hidden="false"
```

5. Al cerrar:

```txt
aria-expanded="false"
aria-hidden="true"
```

6. Foco visible en enlaces.
7. Enlaces externos con `target="_blank"` deben tener `rel="noopener"`.

## Acceptance Criteria

- Tab recorre enlaces principales.
- Foco visible.
- Hamburguesa accesible.
- Estado expandido se actualiza.
- Contraste de texto suficiente.

---

# SDD-F1-VALID-001 - Validacion automatica

## Objetivo

Extender `generate-pages.py` para validar la Fase 1.

## Input

Desarrollador ejecuta:

```bash
python generate-pages.py
```

## Process

El script revisa archivos HTML y estructura critica.

## Output

Si todo esta correcto:

```txt
Todas las páginas pasaron la validación.
```

## Nuevas validaciones requeridas

Agregar validaciones para:

1. `mision-evangelistica.html` existe.
2. Todas las paginas principales cargan `css/main.css`.
3. Todas las paginas principales cargan `js/core/app.js`.
4. Todas las paginas principales tienen `App.init()`.
5. No existe `onclick=`.
6. No existe `href="#"` dentro del navbar.
7. Navbar contiene `Misión evangelística`.
8. Navbar contiene `CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP`.
9. Navbar no contiene `Centro Educativo CEEVS · Tegucigalpa`.
10. Navbar no contiene `TGU`.
11. EDUBOX oficial aparece para `Portal`.
12. EDUBOX oficial aparece para `Solicitar admisión`.
13. Enlaces EDUBOX tienen `target="_blank"`.
14. Enlaces EDUBOX tienen `rel="noopener"`.
15. `data/site-config.json` existe.
16. `data/navigation.json` existe.
17. `data/contacts.json` existe.

## Acceptance Criteria

- El script falla si falta la pagina nueva.
- El script falla si no aparece Mision evangelistica.
- El script falla si hay `onclick=`.
- El script falla si hay `href="#"` en navbar.
- El script falla si EDUBOX es incorrecto.
- El script falla si faltan archivos JSON requeridos.

---

## 12. HTML objetivo del navbar

Claude Code debe adaptar el navbar existente a una estructura equivalente a esta. No copiar ciegamente si rompe estilos actuales, pero el resultado semantico debe coincidir.

```html
<nav id="navbar" aria-label="Navegación principal">
  <a href="index.html" class="nav-logo" aria-label="Ir al inicio">
    <span class="nav-logo-img">
      <img
        src="assets/logo principal.png"
        alt="Logo del Centro Educativo Evangélico Virginia Sapp"
        class="nav-logo-image"
      >
    </span>
    <span class="nav-wordmark">
      <strong>CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP</strong>
      <small>CEEVS</small>
    </span>
  </a>

  <ul class="nav-links">
    <li><a href="quienes-somos.html" data-nav-id="quienes-somos">Quiénes somos</a></li>
    <li><a href="admisiones.html" data-nav-id="admisiones">Admisiones</a></li>
    <li><a href="contactenos.html" data-nav-id="contactenos">Contáctenos</a></li>
    <li><a href="index.html#galeria" data-nav-id="galeria">Galería</a></li>
    <li><a href="interactivo.html" data-nav-id="actividades">Actividades</a></li>
    <li><a href="mision-evangelistica.html" data-nav-id="mision-evangelistica">Misión evangelística</a></li>
  </ul>

  <div class="nav-cta">
    <a
      href="https://portal.edubox.app/login/virginiasapp"
      class="btn-nav-ghost"
      target="_blank"
      rel="noopener"
      data-nav-id="portal"
    >
      Portal
    </a>

    <a
      href="https://portal.edubox.app/login/virginiasapp"
      class="btn-nav-solid"
      target="_blank"
      rel="noopener"
      data-nav-id="solicitar-admision"
    >
      Solicitar admisión
    </a>

    <button
      class="nav-hamburger"
      id="nav-hamburger"
      aria-label="Abrir menú principal"
      aria-controls="mobile-menu"
      aria-expanded="false"
      type="button"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>

<div id="mobile-menu" aria-hidden="true">
  <div class="mm-inner">
    <div class="mm-header">
      <div class="mm-logo">CEEVS</div>
      <button class="mm-close" type="button" aria-label="Cerrar menú principal">✕</button>
    </div>

    <nav class="mm-links" aria-label="Navegación móvil">
      <a href="index.html"><span class="mm-num">01</span>Inicio</a>
      <a href="quienes-somos.html"><span class="mm-num">02</span>Quiénes somos</a>
      <a href="admisiones.html"><span class="mm-num">03</span>Admisiones</a>
      <a href="contactenos.html"><span class="mm-num">04</span>Contáctenos</a>
      <a href="index.html#galeria"><span class="mm-num">05</span>Galería</a>
      <a href="interactivo.html"><span class="mm-num">06</span>Actividades</a>
      <a href="mision-evangelistica.html"><span class="mm-num">07</span>Misión evangelística</a>
    </nav>

    <div class="mm-actions">
      <a
        href="https://portal.edubox.app/login/virginiasapp"
        class="mm-btn-ghost"
        target="_blank"
        rel="noopener"
      >
        Portal
      </a>

      <a
        href="https://portal.edubox.app/login/virginiasapp"
        class="mm-btn-solid"
        target="_blank"
        rel="noopener"
      >
        Solicitar admisión
      </a>
    </div>
  </div>
</div>
```

---

## 13. JavaScript requerido para menu movil

Actualizar `js/main.js` en la funcion o modulo que maneja menu movil.

### Comportamiento requerido

```txt
Click hamburguesa -> abre/cierra menu
Click boton cerrar -> cierra menu
Click fuera del panel -> cierra menu
Click en enlace -> cierra menu
Escape -> cierra menu
Actualizar aria-expanded y aria-hidden
```

### Pseudocodigo

```js
_setupMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('nav-hamburger');
  const closeBtn = document.querySelector('.mm-close');

  if (!menu || !hamburger) return;

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    setOpen(!isOpen);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => setOpen(false));
  }

  menu.addEventListener('click', (event) => {
    if (event.target === menu || event.target.closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
}
```

### Acceptance Criteria

- No `onclick`.
- `aria-expanded` cambia.
- `aria-hidden` cambia.
- Escape cierra menu.
- Click en enlace cierra menu.

---

## 14. CSS requerido para navbar

Actualizar `css/3-layout/navbar.css`.

### Requisitos visuales

- Header mas liviano.
- CTA visible.
- Estado activo visible.
- Menu responsive.
- Sin overflow horizontal.
- Compatible con paleta institucional.

### CSS minimo esperado

```css
#navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px clamp(18px, 4vw, 56px);
  background: rgba(255, 255, 255, 0.96);
  color: var(--ceevs-black, #1E1E1E);
  border-bottom: 1px solid rgba(11, 103, 165, 0.14);
  box-shadow: 0 8px 24px rgba(30, 30, 30, 0.06);
  backdrop-filter: blur(12px);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.nav-logo-img {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--ceevs-white, #FFFFFF);
  border: 2px solid rgba(11, 103, 165, 0.20);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 0 0 auto;
}

.nav-logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.nav-wordmark {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.nav-wordmark strong,
.nav-wordmark b {
  font-size: clamp(0.72rem, 1vw, 0.92rem);
  letter-spacing: 0.03em;
  color: var(--ceevs-blue, #0B67A5);
}

.nav-wordmark small {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ceevs-brown, #6A2407);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vw, 28px);
  list-style: none;
}

.nav-links a {
  color: var(--ceevs-black, #1E1E1E);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.94rem;
  position: relative;
  padding: 8px 0;
}

.nav-links a:hover,
.nav-links a:focus-visible,
.nav-links a.nav-active {
  color: var(--ceevs-blue, #0B67A5);
}

.nav-links a.nav-active::after,
.nav-links a:hover::after,
.nav-links a:focus-visible::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 3px;
  border-radius: 999px;
  background: var(--ceevs-gold, #D7AF4A);
}

.nav-cta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-nav-ghost,
.btn-nav-solid {
  min-height: 40px;
  border-radius: 10px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
}

.btn-nav-ghost {
  color: var(--ceevs-blue, #0B67A5);
  border: 1px solid rgba(11, 103, 165, 0.35);
  background: transparent;
}

.btn-nav-solid {
  color: var(--ceevs-white, #FFFFFF);
  background: var(--ceevs-orange, #F57C00);
  border: 1px solid var(--ceevs-orange, #F57C00);
}

.btn-nav-ghost:hover,
.btn-nav-ghost:focus-visible {
  background: rgba(11, 103, 165, 0.08);
}

.btn-nav-solid:hover,
.btn-nav-solid:focus-visible {
  filter: brightness(0.95);
}

.nav-hamburger {
  display: none;
}
```

### Responsive requerido

En `css/5-responsive/media-queries.css` o `navbar.css`:

```css
@media (max-width: 1024px) {
  .nav-links,
  .nav-cta .btn-nav-ghost,
  .nav-cta .btn-nav-solid {
    display: none;
  }

  .nav-hamburger {
    display: inline-flex;
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
  }

  .nav-hamburger span {
    width: 24px;
    height: 2px;
    background: var(--ceevs-black, #1E1E1E);
    border-radius: 999px;
  }
}
```

### Acceptance Criteria

- Desktop se ve ordenado.
- Tablet no se desborda.
- Movil usa hamburguesa.
- CTA no rompe layout.
- Mision evangelistica no se corta de forma grave.

---

## 15. Estructura de `mision-evangelistica.html`

Crear pagina completa siguiendo el patron de las otras paginas.

### Requisitos minimos

Debe incluir:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Misión evangelística | Centro Educativo Evangélico Virginia Sapp</title>
  <meta name="description" content="Conoce la misión evangelística del Centro Educativo Evangélico Virginia Sapp y su compromiso con la formación cristiana integral.">
  <meta name="theme-color" content="#0B67A5">

  <meta property="og:title" content="Misión evangelística | Centro Educativo Evangélico Virginia Sapp">
  <meta property="og:description" content="Formación cristiana integral, valores bíblicos y propósito evangelístico en CEEVS.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_HN">

  <!-- Fonts: mantener las fuentes actuales si el proyecto las usa -->
  <!-- Styles -->
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <!-- Navbar global actualizado -->

  <main id="main-content">
    <!-- Contenido base de mision evangelistica -->
  </main>

  <!-- Footer global actualizado -->

  <!-- Scripts globales iguales a las otras paginas -->
</body>
</html>
```

### Importante

Copiar la misma secuencia de scripts que usan las paginas actuales, incluyendo:

```txt
js/config.js
js/core/app.js
js/core/dom.js
js/core/storage.js
js/gamification.js
js/main.js
App.init()
```

Si alguna pagina actual usa otros scripts globales, mantener consistencia.

---

## 16. Actualizacion del footer en esta fase

### Objetivo

Alinear footer con identidad global y evitar datos repetitivos incorrectos.

### Reglas

1. Footer puede mostrar ubicacion:

```txt
Tegucigalpa, Honduras
```

2. Footer debe mostrar nombre institucional oficial.
3. Footer debe incluir enlaces principales.
4. Footer debe incluir enlace a `Misión evangelística`.
5. Footer no debe tener enlaces rotos.

### Acceptance Criteria

- Footer contiene `CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP`.
- Footer contiene link a `mision-evangelistica.html`.
- Footer no contiene enlaces `#` en enlaces principales.
- Footer conserva ubicacion solo como dato informativo.

---

## 17. Secuencia exacta de implementacion para Claude Code

### Paso 1 - Crear rama de trabajo

```bash
git checkout -b feature/fase-1-nav-identidad
```

Si no se puede crear rama, continuar en rama actual y documentarlo.

### Paso 2 - Crear archivos de configuracion

Crear:

```txt
data/site-config.json
data/navigation.json
data/contacts.json
```

con los contratos especificados.

### Paso 3 - Actualizar tokens CSS

Modificar:

```txt
css/1-base/tokens.css
```

Agregar tokens institucionales sin borrar los antiguos.

### Paso 4 - Actualizar navbar componente

Modificar:

```txt
components/navbar.html
```

Aplicar:

- Nombre oficial.
- Logo oficial.
- Menu nuevo.
- Mision evangelistica.
- EDUBOX.
- Atributos accesibles.
- Sin `onclick`.

### Paso 5 - Sincronizar navbar en todas las paginas

Actualizar navbar en:

```txt
index.html
quienes-somos.html
admisiones.html
contactenos.html
interactivo.html
inventario.html
recuerdos.html
```

Asegurar que el navbar sea consistente.

### Paso 6 - Actualizar menu movil

Modificar estructura movil en todas las paginas o en componente fuente.

Agregar:

```txt
Misión evangelística
Portal
Solicitar admisión
```

### Paso 7 - Actualizar JS del menu movil

Modificar:

```txt
js/main.js
```

Eliminar dependencia de inline `onclick`.

Asegurar:

```txt
click
escape
aria-expanded
aria-hidden
close on link click
```

### Paso 8 - Actualizar CSS del navbar

Modificar:

```txt
css/3-layout/navbar.css
css/3-layout/dropdown.css
css/5-responsive/media-queries.css
```

Asegurar diseño liviano, responsive y accesible.

### Paso 9 - Crear pagina nueva

Crear:

```txt
mision-evangelistica.html
```

Con estructura, metadatos, navbar y footer.

### Paso 10 - Actualizar footer

Modificar footer global en las paginas y/o `components/footer.html`.

Agregar enlace a `Misión evangelística`.

### Paso 11 - Actualizar validacion

Modificar:

```txt
generate-pages.py
```

Agregar validaciones de Fase 1.

### Paso 12 - Ejecutar validacion

Ejecutar:

```bash
python generate-pages.py
```

Corregir errores hasta pasar.

### Paso 13 - Revision manual

Revisar:

```txt
desktop
tablet
mobile
links
keyboard
scroll
```

### Paso 14 - Documentar

Crear:

```txt
docs/sdd/FASE_1_NAV_IDENTIDAD.md
```

con resumen de cambios implementados, pendientes y validacion.

---

## 18. Checklist de QA obligatorio

### Identidad

```txt
[ ] Navbar muestra CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP.
[ ] Logo apunta a assets/logo principal.png.
[ ] No aparece TGU en navbar.
[ ] No aparece Tegucigalpa como subtitulo repetido del navbar.
[ ] Paleta institucional esta declarada.
```

### Navegacion escritorio

```txt
[ ] Quiénes somos visible.
[ ] Admisiones visible.
[ ] Contáctenos visible.
[ ] Galería visible.
[ ] Actividades visible.
[ ] Misión evangelística visible.
[ ] Portal visible.
[ ] Solicitar admisión visible.
```

### Navegacion movil

```txt
[ ] Hamburguesa visible en movil.
[ ] Menu abre.
[ ] Menu cierra.
[ ] Escape cierra menu.
[ ] Click en enlace cierra menu.
[ ] Misión evangelística aparece.
[ ] Portal aparece.
[ ] Solicitar admisión aparece.
[ ] No hay scroll horizontal.
```

### Links

```txt
[ ] Quiénes somos -> quienes-somos.html
[ ] Admisiones -> admisiones.html
[ ] Contáctenos -> contactenos.html
[ ] Galería -> index.html#galeria
[ ] Actividades -> interactivo.html
[ ] Misión evangelística -> mision-evangelistica.html
[ ] Portal -> https://portal.edubox.app/login/virginiasapp
[ ] Solicitar admisión -> https://portal.edubox.app/login/virginiasapp
[ ] Portal tiene target _blank.
[ ] Portal tiene rel noopener.
[ ] Solicitar admisión tiene target _blank.
[ ] Solicitar admisión tiene rel noopener.
```

### Accesibilidad

```txt
[ ] nav tiene aria-label.
[ ] Hamburguesa tiene aria-controls.
[ ] Hamburguesa tiene aria-expanded.
[ ] Mobile menu tiene aria-hidden.
[ ] Foco visible.
[ ] Tab recorre enlaces.
[ ] Contraste legible.
```

### Pagina nueva

```txt
[ ] mision-evangelistica.html existe.
[ ] Tiene title.
[ ] Tiene meta description.
[ ] Tiene OG tags.
[ ] Tiene navbar.
[ ] Tiene footer.
[ ] Tiene main id main-content.
[ ] Tiene contenido placeholder marcado.
```

### Validacion

```txt
[ ] python generate-pages.py pasa.
[ ] No hay onclick inline.
[ ] No hay href="#" en navbar.
[ ] No hay EDUBOX alternativo en navbar.
[ ] Existen archivos JSON requeridos.
```

---

## 19. Definition of Done

La Fase 1 esta terminada cuando:

1. Todas las paginas principales tienen el nuevo navbar.
2. Existe `mision-evangelistica.html`.
3. El menu escritorio y movil son equivalentes.
4. El logo oficial esta referenciado.
5. El nombre oficial esta aplicado.
6. EDUBOX esta normalizado en `Portal` y `Solicitar admision`.
7. El navbar esta libre de `onclick` inline.
8. El navbar esta libre de `href="#"`.
9. Los tokens institucionales existen.
10. El header se ve mas liviano.
11. El validador pasa.
12. Se documento la fase en `docs/sdd/FASE_1_NAV_IDENTIDAD.md`.

---

## 20. Pendientes para fases posteriores

No resolver todavia, solo documentar:

```txt
FASE 2 - Admisiones, EDUBOX, WhatsApp, quiz automatico y CTAs.
FASE 3 - Quienes somos: ACSI, perfil del egresado, LAES, equipo directivo y junta directiva.
FASE 4 - Contacto, empleos, sugerencias y eliminacion o reemplazo de formularios falsos.
FASE 5 - Galeria, videos, redes sociales, comunicados, noticias, actividades y juegos.
FASE 6 - SEO, accesibilidad completa, performance, sitemap, robots, deploy y documentacion.
FASE 7 - CMS o panel administrativo si el cliente lo aprueba.
```

---

## 21. Prompt breve de ejecucion para Claude Code

Usar este prompt si se quiere iniciar directo:

```txt
Implementa la FASE 1 del SDD para el sitio CEEVS en el repositorio actual.

Objetivo:
Actualizar identidad institucional y navegacion global. El navbar debe mostrar CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP, usar logo assets/logo principal.png, agregar Misión evangelística al menu, crear mision-evangelistica.html, usar EDUBOX oficial en Portal y Solicitar admisión, preparar colores institucionales, actualizar menu movil, eliminar onclick inline del navbar y extender generate-pages.py para validar la fase.

No hagas:
- No crear backend.
- No instalar frameworks.
- No rediseñar todo el sitio.
- No implementar CMS.
- No traducir todo a ingles.
- No inventar contenido final.
- No dejar href="#".
- No usar onclick inline.

Archivos a crear:
- data/site-config.json
- data/navigation.json
- data/contacts.json
- mision-evangelistica.html
- docs/sdd/FASE_1_NAV_IDENTIDAD.md

Archivos a modificar:
- components/navbar.html
- components/footer.html
- index.html
- quienes-somos.html
- admisiones.html
- contactenos.html
- interactivo.html
- inventario.html
- recuerdos.html
- css/1-base/tokens.css
- css/3-layout/navbar.css
- css/3-layout/dropdown.css
- css/5-responsive/media-queries.css
- js/main.js
- generate-pages.py

Acceptance:
Ejecuta python generate-pages.py y corrige hasta que pase. Verifica manualmente desktop y mobile. Entrega resumen de archivos modificados, decisiones tomadas y pendientes.
```

---

## 22. Notas comerciales y de direccion tecnica

Esta fase debe presentarse al cliente como una primera entrega estructural:

- Ordena marca.
- Ordena navegacion.
- Agrega la seccion solicitada de Mision evangelistica.
- Deja lista la base para redisenar las secciones internas.
- Evita rehacer dos veces el trabajo.
- Permite que las siguientes fases sean mas rapidas y medibles.

La fase no debe venderse como sitio final. Es la base de remodelacion.

---

## 23. Versionado sugerido

```txt
Version SDD: 1.0
Fase: 1
Nombre: NAV_IDENTIDAD
Rama sugerida: feature/fase-1-nav-identidad
Commit sugerido: feat: implement phase 1 navigation and institutional identity
```

---

## 24. Resumen ejecutivo para commit o PR

```txt
Implementa la Fase 1 de remodelacion CEEVS: actualiza identidad institucional global, reemplaza branding del navbar, agrega Mision evangelistica al menu, crea pagina base de mision evangelistica, normaliza CTAs de Portal y Solicitar admision hacia EDUBOX, agrega tokens de paleta institucional, actualiza menu movil, mejora accesibilidad de navegacion y extiende validacion tecnica.
```
