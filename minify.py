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


# calc(), min(), max() y clamp() son funciones matematicas: CSS EXIGE espacio
# alrededor de '+' y '-'. Como el minificador colapsa los espacios pegados a
# '+' (lo necesita para el combinador hermano `a + b`), su contenido se aparta
# antes de minificar y se restaura al final. Sin esto, `calc(100% + 8px)` sale
# como `calc(100%+8px)`: el navegador descarta la declaracion y la regla se
# pierde en dist/main.min.css aunque el CSS de origen este bien escrito.
MATH_FN_RE = re.compile(r'(?<![\w-])(calc|min|max|clamp)\(', re.IGNORECASE)


def compact_math(expr):
    """Compacta una funcion matematica sin tocar los espacios obligatorios."""
    expr = re.sub(r'\s+', ' ', expr)
    expr = re.sub(r'\(\s+', '(', expr)
    expr = re.sub(r'\s+\)', ')', expr)
    expr = re.sub(r'\s*,\s*', ',', expr)
    expr = re.sub(r'\s*([*/])\s*', r'\1', expr)
    return expr


def protect_math(text):
    """Aparta cada funcion matematica tras un marcador sin espacios."""
    parts, stash, i = [], [], 0
    while True:
        m = MATH_FN_RE.search(text, i)
        if not m:
            parts.append(text[i:])
            break
        parts.append(text[i:m.start()])
        depth, end = 0, len(text)
        for k in range(m.end() - 1, len(text)):
            if text[k] == '(':
                depth += 1
            elif text[k] == ')':
                depth -= 1
                if depth == 0:
                    end = k + 1
                    break
        stash.append(compact_math(text[m.start():end]))
        parts.append('\x00{}\x00'.format(len(stash) - 1))
        i = end
    return ''.join(parts), stash


def restore_math(text, stash):
    return re.sub(r'\x00(\d+)\x00', lambda m: stash[int(m.group(1))], text)


def minify_css(text):
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    text, math = protect_math(text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s*([{}:;,>~+])\s*', r'\1', text)
    text = re.sub(r';\}', '}', text)
    return restore_math(text.strip(), math)


def minify_js(text):
    text = re.sub(r'(?<!:)//(?!/).*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'[ \t]+$', '', text, flags=re.MULTILINE)
    return text.strip()


def resolve_css_imports(css_path):
    """Recursively inline @import rules."""
    base = os.path.dirname(css_path)
    with open(css_path, encoding='utf-8') as f:
        text = f.read()

    def replace_import(m):
        rel = m.group(1).strip("'\"")
        # Las versiones ?v=... son para caché HTTP; no forman parte del path.
        rel_path = rel.split('?', 1)[0]
        full = os.path.normpath(os.path.join(base, rel_path))
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
