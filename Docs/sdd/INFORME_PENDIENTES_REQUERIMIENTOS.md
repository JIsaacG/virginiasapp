# INFORME DE PENDIENTES — Requerimientos CEEVS vs. implementación

**Proyecto:** Sitio web Centro Educativo Evangélico Virginia Sapp
**Fuente de requerimientos:** `Requerimientos/REQUERIMIENTOS.md` (30 secciones)
**Implementado:** Fases 1–6 del SDD (rama `feature/fase-1-nav-identidad`)
**Fecha de revisión:** 2026-05-22
**Resultado:** Cobertura parcial — base estructural completa; pendientes de contenido oficial, bilingüe y assets.

---

## 0. Actualización de ejecución — 2026-05-22

Se ejecutaron los **7 contratos B0** (contenido oficial disponible en `REQUERIMIENTOS.md`):

| Contrato | Resultado |
|----------|-----------|
| SDD-PEND-001 | ✅ Resuelto — opción "Aún no estoy seguro/a" eliminada del quiz |
| SDD-PEND-002 | ✅ Resuelto — perfil del egresado con contenido oficial (Conocimientos/Actitudes/Habilidades) |
| SDD-PEND-003 | ✅ Resuelto — ACSI con los 3 párrafos oficiales |
| SDD-PEND-004 | ✅ Resuelto — LAES muestra los 5 ejes (descripciones detalladas siguen B1) |
| SDD-PEND-005 | 🟡 Parcial — 5 de 7 resúmenes del equipo cargados; Martha López y Rosa Armijo siguen B1 |
| SDD-PEND-006 | ✅ Resuelto — Junta Directiva ADIEEDS con los 7 cargos (imagen `JD.png` sigue B2) |
| SDD-PEND-007 | ✅ Resuelto — formulario de sugerencias con campo "Sección" y nivel obligatorio |

Además se ejecutó **SDD-PEND-013 (sitio bilingüe ES/EN)**: conmutador de idioma
funcional con motor `js/i18n.js` y diccionario `js/i18n-data.js` (670 entradas).
Las traducciones al inglés quedan sujetas a validación institucional (§29).
Ver `docs/sdd/I18N_BILINGUE.md`.

Validación `generate-pages.py`: **PASS**. Los contratos B1/B2 restantes
permanecen pendientes por requerir decisiones institucionales o entrega de archivos.

---

## 1. Resumen de cobertura por requerimiento

Leyenda: ✅ cumplido · 🟡 parcial · ⛔ pendiente

