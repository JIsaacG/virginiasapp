# 📋 Informe de hallazgos, optimización y guía de réplica — Sitio CEEVS

**Fecha:** 19 de julio de 2026
**Alcance:** revisión completa del repositorio (12 páginas HTML, 25 archivos JS, 40+ archivos CSS, API PHP, assets) con medición real de carga en navegador (Chromium headless).

---

## 1. Resumen ejecutivo

El sitio está **bien construido para su tamaño**: arquitectura CSS modular (ITCSS), JS por módulos, panel admin con backend PHP blindado (CSRF, lockout, bitácora), bilingüe ES/EN y validador propio (`generate-pages.py`). Los problemas encontrados no son de estructura sino de **peso de recursos** y **duplicación manual de HTML**.

**El hallazgo más grave ya quedó corregido:** la mascota (león animado) descargaba **9.5 MB de PNG en cada página** (6 cuadros de 1254×1254 px mostrados a 95 px). Hoy pesa **107 KB en WebP** — una reducción del **99 %**.

| Métrica de carga | Antes | Ahora |
|---|---|---|
| Mascota (6 cuadros, toda página) | 9,501 KB | **107 KB** |
| Póster del video del inicio | 404 (error permanente) | **8 KB (JPG real)** |
| Caché de imágenes/media | 7 días (default Hostinger) | **30 días explícito** |
| Compresión de texto | dependía del hosting | **forzada vía .htaccess** |
| CSS del aula en navegadores con caché | roto (main.css viejo) | **versionado `?v=`** |

Pendiente de decisión del dueño: el **video de presentación de 25 MB con autoplay** en el inicio (ver §3.1).

---

## 2. Optimizaciones aplicadas en esta revisión

1. **Mascota → WebP** (`assets/animacion/1-6.webp`, 256×256, ~18 KB c/u).
   `js/modules/mascota.js` ahora pide `.webp?v=3`. Los PNG originales de 1254 px quedan como *fuente* (no se sirven). Verificado en navegador: 6 peticiones, 18 KB transferidos en una visita típica, cero errores.
2. **`.htaccess` raíz ampliado**: caché de 30 días para imágenes/fuentes/video/PDF (antes solo existía la regla `no-cache` de CSS/JS) y compresión `mod_deflate` para HTML/CSS/JS/JSON (i18n-data.js pasa de ~120 KB a ~25 KB transferidos).
3. **Póster del video generado** (`assets/videos/poster-presentacion.jpg`, 1280×720, 8 KB, extraído del propio MP4). Elimina un **404 en cada visita al inicio** y da imagen inmediata mientras el video carga.
4. **LCP de Misión Evangelística**: la foto principal del hero ya no es `loading="lazy"` (estaba retrasando el elemento más grande visible) y lleva `fetchpriority="high"`.
5. **Cache-busting**: `mision-evangelistica.html` y `admin.html` cargan CSS/JS con `?v=20260719-2`, lo que resolvió el "diseño roto" reportado (era caché del navegador, no el CSS).

---

## 3. Hallazgos detallados

### 3.1 Rendimiento (pendientes, en orden de impacto)

| # | Hallazgo | Impacto | Recomendación |
|---|---|---|---|
| 1 | **Video del inicio: 25 MB con `autoplay muted loop`** (`index.html:361`). El autoplay obliga a descargar el archivo completo aunque el visitante no lo mire. | ~25 MB por visitante nuevo en el inicio | Recomprimir a 720p H.264 CRF 26 (HandBrake, gratis) → queda en 4–6 MB sin pérdida visible. Opcional: quitar `autoplay` y dejar `preload="none"` — con el póster nuevo se ve bien y solo descarga si dan play. |
| 2 | **CSS: 35 `@import` + política `no-cache`** = ~36 peticiones de revalidación por página. | latencia, sobre todo en móvil | Ya existe `minify.py` (genera `dist/main.min.css`) pero **nada lo usa y está desactualizado desde abril**. O se adopta en serio (enlazar `dist/main.min.css?v=FECHA` y regenerar tras cada cambio de CSS), o se elimina `dist/` para no confundir. Con HTTP/2 el esquema actual es tolerable; el bundle ahorraría ~300–500 ms en móvil. |
| 3 | **~29 imágenes de Unsplash** como relleno (álbumes de recuerdos, niveles) y fotos de WordPress sin `width/height` → *layout shift* (CLS) y dependencia de dominios externos. | CLS, SEO | Sustituir Unsplash por fotos reales del instituto (vía panel admin) y servirlas del propio dominio con dimensiones declaradas. |
| 4 | **`js/i18n-data.js` (120 KB) se carga en todas las páginas** aunque cada página usa una fracción. | 25 KB gzip por página | Aceptable con la compresión ya activada. Mejora futura: partir el diccionario por página o cargarlo `defer`. |
| 5 | Imágenes sin `loading="lazy"` en varias páginas (capacitate 0/2, comunicados 0/2, interactivo 0/2, sugerencias 0/2, inventario 0/2). | menor | Añadir `lazy` a toda imagen bajo el pliegue; **nunca** al hero/LCP. |
| 6 | `assets/animacion/originales/` (8.4 MB) y los PNG fuente (9.5 MB) viven en la carpeta desplegada. | peso del hosting, no de la página | Moverlos fuera del deploy (o a una carpeta excluida). |

