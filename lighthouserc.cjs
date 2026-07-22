module.exports = {
  ci: {
    collect: {
      staticDistDir: '.',
      url: [
        'http://localhost/index.html',
        'http://localhost/admisiones.html',
        'http://localhost/preinscripcion.html',
        'http://localhost/contactenos.html'
      ],
      numberOfRuns: 1,
      headful: true,
      settings: {
        // LHCI añade --headless=new por defecto. El modo headless clásico evita
        // un bloqueo de limpieza de perfiles temporales en Chrome 150/Windows.
        chromeFlags: '--headless --no-sandbox --disable-gpu'
      }
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 1 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.75 }],
        'document-title': 'error',
        'meta-description': 'error',
        'html-has-lang': 'error',
        'crawlable-anchors': 'error',
        'is-crawlable': 'error'
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: 'reports/lighthouse'
    }
  }
};