| § | Requerimiento | Estado | Nota |
|---|---------------|--------|------|
| 2 | Nombre oficial en mayúsculas | ✅ | Aplicado en navbar y metadatos |
| 2 | Logo `logo principal.png` | 🟡 | Referenciado; archivo oficial no entregado (usa `logo.jpg` de respaldo) |
| 2 | Misión evangelística visible | ✅ | Página + banda en inicio |
| 3 | Sitio bilingüe español/inglés | ✅ | Conmutador ES/EN funcional (SDD-PEND-013); traducciones EN por validar (§29) |
| 4 | Paleta institucional | 🟡 | Tokens declarados; aplicada a navbar/secciones nuevas, no a secciones heredadas |
| 5 | Tipografía oficial | ⛔ | Sin definir (el requerimiento la deja pendiente) |
| 6.1 | Navbar base | ✅ | Quiénes Somos, Admisiones, Contáctenos, Galería, Actividades, Portal, Solicitar admisión |
| 6.1 | Navbar: Capacítate, Comunicados, Trabaja con nosotros | ⛔ | Páginas existen pero no enlazadas en el menú |
| 6.2 | Botones de acción | ✅ | Portal, Solicitar admisión, Enviar hoja de vida, Contactar exalumno/a |
| 7.1 | "Bienvenido al mundo Virginia Sapp" con fotos | ⛔ | No implementado |
| 7.2 | "Sobre nosotros" (PDF de referencia) | 🟡 | Existe "Historia"; falta sección dedicada con el PDF |
| 7.3 | Video institucional de Instagram | ⛔ | No embebido |
| 8 | Datos institucionales interactivos | 🟡 | Contadores existen; datos exactos sin confirmar |
| 9 | "Lo que creemos" | ✅ | Tarjetas doctrinales |
| 10 | Valores institucionales interactivos | 🟡 | 10 valores con descripción; faltan fotografías |
| 11.1 | Acreditación ACSI | ✅ | 3 párrafos oficiales (SDD-PEND-003) |
| 11.2 | Perfil del egresado | ✅ | Contenido oficial en 3 categorías (SDD-PEND-002) |
| 11.3 | LAES | 🟡 | 5 ejes incorporados; descripciones detalladas pendientes (SDD-PEND-004) |
| 12 | Equipo directivo | 🟡 | 5 de 7 resúmenes oficiales cargados (SDD-PEND-005) |
| 13 | Junta Directiva | ✅ | Listado oficial ADIEEDS; falta imagen JD.png (SDD-PEND-006) |
| 14 | Servicios educativos / niveles | ✅ | Cards de niveles en Admisiones |
| 15 | Orientador por edad (quiz) | ✅ | Opción "Aún no estoy seguro/a" eliminada (SDD-PEND-001) |
| 16 | Matrícula EDUBOX + proceso 4 pasos | ✅ | EDUBOX oficial y proceso centrado |
| 17 | Trabaja con nosotros | 🟡 | `mailto` funciona; correo por confirmar; sin base de datos |
| 18 | Comunidad de egresados | 🟡 | Sección + CTA WhatsApp; sin base de datos ni video |
| 19.1 | WhatsApp por nivel | ✅ | Primaria y Secundaria |
| 19.2 | Dirección con mapa | 🟡 | Botón a Google Maps; falta ubicación oficial fijada |
| 19.3 | Sin formularios ("No forms") | ✅ | Formulario simulado eliminado |
| 20 | Galería / vida escolar | 🟡 | Galería existe; falta iniciar con redes y videos CEEVS |
| 21 | Sugerencias | ✅ | Campo "Sección" y nivel obligatorio incorporados (SDD-PEND-007) |
| 22 | Juegos interactivos | ✅ | Trivia, sopa, memoria, versículo con XP |
| 23 | Espacio evangelístico / e625 | 🟡 | Estructura en página de misión; contenido placeholder |
| 24 | Comunicados y noticias | 🟡 | Página con estructura; contenido placeholder |
| 25 | Capacítate con nosotros | 🟡 | Página creada; contenido placeholder; no en navbar |
| 26 | Portal | ✅ | En navbar |
| 27 | Interactividad general | ✅ | Acordeones, valores, quiz, juegos, contadores |
| 28 | Archivos/recursos | ⛔ | PDFs, imágenes y videos no entregados |

---

## 2. Contratos de pendientes (formato SDD)

Cada contrato es ejecutable en una fase posterior. Clasificación de bloqueo:
**B0** sin bloqueo (contenido ya disponible en `REQUERIMIENTOS.md`) ·
**B1** requiere decisión institucional · **B2** requiere entrega de archivo por la empresa.

---

### SDD-PEND-001 — Eliminar opción "Aún no estoy seguro/a" del quiz
- **Origen:** §15
- **Estado actual:** `admisiones.html` paso 1 conserva `<button data-q="q1" data-val="unsure">Aún no estoy seguro/a</button>`.
- **Brecha:** el requerimiento indica eliminar esa opción (marcada con "X").
- **Acción:** quitar el botón `data-val="unsure"` del paso 1 del quiz; verificar `js/quiz.js` (la rama `unsure` puede quedar como caso por defecto sin opción visible).
- **Bloqueo:** B0
- **Acceptance:** el quiz solo muestra 3 a 5 / 6 a 11 / 12 a 17 años en el paso 1.

### SDD-PEND-002 — Perfil del egresado con contenido oficial
- **Origen:** §11.2
- **Estado actual:** `quienes-somos.html#perfil-egresado` mantiene 6 rasgos genéricos.
- **Brecha:** el requerimiento entrega el texto oficial agrupado en **Conocimientos**, **Actitudes** y **Habilidades**.
- **Acción:** reestructurar la sección en esas 3 categorías con el texto literal de §11.2.
- **Bloqueo:** B0
- **Acceptance:** las 3 categorías existen con el contenido oficial; accesible (no solo imagen).

