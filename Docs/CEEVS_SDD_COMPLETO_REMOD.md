# CEEVS — PLAN SDD COMPLETO DE REMODELACIÓN WEB  
## Requerimientos funcionales, institucionales, técnicos, marketing, UX, SEO y ejecución para Claude Code

**Proyecto:** Remodelación del sitio web institucional del Centro Educativo Evangélico Virginia Sapp  
**Institución:** CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP  
**Repositorio objetivo:** `JIsaacG/virginiasapp`  
**Stack actual esperado:** HTML + CSS modular + JavaScript vanilla  
**Enfoque:** Spec-Driven Development (SDD)  
**Documento:** SDD integral posterior a Fase 1  
**Uso:** Copiar/entregar este `.md` a Claude Code para implementación ordenada por fases.

---

# 0. Instrucciones obligatorias para Claude Code

Claude Code debe implementar este plan como contratos ejecutables, no como sugerencias generales.

## Reglas globales

1. **No cambiar de stack en esta fase integral** salvo instrucción explícita del propietario del proyecto.
2. **No introducir frameworks nuevos** como React, Vue, Angular, Next.js, Astro, Tailwind o Bootstrap.
3. Mantener el enfoque de sitio estático con HTML/CSS/JS, salvo en las secciones donde se especifique que una funcionalidad queda para Fase CMS/backend.
4. Mantener la arquitectura modular CSS actual.
5. Mantener el patrón JavaScript existente basado en `App.register()` / `App.init()`.
6. No dejar enlaces muertos:
   - Prohibido `href="#"` en CTAs y navegación principal.
   - Prohibido `javascript:void(0)` en CTAs.
7. No usar `onclick`, `onmouseover`, `onmouseout`, `onfocus`, `onblur` inline.
8. No inventar contenido doctrinal, académico o institucional no aprobado.
9. Si falta contenido oficial, crear placeholders marcados con `PENDING_CONTENT_*`.
10. Centralizar datos críticos en archivos de configuración.
11. Cada requerimiento debe poder validarse con:
    - revisión DOM,
    - prueba manual,
    - extensión del script `generate-pages.py`,
    - o checklist QA.
12. No simular formularios como si fueran envíos reales. Si no hay backend, usar WhatsApp, `mailto:` o EDUBOX.
13. No publicar fotos reales de alumnos, docentes o padres sin confirmación institucional de autorización.
14. Cuidar siempre:
    - accesibilidad,
    - rendimiento,
    - claridad de navegación,
    - conversión de admisiones,
    - reputación institucional,
    - mantenibilidad.

---

# 1. Contexto del proyecto

El sitio actual es un boceto/prototipo avanzado que requiere remodelación para convertirse en una plataforma institucional clara, confiable, funcional y orientada a admisiones.

La institución solicitó cambios en:

- Identidad institucional.
- Navegación.
- Contenido.
- Diseño visual.
- Integración con EDUBOX.
- Admisiones.
- Contacto.
- Empleos.
- Misión evangelística.
- Quiénes somos.
- Galería.
- Actividades.
- Sugerencias.
- SEO.
- Accesibilidad.
- Seguridad.
- Mantenibilidad.
- Futuro CMS/back-office.

---

# 2. Objetivo general del SDD

Transformar el sitio actual en una web institucional profesional que funcione como:

1. Herramienta de admisión.
2. Plataforma informativa para padres.
3. Refuerzo de identidad cristiana/evangelística.
4. Vitrina institucional.
5. Canal de contacto directo.
6. Punto de acceso a EDUBOX.
7. Base técnica mantenible para crecer hacia CMS y bilingüe.

---

# 3. Arquitectura objetivo

## 3.1 Mantener estructura base

```txt
/
├── index.html
├── quienes-somos.html
├── admisiones.html
├── contactenos.html
├── interactivo.html
├── inventario.html
├── recuerdos.html
├── mision-evangelistica.html
├── comunicados.html
├── capacitate.html
├── sugerencias.html
├── css/
├── js/
├── assets/
├── components/
├── data/
└── docs/
```

## 3.2 Archivos de configuración requeridos

```txt
data/site-config.json
data/navigation.json
data/contacts.json
data/redirects.json
data/content-home.json
data/content-quienes-somos.json
data/content-admisiones.json
data/content-mision-evangelistica.json
data/content-galeria.json
data/content-actividades.json
data/content-comunicados.json
data/content-sugerencias.json
```

## 3.3 Documentación requerida

```txt
docs/sdd/FASE_1_NAV_IDENTIDAD.md
docs/sdd/FASE_2_ADMISIONES_EDUBOX_WHATSAPP.md
docs/sdd/FASE_3_QUIENES_SOMOS_INSTITUCIONAL.md
docs/sdd/FASE_4_CONTACTO_EMPLEOS_SUGERENCIAS.md
docs/sdd/FASE_5_CONTENIDO_GALERIA_ACTIVIDADES_MISION.md
docs/sdd/FASE_6_SEO_ACCESIBILIDAD_PERFORMANCE_SEGURIDAD.md
docs/DEPLOYMENT.md
docs/CONTENT_GUIDE.md
docs/QA_CHECKLIST.md
```

---

# 4. Datos institucionales base

## 4.1 Nombre oficial

```txt
CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP
```

## 4.2 Nombre corto

```txt
CEEVS
```

## 4.3 Logo

```txt
assets/logo principal.png
```

Si el archivo no existe, Claude Code debe preparar la referencia y dejar:

```html
<!-- PENDING_ASSET_LOGO_PRINCIPAL -->
```

## 4.4 Colores principales

```css
--ceevs-blue: #0B67A5;
--ceevs-sky: #3BA6E0;
--ceevs-gold: #D7AF4A;
--ceevs-brown: #6A2407;
--ceevs-orange: #F57C00;
--ceevs-black: #1E1E1E;
--ceevs-white: #FFFFFF;
```

## 4.5 Idiomas

