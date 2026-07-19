'use strict';

/* ═══════════════════════════════════════
   I18N — Conmutador de idioma ES/EN (CEEVS)
   Traduce nodos de texto y atributos usando el diccionario
   embebido window.CEEVS_I18N (js/i18n-data.js).
   No usa fetch: funciona con file:// y con http://.
═══════════════════════════════════════ */

const I18n = {
  name: 'I18n',
  STORAGE_KEY: 'ceevs_lang',
  ATTRS: ['placeholder', 'aria-label', 'title', 'alt'],

  lang: 'es',
  map: null,          // diccionario { "texto es": "texto en" }
  _textNodes: [],     // [{ node, es }]
  _attrNodes: [],     // [{ el, attr, es }]
  _seen: null,        // WeakSet de nodos de texto ya registrados
  _seenAttrEls: null, // WeakSet de elementos con atributos ya registrados

  init() {
    this.lang = localStorage.getItem(this.STORAGE_KEY) === 'en' ? 'en' : 'es';
    this.map = (window.CEEVS_I18N && window.CEEVS_I18N.en) || {};

    this._seen = new WeakSet();
    this._seenAttrEls = new WeakSet();
    this._collect();
    this._buildSwitchers();
    this._reflectActive();
    this._setupObserver();

    document.documentElement.lang = this.lang;
    if (this.lang === 'en') this._apply();
  },

  // Clave normalizada: sin espacios extremos y espacios internos colapsados
  _key(s) {
    return s.trim().replace(/\s+/g, ' ');
  },

  _isTranslatableParent(node) {
    const p = node.parentElement;
    if (!p) return false;
    const tag = p.tagName;
    return tag !== 'SCRIPT' && tag !== 'STYLE';
  },

  // ── Recolectar nodos de texto y atributos traducibles ──
  _collect() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (!this._isTranslatableParent(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      this._seen.add(n);
      this._textNodes.push({ node: n, es: n.nodeValue });
    }
    document.querySelectorAll(this._attrSelector()).forEach((el) => this._registerAttrEl(el));
  },

  _attrSelector() {
    return this.ATTRS.map((a) => '[' + a + ']').join(',');
  },

  // Registra los atributos traducibles de un elemento (y traduce si ya estamos en EN)
  _registerAttrEl(el) {
    if (this._seenAttrEls.has(el)) return;
    this._seenAttrEls.add(el);
    this.ATTRS.forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && v.trim()) {
        this._attrNodes.push({ el, attr, es: v });
        if (this.lang === 'en') {
          const en = this.map[this._key(v)];
          if (en) el.setAttribute(attr, en);
        }
      }
    });
  },

  // ── Aplicar inglés ──
  _apply() {
    this._textNodes.forEach((entry) => this._applyNode(entry));
    this._attrNodes.forEach(({ el, attr, es }) => {
      const en = this.map[this._key(es)];
      if (en) el.setAttribute(attr, en);
    });
    document.documentElement.lang = 'en';
  },

  _applyNode(entry) {
    const raw = entry.es.trim();
    if (!raw) return;
    const en = this.map[this._key(entry.es)];
    if (en) entry.node.nodeValue = entry.es.replace(raw, en);
  },

  // ── Restaurar español ──
  _restore() {
    this._textNodes.forEach(({ node, es }) => { node.nodeValue = es; });
    this._attrNodes.forEach(({ el, attr, es }) => { el.setAttribute(attr, es); });
    document.documentElement.lang = 'es';
  },

  setLang(lang) {
    lang = lang === 'en' ? 'en' : 'es';
    if (lang === this.lang) return;
    this.lang = lang;
    localStorage.setItem(this.STORAGE_KEY, lang);
    if (lang === 'en') this._apply();
    else this._restore();
    this._reflectActive();
  },

  // ── Contenido dinámico: traducir nodos añadidos después de cargar ──
  _setupObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'characterData') {
          this._consider(m.target);
        } else {
          m.addedNodes.forEach((node) => this._collectFrom(node));
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  },

  _collectFrom(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      this._consider(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const sel = this._attrSelector();
    if (node.matches && node.matches(sel)) this._registerAttrEl(node);
    node.querySelectorAll(sel).forEach((el) => this._registerAttrEl(el));
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) this._consider(n);
  },

  _consider(node) {
    if (node.nodeType !== Node.TEXT_NODE || this._seen.has(node)) return;
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    if (!this._isTranslatableParent(node)) return;
    this._seen.add(node);
    const entry = { node, es: node.nodeValue };
    this._textNodes.push(entry);
    if (this.lang === 'en') this._applyNode(entry);
  },

  // ── Construir los conmutadores (móvil existente + escritorio inyectado) ──
  _buildSwitchers() {
    const markup =
      '<button type="button" class="lang-btn" data-lang="es" aria-label="Cambiar a español">ES</button>' +
      '<span class="language-separator" aria-hidden="true">|</span>' +
      '<button type="button" class="lang-btn" data-lang="en" aria-label="Switch to English">EN</button>';

    document.querySelectorAll('.language-switcher').forEach((sw) => {
      sw.innerHTML = markup;
    });

    const navCta = document.querySelector('#navbar .nav-cta');
    if (navCta && !document.querySelector('.nav-lang')) {
      const desktop = document.createElement('div');
      desktop.className = 'language-switcher nav-lang';
      desktop.setAttribute('aria-label', 'Selector de idioma');
      desktop.innerHTML = markup;
      navCta.insertBefore(desktop, navCta.firstChild);
    }

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });
  },

  _reflectActive() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const active = btn.dataset.lang === this.lang;
      btn.classList.toggle('lang-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  },
};

App.register(I18n);