### 3.2 Código y arquitectura

- **Duplicación estructural (el mayor costo de mantenimiento):** navbar, menú móvil, HUD, toast y footer están **copiados a mano en las 12 páginas**. `generate-pages.py` valida pero **no genera** — cambiar un enlace del navbar exige editar 12 archivos. Es la primera mejora que haría antes de replicar el sitio (ver §5).
- **~90 `style="..."` inline** repartidos en 11 páginas (el bloque del logo del footer es el reincidente — está duplicado en cada página). Contradice la convención del propio proyecto; mover a clases en `css/3-layout/footer.css`.
- `js/admin.js` genera `onerror="..."` inline dentro de plantillas de string (p. ej. vista previa de imágenes) — funciona, pero rompe la regla "sin manejadores inline" que el validador exige al resto del sitio.
- **Claves públicas en cliente:** la clave de Web3Forms (formularios de contacto/suscripción) es visible en el JS. Es el diseño normal de Web3Forms, pero el límite de 2 envíos/día vive **solo en localStorage** → trivial de saltar. Si llega spam, migrar el envío a un endpoint PHP propio con el mismo `login-guard`.
- `ADMIN_PASS = 'ceevs2026'` hardcodeada en `admin.js` — solo desbloquea el "modo local" sin servidor (documentado); la cuenta real vive en el servidor con bcrypt. Aceptable, pero conviene saberlo al replicar.
- **Positivo:** API PHP con CSRF por sesión, lockout progresivo por IP, bitácora JSONL protegida, verificación MIME real en uploads, escape HTML consistente en todo el JS público. No se encontraron `console.log` residuales ni `onclick=` inline en páginas.

### 3.3 SEO y accesibilidad

- Buenas bases: `<title>`/`meta description` únicos por página, Open Graph, `sitemap.xml`, `robots.txt`, HTML semántico, `aria-label` en navegación y `aria-expanded` en menús.
- `og:image` usa ruta relativa (`assets/logo principal.png`) — Facebook/WhatsApp requieren **URL absoluta** para la vista previa. Cambiar a `https://tudominio/assets/...` en las 12 páginas.
- El nombre de archivo `logo principal.png` **con espacio** funciona, pero genera URLs `%20` frágiles; renombrar a `logo-principal.png` en la próxima limpieza.
- El visor del aula cierra con Escape pero no atrapa el foco (focus-trap) ni lo devuelve al botón de origen — mejora de accesibilidad pendiente.
- El selector EN/ES existe y funciona; recordar que **todo texto nuevo requiere su entrada ES→EN** en `js/i18n-data.js`.

### 3.4 Limpieza de repositorio

Archivos que no deberían desplegarse (ni, en su mayoría, versionarse):

- `ceevs-v2 (3).zip` — respaldo comprimido dentro del repo.
- `Página web.xlsx` — documento de trabajo.
- `dist/` — bundles de abril que **nada referencia** (decidir: adoptar o borrar, ver §3.1-2).
- `transform.py`, `_config.yml`, `layouts/` — restos de un intento con Jekyll.
- `assets/animacion/originales/` + PNG fuente de la mascota (17.9 MB).

*(No se borró nada: son archivos del dueño; esta lista es para decidir.)*

---

## 4. Tips de mejora priorizados

**P0 — hazlo esta semana (≤1 h total):**
1. Recomprimir el video a 720p (~5 MB) con HandBrake y reemplazar el MP4. Es el 90 % del peso restante del inicio.
2. Subir estos cambios al hosting (los WebP de la mascota + `.htaccess` + póster solo surten efecto publicados).
3. Borrar del hosting el zip, el xlsx y `animacion/originales/`.

