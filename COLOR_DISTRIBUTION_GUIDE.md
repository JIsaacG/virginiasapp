# 🎨 GUÍA DE DISTRIBUCIÓN DE PALETA DE COLORES - CEEVS

**Actualizado**: 26 de mayo de 2026

---

## 📐 Estructura de Color por Secciones

### 1. HEADER / NAVEGACIÓN SUPERIOR
```
┌────────────────────────────────────────────────┐
│ [LOGO] QUIÉNES SOMOS | ADMISIONES | CONTACTO  │
│ NARANJA #F57C00 (fondo)                        │
│ BLANCO #FFFFFF (texto)                         │
│ DORADO #D7AF4A (accents/hover)                 │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
header {
  background-color: var(--bg-header);       /* #F57C00 */
  color: var(--text-header);                /* #FFFFFF */
}

header a:hover {
  color: var(--accent-header);              /* #D7AF4A */
}
```

**Elementos:**
- [ ] Logo principal (blanco sobre naranja)
- [ ] Navegación en MAYÚSCULAS
- [ ] Botones "PLATAFORMA" y "MATRICULA" con hover dorado
- [ ] Desplegables con transición suave

---

### 2. SECCIÓN HERO (Bienvenido/Misión)
```
┌────────────────────────────────────────────────┐
│                                                │
│    AZUL #0B67A5 (fondo principal)              │
│    + CELESTE #3BA6E0 (líneas/divisores)        │
│    + DORADO #D7AF4A (barras decorativas)       │
│                                                │
│    "ESTOY ABRIENDO UN CAMINO..."               │
│    TEXTO: BLANCO #FFFFFF                       │
│    Versículo: Isaías 43:19                     │
│                                                │
│    [FOTO NIÑOS] [DECORATIVOS] [FOTO DOCENTES] │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.hero-section {
  background-color: var(--bg-hero);         /* #0B67A5 */
  color: var(--text-hero);                  /* #FFFFFF */
}

.hero-decoration {
  background-color: var(--decor-hero);      /* #D7AF4A */
  border-color: var(--accent-hero);         /* #3BA6E0 */
}
```

**Elementos:**
- [ ] Fondo azul institucional
- [ ] Barra dorada decorativa (diagonal)
- [ ] Líneas celeste como separadores
- [ ] Texto en blanco (h1, h2)
- [ ] Versículo en itálica

---

### 3. SECCIÓN "QUIÉNES SOMOS" (Contenido)
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo)                      │
│    NEGRO SUAVE #1E1E1E (texto paragraphs)      │
│    AZUL #0B67A5 (títulos h2/h3)               │
│    CELESTE #3BA6E0 (acentos/botones)          │
│                                                │
│    H2: "BIENVENIDO AL MUNDO VIRGINIA SAPP"    │
│    p: Descripción general...                  │
│    [VIDEO INSTAGRAM REEL]                     │
│    [GALERÍA FOTOS]                            │
│                                                │
│    [Button "Conocer más"] (Celeste)           │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.content-light {
  background-color: var(--bg-light);        /* #FFFFFF */
  color: var(--text-light);                 /* #1E1E1E */
}

.content-light h2 {
  color: var(--color-primary-blue);         /* #0B67A5 */
}

.content-light .btn-accent {
  background-color: var(--accent-light);    /* #3BA6E0 */
}
```

**Elementos:**
- [ ] Fondo blanco limpio
- [ ] Títulos azul institucional
- [ ] Párrafos negro suave
- [ ] Botones celeste
- [ ] Video incrustado responsivo

---

### 4. SECCIÓN "SOBRE NOSOTROS" (Acreditación/Perfil)
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo)                      │
│    NEGRO SUAVE #1E1E1E (texto)                 │
│    DORADO #D7AF4A (divisores/acentos)         │
│                                                │
│    [ACSI LOGO]                                │
│    H2: "ACREDITACIÓN" (Azul)                  │
│    Contenido desplegable...                   │
│                                                │
│    ─────── DORADO ───────                     │
│                                                │
│    H2: "PERFIL DEL EGRESADO"                  │
│    - Conocimientos (tabs)                     │
│    - Actitudes (tabs)                         │
│    - Habilidades (tabs)                       │
│                                                │
│    [Button "LAES"] (Naranja)                  │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.sobre-nosotros {
  background-color: var(--bg-light);        /* #FFFFFF */
}

.sobre-nosotros h2 {
  color: var(--color-primary-blue);         /* #0B67A5 */
  border-bottom: 3px solid var(--accent-dark); /* #D7AF4A */
}

.tab-content {
  border-left: 4px solid var(--color-secondary-sky); /* #3BA6E0 */
}
```