### SDD-PEND-003 — Acreditación ACSI con texto completo
- **Origen:** §11.1
- **Estado actual:** `#acsi` usa 1 párrafo + acordeón `PENDING_CONTENT_ACSI_AMPLIADO`.
- **Brecha:** §11.1 entrega 3 párrafos oficiales completos.
- **Acción:** sustituir el placeholder del acordeón por los párrafos 2 y 3 oficiales.
- **Bloqueo:** B0
- **Acceptance:** la sección ACSI contiene los 3 párrafos oficiales.

### SDD-PEND-004 — LAES con los 5 ejes oficiales
- **Origen:** §11.3
- **Estado actual:** `#laes` es un placeholder `PENDING_CONTENT_LAES`.
- **Brecha:** §11.3 define los ejes: Académicos, Espiritual, Liderazgo y Servicio, Socio-emocional, Bilingüe.
- **Acción:** presentar los 5 ejes (tarjetas o infografía) con el título "Logros de Aprendizaje Esperados".
- **Bloqueo:** B0 (estructura) — descripción de cada eje es B1 si se requiere texto ampliado.
- **Acceptance:** los 5 ejes visibles e interactivos.

### SDD-PEND-005 — Resúmenes del equipo directivo
- **Origen:** §12.1
- **Estado actual:** las 7 tarjetas usan `PENDING_CONTENT_EQUIPO_*`.
- **Brecha:** §12.1 entrega resúmenes oficiales de 5 personas (Sara Corrales, Dessiré Hulse, Ana Ávila, Diana Vásquez, Nadia Irula).
- **Acción:** cargar los 5 resúmenes oficiales; mantener `PENDING` solo para Martha López y Rosa Armijo.
- **Bloqueo:** B0 (5 personas) · B1 (Martha López, Rosa Armijo)
- **Acceptance:** 5 tarjetas con resumen real; 2 marcadas como pendientes.

### SDD-PEND-006 — Junta Directiva con listado oficial
- **Origen:** §13
- **Estado actual:** `#junta-directiva` es un placeholder.
- **Brecha:** §13 entrega la Junta Directiva ADIEEDS completa (7 cargos con nombres).
- **Acción:** mostrar la tabla/tarjetas con Presidente, Vicepresidente, Secretario, Tesorero, Fiscal, Vocal 1 y Vocal 2.
- **Bloqueo:** B0 (texto) · B2 (imagen `JD.png`)
- **Acceptance:** los 7 integrantes visibles con cargo y nombre.

### SDD-PEND-007 — Campos del formulario de sugerencias
- **Origen:** §21.1
- **Estado actual:** `sugerencias.html` tiene Nombre, Área, Grado, Nivel, Mensaje, Contacto.
- **Brecha:** falta el campo **Sección**; el nivel debe ser **obligatorio**.
- **Acción:** añadir campo "Sección"; marcar "Nivel" como requerido; ajustar `js/sugerencias.js`.
- **Bloqueo:** B0
- **Acceptance:** el formulario incluye Sección y exige Nivel antes de generar el `mailto`.

### SDD-PEND-008 — Completar navegación superior
- **Origen:** §6.1
- **Estado actual:** navbar de 6 ítems; `comunicados.html` y `capacitate.html` existen pero no enlazadas.
- **Brecha:** §6.1 solicita además Capacítate con nosotros, Comunicados y noticias, Trabaja con nosotros.
- **Acción:** definir la estructura final del menú (directo o submenús) e integrar las páginas; actualizar `data/navigation.json` y `components/navbar.html`.
- **Bloqueo:** B1 (estructura final del menú la decide la institución)
- **Acceptance:** todas las secciones solicitadas son alcanzables desde la navegación.

### SDD-PEND-009 — Correo oficial de "Trabaja con nosotros"
- **Origen:** §17, §29
- **Estado actual:** `contactenos.html` usa `mailto:rrhh@virginiasapp.edu.hn`.
- **Brecha:** §17 indica `empleosadieeds@gmail.com`; `data/contacts.json` registra `empleosaideeds@gmail.com` (variación de escritura). Hay inconsistencia entre fuentes.
- **Acción:** confirmar el correo oficial y aplicarlo en `contactenos.html` y `data/redirects.json`.
- **Bloqueo:** B1
- **Acceptance:** el botón "Enviar hoja de vida" usa el correo confirmado.

