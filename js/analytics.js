/* ════════════════════════════════════════════════════════════════════
   Analítica CEEVS — Google Analytics 4 + Microsoft Clarity
   --------------------------------------------------------------------
   👉 PASO ÚNICO: pega tus IDs reales abajo.
      · GA4      → crea una propiedad en https://analytics.google.com  → "G-XXXXXXXXXX"
      · Clarity  → crea un proyecto en https://clarity.microsoft.com   → ID del proyecto

   Mientras los IDs contengan "XXXX" NO se carga ninguna analítica
   (así este archivo es seguro de publicar sin activar seguimiento todavía).
   Tampoco se carga en localhost ni en el panel de administración.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GA4_ID     = 'G-HH474WYK57';   // Google Analytics 4 (propiedad CEEVS)
  var CLARITY_ID = 'xpzgkdd0up';     // Microsoft Clarity (proyecto CEEVS)

  // No medir en desarrollo local ni en el panel de administración
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' ||
                location.protocol === 'file:';
  var isAdmin = /admin\.html$/i.test(location.pathname);
  if (isLocal || isAdmin) return;

  var gaActive      = GA4_ID.indexOf('XXXX') === -1;
  var clarityActive = CLARITY_ID.indexOf('XXXX') === -1;

  /* ---- Google Analytics 4 ---- */
  if (gaActive) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID, { anonymize_ip: true });

    // Eventos de conversión: clics a EDUBOX (matrícula), WhatsApp y correo
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var canal = null;
      if (/edubox\.app/i.test(href))            canal = 'edubox';
      else if (/wa\.me|api\.whatsapp/i.test(href)) canal = 'whatsapp';
      else if (/^mailto:/i.test(href))          canal = 'correo';
      if (canal) gtag('event', 'contacto_click', { canal: canal, destino: href });
    }, true);
  }

  /* ---- Microsoft Clarity ---- */
  if (clarityActive) {
    (function (c, l, a, r, i) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      var t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      var y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }
})();