```txt
Español
Inglés
```

Implementación inicial recomendada:

- Fase actual: preparar selector visual y arquitectura.
- Fase posterior: traducción completa aprobada.

## 4.6 EDUBOX oficial

```txt
https://portal.edubox.app/login/virginiasapp
```

Toda acción principal de admisión debe apuntar a esta URL, salvo que se defina explícitamente un flujo distinto.

---

# 5. Mapa general de fases

## Fase 1 — Navegación e identidad base

Ya definida en documento separado. Incluye:

- Navbar.
- Nombre oficial.
- Logo.
- Paleta base.
- Misión evangelística en navegación.
- Página base de misión evangelística.
- Menú móvil.
- EDUBOX en Portal y Solicitar admisión.

## Fase 2 — Admisiones, EDUBOX, WhatsApp y quiz automático

Prioridad crítica de conversión.

## Fase 3 — Quiénes somos institucional

Página estructurada por tabs/acordeones:

- Misión.
- Visión.
- Valores.
- Declaración de fe.
- Acreditación ACSI.
- Historia.
- Perfil del egresado.
- LAES.
- Equipo directivo.
- Junta directiva.

## Fase 4 — Contacto, empleos y sugerencias

Eliminar simulaciones. Usar canales reales.

## Fase 5 — Contenido, galería, misión evangelística y actividades

Completar experiencia institucional.

## Fase 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue

Preparar entrega final.

## Fase 7 — CMS/back-office opcional

No obligatorio para primera entrega. Se deja especificado para evolución.

---

# 6. FASE 2 — Admisiones, EDUBOX, WhatsApp y quiz automático

## 6.1 Objetivo

Corregir y optimizar el flujo principal de admisión para que el visitante pueda:

1. Entender niveles educativos.
2. Identificar el nivel ideal mediante quiz.
3. Ir a EDUBOX.
4. Contactar por WhatsApp según nivel.
5. No caer en formularios falsos ni enlaces internos sin acción concreta.

---

## SDD-F2-ADM-001 — URL única oficial de EDUBOX

### Tipo
Funcional / Integración externa

### Input
Usuario hace clic en cualquier CTA principal de admisión.

### Process
El sistema abre la URL oficial de EDUBOX en una pestaña nueva.

### Output
Se abre:

```txt
https://portal.edubox.app/login/virginiasapp
```

### Selectores/elementos afectados

Botones o enlaces con texto:

```txt
Solicitar admisión
Solicitar admisión ahora
Matricúlate
Matrícula en línea
Empezar proceso
Empezar el proceso
Portal
Soy padre / alumno
Ir a matrícula
Ingresar a plataforma
```

### Reglas

1. Todos los CTAs principales deben apuntar a EDUBOX.
2. Usar siempre:
   ```html
   target="_blank" rel="noopener"
   ```
3. No usar URL alternativa salvo que esté documentada en `data/redirects.json`.
4. No apuntar a `#contacto` para CTA principal de matrícula.
5. Si un botón es de “más información”, puede ir a WhatsApp, no a formulario simulado.

### Acceptance Criteria

- Ningún CTA principal de admisión apunta a `#contacto`.
- Ningún CTA principal de admisión apunta a `#admisiones` si su intención es iniciar matrícula.
- Todos los enlaces EDUBOX tienen `target="_blank"` y `rel="noopener"`.
- `data/redirects.json` contiene una sola URL EDUBOX principal.

---

## SDD-F2-ADM-002 — Mapa único de redirecciones

### Tipo
Mantenibilidad / Conversión

### Archivo requerido

```txt
data/redirects.json
```

### Contenido esperado

```json
{
  "edubox": {
    "label": "EDUBOX",
    "url": "https://portal.edubox.app/login/virginiasapp",
    "target": "_blank",
    "rel": "noopener"
  },
  "whatsapp": {
    "general": {
      "label": "WhatsApp general",
      "url": "https://wa.me/50492215752?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp."
    },
    "primaria": {
      "label": "WhatsApp Primaria",
      "url": "https://wa.me/50492215752?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Primaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp."
    },
    "secundaria": {
      "label": "WhatsApp Secundaria",
      "url": "https://wa.me/50492700210?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Secundaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp."
    }
  },
  "jobs": {
    "mailto": "mailto:rrhh@virginiasapp.edu.hn?subject=Aplicaci%C3%B3n%20de%20empleo%20-%20%5BNombre%5D&body=Estimado%20equipo%20de%20RRHH%2C%0A%0AAdjunto%20mi%20hoja%20de%20vida..."
  },
  "suggestions": {
    "mailto": "mailto:administracion.general@virginiasapp.edu.hn?subject=OPORTUNIDAD%20DE%20MEJORA%20CEEVS"
  }
}
```

### Pendientes permitidos

Si el correo de RRHH no está confirmado, usar:

```txt
PENDING_DECISION_HR_EMAIL
```

Si el correo de sugerencias no está confirmado, usar:

```txt
PENDING_DECISION_SUGGESTIONS_EMAIL
```

### Acceptance Criteria

- Existe `data/redirects.json`.
- Todos los CTAs documentados usan la fuente de verdad.
- No hay URLs críticas duplicadas sin justificación.

---

## SDD-F2-ADM-003 — Niveles educativos institucionales

### Tipo
Contenido / Admisiones

### Input
Usuario entra a `admisiones.html#niveles`.

### Process
El sitio muestra las opciones educativas de manera clara.

### Output
Cards de niveles:

```txt
Preescolar
Primaria Bilingüe
Secundaria
```

### Contenido mínimo por card

```json
{
  "name": "Preescolar",
  "grades": "Pre-Kínder y Kínder",
  "description": "Texto breve aprobado o placeholder institucional.",
  "features": ["Formación integral", "Valores cristianos", "Acompañamiento"],
  "ctaLabel": "Matricula Preescolar",
  "ctaTarget": "whatsapp-primaria-or-edubox"
}
```

