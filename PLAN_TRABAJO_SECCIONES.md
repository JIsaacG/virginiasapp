# PLAN DE TRABAJO - SECCIONES DE LA PÁGINA WEB CEEVS

Documento de planificación basado en el requerimiento "Página web.xlsx" del 26 de mayo de 2026.

---

## 📋 1. ELEMENTOS DE NAVEGACIÓN SUPERIOR

### Objetivos
- [ ] Agregar misión evangelística a la navegación
- [ ] Texto completo en MAYÚSCULA
- [ ] Integrar logo principal: `logo principal.png`
- [ ] Nombre: CENTRO EDUCATIVO EVANGELICO VIRGNIA SAPP

### Tareas Específicas
1. **Logo y branding**
   - Implementar logo principal en navbar
   - Usar nombre exacto: "CENTRO EDUCATIVO EVANGELICO VIRGNIA SAPP"
   - Aplicar estilos de navegación superior

2. **Enlaces de navegación**
   - "Quienes somos"
   - "Matriculate" (Admisiones)
   - "Capacitate con nosotros"
   - "Trabaja con nosotros"
   - "Comunicados y noticias"
   - "Misión evangelística" (NUEVO)

3. **Funcionalidades**
   - Navegación responsiva
   - Idiomas: Inglés y Español
   - Todo en mayúsculas

---

## 🎨 GUÍA DE ESTILOS GLOBAL

### Colores Principales y su Aplicación

#### 1. **Naranja/Dorado Institucional** (#D7AF4A / #F57C00)
   - **Ubicación**: Barra de navegación superior (header)
   - **Elementos**: Fondo del navbar, botones principales
   - **Variantes**: Usar #F57C00 para hover/estados activos

#### 2. **Azul Institucional** (#0B67A5)
   - **Ubicación**: Banners principales, secciones hero, elementos grandes
   - **Elementos**: Fondo de secciones destacadas, títulos principales
   - **Variantes**: Degradados con celeste para profundidad

#### 3. **Celeste** (#3BA6E0)
   - **Ubicación**: Elementos decorativos, transiciones, acentos
   - **Elementos**: Líneas divisoras, bordes, efectos visuales
   - **Variantes**: Se combina con azul institucional en degradados

#### 4. **Café Oscuro** (#6A2407)
   - **Ubicación**: Secciones de contenido pesado (misión, valores)
   - **Elementos**: Fondos de secciones, áreas de texto large
   - **Variantes**: Usado para crear contraste y definir secciones

#### 5. **Blanco** (#FFFFFF)
   - **Ubicación**: Fondos generales, espacios en blanco
   - **Elementos**: Body background, tarjetas, secciones claras
   - **Variantes**: Secciones alternas con fondos claros

#### 6. **Negro Suave** (#1E1E1E)
   - **Ubicación**: Textos principales, párrafos
   - **Elementos**: Tipografía, contenido legible
   - **Variantes**: Usado para contraste máximo en textos

#### 7. **Tonos Pastel/Grises**
   - **Ubicación**: Fondos secundarios, separadores
   - **Elementos**: Líneas divisoras, fondos alternos

### Estructura de Distribución Visual

```
┌─────────────────────────────────────────┐
│  HEADER (Naranja #F57C00)               │ ← Navegación principal
├─────────────────────────────────────────┤
│                                         │
│  HERO SECTION (Azul #0B67A5)            │ ← Banner principal con versículo
│  + Celeste (#3BA6E0) + Dorado (#D7AF4A)│
│  + Acentos y líneas decorativas         │
│                                         │
├─────────────────────────────────────────┤
│  BLANCO (#FFFFFF) - Sección clara       │
│  Texto Negro Suave (#1E1E1E)            │
├─────────────────────────────────────────┤
│  CAFÉ OSCURO (#6A2407) - Sección misión│ ← Fondo oscuro para contraste
│  Texto Blanco (#FFFFFF)                 │
├─────────────────────────────────────────┤
│  BLANCO (#FFFFFF) - Contenido           │
│  Acentos Celeste (#3BA6E0)              │
├─────────────────────────────────────────┤
│  DORADO (#D7AF4A) - Sección especial    │ ← Botones, CTAs
└─────────────────────────────────────────┘
```

### Tipografía
- Definir fuentes adecuadas
- Aplicar consistentemente en toda la página

### Requisitos Técnicos
- [ ] Soporte multiidioma (Español e Inglés)
- [ ] Responsive design
- [ ] Secciones bien divididas (NO scroll excesivo)
- [ ] Información resumida y clara

---

## 2️⃣ SECCIÓN "QUIÉNES SOMOS"

