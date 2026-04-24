#!/usr/bin/env python3
"""
Validador de páginas CEEVS
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
    'admisiones.html',
    'contactenos.html',
    'interactivo.html',
    'recuerdos.html',
    'inventario.html',
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


def check_page(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()

    errors = []
    warnings = []

    for pattern, label in BANNED_PATTERNS:
        matches = re.findall(pattern, content)
        if matches:
            count = len(matches)
            errors.append(f'{count}x {label}')

    for pattern, label in REQUIRED_TAGS:
        if not re.search(pattern, content):
            errors.append(f'Missing: {label}')

    for script in REQUIRED_SCRIPTS:
        if script not in content:
            errors.append(f'Missing script: {script}')

    return errors, warnings


def run():
    print('CEEVS — Validador de páginas')
    print('=' * 50)
    total_errors = 0

    for page in PAGES:
        if not os.path.exists(page):
            print(f'\n[SKIP] {page}  (no encontrado)')
            continue

        errors, warnings = check_page(page)
        status = 'OK' if not errors else 'FAIL'
        print(f'\n[{status}] {page}')
        for e in errors:
            print(f'       ERROR: {e}')
            total_errors += 1
        for w in warnings:
            print(f'    WARNING: {w}')

    print('\n' + '=' * 50)
    if total_errors == 0:
        print('Todas las páginas pasaron la validación.')
    else:
        print(f'{total_errors} error(es) encontrado(s). Revisar arriba.')
    return total_errors


if __name__ == '__main__':
    exit_code = run()
    sys.exit(0 if exit_code == 0 else 1)