### Reglas

1. Cada card debe tener:
   - nombre,
   - grados,
   - breve descripción,
   - bullets,
   - CTA.
2. El CTA no puede estar vacío.
3. Usar imágenes institucionales si existen.
4. Si no existen imágenes, usar placeholder con `PENDING_ASSET_NIVELES`.

### Acceptance Criteria

- Los tres niveles se muestran de forma consistente.
- El layout no se desborda en móvil.
- Los CTAs funcionan.
- No se usa información no verificada como definitiva.

---

## SDD-F2-ADM-004 — Quiz automático sin botón Continuar

### Tipo
Funcional / UX / Conversión

### Input
Usuario selecciona una opción del quiz.

### Process
El sistema guarda la respuesta y avanza automáticamente.

### Output
Siguiente pregunta o resultado final.

### Reglas

1. Eliminar o esconder botones “Continuar” en pasos intermedios.
2. Al seleccionar una opción:
   - marcar opción seleccionada,
   - guardar valor,
   - esperar 250–450 ms para feedback visual,
   - avanzar al siguiente paso.
3. En la última pregunta:
   - seleccionar opción,
   - guardar valor,
   - mostrar resultado automáticamente.
4. Mantener botón “Atrás” opcional.
5. Mantener botón “Repetir quiz”.
6. El resultado debe sugerir:
   - Preescolar,
   - Primaria,
   - Secundaria,
   - o contacto personalizado.
7. No guardar leads en `localStorage` como si fuera envío real a la institución.
8. Si se conserva captura de datos, debe llamarse claramente “guardar localmente” o cambiarse a WhatsApp/mailto.

### Acceptance Criteria

- No existe botón visible `Continuar` en pasos 1, 2 y 3.
- La selección de edad avanza sola.
- La selección de última pregunta muestra resultado.
- El quiz funciona con mouse y teclado.
- No se rompe gamificación existente.
- No hay error JS en consola.

---

## SDD-F2-ADM-005 — Resultado del quiz con acción concreta

### Tipo
Conversión / UX

### Input
Usuario termina quiz.

### Process
Sistema calcula recomendación.

### Output
Muestra recomendación y acciones.

### Acciones requeridas

Para resultado Preescolar:

```txt
CTA 1: Solicitar admisión en EDUBOX
CTA 2: Consultar por WhatsApp Primaria
```

Para resultado Primaria:

```txt
CTA 1: Solicitar admisión en EDUBOX
CTA 2: Consultar por WhatsApp Primaria
```

Para resultado Secundaria:

```txt
CTA 1: Solicitar admisión en EDUBOX
CTA 2: Consultar por WhatsApp Secundaria
```

Para resultado inseguro:

```txt
CTA 1: Hablar por WhatsApp
CTA 2: Ver niveles educativos
```

### Acceptance Criteria

- Cada resultado tiene al menos dos CTAs.
- Ningún resultado termina sin acción.
- WhatsApp abre con mensaje prellenado.
- EDUBOX abre con `target="_blank"` y `rel="noopener"`.

---

## SDD-F2-ADM-006 — Centrado y jerarquía visual de proceso de admisión

### Tipo
Diseño / UX

### Input
Usuario ve sección de proceso de admisión.

### Process
El sistema muestra pasos ordenados y visualmente centrados.

### Output
Sección de proceso con pasos claros.

### Reglas

1. Mostrar máximo 4 pasos principales:
   - Solicita información.
   - Visita el colegio.
   - Entrevista familiar.
   - Matrícula / EDUBOX.
2. No mostrar textos largos.
3. No permitir elementos descentrados.
4. En móvil, mostrar pasos en columna.
5. CTA principal debe ser EDUBOX.

### Acceptance Criteria

- Pasos alineados.
- No hay textos desbordados.
- CTA principal visible.
- Sección comprensible en menos de 10 segundos.

---

# 7. FASE 3 — Quiénes somos institucional

## 7.1 Objetivo

Convertir `quienes-somos.html` en una página institucional clara, estructurada y navegable, evitando scroll excesivo.

Debe implementar secciones tipo tabs/acordeones para:

```txt
Misión
Visión
Valores fundamentales
Declaración de fe
Acreditación ACSI
Nuestra historia
Perfil del egresado
LAES
Equipo directivo
Junta directiva
```

---

## SDD-F3-QS-001 — Estructura tabulada o desplegable

### Tipo
Arquitectura de información

### Input
Usuario entra a `quienes-somos.html`.

### Process
Sistema muestra navegación interna por secciones.

### Output
Tabs, pills, menú lateral o acordeones.

### Reglas

1. No presentar todo como una página lineal interminable.
2. El usuario debe poder saltar a cada bloque.
3. En móvil, usar acordeones o tabs scrollables.
4. Mantener URL con anchors si es posible:
   - `#mision`
   - `#vision`
   - `#valores`
   - `#declaracion-fe`
   - `#acsi`
   - `#historia`
   - `#perfil-egresado`
   - `#laes`
   - `#equipo-directivo`
   - `#junta-directiva`

### Acceptance Criteria

- Existe navegación interna.
- Cada sección es accesible por anchor.
- No hay scroll excesivo sin estructura.
- Funciona en móvil.

---

## SDD-F3-QS-002 — Misión y visión

### Tipo
Contenido institucional

### Input
Usuario selecciona Misión o Visión.

### Process
Sistema muestra contenido oficial o placeholder.

### Output
Bloques visuales claros.

### Reglas

1. No inventar misión final.
2. Si falta texto oficial, usar:
   ```html
   <!-- PENDING_CONTENT_MISION_OFICIAL -->
   ```
3. La misión evangélica debe destacarse también desde home o enlace a página de misión evangelística.
4. La redacción debe ser breve y clara.

### Acceptance Criteria

- Sección Misión existe.
- Sección Visión existe.
- Textos tienen jerarquía visual.
- No hay contenido inventado sin marcar.

---