**P1 — próximo mes:**
4. Reemplazar las 29 fotos Unsplash por fotos reales (se hace desde el panel admin, pestaña Imágenes).
5. Mover el bloque del logo del footer a CSS (elimina ~40 estilos inline de un golpe).
6. `og:image` con URL absoluta y renombrar `logo principal.png` → `logo-principal.png`.
7. Decidir el destino de `dist/` + `minify.py` (adoptar con disciplina de "regenerar tras cada cambio" o eliminar).

**P2 — cuando haya tiempo / antes de replicar:**
8. Generador real de páginas: plantilla única para navbar/footer/HUD (un script Node/Python de 100 líneas que ensambla las 12 páginas desde `components/`). Elimina la edición ×12 para siempre.
9. Focus-trap en el visor del aula y en los modales.
10. Partir `i18n-data.js` por página o cargarlo con `defer`.

---

## 5. Guía para replicar el sitio para otro instituto

### 5.1 Qué es genérico y qué es de marca

| Capa | ¿Reutilizable tal cual? | Dónde se personaliza |
|---|---|---|
| Arquitectura CSS (ITCSS) | ✅ 100 % | — |
| **Colores/tipografía** | ✅ | `css/1-base/tokens.css` (variables) + presets en `js/themes.js` |
| Núcleo JS (`core/`, gamification, i18n, image-manager, admin-sync) | ✅ 100 % | — |
| Aula virtual (`mision-aula.js`) e Inventario | ✅ | contenido semilla `DEFAULT_DATA` |
| API PHP (`api/`) | ✅ | `bootstrap.php`: correo y hashes bcrypt del admin |
| Páginas HTML | ⚠️ estructura sí, textos no | nombre, historia, niveles, contactos, fotos |
| `js/i18n-data.js` | ⚠️ | regenerar entradas para los textos nuevos |
| Identidad (logos, mascota, fotos) | ❌ | `assets/` + `IMAGE_CATALOG` en `admin.js` |

### 5.2 Puntos de personalización (checklist)

1. **Nombre e identidad**: buscar y reemplazar `Virginia Sapp`, `CEEVS`, `virginiasapp` (dominios, EduBox, WhatsApp `wa.me/504...`, Facebook) en los 12 HTML + `components/` + `sitemap.xml`.
2. **Colores**: editar solo `css/1-base/tokens.css` (7 variables `--ceevs-*` + alias). Todo el sitio cambia solo.
3. **Logos**: `assets/logo-principal.png` y `assets/logo.jpg` (favicon, navbar, footer).
4. **Cuenta admin**: en `api/bootstrap.php` cambiar `CEEVS_SEED_EMAIL` y regenerar los hashes bcrypt (`password_hash()`); borrar `server-data/` del servidor nuevo para que se siembre limpia.
5. **Catálogo de imágenes**: `IMAGE_CATALOG` en `js/admin.js` — cada `data-img-key` del HTML debe tener su tarjeta (relación 1:1).
6. **Regla de oro de claves nuevas**: toda clave `ceevs_*` nueva se registra en **4 listas**: `CONFIG_KEYS` (admin.js), `CONFIG_KEYS` (admin-sync.js), `REMOTE_CONFIG_KEYS` (image-manager.js), `CEEVS_CONFIG_KEYS` (api/bootstrap.php).
7. **Contenido dinámico**: los JSON de `data/` (comunicados, sopa de letras, quiz) y las semillas de `mision-aula.js` / inventario.
8. **i18n**: cada texto ES nuevo necesita su par EN en `js/i18n-data.js` (el conmutador traduce por nodo de texto exacto).
9. **Validar**: `python generate-pages.py` debe quedar en verde; probar con `docker run --rm -p 8899:80 -v "RUTA:/var/www/html" php:8.2-apache`.

### 5.3 Consejo antes de la segunda réplica

Si se van a hacer **2+ institutos**, primero implementa el generador de páginas (P2-8): con navbar/footer en un solo lugar, replicar pasa de "editar 12 archivos con cuidado" a "cambiar un JSON de configuración". El resto del sistema (admin, aula, API, i18n) ya es plantilla pura.

---

## 6. 🪄 Prompt maestro para replicar el sitio

Copia este prompt en Claude Code **parado sobre una copia de esta carpeta** (sin `server-data/`, `uploads/`, zips ni `.git`). Rellena los corchetes antes de enviarlo.