### SDD-PEND-010 — Tipografía oficial
- **Origen:** §5, §29
- **Estado actual:** el sitio usa Outfit + Playfair Display.
- **Brecha:** la tipografía oficial no está definida.
- **Acción:** confirmar la familia tipográfica institucional y aplicarla.
- **Bloqueo:** B1
- **Acceptance:** tipografía oficial aplicada de forma consistente.

### SDD-PEND-011 — Datos exactos de indicadores institucionales
- **Origen:** §8, §29
- **Estado actual:** contadores en `index.html` (63 años, 1962, 3 niveles).
- **Brecha:** faltan cifras reales confirmadas (egresados, programas activos, docentes).
- **Acción:** sustituir por los datos oficiales una vez confirmados.
- **Bloqueo:** B1
- **Acceptance:** los indicadores muestran cifras institucionales reales.

### SDD-PEND-012 — Confirmación de correos y dominio
- **Origen:** §19.4, §29
- **Estado actual:** correos `admisiones@`, `administracion.general@` y números WhatsApp usados con marca `PENDING_CONFIRMATION`; dominio `PENDING_DOMAIN_OFFICIAL` en `sitemap.xml`/`robots.txt`.
- **Brecha:** falta validación institucional de correos, números y dominio.
- **Acción:** confirmar y aplicar; actualizar `sitemap.xml`, `robots.txt` y `og:image` con dominio absoluto.
- **Bloqueo:** B1
- **Acceptance:** sin marcadores `PENDING_CONFIRMATION` / `PENDING_DOMAIN_OFFICIAL`.

### SDD-PEND-013 — Versión bilingüe (inglés) — ✅ RESUELTO (2026-05-22)
- **Origen:** §3, §29
- **Estado actual:** conmutador de idioma ES/EN funcional en escritorio y móvil.
- **Implementación:** motor `js/i18n.js` (traduce nodos de texto y atributos sin
  duplicar páginas), diccionario `js/i18n-data.js` (670 entradas ES→EN), conmutador
  inyectado en el navbar y en el menú móvil, preferencia persistida en `localStorage`.
- **Pendiente menor (B1):** las traducciones al inglés deben ser **validadas por la
  institución** (§29). Algunos títulos divididos por `<em>` pueden tener orden de
  palabras mejorable. El contenido generado dinámicamente (resultado del quiz,
  notificaciones de juegos) permanece en español.
- **Acceptance:** ✅ las secciones principales se visualizan en inglés y español.

### SDD-PEND-014 — Logo oficial
- **Origen:** §2, §28
- **Estado actual:** navbar referencia `assets/logo principal.png` (inexistente); usa `assets/logo.jpg` como respaldo.
- **Brecha:** falta el archivo oficial `logo principal.png`.
- **Acción:** colocar el logo oficial en `assets/logo principal.png`.
- **Bloqueo:** B2
- **Acceptance:** el logo oficial se muestra en navbar y footer sin recurrir al respaldo.

### SDD-PEND-015 — Sección "Bienvenido al mundo Virginia Sapp" / "Sobre nosotros"
- **Origen:** §7.1, §7.2, §28
- **Estado actual:** existe "Historia"; no hay sección de bienvenida con fotos ni "Sobre nosotros" basada en el PDF.
- **Brecha:** faltan la sección de bienvenida con fotografías reales (niños, docentes, ambiente escolar) y la sección "Sobre nosotros" a partir de `Sobre nosotros CEEVS.pdf`.
- **Acción:** crear ambas secciones al recibir el PDF y las fotografías.
- **Bloqueo:** B2
- **Acceptance:** secciones creadas con contenido del PDF y fotografías institucionales.

### SDD-PEND-016 — Video institucional de Instagram
- **Origen:** §7.3
- **Estado actual:** no embebido.
- **Brecha:** falta integrar el reel de Instagram en "Quiénes Somos" / "Vida Institucional".
- **Acción:** embeber el reel indicado en el requerimiento.
- **Bloqueo:** B2 (confirmar reel definitivo)
- **Acceptance:** el video institucional se reproduce en la página.

### SDD-PEND-017 — Galería: redes sociales y videos CEEVS
- **Origen:** §20
- **Estado actual:** galería con carrusel de fotos (imágenes de Facebook); enlace a FB.
- **Brecha:** debe **iniciar con las redes sociales** y mostrar los videos `Video Virginia Sapp 2026(2).mp4` y `PREESCOLAR.mp4`.
- **Acción:** anteponer bloque de redes sociales e integrar los videos con controles y `loading` diferido.
- **Bloqueo:** B2 (archivos de video) · B1 (URLs de redes oficiales)
- **Acceptance:** la galería abre con redes sociales e incluye los videos institucionales.