## SDD-F3-QS-003 — Valores fundamentales

### Tipo
Contenido / UX

### Input
Usuario abre Valores.

### Process
Sistema muestra valores en cards.

### Output
Cards o acordeones de valores.

### Reglas

1. Cada valor debe tener:
   - título,
   - descripción breve,
   - icono o elemento visual.
2. Evitar párrafos extensos.
3. Mantener tono cristiano/institucional.

### Acceptance Criteria

- Valores no se muestran como bloque largo.
- Cards responden correctamente en móvil.
- Contenido no se duplica.

---

## SDD-F3-QS-004 — Declaración de fe

### Tipo
Contenido institucional / Identidad cristiana

### Input
Usuario abre Declaración de fe.

### Process
Sistema muestra declaración en estructura legible.

### Output
Acordeón o cards por punto doctrinal.

### Reglas

1. No inventar doctrina.
2. Usar contenido existente si ya está en el sitio.
3. Si falta contenido final, dejar `PENDING_CONTENT_DECLARACION_FE`.
4. Evitar bloques extensos sin diseño.

### Acceptance Criteria

- Existe sección Declaración de fe.
- Es legible.
- No hay contenido doctrinal falso.

---

## SDD-F3-QS-005 — Acreditación ACSI

### Tipo
Contenido institucional / Credibilidad

### Input
Usuario abre sección Acreditación.

### Process
Sistema muestra acreditación ACSI.

### Output
Bloque con texto resumido.

### Contenido base permitido

```txt
Acreditada por Association of Christian Schools International, nuestra institución reafirma su compromiso con una educación cristiana de excelencia, basada en estándares internacionales de calidad académica, formación espiritual y mejora continua.
```

### Reglas

1. Debe mencionar:
   - Association of Christian Schools International.
   - educación cristiana de excelencia.
   - estándares internacionales.
   - formación espiritual.
   - mejora continua.
2. Debe poder ampliarse con más párrafos en acordeón.
3. Si hay logo ACSI oficial, usarlo solo si la institución lo proporciona.

### Acceptance Criteria

- Sección ACSI existe.
- Texto es legible.
- No hay logo externo sin autorización.
- La sección fortalece credibilidad institucional.

---

## SDD-F3-QS-006 — Perfil del estudiante egresado

### Tipo
Contenido académico / Institucional

### Input
Usuario abre Perfil del Egresado.

### Process
Sistema agrupa contenido por categorías.

### Output
Secciones:

```txt
Conocimientos
Actitudes
Habilidades
Logros de aprendizaje esperados
```

### Reglas

1. No mostrar el perfil como captura o imagen únicamente.
2. El texto debe ser accesible.
3. La imagen de logros puede acompañar, pero no reemplazar texto.
4. Si el contenido no está limpio, usar resumen y marcar pendiente.

### Acceptance Criteria

- Existen las categorías.
- Contenido legible.
- Imagen con `alt`.
- Responsive en móvil.

---

## SDD-F3-QS-007 — LAES

### Tipo
Contenido académico

### Input
Usuario abre LAES.

### Process
Sistema muestra explicación o placeholder.

### Output
Bloque LAES.

### Reglas

1. Si no hay definición final, usar:
   ```html
   <!-- PENDING_CONTENT_LAES -->
   ```
2. Si existe imagen oficial, incluir con alt.
3. No inventar descripción técnica extensa.

### Acceptance Criteria

- Sección LAES existe.
- El contenido pendiente está marcado si falta.
- No queda enlace roto.

---

## SDD-F3-QS-008 — Equipo directivo

### Tipo
Contenido institucional / Interacción

### Input
Usuario abre Equipo Directivo.

### Process
Sistema muestra cards de personas.

### Output
Cards con nombre, cargo, foto o placeholder y resumen.

### Personas base

```txt
Sara Corrales — Directora Ejecutiva
Dessiré Hulse — Directora Secundaria
Ana Ávila — Directora Primaria
Diana Vásquez — Administradora General
Nadia Irula — Coordinadora de Talento Humano
Martha López — Coordinadora de Pastoral
Rosa Armijo — Especialista de Español
```

### Reglas

1. Cada card debe abrir resumen en modal/acordeón.
2. Si no hay foto, usar placeholder institucional.
3. No usar fotos genéricas realistas de personas si pueden confundirse con personal real.
4. Cards accesibles por teclado.
5. Resumen no debe inventarse si falta confirmación.

### Acceptance Criteria

- Todas las personas base aparecen.
- Cada persona tiene cargo.
- Hay interacción para ver resumen.
- Funciona en móvil.
- No hay fotos engañosas.

---

## SDD-F3-QS-009 — Junta directiva

### Tipo
Contenido institucional

### Input
Usuario abre Junta Directiva.

### Process
Sistema muestra tabla o cards.

### Output
Junta directiva institucional.

### Reglas

1. Si nombres/cargos no están confirmados, usar `PENDING_CONTENT_JUNTA_DIRECTIVA`.
2. Si hay imagen oficial, puede mostrarse como apoyo.
3. Debe existir texto accesible, no solo imagen.

### Acceptance Criteria

- Sección Junta Directiva existe.
- Contenido no queda solo en imagen.
- Layout responsive.

---

# 8. FASE 4 — Contacto, empleos y sugerencias

## 8.1 Objetivo

Corregir todos los flujos de contacto y eliminar simulaciones.

---

## SDD-F4-CONTACT-001 — Contacto sin formulario falso

### Tipo
Funcional / Contacto

### Input
Usuario entra a `contactenos.html`.

### Process
Sistema muestra canales directos.

### Output
Contacto por:

```txt
WhatsApp Primaria
WhatsApp Secundaria
Correo institucional
Google Maps
Horario
Redes sociales
```

### Reglas

1. Si la institución confirmó “No forms”, eliminar formulario público o convertirlo en bloque informativo.
2. Si se deja formulario, debe tener destino real; no simular.
3. No mostrar teléfonos placeholder como `+504 2200-0000`.
4. No mostrar correos no aprobados como definitivos.