**Elementos:**
- [ ] Secciones con tabs/acordeones
- [ ] Divisores dorados horizontales
- [ ] Bordes celeste en contenido
- [ ] Botones naranja para CTAs

---

### 5. SECCIÓN "EQUIPO DIRECTIVO"
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo)                      │
│    NEGRO SUAVE #1E1E1E (texto)                 │
│    AZUL #0B67A5 (títulos/hover)               │
│    CELESTE #3BA6E0 (bordes tarjetas)          │
│                                                │
│    ┌──────────────┐                           │
│    │   [FOTO]     │ Sara Corrales             │
│    │ BORDE CELESTE│ Directora Ejecutiva       │
│    │              │ "Líder educativa..."      │
│    │ [Expandir]   │ (Click para más info)    │
│    └──────────────┘                           │
│                                                │
│    (Repetir para cada miembro)                │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.team-card {
  background-color: var(--bg-light);        /* #FFFFFF */
  border: 2px solid var(--border-color-light); /* #3BA6E0 */
}

.team-card:hover {
  border-color: var(--color-primary-blue);  /* #0B67A5 */
  box-shadow: 0 4px 12px rgba(11, 103, 165, 0.2);
}

.team-card h3 {
  color: var(--color-primary-blue);         /* #0B67A5 */
}
```

**Elementos:**
- [ ] Tarjetas con foto
- [ ] Bordes celeste
- [ ] Nombre en azul
- [ ] Descripción corta
- [ ] Hover para expandir biografía

---

### 6. SECCIÓN "ADMISIONES" (¿Cuál es tu nivel?)
```
┌────────────────────────────────────────────────┐
│                                                │
│    AZUL #0B67A5 (fondo/header)                │
│    BLANCO #FFFFFF (texto sobre azul)          │
│    NARANJA #F57C00 (botones/selección)        │
│                                                │
│    H2: "¿CUÁL ES TU NIVEL?"                   │
│    [Selector edad/grado]                      │
│                                                │
│    Al seleccionar:                             │
│    ┌──────────────────────┐                   │
│    │ PREESCOLAR           │                   │
│    │ ✓ Edad: 3-5 años     │ FONDO: Blanco    │
│    │ ✓ Enfoque: ...       │ BORDER: Naranja  │
│    │ [Inscribirse]        │ HOVER: Dorado    │
│    └──────────────────────┘                   │
│                                                │
│    [Botón EDUBOX] (Naranja → EDUBOX)          │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.admisiones-section {
  background-color: var(--color-primary-blue); /* #0B67A5 */
  color: var(--color-neutral-white);          /* #FFFFFF */
}

.level-card {
  background-color: var(--color-neutral-white); /* #FFFFFF */
  border: 3px solid var(--btn-primary);     /* #F57C00 */
}

.level-card:hover {
  border-color: var(--color-primary-gold);  /* #D7AF4A */
  background-color: #FFF9E6;
}

