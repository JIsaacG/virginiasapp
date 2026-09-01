# Operación SEO de CEEVS

## Dominios

- Dominio público y origen canónico: `https://virginiasapp.edu.hn/` (sin `www`)

Toda la metadata SEO, el sitemap y las pruebas usan ese dominio como canónico. El host
`www` no es canónico: `.htaccess` lo redirige con un 301 a la raíz y `seo:check` lo rechaza.

Hasta agosto de 2026 el canónico fue `prueba.virginiasapp.edu.hn` y parte de las fotos se
servían desde el WordPress viejo (`virginiasapp.edu.hn/wp-content/`). Las dos cosas se
resolvieron al preparar la migración: ver `Docs/HOSTINGER_RUNBOOK.md` §9.

La respuesta pública de Hostinger entregaba una regla que bloqueaba a Googlebot; para poder
aparecer en Google, elimina ese bloqueo desde hPanel o solicita a soporte de Hostinger que
habilite el rastreo del dominio.

## Comandos

```bash
npm run seo:check       # Metadatos, sitemap, robots, JSON-LD, H1, alt y enlaces
npm run seo:lighthouse  # SEO, rendimiento, accesibilidad y buenas prácticas
npm run seo:audit       # Ambas pruebas locales
npm run seo:production  # Comprueba la publicación temporal después de desplegar
```

Para comprobar otra publicación:

```bash
SEO_TARGET_URL=https://virginiasapp.edu.hn npm run seo:production
```

En PowerShell:

```powershell
$env:SEO_TARGET_URL='https://virginiasapp.edu.hn'; npm run seo:production
```

Los pull requests y cambios a `main` ejecutan la auditoría local mediante `.github/workflows/seo-quality.yml`. Los informes Lighthouse quedan adjuntos a la ejecución durante 14 días.

## Analítica y Search Console

**Cuenta oficial: `adminwebvs@gmail.com`** — la misma del panel de administración. Toda propiedad
de GA4, proyecto de Clarity y propiedad de Search Console se crea y administra desde ahí, nunca
desde una cuenta personal: si la persona que la creó se va, el histórico se va con ella.

Todo el seguimiento vive en **un solo archivo**: `js/analytics.js`, con dos constantes
(`GA4_ID`, `CLARITY_ID`). Se carga con `defer` en las 13 páginas públicas desde el `<head>`
y **no mide** en `localhost`, `file://` ni en `admin.html`. Mientras un ID contenga `XXXX`,
ese proveedor no se carga (el archivo es seguro de publicar sin activar seguimiento).

### Google Analytics 4

1. `analytics.google.com` → Administrar → Crear propiedad.
2. Nombre `CEEVS — Virginia Sapp`, zona horaria **(GMT-06:00) Tegucigalpa**, moneda Lempira.
3. Flujo de datos → Web → URL `https://virginiasapp.edu.hn` (el **dominio canónico**,
   sin `www`). Medición mejorada activada.
4. Copiar el ID de medición `G-XXXXXXXXXX` y pegarlo en `GA4_ID` (`js/analytics.js`).
5. La propiedad anterior `G-HH474WYK57` queda archivada en su cuenta de origen; la nueva
   empieza a contar de cero. Exportar antes lo que se quiera conservar.

Evento de conversión ya implementado en el código: `contacto_click`, con el parámetro `canal`
(`edubox` para matrícula, `whatsapp`, `correo`) y `destino`. Para verlo en los informes hay que
registrar `canal` en **Administrar → Definiciones personalizadas → Dimensión personalizada**
(ámbito: evento). Sin ese paso el evento llega pero el parámetro no es explorable.

### Microsoft Clarity (mapas de calor y grabaciones)

- `clarity.microsoft.com` permite iniciar sesión **con la cuenta de Google**.
- El proyecto actual es `xpzgkdd0up`. Para ponerlo en la cuenta oficial basta añadir
  `adminwebvs@gmail.com` en *Settings → Team → Add member* con rol Admin: **no cambia el ID
  ni requiere tocar el código**, y conserva todas las grabaciones.
- Recomendado: *Settings → Integrations → Google Analytics* para cruzar grabaciones con eventos GA4.

### Google Search Console

Orden de preferencia para verificar:

1. **Propiedad de dominio (DNS)** — un registro `TXT` en el DNS de `virginiasapp.edu.hn`.
   Es la mejor: cubre `http`/`https`, con y sin `www`, y todos los subdominios.
2. **Método "Google Analytics"** — aprovecha el `gtag.js` ya publicado por `analytics.js`.
   No requiere ningún cambio de código, pero solo verifica el prefijo de URL exacto.
3. **Meta `google-site-verification`** — se añade en el `<head>` de las 13 páginas públicas.

⚠️ Antes de intentar verificar hay que resolver el bloqueo a Googlebot descrito arriba: con el
rastreo bloqueado, los métodos 2 y 3 pueden fallar porque Google no puede leer la página.

Después de verificar: enviar `https://virginiasapp.edu.hn/sitemap.xml` y vincular la
propiedad a GA4 (*Administrar → Enlaces de Search Console*).

### Comprobar que realmente mide

- GA4 → Informes → **Tiempo real**, con el sitio publicado abierto en otra pestaña.
- DevTools → Network: debe salir `collect?v=2` hacia `google-analytics.com` y `tag/...`
  hacia `clarity.ms`. Si no salen, revisar que no se esté probando en `localhost`.

## OpenSEO

El endpoint alojado ya está declarado en `.mcp.json`:

```text
https://app.openseo.so/mcp
```

OpenSEO necesita que el propietario autorice su cuenta. Para conectarlo directamente a Codex CLI:

```bash
codex mcp add openseo --url https://app.openseo.so/mcp
```

Después de autorizar:

1. Crea o selecciona el proyecto `virginiasapp.edu.hn`.
2. Conecta Google Search Console cuando Googlebot pueda rastrear el dominio.
3. Ejecuta una auditoría de sitio después de cada despliegue importante.
4. Revisa semanalmente posiciones, páginas con impresiones y errores de indexación.
5. Revisa mensualmente palabras clave locales como colegio cristiano, colegio bilingüe, preescolar, primaria y secundaria en Tegucigalpa.
6. Revisa trimestralmente competidores y backlinks; convierte oportunidades reales en contenido o relaciones institucionales.

Si en el futuro se cambia el dominio público, primero actualiza el origen canónico en el código y configura una redirección permanente desde este dominio para conservar las señales SEO.
