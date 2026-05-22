# QA Checklist — Sitio web CEEVS

Lista de verificación manual antes de cada entrega. Complementa al validador
automático (`python generate-pages.py`).

---

## Navegación

- [ ] Navbar correcto en escritorio (todas las páginas).
- [ ] Navbar correcto en móvil (hamburguesa abre/cierra, Escape cierra).
- [ ] "Misión evangelística" visible en el menú.
- [ ] "Portal" abre EDUBOX en pestaña nueva.
- [ ] "Solicitar admisión" abre EDUBOX en pestaña nueva.
- [ ] No hay enlaces principales rotos.

## Identidad

- [ ] Nombre oficial "CENTRO EDUCATIVO EVANGÉLICO VIRGINIA SAPP" en navbar.
- [ ] Logo visible en navbar y footer.
- [ ] Paleta institucional aplicada.
- [ ] No aparece "TGU" en el branding.

## Admisiones (Fase 2)

- [ ] Niveles educativos visibles y con CTA.
- [ ] Quiz avanza automáticamente (sin botón "Continuar").
- [ ] El resultado del quiz muestra CTAs (EDUBOX + WhatsApp).
- [ ] EDUBOX unificado en todos los CTAs de admisión.
- [ ] Proceso de admisión centrado y claro.

## Quiénes somos (Fase 3)

- [ ] Navegación interna (pills) funciona y resalta la sección visible.
- [ ] Secciones: Misión, Visión, Valores, Declaración de fe, ACSI, Historia,
      Perfil del egresado, LAES, Equipo directivo, Junta directiva.
- [ ] Acordeones del equipo directivo abren/cierran con teclado.

## Contacto (Fase 4)

- [ ] WhatsApp Primaria y Secundaria funcionan con mensaje prellenado.
- [ ] No hay formulario simulado de contacto.
- [ ] "Cómo llegar" abre Google Maps.
- [ ] Empleos abre `mailto` a RRHH.
- [ ] `sugerencias.html` abre el cliente de correo al enviar.

## Contenido (Fase 5)

- [ ] Misión evangelística visible en el inicio.
- [ ] Galería carga sin imágenes rotas.
- [ ] Juegos de `interactivo.html` funcionan sin errores en consola.
- [ ] `comunicados.html` y `capacitate.html` cargan correctamente.

## SEO / Accesibilidad / Rendimiento (Fase 6)

- [ ] Cada página tiene `title` único.
- [ ] Cada página tiene `meta description`.
- [ ] Open Graph completo (incluye `og:image`).
- [ ] `sitemap.xml` y `robots.txt` existen.
- [ ] Imágenes con `alt` y `loading="lazy"` (excepto hero).
- [ ] Foco visible al navegar con teclado (tecla Tab).
- [ ] Contraste de texto legible.
- [ ] El HTML no contiene imágenes base64 pesadas.

## Técnico

- [ ] `python generate-pages.py` pasa sin errores.
- [ ] Sin `onclick` inline.
- [ ] Sin `href="#"` en navegación/CTAs críticos.
- [ ] Enlaces externos con `target="_blank"` y `rel="noopener"`.
- [ ] Sin errores en la consola del navegador (F12).
- [ ] Responsive verificado en escritorio, tablet y móvil.