### Contenido Requerido
- [ ] Barra de navegación con opciones principales
- [ ] Video de bienvenida (Instagram Reel)
  - Link: `https://www.instagram.com/reel/DUodgArEq5F/?igsh=anFjdWozcjI0aDFz`
- [ ] Fotos de niños y docentes con camisas institucionales
- [ ] "Bienvenido al mundo Virginia Sapp" (como título)
- [ ] Documento PDF: "Sobre nosotros CEEVS.pdf"

### Tareas Específicas
1. **Video embebido**
   - Integrar video de Instagram
   - Asegurar carga responsiva

2. **Galería de fotos**
   - Niños en actividades
   - Docentes con uniforme
   - Fondo institucional

3. **Contenido interactivo**
   - "Cambiar a datos interactivos" (funcionalidad)
   - Enlace a PDF de referencia

4. **Referencia externa**
   - "Universidad Mariano Gálvez de Guatemala"
   - Versículo: "Y conoceréis la verdad y la verdad os hará libres" Juan 8:32

---

## 3️⃣ SECCIÓN "SOBRE NOSOTROS"

### 3.1 Acreditación
**Contenido Desplegable (Accordion)**
- [ ] Título: "Acreditación"
- [ ] Contenido:
  - Acreditada por Association of Christian Schools International (ACSI)
  - Compromiso con educación cristiana de excelencia
  - Estándares internacionales de calidad académica
  - Formación espiritual y mejora continua
  - Participación de docentes en certificación ACSI

### 3.2 Perfil del Egresado
**Contenido Interactivo con Secciones Expandibles**

- [ ] **Conocimientos** (5 ítems)
  1. Interpreta eventos de Honduras y el mundo desde cosmovisión bíblica
  2. Sustenta convicciones morales fundamentadas en la Palabra de Dios
  3. Utiliza investigación, ciencia y tecnología
  4. Procura excelencia académica
  5. Practica lectura como enriquecimiento espiritual

- [ ] **Actitudes** (10 ítems)
  1. Cultiva relación personal con Dios
  2. Responde al llamado de Dios para servir
  3. Valora al ser humano por ser creado a imagen de Dios
  4. Demuestra aprecio por la naturaleza
  5. Ejerce liderazgo con vocación de servicio
  6. Reconoce potencial de compañeros
  7. Sentido de identidad nacional
  8. Respeta diversidad cultural
  9. Actitud positiva hacia cambio e innovación
  10. Evidencia valores del Reino de Dios

- [ ] **Habilidades** (8 ítems)
  1. Aprecia y practica arte y deportes
  2. Utiliza tiempo libre en actividades físico-culturales
  3. Desarrolla destrezas de reflexión y análisis
  4. Habilidad de comunicación y relaciones efectivas
  5. Creatividad, autoestima e identidad
  6. Proyecto de vida y toma de decisiones

### 3.3 LAES (Logros de Aprendizaje Esperado)
- [ ] Integrar información de LAES
- [ ] Formato expandible/desplegable

---

## 4️⃣ SECCIÓN "EQUIPO DIRECTIVO"

### Equipo Ejecutivo (7 miembros + Junta Directiva)

**Equipo a mostrar con BIOGRAFÍAS EXPANDIBLES**

1. **Sara Corrales - Directora Ejecutiva**
   - Biografía: "Líder educativa y coach especializada en desarrollo personal, liderazgo organizacional y gestión educativa"
   - Foto: Sara Corrales (genérica si no disponible)

2. **Dessire Hulse - Directora Secundaria**
   - Biografía: "Lic. Dessiré Hulse - Directora educativa con más de 22 años de experiencia en gestión académica, liderazgo docente y procesos de calidad educativa"

3. **Ana Ávila - Directora Primaria**
   - Biografía: "Mgtr. Ana Estela Ávila - Directora de Preescolar y Primaria con 27 años de experiencia en el ámbito educativo"

4. **Diana Vásquez - Administradora General**
   - Biografía: "Lic. Diana Vásquez - Administradora con formación en contaduría pública y 2 años de experiencia"

5. **Nadia Irula - Coordinadora de Talento Humano**
   - Biografía: "Lic. Nadia Irula - Coordinadora con formación en psicología y 2 años de experiencia"

6. **Martha López - Coordinadora de Pastoral**
   - Tareas de equipo

7. **Rosa Armijo - Especialista de Español**
   - Tareas de equipo

### Tareas Específicas
- [ ] Crear componente expandible/modal para biografías
- [ ] Al dar clic: mostrar resumen/biografía completa
- [ ] Usar fotos genéricas si no están disponibles
- [ ] Sección "Junta Directiva" con foto (JD.png)