### Acceptance Criteria

- No hay botón que diga “Solicitud enviada” sin haber enviado nada.
- Los WhatsApp funcionan.
- Dirección tiene enlace a Maps.
- No hay formularios falsos.

---

## SDD-F4-CONTACT-002 — WhatsApp por nivel

### Tipo
Integración externa / Contacto

### Input
Usuario hace clic en WhatsApp.

### Process
Abre WhatsApp con mensaje prellenado.

### Output

Primaria:

```txt
https://wa.me/50492215752?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Primaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp.
```

Secundaria:

```txt
https://wa.me/50492700210?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20de%20Secundaria%20del%20Centro%20Educativo%20Evang%C3%A9lico%20Virginia%20Sapp.
```

### Reglas

1. Usar `target="_blank"` y `rel="noopener"`.
2. Mantener mensajes con trazabilidad.
3. No usar número placeholder.
4. Botón flotante puede usar WhatsApp general.

### Acceptance Criteria

- WhatsApp Primaria abre número correcto.
- WhatsApp Secundaria abre número correcto.
- El mensaje está prellenado.
- Los enlaces son seguros.

---

## SDD-F4-CONTACT-003 — Google Maps

### Tipo
Ubicación

### Input
Usuario hace clic en dirección.

### Process
Sistema abre Google Maps.

### Output
Mapa de ubicación institucional.

### Reglas

1. Usar enlace oficial de Maps si se proporciona.
2. Si no se proporciona, dejar `PENDING_URL_GOOGLE_MAPS`.
3. No incrustar iframe pesado sin necesidad.
4. Si se incrusta mapa, usar lazy loading.

### Acceptance Criteria

- Dirección visible.
- Enlace a Maps funciona o queda marcado pendiente.
- No hay mapa roto.

---

## SDD-F4-JOBS-001 — Trabaja con nosotros

### Tipo
Empleos / Integración correo

### Input
Usuario hace clic en “Enviar hoja de vida”.

### Process
Sistema abre cliente de correo.

### Output
`mailto:` prellenado.

### Correo recomendado

```txt
rrhh@virginiasapp.edu.hn
```

### Si el cliente confirma otro

Usar:

```txt
PENDING_DECISION_HR_EMAIL
```

o el correo aprobado.

### Mailto esperado

```txt
mailto:rrhh@virginiasapp.edu.hn?subject=Aplicación%20de%20empleo%20-%20[Nombre]&body=Estimado%20equipo%20de%20RRHH%2C%0A%0AAdjunto%20mi%20hoja%20de%20vida...
```

### Reglas

1. El botón no puede apuntar a `#contacto`.
2. Debe abrir correo.
3. Debe tener asunto.
4. Debe tener cuerpo sugerido.
5. La sección debe explicar brevemente qué enviar.

### Acceptance Criteria

- Clic abre mailto.
- No hay enlace interno falso.
- Texto claro para postulantes.

---

## SDD-F4-FEEDBACK-001 — Página/sección de sugerencias

### Tipo
Mejora continua / Comunicación institucional

### Input
Usuario entra a `sugerencias.html`.

### Process
Sistema muestra canal para oportunidades de mejora.

### Output
Formulario mailto o estructura sin backend.

### Campos sugeridos

```txt
Nombre
Área
Grado
Nivel
Mensaje
Cómo podemos contactarte
```

### Correo destino

```txt
administracion.general@virginiasapp.edu.hn
```

### Subject

```txt
OPORTUNIDAD DE MEJORA CEEVS
```

### Reglas

1. Si no hay backend, usar `mailto:`.
2. No simular base de datos.
3. Explicar que se abrirá el cliente de correo.
4. Incluir trazabilidad en subject.
5. Si se requiere base de datos, mover a Fase CMS.

### Acceptance Criteria

- Existe `sugerencias.html` o sección equivalente.
- El envío genera correo prellenado.
- No hay envío falso.
- El usuario entiende el proceso.

---

## SDD-F4-EXALUMNOS-001 — Comunidad de egresados

### Tipo
Contenido / Comunidad

### Input
Usuario entra a sección Egresados.

### Process
Sistema muestra invitación y CTA.

### Output
CTA a correo/WhatsApp o formulario real futuro.

### Reglas

1. Si no hay base de datos, no prometer registro automático.
2. CTA puede abrir WhatsApp o correo.
3. Si hay video de egresado pendiente, marcar.

### Acceptance Criteria

- El bloque no promete base de datos inexistente.
- CTA funciona.
- Video pendiente está marcado si aplica.

---

# 9. FASE 5 — Contenido, galería, actividades y misión evangelística

## 9.1 Objetivo

Completar el contenido institucional y experiencial del sitio.

---

## SDD-F5-HOME-001 — Misión evangelística visible en inicio

### Tipo
Contenido / Identidad / Marketing

### Input
Usuario entra a `index.html`.

### Process
Sistema muestra misión evangelística sobre la línea de pliegue o en bloque destacado temprano.

### Output
Card o sección de misión evangelística.

### Reglas

1. Debe aparecer antes de secciones largas.
2. Debe conectar con `mision-evangelistica.html`.
3. Si falta texto oficial, usar placeholder marcado.
4. No inventar declaración doctrinal final.
5. Debe reforzar identidad cristiana.

### Acceptance Criteria

- Misión evangelística visible en home.
- Existe CTA a página dedicada.
- No está enterrada al final del sitio.

---

## SDD-F5-MISION-001 — Página completa de misión evangelística

### Tipo
Contenido / Identidad cristiana

### Input
Usuario abre `mision-evangelistica.html`.

### Process
Sistema muestra página dedicada.

### Output
Secciones:

```txt
Propósito evangelístico
Versículo / devocional destacado
Recursos o artículos
Videos
CTA comunidad / admisiones
```

### Reglas