### SDD-PEND-018 — Video de egresado
- **Origen:** §18, §29
- **Estado actual:** sección de egresados sin video.
- **Brecha:** falta el video de un egresado.
- **Acción:** integrar el video cuando se entregue.
- **Bloqueo:** B2
- **Acceptance:** el video del egresado se reproduce en la sección.

### SDD-PEND-019 — Fotografías de los valores institucionales
- **Origen:** §10
- **Estado actual:** las 10 tarjetas de valores usan emojis.
- **Brecha:** §10 solicita fotografías relacionadas con cada valor.
- **Acción:** sustituir/complementar los emojis con fotografías al recibirlas.
- **Bloqueo:** B2
- **Acceptance:** cada valor muestra una fotografía representativa.

### SDD-PEND-020 — Imagen Open Graph institucional
- **Origen:** derivado de §28 (assets) y SDD-F6-SEO-002
- **Estado actual:** `og:image` apunta a `assets/logo.jpg` (`PENDING_ASSET_OG_IMAGE`).
- **Brecha:** falta una imagen Open Graph 1200×630 oficial.
- **Acción:** crear/colocar la imagen y referenciarla en todas las páginas.
- **Bloqueo:** B2
- **Acceptance:** `og:image` apunta a una imagen institucional dedicada.

### SDD-PEND-021 — Espacio evangelístico con recursos e625
- **Origen:** §23
- **Estado actual:** `mision-evangelistica.html` tiene estructura (propósito, versículo, recursos, video) con placeholders.
- **Brecha:** falta el contenido evangelístico real (videos, artículos tipo e625) y el versículo auto-actualizable en la página de misión.
- **Acción:** cargar recursos oficiales; definir mecanismo de versículo dinámico.
- **Bloqueo:** B1 (contenido) — la estructura ya está lista (B0)
- **Acceptance:** la sección aloja videos y artículos reales.

### SDD-PEND-022 — Contenido real de Comunicados y Capacítate
- **Origen:** §24, §25
- **Estado actual:** `comunicados.html` y `capacitate.html` con tarjetas placeholder marcadas.
- **Brecha:** falta el contenido institucional real (comunicados, calendario, programas de capacitación).
- **Acción:** cargar el contenido oficial cuando se entregue.
- **Bloqueo:** B1
- **Acceptance:** páginas con contenido real, sin placeholders.

### SDD-PEND-023 — Base de datos de candidatos y egresados
- **Origen:** §17, §18
- **Estado actual:** empleos y egresados usan `mailto`/WhatsApp; no hay almacenamiento.
- **Brecha:** §17 y §18 mencionan una base de datos para hojas de vida y egresados.
- **Acción:** corresponde a la Fase 7 (CMS/back-office); requiere backend y presupuesto.
- **Bloqueo:** B1 (decisión y presupuesto) — ver `docs/sdd/FASE_7_CMS_BACKOFFICE.md`
- **Acceptance:** registro organizado de candidatos y egresados.

---

## 3. Conclusión

La remodelación (Fases 1–6) entregó la **base estructural, técnica y de navegación**
solicitada: identidad, EDUBOX, WhatsApp, quiz, secciones institucionales, páginas
nuevas, SEO y documentación. Validador `generate-pages.py`: **PASS**.

Los 23 contratos de pendiente se agrupan en:

- **8 ejecutables ya (B0)** — contenido disponible en `REQUERIMIENTOS.md`:
  SDD-PEND-001 a 007 y parte de 004/005. Recomendable resolverlos en una
  **Fase 3.1 / 5.1 de contenido**.
- **9 bloqueados por decisión institucional (B1)** — correos, dominio, tipografía,
  datos, bilingüe, estructura de menú, contenido de comunicados/capacitación.
- **8 bloqueados por entrega de archivos (B2)** — logo, PDFs, imágenes, videos.

La **versión bilingüe (SDD-PEND-013)** y la **base de datos (SDD-PEND-023)** son
los pendientes de mayor esfuerzo y deben presupuestarse aparte.