---

## 5️⃣ SECCIÓN "ADMISIONES" / "MATRICULATE CON NOSOTROS"

### Contenido Requerido
- [ ] "¿Cuál es el nivel ideal para tu hijo?"
  - **ELIMINAR botón "Continuar"** (según observaciones IT)
  - Mostrar información del nivel directamente al seleccionar edad
  
- [ ] Niveles educativos disponibles
  - Preescolar
  - Primaria
  - Secundaria

- [ ] Información de servicios
  - Detallar servicios por nivel

- [ ] Portal de inscripción
  - Link: `https://portal.edubox.app/login/virginiasapp`
  - Botón "Comenzar Proceso" debe dirigir a EDUBOX
  - Botón "Solicitar Información" (funcional)

### Tareas Específicas
1. **Selector interactivo de niveles**
   - Input: edad o grado
   - Output: información específica del nivel
   - Eliminar botón "Continuar"

2. **Información centrada y mejorada**
   - Mejorar layout
   - Centrar contenido
   - Información clara y resumida

3. **Integración con EDUBOX**
   - Botón "Comenzar Proceso" → `https://portal.edubox.app/login/virginiasapp`

4. **Formulario de solicitud**
   - Validar funcionalidad
   - Asegurar envío correctamente

---

## 6️⃣ SECCIÓN "CONTACTANOS"

### 6.1 Trabaja con Nosotros
- [ ] Email: `empleosadieeds@gmail.com`
- [ ] Base de datos de CV
- [ ] "Enviar hoja de vida" debe redirigir al email
  - **VERIFICAR**: Actualmente no está redireccionando correctamente
  - Implementar: `mailto:empleosadieeds@gmail.com`

### 6.2 Egresados
- [ ] Sección dedicada a egresados
- [ ] Video de un egresado (pendiente)
  - Espacio disponible para contenido

### 6.3 Información de Contacto
- [ ] **Primaria**: +504 9221-5752 (WhatsApp)
- [ ] **Secundaria**: +504 9270-0210 (WhatsApp)
- [ ] **Dirección**: Integrar con Google Maps
- [ ] Nota: Sin formulario de contacto (NO forms)

### Tareas Específicas
1. **Enlaces de WhatsApp**
   - Crear links funcionales: `https://wa.me/50492215752` (Primaria)
   - Crear links funcionales: `https://wa.me/50492700210` (Secundaria)

2. **Integración Google Maps**
   - Mostrar dirección en mapa

3. **Email para empleos**
   - Botones con mailto funcionales

---

## 7️⃣ SECCIÓN "GALERÍA"

### Contenido Requerido
- [ ] **Iniciar con las redes sociales** (Instagram feed)
- [ ] **Fotografías genéricas** de:
  - Actividades escolares
  - Estudiantes
  - Eventos
  
- [ ] **Videos CEEVS**
  - Archivo: "Video Virginia Sapp 2026(2).mp4"
  - Archivo: "PREESCOLAR.mp4"
  - Espacio para cargar más videos

### Tareas Específicas
1. **Feed de Instagram**
   - Integrar widgets de Instagram
   - Mostrar publicaciones recientes

2. **Galería de fotos**
   - Lightbox/modal para ver imágenes
   - Responsive grid layout

3. **Reproductor de videos**
   - Reproducción de archivos locales
   - Opción de cargar nuevos videos

---

## 8️⃣ SECCIÓN "ACTIVIDADES" 

### 8.1 Sugerencias/Encuesta
- [ ] Título: "Comparte tus sugerencias y mejoras"
- [ ] Subtítulo: "Tu opinión nos importa"

**Preguntas a incluir:**
1. "¿En qué nivel está inscrito su hijo/a?"
2. "¿Qué área nos va a reportar?" (Académica / Administrativa)
3. "¿Cómo podemos contactarte?"

**Base de datos:**
- [ ] Guardar respuestas
- [ ] Email de destino: `administracion.general@virginiasapp.edu.hn`
- [ ] Subject: "OPORTUNIDAD DE MEJORA CEEVS"
- [ ] Mapear trazabilidad de sugerencias

### 8.2 Juegos Interactivos
- [ ] **Sopa de letras** (ACTUALIZAR)
  - Revisar contenido
  - Verificar datos
  - Renovar regularmente

- [ ] Otros juegos educativos
  - Renovar contenido

### Tareas Específicas
1. **Formulario de encuesta**
   - Validación de datos
   - Almacenamiento seguro

2. **Gestión de juegos**
   - Actualizar regularmente
   - Verificar funcionalidad

