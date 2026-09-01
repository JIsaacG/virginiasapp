# Runbook de migración a Hostinger — sitio CEEVS

Mover `virginiasapp.edu.hn` del WordPress viejo al sitio estático + API PHP que
vive en este repositorio, alojado en el hosting nuevo de Hostinger.

> **Lo que hay que tener claro antes de empezar.** El sitio no es solo HTML: hay
> un backend PHP (`api/`) y una base de datos MySQL con **solicitudes de admisión
> de familias reales**. El HTML se puede volver a publicar desde el repositorio
> tantas veces como haga falta; las solicitudes, la configuración del panel y las
> imágenes subidas desde el panel **no están en el repositorio** y se pierden si
> no se migran a mano. Esa es la parte delicada de esta migración, no el DNS.

---

## 1. Inventario: qué está en el repositorio y qué solo en el servidor

| Qué | Dónde vive | ¿Se recupera desde el repo? |
|---|---|---|
| Páginas, CSS, JS, imágenes del diseño | repositorio | ✅ Sí |
| `api/*.php` | repositorio | ✅ Sí |
| `data/*.json` (comunicados, juegos, quiz) | repositorio | ✅ Sí |
| **Configuración publicada del panel** (`server-data/site-config.json`) | servidor, dentro de `public_html/server-data/` | ❌ **No** |
| **Cuenta del panel** (`server-data/admin-user.php`, solo hashes) | servidor | ❌ **No** |
| **Credenciales SMTP** (`server-data/correo-config.php`) | servidor | ❌ **No** |
| **Imágenes y videos subidos desde el panel** (`uploads/`) | servidor, dentro de `public_html/uploads/` | ❌ **No** |
| **Bitácora de seguridad** (`server-data/audit-log.php`) | servidor | ❌ **No** |
| **Solicitudes de admisión** | **MySQL** + espejo en la carpeta privada | ❌ **No** |
| **Credenciales de la base** (`ceevs-db.php`) | carpeta privada, **fuera** de `public_html` | ❌ **No** |
| Espejo de solicitudes (`SOLICITUDES DE ADMISIÓN/`) | carpeta privada, **fuera** de `public_html` | ❌ **No** |

Las rutas privadas que busca el código (`api/db.php`, `api/preinscripciones-lib.php`)
cuelgan de la carpeta **hermana** de `public_html`:

```
/home/<cuenta>/
├── public_html/                 ← el sitio
│   ├── server-data/             ← estado del panel
│   └── uploads/                 ← subidas del panel
└── VIRGINIASAPP/                ← privada: NO accesible por web
    ├── ceevs-db.php             ← credenciales MySQL
    └── SOLICITUDES DE ADMISIÓN/ ← espejo en archivos de cada solicitud
```

En algunos planes la ruta es `/home/<cuenta>/domains/<dominio>/public_html`; el
código contempla las dos porque busca la última aparición de `/public_html`.

---

## 2. Requisitos del hosting nuevo

Comprobar en hPanel **antes** de subir nada:

- **PHP 8.0 o superior** con la extensión **`pdo_mysql`** habilitada. Sin
  `pdo_mysql` el sitio arranca igual, pero las solicitudes caen al modo archivos
  y no llegan a la base de datos.
- **`AllowOverride All`** o equivalente, para que `.htaccess` se aplique. Si no,
  se pierden el HTTPS forzado, las cabeceras de caché y el bloqueo de `.env`.
- **Base de datos MySQL** creada, con usuario y contraseña propios.
- **Acceso a la carpeta padre de `public_html`** (File Manager o SFTP). Sin ella
  no se pueden dejar las credenciales fuera del alcance de la web.
- Espacio: el paquete de publicación pesa ~48 MB (`npm run deploy:list` lo dice).

---

## 3. Antes de tocar nada: bajar copia del hosting actual

Del hosting que hoy sirve el sitio estático:

1. **Descargar `public_html/server-data/`** completo.
2. **Descargar `public_html/uploads/`** completo.
3. **Descargar la carpeta privada `VIRGINIASAPP/`** completa (credenciales y
   espejo de solicitudes).
4. **Volcar la base de datos**: hPanel → Bases de datos → phpMyAdmin →
   Exportar → formato SQL. O por SSH:
   ```bash
   mysqldump -u USUARIO -p BASE > ceevs-$(date +%F).sql
   ```
   Debe contener `ceevs_preinscripciones`, `ceevs_preinscripcion_archivos` y
   `ceevs_ajustes`.
