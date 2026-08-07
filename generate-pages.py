#!/usr/bin/env python3
"""
Validador de páginas CEEVS — Fases 1 a 6
Verifica que todas las páginas HTML cumplan los estándares del proyecto.

Uso:
  python generate-pages.py          # valida todas las páginas
  python generate-pages.py --fix    # muestra sugerencias de corrección
"""

import os
import re
import sys

PAGES = [
    'index.html',
    'quienes-somos.html',
    'nosotros.html',
    'admisiones.html',
    'contactenos.html',
    'interactivo.html',
    'recuerdos.html',
    'inventario.html',
    'mision-evangelistica.html',
    'sugerencias.html',
    'comunicados.html',
    'capacitate.html',
]

REQUIRED_SCRIPTS = [
    'js/config.js',
    'js/core/app.js',
    'js/core/dom.js',
    'js/core/storage.js',
    'js/gamification.js',
    'js/main.js',
]

BANNED_PATTERNS = [
    (r'\bonclick\s*=', 'Inline onclick handler'),
    (r'\bonmouseover\s*=', 'Inline onmouseover handler'),
    (r'\bonmouseout\s*=', 'Inline onmouseout handler'),
    (r'\bonfocus\s*=.*this\.style', 'Inline onfocus style mutation'),
    (r'\bonblur\s*=.*this\.style', 'Inline onblur style mutation'),
]

REQUIRED_TAGS = [
    (r'<meta charset=', 'charset meta'),
    (r'<meta name="viewport"', 'viewport meta'),
    (r'<meta name="description"', 'description meta'),
    (r'App\.init\(\)', 'App.init() call'),
]

EDUBOX_URL = 'https://portal.edubox.app/login/virginiasapp'

DATA_FILES = [
    'data/site-config.json',
    'data/navigation.json',
    'data/contacts.json',
    'data/redirects.json',
    'data/word-search.json',
    'data/content-comunicados.json',
]

# Fase 2 — números/URL placeholder prohibidos
PLACEHOLDER_PHONE = '50422000000'
ALT_EDUBOX_URL = 'virginiasapp.edubox.app/core_sc'

# Fase 3 — secciones requeridas en quienes-somos.html
QS_REQUIRED_IDS = [
    'historia', 'mision', 'vision', 'filosofia', 'declaracion-fe', 'acsi',
]

# Secciones trasladadas de quienes-somos.html a nosotros.html (agosto 2026).
# Viven en nosotros.html y NO deben volver a quienes-somos.html: dos páginas
# con el mismo id romperían los anclajes y el scroll-spy.
NOSOTROS_REQUIRED_IDS = [
    'valores', 'perfil-egresado', 'laes', 'equipo-directivo', 'junta-directiva',
]


def extract_navbar(content):
    """Extract the navbar+mobile-menu block from HTML content."""
    match = re.search(
        r'<nav id="navbar".*?</div>\s*\n(?=\s*\n)',
        content,
        re.DOTALL,
    )
    return match.group(0) if match else content


