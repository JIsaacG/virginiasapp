# Operación SEO de CEEVS

## Dominios

- Dominio público y origen canónico: `https://prueba.virginiasapp.edu.hn/`
- Dominio que todavía aloja parte de las imágenes: `https://virginiasapp.edu.hn/`

Toda la metadata SEO, el sitemap y las pruebas usan el dominio de Hostinger como canónico. La respuesta pública de Hostinger entrega actualmente una regla que bloquea a Googlebot; para poder aparecer en Google, elimina ese bloqueo desde hPanel o solicita a soporte de Hostinger que habilite el rastreo del dominio.

## Comandos

```bash
npm run seo:check       # Metadatos, sitemap, robots, JSON-LD, H1, alt y enlaces
npm run seo:lighthouse  # SEO, rendimiento, accesibilidad y buenas prácticas
npm run seo:audit       # Ambas pruebas locales
npm run seo:production  # Comprueba la publicación temporal después de desplegar
```

Para comprobar otra publicación:

```bash
SEO_TARGET_URL=https://prueba.virginiasapp.edu.hn npm run seo:production
```

En PowerShell:

```powershell
$env:SEO_TARGET_URL='https://prueba.virginiasapp.edu.hn'; npm run seo:production
```

Los pull requests y cambios a `main` ejecutan la auditoría local mediante `.github/workflows/seo-quality.yml`. Los informes Lighthouse quedan adjuntos a la ejecución durante 14 días.

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

1. Crea o selecciona el proyecto `prueba.virginiasapp.edu.hn`.
2. Conecta Google Search Console cuando Googlebot pueda rastrear el dominio.
3. Ejecuta una auditoría de sitio después de cada despliegue importante.
4. Revisa semanalmente posiciones, páginas con impresiones y errores de indexación.
5. Revisa mensualmente palabras clave locales como colegio cristiano, colegio bilingüe, preescolar, primaria y secundaria en Tegucigalpa.
6. Revisa trimestralmente competidores y backlinks; convierte oportunidades reales en contenido o relaciones institucionales.

Si en el futuro se cambia el dominio público, primero actualiza el origen canónico en el código y configura una redirección permanente desde este dominio para conservar las señales SEO.