5. **Del WordPress viejo**, si todavía responde: descargar `wp-content/uploads/`
   entero como respaldo histórico. Las 9 fotos que el sitio usaba ya están en el
   repositorio (`assets/images/wp/`, ver §9), pero puede haber más material que
   nadie quiera perder cuando ese hosting se cancele.

Guardar todo junto, fechado, fuera del portátil de trabajo.

---

## 4. Armar el paquete de publicación

```bash
npm run deploy:list     # ver qué entra y qué se excluye, sin escribir nada
npm run deploy:build    # deja el paquete en output/deploy/
```

`scripts/build-deploy.mjs` copia a `output/deploy/` solo lo que debe ser público
y falla ruidosamente si se cuela un `.env`, `api/db-config.php` o `server-data/`.
Se excluyen a propósito: `node_modules/`, `Docs/`, `scripts/`, `components/`
(fragmentos de referencia que ninguna página carga en runtime), `layouts/`,
`_test/`, `server-data/`, `uploads/`, los `.py`, el `.xlsx` y las carpetas fuente
de la animación.

**Por qué usar el script y no arrastrar el repositorio entero al FTP:** el riesgo
de una subida manual no es olvidar un archivo, es subir de más. Un `.env` en la
raíz del sitio se descarga escribiendo la URL; una copia local de `server-data/`
pisa la configuración real del panel en el servidor.

Antes de subir, comprobar que el paquete está sano:

```bash
node scripts/seo-check.mjs      # metadatos, sitemap, enlaces internos
python generate-pages.py        # validador de páginas
npm run check:js                # sintaxis de todo el JS
```

---

## 5. Subir el sitio (todavía en staging)

1. Subir **el contenido** de `output/deploy/` a `public_html/` del hosting nuevo
   (el contenido, no la carpeta: `index.html` tiene que quedar en la raíz).
2. **Verificar que `.htaccess` subió.** Muchos clientes FTP ocultan los archivos
   que empiezan por punto. Si falta, no hay HTTPS forzado ni bloqueo de `.env`.
3. Probar en la URL temporal de Hostinger o en un subdominio de staging.
   `.htaccess` conserva el host activo en la redirección a HTTPS justamente para
   que la vista previa siga siendo navegable antes del corte.

En este punto el sitio se ve, pero el panel y las solicitudes todavía no
funcionan: falta el paso 6.

---

## 6. Configurar el backend en el hosting nuevo

### 6.1 Restaurar el estado del servidor

Subir las copias del paso 3 a sus sitios:

- `server-data/` → `public_html/server-data/`
- `uploads/` → `public_html/uploads/`
- `VIRGINIASAPP/` → carpeta **hermana** de `public_html`

Comprobar que `public_html/server-data/.htaccess` viajó con la carpeta y que los
`.php` de dentro siguen empezando por `<?php exit;`. Son las dos barreras que
impiden leer la configuración y la bitácora desde el navegador.

### 6.2 Base de datos

1. Crear la base y el usuario en hPanel.
2. Importar el `.sql` del paso 3 desde phpMyAdmin. Si es una instalación limpia,
   las tablas se crean solas en la primera conexión (`api/db-esquema.sql` es la
   referencia del esquema).
3. **Configurar las credenciales desde el panel**, no a mano: `admin.html` →
   pestaña 📋 → tarjeta "🗄️ Base de datos". El panel **prueba la conexión antes
   de guardar** y escribe el archivo fuera de `public_html` cuando el hosting lo
   permite, así una republicación del sitio no lo borra.
4. Verificar en la bandeja del panel que aparecen las solicitudes importadas.

### 6.3 Correo

`server-data/correo-config.php` trae las credenciales de
`servicios@virginiasapp.edu.hn` (Microsoft 365, `smtp.office365.com:587`,
STARTTLS). Si se restauró en 6.1 no hay nada que hacer; si se perdió, se rehace
desde `api/correo-config.example.php`. Probar enviando el formulario de contacto.

### 6.4 Panel de administración

Entrar a `/admin.html` con la cuenta de siempre. Si `server-data/admin-user.php`
se restauró, la contraseña es la misma. Si no, la cuenta se siembra en el primer
arranque desde los hashes de `api/bootstrap.php` y **hay que cambiar la
contraseña inmediatamente** desde el panel.

---

## 7. El corte

### 7.1 Preparación, 24–48 h antes

1. En el Zone Editor del DNS actual, editar el registro **A** de la raíz:
   dejar la **misma IP vieja** y bajar el **TTL de 14400 a 300**. Guardar.
   No cambia nada visible; solo hace que la propagación del día del corte se
   mida en minutos en vez de en horas.