def check_page(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()

    errors = []
    warnings = []

    # ── General: banned inline handlers ──
    for pattern, label in BANNED_PATTERNS:
        matches = re.findall(pattern, content)
        if matches:
            errors.append(f'{len(matches)}x {label}')

    # ── General: required meta/script tags ──
    for pattern, label in REQUIRED_TAGS:
        if not re.search(pattern, content):
            errors.append(f'Missing: {label}')

    # ── General: required scripts ──
    for script in REQUIRED_SCRIPTS:
        if script not in content:
            errors.append(f'Missing script: {script}')

    # ── Fase 1: extract navbar block ──
    navbar_block = extract_navbar(content)

    # ── Fase 1: official name in navbar ──
    if 'CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP' not in navbar_block:
        errors.append('Navbar no contiene "CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP"')

    # ── Fase 1: Misión evangelística in navbar ──
    if 'mision-evangelistica.html' not in navbar_block:
        errors.append('Navbar no contiene enlace a mision-evangelistica.html')
    if 'Misión evangelística' not in navbar_block:
        errors.append('Navbar no contiene texto "Misión evangelística"')

    # ── Fase 1: no TGU in navbar ──
    if re.search(r'\bTGU\b', navbar_block):
        errors.append('Navbar contiene "TGU" (debe eliminarse del branding)')

    # ── Fase 1: no href="#" in navbar ──
    href_hash_in_nav = re.findall(r'href="#"', navbar_block)
    if href_hash_in_nav:
        errors.append(f'{len(href_hash_in_nav)}x href="#" encontrado en navbar')

    # ── Fase 1: EDUBOX target and rel ──
    edubox_anchors = re.findall(
        r'<a[^>]*href="' + re.escape(EDUBOX_URL) + r'"[^>]*>',
        navbar_block,
    )
    for anchor in edubox_anchors:
        if 'target="_blank"' not in anchor:
            errors.append(f'Enlace EDUBOX sin target="_blank"')
            break
    for anchor in edubox_anchors:
        if 'rel="noopener"' not in anchor:
            errors.append(f'Enlace EDUBOX sin rel="noopener"')
            break

    # ── Fase 2: número WhatsApp placeholder ──
    if PLACEHOLDER_PHONE in content:
        errors.append(f'Número WhatsApp placeholder "{PLACEHOLDER_PHONE}" presente')

    # ── Fase 2: URL EDUBOX alternativa no documentada ──
    if ALT_EDUBOX_URL in content:
        errors.append('URL EDUBOX alternativa no documentada (virginiasapp.edubox.app/core_sc)')

    # ── Fase 2: enlaces WhatsApp seguros (target + rel) ──
    wa_anchors = re.findall(r'<a\b[^>]*href="https://wa\.me/[^"]*"[^>]*>', content)
    for a in wa_anchors:
        if 'target="_blank"' not in a:
            errors.append('Enlace WhatsApp sin target="_blank"')
            break
    for a in wa_anchors:
        if 'rel="noopener"' not in a:
            errors.append('Enlace WhatsApp sin rel="noopener"')
            break

    # ── Fase 2: validaciones específicas de admisiones.html ──
    if os.path.basename(path) == 'admisiones.html':
        if 'quiz-btn-next' in content:
            errors.append('Quiz contiene botón "Continuar" (quiz-btn-next) — debe avanzar solo')
        if 'data-show-result' in content:
            errors.append('Quiz contiene botón "Ver resultado" (data-show-result) — debe ser automático')
        if 'quiz-lead-form' in content:
            errors.append('Quiz contiene formulario simulado de captura (quiz-lead-form)')
        if EDUBOX_URL not in content:
            errors.append('admisiones.html no referencia la URL oficial de EDUBOX')

    # ── Fase 3: validaciones específicas de quienes-somos.html ──
    if os.path.basename(path) == 'quienes-somos.html':
        if 'class="qs-nav"' not in content:
            errors.append('quienes-somos.html no tiene navegación interna (qs-nav)')
        for sec_id in QS_REQUIRED_IDS:
            if f'id="{sec_id}"' not in content:
                errors.append(f'quienes-somos.html falta la sección id="{sec_id}"')
        if 'js/quienes-somos.js' not in content:
            errors.append('quienes-somos.html no carga js/quienes-somos.js')
        for sec_id in NOSOTROS_REQUIRED_IDS:
            if f'id="{sec_id}"' in content:
                errors.append(
                    f'quienes-somos.html conserva la sección id="{sec_id}" '
                    '(fue trasladada a nosotros.html)'
                )

    # ── Secciones trasladadas: nosotros.html ──
    if os.path.basename(path) == 'nosotros.html':
        if 'class="qs-nav"' not in content:
            errors.append('nosotros.html no tiene navegación interna (qs-nav)')
        for sec_id in NOSOTROS_REQUIRED_IDS:
            if f'id="{sec_id}"' not in content:
                errors.append(f'nosotros.html falta la sección id="{sec_id}"')
        if 'js/quienes-somos.js' not in content:
            errors.append(
                'nosotros.html no carga js/quienes-somos.js '
                '(scroll-spy y modal del equipo directivo)'
            )

    # ── Fase 4: validaciones específicas de contactenos.html ──
    if os.path.basename(path) == 'contactenos.html':
        if 'f-submit-btn' in content or 'class="contacto-form"' in content:
            errors.append('contactenos.html conserva el formulario simulado de contacto')
        if 'contacto-canales' not in content:
            errors.append('contactenos.html no tiene el bloque de canales directos')
        if 'mailto:empleosadieeds@gmail.com' not in content:
            errors.append('Empleos no usa el mailto oficial confirmado (SDD-F4-JOBS-001)')

    # ── Fase 4: validaciones específicas de sugerencias.html ──
    if os.path.basename(path) == 'sugerencias.html':
        if 'id="sugerencias-form"' not in content:
            errors.append('sugerencias.html no contiene el formulario de sugerencias')
        if 'js/sugerencias.js' not in content:
            errors.append('sugerencias.html no carga js/sugerencias.js')

    # ── Fase 6: misión evangelística accesible desde el inicio ──
    # Tras rediseñar el index como portal de navegación, el acceso a la
    # misión evangelística es una tarjeta del portal (no la antigua
    # sección home-mision). Basta con que el inicio enlace a su página.
    if os.path.basename(path) == 'index.html':
        if 'mision-evangelistica.html' not in content:
            errors.append('index.html no enlaza a mision-evangelistica.html')

    # ── Fase 5: comunicados.html ──
    if os.path.basename(path) == 'comunicados.html':
        if 'id="comunicados"' not in content:
            errors.append('comunicados.html no tiene la sección de comunicados')
        if 'id="calendario"' not in content:
            errors.append('comunicados.html no tiene la sección de calendario')

    # ── Fase 5: capacitate.html ──
    if os.path.basename(path) == 'capacitate.html':
        if 'id="capacitate"' not in content:
            errors.append('capacitate.html no tiene la sección de capacitación')

    # ── i18n: conmutador de idioma ES/EN ──
    if 'js/i18n-data.js' not in content:
        errors.append('La página no carga js/i18n-data.js (diccionario de idioma)')
    if 'js/i18n.js' not in content:
        errors.append('La página no carga js/i18n.js (conmutador de idioma)')
    elif 'js/i18n-data.js' in content:
        # i18n-data.js debe cargarse ANTES que i18n.js
        if content.index('js/i18n-data.js') > content.index('js/i18n.js'):
            errors.append('js/i18n-data.js debe cargarse antes que js/i18n.js')

    # ── Fase 6: SEO / rendimiento / seguridad ──
    if 'property="og:image"' not in content:
        errors.append('Falta <meta property="og:image"> (Open Graph)')
    if 'data:image' in content:
        errors.append('HTML contiene imagen base64 (data:image) — usar archivo externo')
    blank_anchors = re.findall(r'<a\b[^>]*target="_blank"[^>]*>', content)
    for a in blank_anchors:
        if 'rel=' not in a:
            errors.append('Enlace target="_blank" sin rel')
            break

    return errors, warnings


def check_data_files():
    errors = []
    for f in DATA_FILES:
        if not os.path.exists(f):
            errors.append(f'Archivo requerido faltante: {f}')
    return errors


def run():
    print('CEEVS — Validador de páginas (Fases 1 a 6)')
    print('=' * 55)
    total_errors = 0

    # Check data files
    data_errors = check_data_files()
    if data_errors:
        print('\n[FAIL] Archivos de configuración')
        for e in data_errors:
            print(f'       ERROR: {e}')
            total_errors += 1
    else:
        print('\n[OK  ] Archivos de configuración (data/)')

    # Check páginas nuevas existen
    for new_page in ('mision-evangelistica.html', 'sugerencias.html',
                     'comunicados.html', 'capacitate.html', 'nosotros.html'):
        if not os.path.exists(new_page):
            print(f'\n[FAIL] {new_page} no existe')
            total_errors += 1
        else:
            print(f'[OK  ] {new_page} existe')

    # Check archivos SEO técnicos (Fase 6)
    for seo_file in ('sitemap.xml', 'robots.txt'):
        if not os.path.exists(seo_file):
            print(f'\n[FAIL] {seo_file} no existe')
            total_errors += 1
        else:
            print(f'[OK  ] {seo_file} existe')

    # Check HTML pages
    titles = {}
    for page in PAGES:
        if not os.path.exists(page):
            print(f'\n[SKIP] {page}  (no encontrado)')
            continue

        errors, warnings = check_page(page)

        # Fase 6: títulos únicos
        with open(page, encoding='utf-8') as f:
            tm = re.search(r'<title>(.*?)</title>', f.read(), re.DOTALL)
        title = tm.group(1).strip() if tm else ''
        if title and title in titles:
            errors.append(f'Título duplicado (igual que {titles[title]})')
        elif title:
            titles[title] = page

        status = 'OK  ' if not errors else 'FAIL'
        print(f'\n[{status}] {page}')
        for e in errors:
            print(f'       ERROR: {e}')
            total_errors += 1
        for w in warnings:
            print(f'    WARNING: {w}')

    print('\n' + '=' * 55)
    if total_errors == 0:
        print('OK Todas las paginas pasaron la validacion (Fases 1 a 6).')
    else:
        print(f'FAIL {total_errors} error(es) encontrado(s). Revisar arriba.')
    return total_errors


if __name__ == '__main__':
    exit_code = run()
    sys.exit(0 if exit_code == 0 else 1)