3. **Email de seguimiento**
   - Configurar envío automático
   - Incluir Subject específico

---

## 9️⃣ SECCIÓN "MISIÓN EVANGELÍSTICA"

### Contenido Requerido
- [ ] Espacio para videos evangelísticos
- [ ] Espacio para artículos evangelísticos
- [ ] Referencia: "e625 – Discipulado Generacional"

### Elementos Dinámicos
1. **Videos**
   - [ ] Espacio para cargar/subir videos
   - [ ] Reproductor integrado
   - [ ] Gestión de contenido

2. **Versículos**
   - [ ] Versículo que se actualiza dinámicamente
   - [ ] Cambio periódico de versículo
   - [ ] Base de datos de versículos

### Tareas Específicas
1. **Interfaz de carga de videos**
   - CMS simple para agregar videos
   - Validación de archivos

2. **Sistema de versículos**
   - Mostrar versículo del día
   - Actualización automática
   - Almacenar en base de datos

---

## 🔟 OBSERVACIONES DEL EQUIPO IT - CORRECCIONES PRIORITARIAS

### Problemas a Resolver (CRÍTICOS)

- [ ] **Eliminar botón "Continuar"** en selector de nivel (Admisiones)
- [ ] **Revisar ortografía** - Errores generales en la página
- [ ] **Organizar por secciones** - Dividir lo que no sea scroll
- [ ] **Reducir contenido** - Página muy cargada
- [ ] **Mejorar Admisiones** - Centrar información
- [ ] **Botón "Comenzar Proceso"** → Debe ir a EDUBOX
- [ ] **Botones de solicitud** - Verificar funcionalidad
- [ ] **Sopa de letras** - Actualizar y verificar
- [ ] **Verificar datos de actividades** - Revisar información
- [ ] **Email "Enviar hoja de vida"** - Debe redirigir a empleosadieeds@gmail.com

---

## 📊 RESUMEN DE TAREAS POR SECCIÓN

| Sección | Tareas | Prioridad | Estado |
|---------|--------|-----------|--------|
| Navegación | 5 tareas | 🔴 ALTA | ⏳ Pendiente |
| Quiénes Somos | 4 tareas | 🔴 ALTA | ⏳ Pendiente |
| Sobre Nosotros | 8 tareas | 🟠 MEDIA | ⏳ Pendiente |
| Admisiones | 6 tareas | 🔴 ALTA | ⏳ Pendiente |
| Contacto | 5 tareas | 🟠 MEDIA | ⏳ Pendiente |
| Galería | 3 tareas | 🟡 BAJA | ⏳ Pendiente |
| Actividades | 4 tareas | 🟠 MEDIA | ⏳ Pendiente |
| Misión Evangelística | 3 tareas | 🟡 BAJA | ⏳ Pendiente |
| Correcciones IT | 10 tareas | 🔴 ALTA | ⏳ Pendiente |

---

## 📝 ARCHIVOS Y RECURSOS NECESARIOS

### Archivos a Obtener/Crear
- [ ] `logo principal.png` - Logo institucional
- [ ] `Sobre nosotros CEEVS.pdf` - Documento PDF
- [ ] `VALORES V5.pdf` - Documento de valores
- [ ] `Video Virginia Sapp 2026(2).mp4` - Video principal
- [ ] `PREESCOLAR.mp4` - Video preescolar
- [ ] `JD.png` - Foto de Junta Directiva
- [ ] Fotos genéricas de niños y docentes
- [ ] Fotos del equipo directivo (si no están disponibles, usar genéricas)

### Información Adicional
- [ ] Link de Instagram Reel: `https://www.instagram.com/reel/DUodgArEq5F/?igsh=anFjdWozcjI0aDFz`
- [ ] Portal EDUBOX: `https://portal.edubox.app/login/virginiasapp`
- [ ] Email empleos: `empleosadieeds@gmail.com`
- [ ] Email administrativo: `administracion.general@virginiasapp.edu.hn`
- [ ] WhatsApp Primaria: `+504 9221-5752`
- [ ] WhatsApp Secundaria: `+504 9270-0210`

---

## 🎯 PRÓXIMOS PASOS

1. **Fase 1**: Revisión de ortografía y correcciones IT
2. **Fase 2**: Implementar navegación superior mejorada
3. **Fase 3**: Secciones principales (Quiénes somos, Sobre nosotros)
4. **Fase 4**: Admisiones y formularios
5. **Fase 5**: Galería, actividades y sección evangelística
6. **Fase 6**: Testing y optimización

---

**Documento actualizado**: 26 de mayo de 2026
**Generado desde**: Página web.xlsx