2. Anotar la **IP del hosting nuevo** (hPanel → Hosting → Detalles del servidor).
3. Repetir el respaldo del paso 3 si pasaron días desde el primero: entre medias
   pueden haber entrado solicitudes nuevas.

### 7.2 Ensayo con el dominio real (opcional, muy recomendado)

Antes de tocar el DNS público, apuntar **solo tu máquina** al hosting nuevo:

```
# C:\Windows\System32\drivers\etc\hosts   (abrir el editor como administrador)
IP_NUEVA_HOSTINGER   virginiasapp.edu.hn
```

Así se ve el sitio nuevo bajo el dominio real —navegación, canonical, formularios—
sin afectar a nadie más. **Borrar esa línea al terminar la prueba**, o seguirás
viendo el hosting nuevo cuando todos los demás vean el viejo.

### 7.3 Día del corte

Elegir una ventana de bajo tráfico (noche o fin de semana).

1. **Backup previo**: repetir el paso 3 sobre el hosting nuevo, ya en su estado
   final. Si el corte sale mal, esto es lo que permite volver.
2. **Publicar la versión final**: `npm run deploy:build` y subir a `public_html`.
3. **Mover el DNS**: en el Zone Editor, cambiar la IP del registro **A** de la
   raíz (`207.174.212.161`) por la IP nueva de Hostinger. Guardar.
4. **Esperar la propagación.** Con el TTL en 300 son minutos.
   ```bash
   nslookup virginiasapp.edu.hn      # debe devolver la IP nueva
   ```
5. **SSL**: hPanel → Security → SSL. Hostinger suele emitirlo solo en cuanto
   detecta el DNS apuntando ahí. Si no, forzarlo desde ahí. Hasta que exista, la
   redirección a HTTPS de `.htaccess` deja el sitio inaccesible con aviso de
   certificado: no anunciar el cambio hasta ver el candado.
6. **Smoke test** (§7.4).

### 7.4 Smoke test — nada se da por bueno sin pasar esta lista

Sobre `https://virginiasapp.edu.hn`:

**Infraestructura**
- [ ] `http://virginiasapp.edu.hn` redirige a `https://` (301).
- [ ] `https://www.virginiasapp.edu.hn` redirige a la raíz sin `www` (301).
- [ ] `https://virginiasapp.edu.hn/index.html` redirige a `/`.
- [ ] `https://virginiasapp.edu.hn/.env` devuelve 403, **no** el contenido.
- [ ] `https://virginiasapp.edu.hn/server-data/site-config.json` no se descarga.
- [ ] El candado del navegador sale sin avisos.

**Páginas**
- [ ] Las 13 páginas cargan sin errores en consola (F12).
- [ ] El menú móvil abre y cierra.
- [ ] Las fotos del hero de `index.html` se ven (ahora salen de
      `assets/images/wp/`, ya no del WordPress viejo — ver §9).
- [ ] `mision-evangelistica.html`, `quienes-somos.html` y `contactenos.html`
      muestran sus fotos.
- [ ] El cambio de idioma ES/EN funciona.

**Lo que de verdad importa**
- [ ] `preinscripcion.html`: completar una solicitud de prueba de principio a fin.
- [ ] La solicitud aparece en la bandeja del panel (pestaña 📋).
- [ ] El PDF de la solicitud se descarga y se ve completo.
- [ ] Llega el correo de aviso a la dirección de admisiones.
- [ ] La solicitud está en MySQL (phpMyAdmin → `ceevs_preinscripciones`) **y** en
      el espejo `VIRGINIASAPP/SOLICITUDES DE ADMISIÓN/`.
- [ ] Borrar la solicitud de prueba desde el panel y comprobar que desaparece de
      los dos sitios.
- [ ] El formulario de contacto envía y llega.
- [ ] Login del panel: entra, publica un cambio, y el cambio se ve en el sitio.

**SEO**
```bash
npm run seo:production          # ya apunta a https://virginiasapp.edu.hn
```
- [ ] `robots.txt` y `sitemap.xml` responden 200 y nombran el dominio sin `www`.

### 7.5 Si algo sale mal: reversión

El DNS es lo único que hay que deshacer: volver a poner la IP vieja en el
registro **A**. Con el TTL en 300 el sitio viejo vuelve en minutos. **Por eso no
se cancela el hosting de WordPress hasta varios días después.**

