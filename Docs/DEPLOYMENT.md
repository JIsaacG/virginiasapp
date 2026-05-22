# Guía de despliegue — Sitio web CEEVS

Centro Educativo Evangélico Virginia Sapp · Sitio estático (HTML + CSS + JavaScript).

---

## 1. Requisitos

- No requiere backend, base de datos ni proceso de build.
- Para probar localmente: un servidor estático (XAMPP, `python -m http.server`,
  extensión "Live Server" de VS Code, etc.). Algunas funciones (`fetch` de los
  archivos `data/*.json`) **no funcionan abriendo el HTML con `file://`**: usar
  siempre un servidor HTTP.
- Para validar: Python 3 (`python generate-pages.py`).

---

## 2. Estructura del proyecto

```
/
├── *.html                 Páginas públicas
├── admin.html             Panel administrativo (excluido de buscadores)
├── css/                   CSS modular (entrada: css/main.css)
├── js/                    JavaScript (patrón App.register / App.init)
├── components/            Fragmentos HTML de referencia (navbar, footer)
├── data/                  Configuración y contenido en JSON
├── assets/                Imágenes, iconos, fuentes
├── docs/                  Documentación (incluye docs/sdd/ por fase)
├── sitemap.xml            Mapa del sitio
├── robots.txt             Reglas para buscadores
└── generate-pages.py      Validador técnico
```

---

## 3. Probar localmente

```bash
# Opción A — Python
python -m http.server 8000
# Abrir http://localhost:8000

# Opción B — XAMPP
# Copiar el proyecto a htdocs/ y abrir http://localhost/<carpeta>/

# Validar estructura
python generate-pages.py
```

---

## 4. Desplegar

El sitio es estático: se publica subiendo los archivos tal cual.

### GitHub Pages
1. Subir el repositorio a GitHub.
2. Settings → Pages → Source: rama `main`, carpeta `/ (root)`.
3. El sitio queda en `https://<usuario>.github.io/<repo>/`.

### Cloudflare Pages
1. Conectar el repositorio en el panel de Cloudflare Pages.
2. Build command: *(vacío)* · Output directory: `/`.
3. Deploy.

### Vercel
1. Importar el repositorio en Vercel.
2. Framework preset: **Other** · Build/Output: *(vacío)*.
3. Deploy.

---

## 5. Dominio y SSL

- **PENDING_DOMAIN_OFFICIAL:** confirmar el dominio oficial (p. ej.
  `www.virginiasapp.edu.hn`).
- Tras confirmarlo, actualizar:
  - `robots.txt` → línea `Sitemap:`
  - `sitemap.xml` → todas las etiquetas `<loc>`
  - `og:image` de cada página (idealmente a URL absoluta)
- SSL: GitHub Pages, Cloudflare Pages y Vercel proveen HTTPS automático. Para un
  dominio propio, activar el certificado en el panel del proveedor.

---

## 6. Validar enlaces

```bash
python generate-pages.py
```

El validador comprueba: scripts requeridos, metadatos, navbar, EDUBOX, WhatsApp,
ausencia de `onclick` inline y de formularios simulados, y la estructura por fase.

Revisión manual recomendada: ver `docs/QA_CHECKLIST.md`.

---

## 7. Actualizar contenido

Ver `docs/CONTENT_GUIDE.md`. En resumen:

- Marca, navegación y contactos: archivos en `data/`.
- Textos pendientes: buscar los comentarios `PENDING_CONTENT_*`, `PENDING_ASSET_*`
  y `PENDING_DECISION_*` en el código.
- Estilos: editar el archivo correspondiente en `css/4-sections/`.

---

## 8. Pendientes antes de la publicación final

- `PENDING_ASSET_LOGO_PRINCIPAL` — logo oficial en `assets/logo principal.png`.
- `PENDING_DOMAIN_OFFICIAL` — dominio oficial en `sitemap.xml` y `robots.txt`.
- `PENDING_ASSET_OG_IMAGE` — imagen Open Graph institucional (1200×630).
- Contenido institucional marcado con `PENDING_CONTENT_*`.
- Confirmar correos y números (`data/contacts.json`, `data/redirects.json`).