.btn-edubox {
  background-color: var(--btn-primary);     /* #F57C00 */
  color: var(--btn-text);                   /* #FFFFFF */
}
```

**Elementos:**
- [ ] Sección hero azul
- [ ] Selector de nivel interactivo
- [ ] Cards por nivel (sin botón continuar ✓)
- [ ] Botón EDUBOX naranja
- [ ] Información clara y centrada

---

### 7. SECCIÓN "CONTACTO"
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo general)              │
│    NEGRO SUAVE #1E1E1E (texto)                 │
│                                                │
│    ┌─────────────────┐                        │
│    │ PRIMARIA        │                        │
│    │ +504 9221-5752  │ WhatsApp (Celeste)    │
│    │ [Contactar]     │                        │
│    └─────────────────┘                        │
│                                                │
│    ┌─────────────────┐                        │
│    │ SECUNDARIA      │                        │
│    │ +504 9270-0210  │ WhatsApp (Celeste)    │
│    │ [Contactar]     │                        │
│    └─────────────────┘                        │
│                                                │
│    ┌─────────────────┐                        │
│    │ UBICACIÓN       │ Google Maps            │
│    │ [Mapa]          │                        │
│    └─────────────────┘                        │
│                                                │
│    ┌─────────────────┐                        │
│    │ EMPLEOS         │ empleos@ceevs.edu.hn  │
│    │ [Enviar CV]     │ (Naranja)              │
│    └─────────────────┘                        │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.contact-card {
  background-color: var(--color-light-gray); /* #F5F5F5 */
  border-left: 4px solid var(--color-secondary-sky); /* #3BA6E0 */
}

.whatsapp-btn {
  background-color: var(--accent-light);    /* #3BA6E0 */
}

.email-btn {
  background-color: var(--btn-primary);     /* #F57C00 */
}
```

**Elementos:**
- [ ] Cards de contacto gris claro
- [ ] Bordes celeste en tarjetas
- [ ] Links WhatsApp funcionando
- [ ] Google Maps embebido
- [ ] Botones de email activos

---

### 8. SECCIÓN "GALERÍA"
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo)                      │
│    NEGRO SUAVE #1E1E1E (títulos)               │
│    CELESTE #3BA6E0 (overlay hover)            │
│                                                │
│    [INSTAGRAM FEED]                           │
│    ─────── DORADO ───────                     │
│                                                │
│    H2: "GALERÍA DE FOTOS" (Azul)              │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│    │[IMG]│ │[IMG]│ │[IMG]│ │[IMG]│          │
│    │     │ │     │ │     │ │     │          │
│    │Hover│ │Hover│ │Hover│ │Hover│ (Celeste)│
│    └─────┘ └─────┘ └─────┘ └─────┘          │
│                                                │
│    ─────── DORADO ───────                     │
│    H2: "VIDEOS" (Azul)                        │
│    [VIDEO PLAYER - Video Virginia Sapp]      │
│    [VIDEO PLAYER - Preescolar]                │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.gallery-grid {
  background-color: var(--bg-light);        /* #FFFFFF */
}

.gallery-item:hover {
  background-color: var(--accent-light);    /* #3BA6E0 */
  opacity: 0.9;
}