```text
Este repositorio es la plantilla del sitio del Centro Educativo Evangélico Virginia Sapp
(CEEVS). Quiero convertirlo en el sitio de otro instituto. Lee CLAUDE.md primero y respeta
la arquitectura existente (CSS modular ITCSS, módulos JS con App.register, panel admin con
api/ PHP, sistema bilingüe i18n-data.js, validador generate-pages.py).

DATOS DEL NUEVO INSTITUTO
- Nombre completo: [NOMBRE COMPLETO]
- Siglas: [SIGLAS]
- Ciudad y país: [CIUDAD, PAÍS]
- Año de fundación: [AÑO]
- Lema o versículo institucional: [LEMA]
- Confesión/enfoque: [ej. evangélico, católico, laico]
- Niveles educativos: [ej. preescolar, primaria, secundaria bilingüe]
- Teléfonos WhatsApp: [+XXX ...] (primaria) y [+XXX ...] (secundaria)
- Facebook/redes: [URL]
- Plataforma de matrícula/portal (si existe): [URL o "ninguna"]
- Correo del administrador del panel: [CORREO]
- Dominio donde se publicará: [https://...]
- Paleta deseada: primario [#HEX], acento [#HEX], fondo [#HEX]
  (o "conserva la actual" / "propón una acorde al logo adjunto")
- Logo: [ruta del archivo que te doy / "genera un placeholder"]

TAREAS (en este orden, con commit por fase)
1. IDENTIDAD: reemplaza en las 12 páginas, components/, sitemap.xml y robots.txt todo
   rastro de "Virginia Sapp", "CEEVS", virginiasapp (dominios, edubox, wa.me, Facebook)
   por los datos nuevos. Actualiza título, meta description y og: de cada página
   (og:image con URL absoluta del dominio nuevo).
2. PALETA Y LOGOS: ajusta las variables de css/1-base/tokens.css y los presets de
   js/themes.js a la paleta nueva. Coloca los logos en assets/ y actualiza favicon,
   navbar y footer.
3. CONTENIDO INSTITUCIONAL: reescribe los textos de index, quienes-somos (historia,
   filosofía, valores), admisiones (niveles y proceso), contactenos (datos reales) con
   la información que te doy arriba; lo que no sepas márcalo con [PENDIENTE-DUEÑO] y
   listámelo al final.
4. GAMIFICACIÓN Y JUEGOS: adapta preguntas de trivia/quiz y palabras de la sopa de
   letras (data/ y js/games.js) al instituto nuevo; conserva la mecánica y los XP.
5. AULA VIRTUAL (mision-aula.js): conserva la estructura; ajusta el DEFAULT_DATA
   (cursos/avisos semilla) al enfoque del instituto. Recuerda: la clave ceevs_mision_aula
   ya está registrada en las 4 listas; si agregas claves ceevs_* nuevas debes
   registrarlas en CONFIG_KEYS (admin.js), CONFIG_KEYS (admin-sync.js),
   REMOTE_CONFIG_KEYS (image-manager.js) y CEEVS_CONFIG_KEYS (api/bootstrap.php).
6. PANEL ADMIN: en api/bootstrap.php cambia el correo sembrado y genera hashes bcrypt
   nuevos para una contraseña temporal que me entregarás por este chat; verifica que
   server-data/ no exista en el repo. Actualiza IMAGE_CATALOG en js/admin.js para que
   cada data-img-key del HTML nuevo tenga su tarjeta (relación 1:1).
7. IDIOMA: regenera las entradas de js/i18n-data.js para TODOS los textos que cambiaste
   (par exacto texto-ES → texto-EN, por nodo de texto). No traduzcas nombres propios.
8. RENDIMIENTO: imágenes locales a WebP con tamaño acorde a su uso (nada mayor a 2x su
   tamaño de render), loading="lazy" salvo el hero, mantén el .htaccess de caché y
   compresión, video de presentación ≤6 MB con poster propio.
9. VALIDACIÓN: python generate-pages.py en verde; abre cada página con Playwright o un
   servidor local y confirma cero errores de consola; prueba el panel admin en modo
   local (login, pestañas Imágenes/Galería/Videos/Inventario/Misión/Respaldo) y el
   conmutador ES/EN.
10. ENTREGA: resume qué cambiaste, la lista de [PENDIENTE-DUEÑO], y los pasos para
    publicar en el hosting (subir archivos, crear la cuenta admin en el primer login,
    verificar api/config.php).

REGLAS
- No uses estilos inline ni onclick= (el validador lo revisa).
- No toques la lógica de api/ salvo lo indicado en la tarea 6.
- Textos nuevos siempre con su par en i18n-data.js.
- Cada cambio de CSS/JS en páginas con ?v= requiere subir la versión.
```

---

*Informe generado tras revisión de código línea por línea de los módulos críticos (admin, sync, aula, mascota, API PHP, .htaccess) y medición de red real en Chromium. Las optimizaciones de §2 ya están aplicadas en este repositorio y verificadas.*
