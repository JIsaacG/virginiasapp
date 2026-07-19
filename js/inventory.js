/**
 * INVENTORY — Sistema de inventario público + CRUD administrativo
 *
 * Dual-mode IIFE:
 * - En páginas de contenido: registra módulo público que renderiza el catálogo
 *   (filtros por categoría, búsqueda, consulta por WhatsApp)
 * - En admin.html: expone API CRUD para el panel administrativo
 *
 * localStorage key: ceevs_inventory (JSON array de productos)
 * La clave se publica al servidor vía admin-sync.js (lista CONFIG_KEYS).
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'ceevs_inventory';

  /**
   * Estructura de un producto:
   * {
   *   id: string (auto-generated: Date.now().toString(36)),
   *   nombre: string,
   *   categoria: string,  // Uniformes | Útiles | Souvenirs | Libros | Otros
   *   descripcion: string,
   *   imagenUrl: string,
   *   disponibilidad: string,  // disponible | agotado | proximamente
   *   talla: string,  // opcional
   *   color: string,  // opcional
   *   precio: string,  // solo display, ej: "L. 350"
   *   activo: boolean,
   *   orden: number
   * }
   */

  const CATEGORIES = ['Uniformes', 'Útiles', 'Souvenirs', 'Libros', 'Otros'];

  const STATUS_LABELS = {
    disponible:   { text: '✓ Disponible',   cls: 'disponible' },
    agotado:      { text: '✗ Agotado',      cls: 'agotado' },
    proximamente: { text: '⏳ Próximamente', cls: 'proximamente' }
  };

  // Imagen de respaldo local (SVG inline): no depende de servicios externos.
  const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#F1EAE0"/>' +
      '<g transform="translate(200 132)" fill="none" stroke="#C4AC8C" stroke-width="6" stroke-linejoin="round">' +
        '<path d="M-42 -20 L0 -42 L42 -20 L42 24 L0 46 L-42 24 Z"/>' +
        '<path d="M-42 -20 L0 2 L42 -20 M0 2 L0 46"/>' +
      '</g>' +
      '<text x="200" y="230" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#A98B62">Imagen no disponible</text>' +
    '</svg>'
  );

  /**
   * Escapa texto para inyectarlo en HTML (los datos vienen del panel admin).
   */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Minúsculas y sin tildes, para búsquedas ("utiles" encuentra "Útiles").
   */
  function normalizeText(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /**
   * Lee todos los productos del localStorage, ordenados por `orden`
   * (los productos antiguos sin `orden` conservan su posición original).
   */
  function getAll() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error('Error reading inventory:', e);
      return [];
    }
    if (!Array.isArray(raw)) return [];
    return raw
      .map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) {
        const oa = typeof a.p.orden === 'number' ? a.p.orden : a.i;
        const ob = typeof b.p.orden === 'number' ? b.p.orden : b.i;
        return (oa - ob) || (a.i - b.i);
      })
      .map(function (x) { return x.p; });
  }

  /**
   * Guarda el array de productos en localStorage
   */
  function saveAll(products) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      return true;
    } catch (e) {
      console.error('Error saving inventory:', e);
      return false;
    }
  }

  // ── API Pública para admin.js ──

  /**
   * Crea un nuevo producto
   */
  function create(product) {
    if (!product.nombre || !product.categoria) {
      return { success: false, error: 'Nombre y categoría requeridos' };
    }
    // Sufijo aleatorio: dos productos creados en el mismo milisegundo no chocan
    product.id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    product.activo = true;
    const products = getAll();
    product.orden = products.length;
    products.push(product);
    saveAll(products);
    return { success: true, id: product.id };
  }

  /**
   * Actualiza un producto existente
   */
  function update(id, changes) {
    const products = getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) {
      return { success: false, error: 'Producto no encontrado' };
    }
    products[idx] = { ...products[idx], ...changes };
    saveAll(products);
    return { success: true };
  }

  /**
   * Desactiva un producto (soft delete)
   */
  function deactivate(id) {
    return update(id, { activo: false });
  }

  /**
   * Elimina un producto permanentemente
   */
  function deleteProduct(id) {
    const products = getAll().filter(p => p.id !== id);
    products.forEach((p, i) => p.orden = i);
    saveAll(products);
    return { success: true };
  }

  /**
   * Reordena productos por índice
   */
  function reorder(fromIdx, toIdx) {
    const products = getAll();
    if (fromIdx < 0 || fromIdx >= products.length || toIdx < 0 || toIdx >= products.length) {
      return { success: false, error: 'Índices inválidos' };
    }
    const [item] = products.splice(fromIdx, 1);
    products.splice(toIdx, 0, item);
    products.forEach((p, i) => p.orden = i);
    saveAll(products);
    return { success: true };
  }

  /**
   * Mueve un producto una posición hacia arriba o abajo ('up' | 'down')
   */
  function move(id, direction) {
    const products = getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Producto no encontrado' };
    const target = idx + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= products.length) {
      return { success: false, error: 'Ya está en el extremo' };
    }
    const tmp = products[idx];
    products[idx] = products[target];
    products[target] = tmp;
    products.forEach((p, i) => p.orden = i);
    saveAll(products);
    return { success: true };
  }

  /**
   * Obtiene productos activos filtrados por categoría (ya ordenados)
   */
  function getActive(category) {
    const all = getAll().filter(p => p.activo);
    if (category && category !== 'todos') {
      return all.filter(p => p.categoria === category);
    }
    return all;
  }

  // Exponer API pública
  window.ceevsInventory = {
    CATEGORIES: CATEGORIES,
    PLACEHOLDER: PLACEHOLDER,
    escapeHtml: escapeHtml,
    normalize: normalizeText,
    getAll: getAll,
    create: create,
    update: update,
    deactivate: deactivate,
    deleteProduct: deleteProduct,
    reorder: reorder,
    move: move,
    getActive: getActive
  };

  // ── Módulo público para páginas de contenido ──

  // Solo registrar si App existe (en páginas de contenido)
  if (typeof App !== 'undefined') {
    const InventoryPublic = {
      name: 'InventoryPublic',
      category: 'todos',
      query: '',
      _waNumber: '50492215752',

      init() {
        const grid = document.getElementById('inv-grid');
        if (!grid) return; // Guard: página sin inventario

        // Reutiliza el número del FAB de WhatsApp para no duplicarlo
        const fab = document.getElementById('wa-fab');
        if (fab) {
          const m = (fab.getAttribute('href') || '').match(/wa\.me\/(\d+)/);
          if (m) this._waNumber = m[1];
        }

        this._render();
        this._bindFilters();
        this._bindSearch();

        // Cuando image-manager.js baja la configuración publicada del servidor,
        // el catálogo local puede haber cambiado: re-renderizar.
        document.addEventListener('ceevs:remote-config', (e) => {
          if (e.detail && e.detail.changed) this._render();
        });
      },

      /** Productos visibles según categoría activa + término de búsqueda. */
      _getVisible() {
        const products = getActive(this.category);
        const q = this._normalize(this.query);
        if (!q) return products;
        return products.filter(p => {
          const haystack = this._normalize(
            [p.nombre, p.descripcion, p.categoria, p.talla, p.color, p.precio].join(' ')
          );
          return haystack.indexOf(q) !== -1;
        });
      },

      _normalize(str) {
        return normalizeText(str);
      },

      _render() {
        const grid = document.getElementById('inv-grid');
        if (!grid) return;

        const products = this._getVisible();
        const countEl = document.getElementById('inv-results-count');
        if (countEl) {
          countEl.textContent = products.length === 0 ? '' :
            products.length === 1 ? '1 producto' : products.length + ' productos';
        }

        if (products.length === 0) {
          const hayInventario = getActive('todos').length > 0;
          const titulo = !hayInventario ? 'Inventario vacío' :
            this.query ? 'Sin resultados' : 'Sin productos en esta categoría';
          const desc = !hayInventario
            ? 'No hay productos disponibles en este momento. Vuelve pronto.'
            : this.query
              ? 'No se encontraron productos para «' + escapeHtml(this.query) + '». Intenta con otra palabra.'
              : 'Prueba con otra categoría o revisa todos los productos.';
          grid.innerHTML = `
            <div class="inv-empty">
              <div class="inv-empty-icon">📦</div>
              <div class="inv-empty-title">${titulo}</div>
              <p class="inv-empty-desc">${desc}</p>
            </div>
          `;
          return;
        }

        grid.innerHTML = products.map(p => this._cardHtml(p)).join('');

        // Fallback de imagen sin handlers inline
        grid.querySelectorAll('.inv-card-img').forEach(img => {
          img.addEventListener('error', function () {
            if (this.dataset.fbk) return;
            this.dataset.fbk = '1';
            this.src = PLACEHOLDER;
          });
        });
      },

      _cardHtml(p) {
        const st = STATUS_LABELS[p.disponibilidad] || STATUS_LABELS.disponible;
        const img = (p.imagenUrl || '').trim() || PLACEHOLDER;
        const tags = [];
        if (p.talla) tags.push('<span class="inv-tag">Talla: ' + escapeHtml(p.talla) + '</span>');
        if (p.color) tags.push('<span class="inv-tag">' + escapeHtml(p.color) + '</span>');
        const waMsg = 'Hola, vi el producto "' + p.nombre + '" en el inventario del CEEVS y quisiera más información.';
        const waUrl = 'https://wa.me/' + this._waNumber + '?text=' + encodeURIComponent(waMsg);

        return `
          <article class="inv-card${p.disponibilidad === 'agotado' ? ' inv-card--agotado' : ''}">
            <div class="inv-card-image">
              <img class="inv-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(p.nombre)}" loading="lazy">
              <span class="inv-card-flag inv-status--${st.cls}">${st.text}</span>
            </div>
            <div class="inv-card-body">
              <div class="inv-card-category">${escapeHtml(p.categoria)}</div>
              <h3 class="inv-card-name">${escapeHtml(p.nombre)}</h3>
              ${p.descripcion ? '<p class="inv-card-desc">' + escapeHtml(p.descripcion) + '</p>' : ''}
              <div class="inv-card-meta">
                ${tags.length ? '<div class="inv-card-tags">' + tags.join('') + '</div>' : ''}
                <div class="inv-card-foot">
                  <span class="inv-card-price">${p.precio ? escapeHtml(p.precio) : ''}</span>
                  <a class="inv-card-wa" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp sobre ${escapeHtml(p.nombre)}">💬 Consultar</a>
                </div>
              </div>
            </div>
          </article>
        `;
      },

      _bindFilters() {
        const filterBtns = document.querySelectorAll('.inv-filter-btn');
        filterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.category = btn.dataset.category || 'todos';
            this._render();
          });
        });
      },

      _bindSearch() {
        const input = document.getElementById('inv-search');
        if (!input) return;
        let timer = null;
        input.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            this.query = input.value.trim();
            this._render();
          }, 160);
        });
      }
    };

    App.register(InventoryPublic);
  }
})();