1. Preparar sección para videos.
2. Preparar sección para artículos.
3. Preparar sección de versículo.
4. No usar contenido no aprobado.
5. Si hay referencia e625 o discipulado generacional, dejar bloque preparado.

### Acceptance Criteria

- Página tiene estructura completa.
- Puede alojar videos.
- Puede alojar artículos.
- SEO básico configurado.
- No hay contenido final inventado.

---

## SDD-F5-GAL-001 — Galería institucional

### Tipo
Contenido visual

### Input
Usuario abre Galería.

### Process
Sistema muestra fotos y videos.

### Output
Galería organizada.

### Categorías recomendadas

```txt
Académico
Deportes
Cultural
Graduaciones
Vida escolar
Videos CEEVS
Redes sociales
```

### Reglas

1. Mostrar primero enlaces a redes oficiales si se solicita.
2. Usar fotos institucionales si existen.
3. Si se usan fotos genéricas, marcarlas como placeholders.
4. Videos deben tener controles.
5. Imágenes con `loading="lazy"`.
6. Imágenes con `alt`.
7. No bloquear rendimiento con videos pesados autoplay.

### Acceptance Criteria

- Galería carga en escritorio y móvil.
- No hay imágenes rotas.
- Videos no rompen layout.
- Fotos tienen alt.
- Sección no pesa innecesariamente.

---

## SDD-F5-NEWS-001 — Comunicados y noticias

### Tipo
Contenido / Comunicación

### Archivo/página

```txt
comunicados.html
```

### Input
Usuario abre Comunicados y noticias.

### Process
Sistema lista comunicados.

### Output
Cards o lista con:

```txt
Título
Fecha
Categoría
Resumen
Última actualización
CTA leer más
```

### Estructura JSON sugerida

```json
{
  "items": [
    {
      "id": "comunicado-001",
      "title": "Título del comunicado",
      "date": "2026-04-01",
      "category": "Comunicado",
      "summary": "Resumen breve.",
      "content": "Contenido completo.",
      "lastUpdated": "2026-04-01",
      "image": null,
      "status": "published"
    }
  ]
}
```

### Reglas

1. No crear CMS todavía.
2. Usar archivo JSON o HTML estático.
3. Mostrar fecha.
4. Mostrar última actualización.
5. Preparar para CMS futuro.

### Acceptance Criteria

- Página existe.
- Navbar puede enlazar si se aprueba.
- Hay estructura para comunicados.
- No hay contenido ficticio sin marcar.

---

## SDD-F5-CALENDAR-001 — Calendario escolar

### Tipo
Contenido / Servicio a padres

### Input
Usuario consulta calendario.

### Process
Sistema muestra fechas importantes.

### Output
Lista o cards de fechas.

### Campos

```txt
Fecha
Título
Descripción
Categoría
Estado
```

### Reglas

1. Si no hay fechas oficiales, usar `PENDING_CONTENT_CALENDARIO`.
2. No inventar fechas escolares.
3. Puede quedar como sección dentro de Comunicados.

### Acceptance Criteria

- Existe estructura para calendario.
- No hay fechas inventadas.
- Diseño responsive.

---

## SDD-F5-ACT-001 — Actividades y juegos renovados

### Tipo
Interactividad / Contenido educativo

### Input
Usuario entra a `interactivo.html`.

### Process
Sistema muestra juegos actualizados.

### Output
Juegos categorizados.

### Categorías

```txt
Padres
Alumnos
Docentes
Todos
```

### Reglas

1. Renovar contenido desactualizado.
2. Sopa de letras debe usar palabras aprobadas.
3. Trivia bíblica debe ser revisada.
4. Cada juego debe tener:
   - título,
   - audiencia,
   - instrucciones,
   - estado activo.
5. Si no hay contenido validado, marcar pendiente.

### Acceptance Criteria

- Juegos funcionan.
- Sopa de letras no usa palabras antiguas no aprobadas.
- No hay errores JS.
- Contenido no está desactualizado.

---

## SDD-F5-ACT-002 — Sopa de letras configurable

### Tipo
Juego / Configuración

### Input
Usuario abre sopa de letras.

### Process
Sistema carga palabras desde configuración.

### Output
Sopa de letras con palabras vigentes.

### Archivo sugerido

```txt
data/word-search.json
```

### Estructura

```json
{
  "words": [
    "FE",
    "AMOR",
    "SERVICIO",
    "RESPETO",
    "EXCELENCIA"
  ],
  "status": "pending-validation"
}
```

### Reglas

1. No hardcodear palabras en HTML.
2. Si palabras no están aprobadas, dejar status `pending-validation`.
3. Mostrar solo palabras aprobadas si `status=approved`.

### Acceptance Criteria

- Palabras vienen de configuración.
- No hay palabras antiguas si no están aprobadas.
- Juego sigue funcionando.

---

## SDD-F5-CAP-001 — Capacítate con nosotros

### Tipo
Nueva sección / Marketing institucional

### Archivo/página

```txt
capacitate.html
```

### Input
Usuario hace clic en Capacítate con nosotros.

### Process
Sistema muestra información de capacitaciones.

### Output
Página base con:

```txt
Hero
Descripción
Programas disponibles
CTA contacto
```

### Reglas

1. Si no hay contenido oficial, usar `PENDING_CONTENT_CAPACITATE`.
2. No inventar programas.
3. Preparar estructura para futuros cursos o capacitaciones.

### Acceptance Criteria

- Página existe si se incluye en navegación final.
- No hay enlaces rotos.
- Contenido pendiente marcado.

---

# 10. FASE 6 — SEO, accesibilidad, rendimiento, seguridad y despliegue

## 10.1 Objetivo

Preparar el sitio para publicación profesional.

---

## SDD-F6-SEO-001 — Titles y descriptions únicos

### Tipo
SEO

### Input
Crawler o navegador carga página.

### Process
Cada página entrega metadatos únicos.

