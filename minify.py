#!/usr/bin/env python3
"""
Minificador de CSS y JS para CEEVS
Uso: python minify.py [--check]
  --check   Solo reporta tamaños sin generar archivos
"""

import os
import re
import sys

DIST_DIR = 'dist'
CSS_ENTRY = 'css/main.css'
JS_FILES = [
    'js/config.js',
    'js/core/app.js',
    'js/core/dom.js',
    'js/core/storage.js',
    'js/gamification.js',
    'js/main.js',
    'js/gallery.js',
    'js/games.js',
    'js/quiz.js',
    'js/image-manager.js',
]


def minify_css(text):
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s*([{}:;,>~+])\s*', r'\1', text)
    text = re.sub(r';\}', '}', text)
    return text.strip()


def minify_js(text):
    text = re.sub(r'(?<!:)//(?!/).*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def resolve_css_imports(css_path):
    """Recursively inline @import rules."""
    base = os.path.dirname(css_path)
    with open(css_path, encoding='utf-8') as f:
        text = f.read()

    def replace_import(m):
        rel = m.group(1).strip("'\"")
        full = os.path.normpath(os.path.join(base, rel))
        if os.path.exists(full):
            return resolve_css_imports(full)
        return f'/* missing: {rel} */'

    return re.sub(r"@import\s+url\(['\"]?([^'\")\s]+)['\"]?\)\s*;", replace_import, text)


def check_only():
    total_css = sum(os.path.getsize(p) for p in [CSS_ENTRY] if os.path.exists(p))
    total_js = sum(os.path.getsize(p) for p in JS_FILES if os.path.exists(p))
    print(f'CSS entry:  {CSS_ENTRY}  ({total_css:,} bytes)')
    print(f'JS total:   {total_js:,} bytes across {len(JS_FILES)} files')
    print(f'Combined:   {total_css + total_js:,} bytes')


def build():
    os.makedirs(DIST_DIR, exist_ok=True)

    # --- CSS ---
    if os.path.exists(CSS_ENTRY):
        raw = resolve_css_imports(CSS_ENTRY)
        mini = minify_css(raw)
        out_css = os.path.join(DIST_DIR, 'main.min.css')
        with open(out_css, 'w', encoding='utf-8') as f:
            f.write(mini)
        ratio = (1 - len(mini) / max(len(raw), 1)) * 100
        print(f'CSS: {len(raw):,} -> {len(mini):,} bytes  ({ratio:.0f}% saved)  ->  {out_css}')
    else:
        print(f'CSS entry not found: {CSS_ENTRY}')

    # --- JS ---
    combined = []
    for path in JS_FILES:
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                combined.append(f.read())
        else:
            print(f'  SKIP (not found): {path}')
    raw_js = '\n'.join(combined)
    mini_js = minify_js(raw_js)
    out_js = os.path.join(DIST_DIR, 'bundle.min.js')
    with open(out_js, 'w', encoding='utf-8') as f:
        f.write(mini_js)
    ratio = (1 - len(mini_js) / max(len(raw_js), 1)) * 100
    print(f'JS:  {len(raw_js):,} -> {len(mini_js):,} bytes  ({ratio:.0f}% saved)  ->  {out_js}')

    print(f'\nDist ready in ./{DIST_DIR}/')
    print('Update <link> and <script> tags in HTML to point to dist/ for production.')


if __name__ == '__main__':
    if '--check' in sys.argv:
        check_only()
    else:
        build()