Si el problema es de datos (solicitudes que no se guardan), la reversión del DNS
no basta: hay que exportar de la base nueva lo que haya entrado mientras tanto
antes de volver atrás, o esas solicitudes quedan huérfanas.

---

## 8. Después del corte

- **No cancelar el hosting de WordPress** durante al menos una semana.
- **Search Console**: reenviar el sitemap y vigilar los 404 durante las primeras
  semanas. WordPress tenía URLs (`/nosotros/`, `/?page_id=…`, `/wp-content/…`)
  que el sitio estático no sirve. Si alguna recibe tráfico real, añadir su
  `Redirect 301` a `.htaccess`.
- **GA4 y Clarity**: en la propiedad GA4 (`G-HH474WYK57`, cuenta
  `adminwebvs@gmail.com`) actualizar la URL del flujo de datos web a
  `https://virginiasapp.edu.hn`. `js/analytics.js` no depende del dominio, así
  que sigue midiendo, pero la propiedad debe apuntar al sitio bueno.
- **Volver a subir el TTL** del registro A de 300 a 14400 cuando todo esté
  estable.
- Correr `npm run seo:production` una semana después.

---

## 9. Cambios ya aplicados en el repositorio para esta migración

*(agosto 2026 — ya están hechos, no hay que repetirlos)*

1. **Dominio canónico**: `prueba.virginiasapp.edu.hn` → `virginiasapp.edu.hn` en
   las 13 páginas (canonical, `og:url`, Twitter, JSON-LD), `robots.txt`,
   `sitemap.xml`, `components/head.html`, `scripts/seo-check.mjs` y
   `scripts/seo-production-check.mjs`.

2. **Fotos rescatadas del WordPress viejo** — el punto que habría roto el sitio
   en silencio. `index.html`, `quienes-somos.html`, `mision-evangelistica.html`,
   `contactenos.html` y el catálogo del panel (`js/admin.js`) cargaban 9
   fotografías desde `https://virginiasapp.edu.hn/wp-content/uploads/…`, es decir
   **desde el propio WordPress que la migración apaga**. Al mover el registro A
   esas URLs habrían devuelto 404 y el hero de la portada se habría quedado en
   blanco. Se descargaron mientras el WordPress seguía en pie, se redimensionaron
   a 1600 px (24,8 MB → 1,3 MB) y ahora se sirven desde `assets/images/wp/`.

3. **Redirección `www` → raíz** en `.htaccess`, nombrando el host explícitamente
   para no afectar a la URL temporal de Hostinger ni a un subdominio de staging.

4. **`scripts/build-deploy.mjs`** con `npm run deploy:build` y `deploy:list`.

5. `api/preinscripcion.php` ya no cita `www.virginiasapp.edu.hn` como host de
   respaldo en el correo de aviso.

---

## 10. Pendientes y decisiones que no son técnicas

- **Fotos publicadas desde el panel**: si en algún momento se guardó desde el
  panel una imagen apuntando a `wp-content`, esa URL sigue en
  `server-data/site-config.json` y se romperá igual, porque la configuración del
  servidor manda sobre el HTML. Revisar el gestor de imágenes del panel después
  del corte y volver a guardar las que aparezcan rotas.
- **`npm run check:secrets` falla** por un falso positivo anterior a esta tarea:
  `js/modules/versiculo-dia.js:28` es `CLAVE: 'versiculo_dia'`, el nombre de una
  clave de `localStorage`, no una credencial. Documentarlo en la lista
  `ACKNOWLEDGED` del propio checker (nunca borrando el patrón).
- **`ADMIN_PASS` en `js/admin.js`**: contraseña de emergencia del "modo local",
  en texto plano en el repositorio. En producción no se alcanza, pero si se
  parece a la contraseña real del panel, cambiarla.
- **Imágenes pesadas sin usar** que igual viajan al hosting:
  `assets/images/misionvision/IMG_9055.JPG` e `IMG_9057.JPG` (12 MB entre las
  dos) no las referencia nadie; los `.png` de `assets/animacion/` tampoco (el
  sitio pide los `.webp`). Se pueden quitar del paquete si el espacio aprieta.
- **Página 404 propia**: no existe. Tras el corte, las URLs viejas de WordPress
  mostrarán el error genérico de Apache. Vale la pena hacer una.

---

**Documentos relacionados**: `Docs/DEPLOYMENT.md` (despliegue general),
`Docs/SEO_OPERATIONS.md` (Search Console y analítica), `Docs/QA_CHECKLIST.md`.