### Output
`title` y `description` personalizados.

### Páginas mínimas

```txt
index.html
quienes-somos.html
admisiones.html
contactenos.html
interactivo.html
mision-evangelistica.html
comunicados.html
capacitate.html
sugerencias.html
```

### Acceptance Criteria

- Ninguna página tiene title duplicado.
- Ninguna página tiene description vacía.
- El nombre oficial aparece en metadatos clave.

---

## SDD-F6-SEO-002 — Open Graph

### Tipo
SEO / Redes sociales

### Output mínimo por página

```html
<meta property="og:title" content="">
<meta property="og:description" content="">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_HN">
<meta property="og:image" content="">
```

### Reglas

1. Si no hay imagen oficial, usar placeholder institucional.
2. No dejar `og:image` roto.
3. Mantener textos breves.

### Acceptance Criteria

- Open Graph completo en páginas principales.
- No hay URLs rotas.

---

## SDD-F6-SEO-003 — Sitemap y robots

### Tipo
SEO técnico

### Archivos requeridos

```txt
sitemap.xml
robots.txt
```

### Reglas

1. Incluir páginas públicas.
2. Excluir admin si existe.
3. Incluir canonical domain cuando se confirme dominio.
4. Si dominio no confirmado, usar `PENDING_DOMAIN_OFFICIAL`.

### Acceptance Criteria

- `sitemap.xml` existe.
- `robots.txt` existe.
- No bloquea páginas públicas principales.

---

## SDD-F6-ACC-001 — WCAG 2.1 AA

### Tipo
Accesibilidad

### Reglas

1. Contraste AA en texto.
2. Navegación por teclado.
3. Focus visible.
4. Labels en controles.
5. `alt` en imágenes.
6. `aria-expanded` en acordeones.
7. `aria-controls` en menú móvil.
8. No usar color como único indicador.

### Acceptance Criteria

- Menú accesible con teclado.
- Acordeones accesibles.
- Botones tienen nombres accesibles.
- Imágenes relevantes tienen alt.
- Contraste aprobado visualmente.

---

## SDD-F6-PERF-001 — Optimización de imágenes

### Tipo
Performance

### Reglas

1. Imágenes con `loading="lazy"` excepto hero principal.
2. Usar WebP si existen versiones.
3. Evitar imágenes externas innecesarias.
4. No cargar videos pesados en autoplay.
5. Comprimir assets.

### Acceptance Criteria

- No hay imágenes enormes sin optimizar.
- Galería usa lazy loading.
- Hero no bloquea carga excesivamente.

---

## SDD-F6-PERF-002 — Tiempo de carga objetivo

### Tipo
Performance

### Objetivo

```txt
Carga inicial inferior a 3 segundos en conexión 4G razonable.
```

### Reglas

1. Reducir scripts innecesarios.
2. Evitar autoplay pesado.
3. Usar defer en scripts si aplica.
4. Evitar base64 gigante en HTML.
5. Eliminar imágenes base64 del footer si existen.

### Acceptance Criteria

- HTML no contiene assets base64 pesados.
- Scripts no bloquean render innecesariamente.
- Imágenes principales optimizadas.

---

## SDD-F6-SEC-001 — Seguridad básica

### Tipo
Seguridad / Mantenibilidad

### Reglas

1. Enlaces externos con `rel="noopener"`.
2. No manejar credenciales en frontend.
3. No almacenar datos personales sensibles en `localStorage`.
4. No exponer claves API.
5. Si se usa formulario futuro, debe incluir protección antispam.

### Acceptance Criteria

- EDUBOX externo seguro.
- WhatsApp externo seguro.
- No hay claves en repo.
- No hay datos personales guardados localmente sin advertencia.

---

## SDD-F6-DEPLOY-001 — Documentación de despliegue

### Tipo
DevOps

### Archivo requerido

```txt
docs/DEPLOYMENT.md
```

### Debe incluir

```txt
Requisitos
Estructura del proyecto
Cómo probar localmente
Cómo desplegar en GitHub Pages / Cloudflare Pages / Vercel
Cómo configurar dominio
Cómo configurar SSL
Cómo validar enlaces
Cómo actualizar contenido básico
```

### Acceptance Criteria

- Documento existe.
- Un desarrollador puede desplegar sin explicación adicional.
- Incluye pendientes de dominio/hosting.

---

# 11. FASE 7 — CMS/back-office opcional

## 11.1 Objetivo

Permitir que la institución actualice contenido frecuente sin depender del desarrollador.

## SDD-F7-CMS-001 — CMS futuro

### Tipo
Mantenibilidad / Administración

### Alcance futuro

Contenido editable:

```txt
Noticias
Comunicados
Galería
Calendario
Devocional
Videos
Actividades
```

### Opciones recomendadas

```txt
Git-based CMS
Decap CMS
Google Sheets como fuente temporal
Backend ligero
Headless CMS externo
```

### Reglas

1. No implementar en fase actual si no está presupuestado.
2. Dejar datos en JSON para facilitar migración.
3. Documentar estructura de contenido.

### Acceptance Criteria futuro

- Personal no técnico puede actualizar contenido.
- Cambios quedan publicados con control.
- Hay capacitación.

---

# 12. Validación técnica global

## 12.1 Extender `generate-pages.py`

El script debe validar:

```txt
[ ] Todas las páginas públicas existen.
[ ] Todas cargan css/main.css.
[ ] Todas cargan App.init().
[ ] No hay onclick inline.
[ ] No hay href="#" en navegación/CTAs críticos.
[ ] EDUBOX usa URL oficial.
[ ] Enlaces externos críticos tienen target="_blank" y rel="noopener".
[ ] Navbar contiene Misión evangelística.
[ ] Nombre oficial aparece en navbar.
[ ] No aparece TGU en branding.
[ ] WhatsApp usa números reales.
[ ] Hoja de vida usa mailto.
[ ] Página misión evangelística existe.
[ ] Página sugerencias existe si fue creada.
[ ] sitemap.xml existe.
[ ] robots.txt existe.
```

