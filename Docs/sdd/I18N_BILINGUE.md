# Sistema bilingüe ES/EN — Sitio web CEEVS

**Requerimiento:** REQUERIMIENTOS.md §3 · Contratos: SDD-PEND-013, SDD-I18N-FIX-001 a 004
**Fecha:** 2026-05-22 · **Estado:** Funcional (file:// y http://) — traducciones EN por validar (§29)

---

## Qué se implementó

Un conmutador de idioma **Español / Inglés** funcional en todo el sitio, sin
duplicar las páginas HTML.

| Componente | Archivo |
|------------|---------|
| Motor de traducción | `js/i18n.js` |
| Diccionario ES→EN (670 entradas) | `js/i18n-data.js` |
| Estilos del conmutador | `css/3-layout/navbar.css` (`.lang-btn`, `.nav-lang`) |

---

## Cómo funciona

1. `js/i18n-data.js` define el diccionario en la variable global
   `window.CEEVS_I18N`. Se carga con `<script>` **antes** de `js/i18n.js`.
2. `js/i18n.js` recorre los nodos de texto y atributos (`placeholder`,
   `aria-label`, `title`, `alt`) de la página al cargar.
3. El conmutador ES/EN aparece en la barra de navegación (escritorio) y en el
   menú móvil. Se construye por JavaScript, por lo que **no fue necesario editar
   las 11 páginas**.
4. Al elegir **EN**, el motor busca cada texto en el diccionario y lo reemplaza;
   al elegir **ES**, restaura el original.
5. Un `MutationObserver` traduce también el contenido que aparece después de
   cargar (por ejemplo, el resultado del quiz).
6. La preferencia se guarda en `localStorage` (`ceevs_lang`) y se aplica
   automáticamente al navegar entre páginas. El atributo `<html lang>` se actualiza.

> **No usa `fetch`.** El diccionario va embebido como JavaScript, por lo que el
> conmutador funciona tanto abriendo el sitio con un servidor (`http://`) como
> abriendo el archivo directamente en el navegador (`file://`).

---

## Cómo actualizar las traducciones

Editar `js/i18n-data.js`. Estructura:

```js
window.CEEVS_I18N = {
  "en": {
    "Texto en español": "Text in English"
  }
};
```

La clave es el texto en español **tal como aparece en la página** (los espacios
internos se normalizan automáticamente). Si una cadena no está en el diccionario,
el motor la deja en español (degradación segura).

---

## Pendientes (§29 — validación institucional)

- Las traducciones al inglés son una **primera versión generada por el
  desarrollador** y deben ser **revisadas y aprobadas** por la institución.
- El nombre institucional se tradujo como *"Virginia Sapp Evangelical Educational
  Center"*; confirmar si la institución prefiere otra forma o conservar el nombre
  en español.
- Algunos títulos divididos por `<em>` pueden tener un orden de palabras
  mejorable en inglés.
- El banco de preguntas de la trivia y otros textos largos embebidos en
  `js/games.js` permanecen en español (`SDD-I18N-FIX-005`, pendiente menor por
  volumen).
- Los metadatos `<title>` y `<meta description>` no cambian con el idioma
  (el SEO multilingüe es una mejora posterior).
