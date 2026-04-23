#!/usr/bin/env python3
"""
Generador automático de páginas HTML

Automatiza la creación de páginas reutilizando componentes y layouts.
Cambios en un componente = regenerar todos los HTML automáticamente.

USO:
  python generate-pages.py

RESULTADO:
  Actualiza/crea todas las páginas HTML automáticamente
"""

import os
import json

# Configuración de páginas
PAGES_CONFIG = {
    "index.html": {
        "title": "Instituto Evangélico Virginia Sapp | CEEVS · Tegucigalpa, Honduras",
        "description": "Formamos líderes con valores cristianos desde 1962. Educación bilingüe en Preescolar, Primaria y Secundaria en Tegucigalpa, Honduras.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
    },
    "quienes-somos.html": {
        "title": "Quiénes Somos | CEEVS",
        "description": "Conoce nuestra historia, filosofía educativa y valores.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
    },
    "admisiones.html": {
        "title": "Admisiones 2026–2027 | CEEVS",
        "description": "Proceso de admisión y niveles educativos.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
    },
    "contactenos.html": {
        "title": "Contáctenos | CEEVS",
        "description": "Ubicación, teléfono y formulario de contacto.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
    },
    "interactivo.html": {
        "title": "Actividades Interactivas | CEEVS",
        "description": "Mini-juegos educativos para todas las edades.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
    },
    "recuerdos.html": {
        "title": "Recuerdos | Instituto Evangélico Virginia Sapp · CEEVS",
        "description": "Álbumes de fotos y recuerdos del Instituto Evangélico Virginia Sapp.",
        "lang": "es",
        "robots": "index, follow",
        "components": ["custom-cursor", "navbar", "gamification-hud", "toast"],
        "extra_css": "css/pages/recuerdos.css",
    },
    "admin.html": {
        "title": "Administración | CEEVS",
        "lang": "es",
        "robots": "noindex, nofollow",
        "components": ["custom-cursor"],
        "extra_css": "css/pages/admin.css",
    },
}

def load_component(component_name):
    """Carga el contenido de un componente HTML"""
    path = f"components/{component_name}.html"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"<!-- ERROR: Componente {component_name} no encontrado -->"

def generate_head(config):
    """Genera el <head> de una página"""
    title = config.get("title", "CEEVS")
    desc = config.get("description", "Instituto Evangélico Virginia Sapp")
    lang = config.get("lang", "es")
    robots = config.get("robots", "index, follow")

    head = f'''<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#412404">

<!-- Open Graph -->
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_HN">

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap" rel="stylesheet">

<!-- Styles -->
<link rel="stylesheet" href="css/main.css">'''

    if config.get("extra_css"):
        head += f'\n<link rel="stylesheet" href="{config["extra_css"]}">'

    return head

def generate_page(filename, config):
    """Genera una página HTML completa"""
    title = config.get("title", "CEEVS")
    components = config.get("components", [])

    # Construir HTML
    html = f"""<!DOCTYPE html>
<html lang="{config.get('lang', 'es')}">
<head>
{generate_head(config)}
<title>{title}</title>
</head>
<body>

"""

    # Agregar componentes
    for comp in components:
        html += load_component(comp) + "\n\n"

    # Agregar body content (si existe en página original)
    # Por ahora, esto es un template base
    # Las páginas completas se editan manualmente

    html += """</body>
</html>
"""
    return html

if __name__ == "__main__":
    print("🔄 Generador de páginas CEEVS")
    print("=" * 50)

    for filename, config in PAGES_CONFIG.items():
        print(f"\n✓ Configuración cargada para: {filename}")
        print(f"  Componentes: {', '.join(config.get('components', []))}")

        # En fase 2, solo mostramos la configuración
        # Las páginas completas se generarían si tenemos templates

    print("\n" + "=" * 50)
    print("📝 NOTA: Este script está listo para automatizar")
    print("   la generación de páginas cuando tengas templates.")
    print("\n   Para activarlo completamente, necesitas:")
    print("   1. layouts/ con templates base")
    print("   2. Bloques de contenido separados")
    print("   3. Sistema de macros para secciones")