## 12.2 Comando esperado

```bash
python generate-pages.py
```

## 12.3 Resultado esperado

```txt
Todas las páginas pasaron la validación.
```

---

# 13. Checklist QA final

## Navegación

```txt
[ ] Navbar escritorio correcto.
[ ] Navbar móvil correcto.
[ ] Misión evangelística visible.
[ ] Portal abre EDUBOX.
[ ] Solicitar admisión abre EDUBOX.
[ ] No hay enlaces principales rotos.
```

## Identidad

```txt
[ ] Nombre oficial en mayúsculas.
[ ] Logo oficial referenciado.
[ ] Colores institucionales aplicados.
[ ] No hay TGU/Tegucigalpa repetitivo.
```

## Admisiones

```txt
[ ] Niveles visibles.
[ ] Quiz avanza automáticamente.
[ ] Resultado del quiz muestra CTA.
[ ] EDUBOX unificado.
[ ] Proceso de admisión centrado.
```

## Contacto

```txt
[ ] WhatsApp Primaria funciona.
[ ] WhatsApp Secundaria funciona.
[ ] No hay formulario falso.
[ ] Maps funciona o está marcado pendiente.
[ ] Empleos abre mailto.
```

## Quiénes somos

```txt
[ ] Misión y visión.
[ ] Valores.
[ ] Declaración de fe.
[ ] ACSI.
[ ] Historia.
[ ] Perfil egresado.
[ ] LAES.
[ ] Equipo directivo.
[ ] Junta directiva.
```

## Contenido

```txt
[ ] Galería funcional.
[ ] Videos preparados.
[ ] Comunicados preparados.
[ ] Calendario preparado.
[ ] Misión evangelística completa o pendiente marcado.
[ ] Actividades actualizadas o pendientes marcados.
```

## SEO / Accesibilidad / Rendimiento

```txt
[ ] Titles únicos.
[ ] Descriptions únicas.
[ ] Open Graph.
[ ] Sitemap.
[ ] Robots.
[ ] Alt text.
[ ] Focus visible.
[ ] Contraste AA.
[ ] Lazy loading.
[ ] No base64 pesado.
```

---

# 14. Prompt maestro para Claude Code

```txt
Implementa el plan SDD completo de remodelación CEEVS posterior a la Fase 1.

Contexto:
El repositorio es un sitio estático HTML/CSS/JS. Debes mantener el stack actual, respetar CSS modular y el patrón JavaScript App.register/App.init. No uses frameworks nuevos, no crees backend, no inventes contenido final no aprobado y no dejes enlaces falsos.

Objetivo:
Completar las fases 2 a 6 del SDD:
- Admisiones, EDUBOX, WhatsApp y quiz automático.
- Quiénes somos institucional con tabs/acordeones.
- Contacto, empleos y sugerencias sin formularios falsos.
- Contenido: galería, actividades, misión evangelística, comunicados y calendario.
- SEO, accesibilidad, rendimiento, seguridad y documentación.

Reglas absolutas:
- EDUBOX oficial: https://portal.edubox.app/login/virginiasapp
- No href="#" en navegación o CTAs críticos.
- No onclick inline.
- No formularios simulados.
- No usar teléfonos placeholder.
- No almacenar leads reales en localStorage como si fueran envíos.
- Si falta contenido oficial, usar PENDING_CONTENT_*.
- Si falta asset oficial, usar PENDING_ASSET_*.
- Si falta decisión institucional, usar PENDING_DECISION_*.
- Extender generate-pages.py para validar contratos.
- Crear o actualizar docs de cada fase.

Implementa en orden:
1. data/redirects.json y configuración de CTAs.
2. Admisiones: EDUBOX único, quiz automático, niveles y proceso.
3. Contacto: WhatsApp, Maps, eliminación de formularios falsos, empleos mailto.
4. Quiénes somos: tabs/acordeones y contenido institucional.
5. Misión evangelística, galería, comunicados, sugerencias, actividades.
6. SEO, accesibilidad, performance, sitemap, robots, deployment docs.
7. Validación final con generate-pages.py.

Acceptance final:
El sitio debe quedar navegable, sin enlaces críticos rotos, con identidad institucional aplicada, con flujos reales hacia EDUBOX/WhatsApp/mailto, sin formularios falsos, con contenido estructurado, responsive, accesible y documentado.
```

---

# 15. Orden recomendado de commits

```txt
commit 1: chore(config): add central site configuration and redirects
commit 2: fix(admissions): normalize EDUBOX CTAs and admission flow
commit 3: feat(quiz): auto-advance admission quiz and update result CTAs
commit 4: feat(contact): replace fake forms with WhatsApp/mailto contact flows
commit 5: feat(about): restructure quienes somos with institutional sections
commit 6: feat(content): add mission, news, suggestions, gallery and activities structure
commit 7: chore(seo): add sitemap robots metadata and Open Graph
commit 8: chore(a11y): improve accessibility and keyboard navigation
commit 9: chore(docs): add deployment content and QA documentation
commit 10: test(validation): extend generate-pages validation
```

---

# 16. Criterio de entrega final

El proyecto se considera listo cuando:

1. Fase 1 está completada.
2. Fases 2–6 implementadas o marcadas con pendientes explícitos.
3. No quedan enlaces críticos falsos.
4. No quedan formularios simulados.
5. EDUBOX, WhatsApp y mailto funcionan.
6. Identidad CEEVS está aplicada.
7. Quiénes Somos está reestructurado.
8. Misión evangelística existe y se destaca.
9. Galería, comunicados, sugerencias y actividades tienen estructura.
10. SEO básico existe.
11. Accesibilidad básica existe.
12. Performance no está degradado por assets pesados.
13. `generate-pages.py` pasa.
14. `docs/DEPLOYMENT.md` y `docs/QA_CHECKLIST.md` existen.