.gallery-title {
  color: var(--color-primary-blue);         /* #0B67A5 */
  border-top: 3px solid var(--color-primary-gold); /* #D7AF4A */
}
```

**Elementos:**
- [ ] Feed de Instagram incrustado
- [ ] Grid de fotos responsivo
- [ ] Overlay celeste en hover
- [ ] Divisores dorados
- [ ] Reproductores de video integrados

---

### 9. SECCIÓN "ACTIVIDADES" (Encuestas/Juegos)
```
┌────────────────────────────────────────────────┐
│                                                │
│    BLANCO #FFFFFF (fondo)                      │
│    NEGRO SUAVE #1E1E1E (texto)                 │
│    NARANJA #F57C00 (botones envío)            │
│    CELESTE #3BA6E0 (acentos de formulario)    │
│                                                │
│    H2: "COMPARTE TUS SUGERENCIAS" (Azul)      │
│    "Tu opinión nos importa"                    │
│                                                │
│    Formulario:                                 │
│    [Input Nombre] (border: #3BA6E0)           │
│    [Select Nivel] (border: #3BA6E0)           │
│    [Select Área] (border: #3BA6E0)            │
│    [Textarea] (border: #3BA6E0)               │
│    [ENVIAR] (Naranja #F57C00)                 │
│                                                │
│    ─────── DORADO ───────                     │
│    H2: "JUEGOS EDUCATIVOS" (Azul)             │
│    [SOPA DE LETRAS] (interactivo)             │
│    [MÁS JUEGOS] (pronto)                      │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.activities-section {
  background-color: var(--bg-light);        /* #FFFFFF */
}

.form-input,
.form-select,
.form-textarea {
  border-color: var(--border-color-light);  /* #3BA6E0 */
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary-blue);  /* #0B67A5 */
  box-shadow: 0 0 0 3px rgba(11, 103, 165, 0.1);
}

.submit-btn {
  background-color: var(--btn-primary);     /* #F57C00 */
  color: var(--btn-text);                   /* #FFFFFF */
}

.game-container {
  background-color: var(--color-light-gray); /* #F5F5F5 */
}
```

**Elementos:**
- [ ] Formulario con inputs celeste
- [ ] Botón envío naranja
- [ ] Focus azul en inputs
- [ ] Contenedor juegos gris claro
- [ ] Juegos interactivos (sopa de letras actualizada)

---

### 10. SECCIÓN "MISIÓN EVANGELÍSTICA"
```
┌────────────────────────────────────────────────┐
│                                                │
│    CAFÉ OSCURO #6A2407 (fondo)                 │
│    BLANCO #FFFFFF (texto)                      │
│    DORADO #D7AF4A (títulos/acentos)           │
│    CELESTE #3BA6E0 (líneas decorativas)       │
│                                                │
│    H2: "MISIÓN EVANGELÍSTICA" (Dorado)        │
│    "e625 – Discipulado Generacional"          │
│                                                │
│    ┌────────────────┐                         │
│    │  VIDEOS        │ (Dorado decorativo)     │
│    │  Cargar videos │                         │
│    │  ─────────────│ (Celeste)                │
│    │  [VIDEO CARD] │                         │
│    │  [VIDEO CARD] │                         │
│    └────────────────┘                         │
│                                                │
│    ┌────────────────┐                         │
│    │ VERSÍCULO DEL DÍA│ (Celeste borde)       │
│    │                │                         │
│    │ "Isaías 43:19" │ (Dorado)                │
│    │ "Yo voy a..."  │ (Blanco texto)          │
│    └────────────────┘                         │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Variables a usar:**
```css
.mision-section {
  background-color: var(--bg-dark);         /* #6A2407 */
  color: var(--text-dark);                  /* #FFFFFF */
}

.mision-section h2 {
  color: var(--accent-dark);                /* #D7AF4A */
  border-bottom: 2px solid var(--accent-dark);
}

.verse-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--accent-light);    /* #3BA6E0 */
}

.verse-reference {
  color: var(--accent-dark);                /* #D7AF4A */
  font-weight: bold;
}

.video-upload-btn {
  background-color: var(--color-primary-gold); /* #D7AF4A */
  color: var(--color-secondary-brown);      /* #6A2407 */
}
```

**Elementos:**
- [ ] Fondo café oscuro institucional
- [ ] Títulos en dorado
- [ ] Texto en blanco
- [ ] Borde celeste en tarjetas de versículo
- [ ] Espacio para cargar videos
- [ ] Versículo actualizado dinámicamente

---

## 🎯 RESUMEN RÁPIDO DE COLORES POR USO

| USO | COLOR | HEX | CSS Variable |
|-----|-------|-----|--------------|
| Header | Naranja | #F57C00 | --color-primary-orange |
| Hero principal | Azul | #0B67A5 | --color-primary-blue |
| Acentos/líneas | Celeste | #3BA6E0 | --color-secondary-sky |
| Decorativo/divisores | Dorado | #D7AF4A | --color-primary-gold |
| Fondo oscuro | Café | #6A2407 | --color-secondary-brown |
| Fondos claros | Blanco | #FFFFFF | --color-neutral-white |
| Texto principal | Negro suave | #1E1E1E | --color-neutral-black |
| Botones primarios | Naranja | #F57C00 | --btn-primary |
| Botones secundarios | Azul | #0B67A5 | --btn-secondary |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Importar `color-palette.css` en `main.css`
- [ ] Revisar cada sección contra esta guía
- [ ] Aplicar variables CSS en lugar de valores hardcoded
- [ ] Validar contraste de colores (AA mínimo)
- [ ] Probar en diferentes dispositivos
- [ ] Revisar estados hover/active de botones
- [ ] Verificar modo oscuro (si aplica)
- [ ] Documentar cambios en esta guía

---

**Documento de referencia para mantener coherencia visual en toda la página web CEEVS.**
