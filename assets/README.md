# Assets

Organización de recursos estáticos:

## Estructura
- **images/** - Imágenes organizadas por sección
  - hero/ - Imágenes del hero
  - sections/ - Imágenes de secciones
  - gallery/ - Galería de fotos
- **icons/** - SVG icons reutilizables
- **fonts/** - Fuentes locales (si las tienes)

## Convenciones
- Usar nombres descriptivos: `hero-bg.jpg`, `section-hero-cta.png`
- Optimizar antes de subir
- Preferir WebP para navegadores modernos
- Mantener fallbacks JPG/PNG

## Optimización
Todos los cambios de imágenes se hacen a través del panel admin:
- admin.html → Gestión de Imágenes
- Las URLs se guardan en localStorage
