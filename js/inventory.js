/**
 * INVENTORY — Sistema de inventario público + CRUD administrativo
 *
 * Dual-mode IIFE:
 * - En páginas de contenido: registra módulo público que renderiza el catálogo
 * - En admin.html: expone API CRUD para el panel administrativo
 *
 * localStorage key: ceevs_inventory (JSON array de productos)
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

  /**
   * Lee todos los productos del localStorage
   */
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error('Error reading inventory:', e);
      return [];
    }
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
    product.id = Date.now().toString(36);
    product.activo = true;
    product.orden = getAll().length;
    const products = getAll();
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
   * Obtiene productos activos filtrados por categoría
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
    getAll: getAll,
    create: create,
    update: update,
    deactivate: deactivate,
    deleteProduct: deleteProduct,
    reorder: reorder,
    getActive: getActive
  };

  // ── Módulo público para páginas de contenido ──

  // Solo registrar si App existe (en páginas de contenido)
  if (typeof App !== 'undefined') {
    const InventoryPublic = {
      name: 'InventoryPublic',

      init() {
        const grid = document.getElementById('inv-grid');
        if (!grid) return; // Guard: página sin inventario
        this._renderGrid(grid);
        this._bindFilters();
      },

      _renderGrid(grid) {
        const products = getActive('todos');
        if (products.length === 0) {
          grid.innerHTML = `
            <div class="inv-empty">
              <div class="inv-empty-icon">📦</div>
              <div class="inv-empty-title">Inventario vacío</div>
              <p class="inv-empty-desc">No hay productos disponibles en este momento.</p>
            </div>
          `;
          return;
        }

        grid.innerHTML = products.map(p => `
          <div class="inv-card">
            <div class="inv-card-image">
              <img class="inv-card-img" src="${p.imagenUrl || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(p.nombre)}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/400x300?text=' + encodeURIComponent('${p.nombre}')">
            </div>
            <div class="inv-card-body">
              <div class="inv-card-category">${p.categoria}</div>
              <div class="inv-card-name">${p.nombre}</div>
              <div class="inv-card-desc">${p.descripcion || ''}</div>
              <div class="inv-card-meta">
                ${p.talla ? `<span>${p.talla}</span> • ` : ''}
                ${p.precio ? `<span>${p.precio}</span>` : ''}
                <div class="inv-status inv-status--${p.disponibilidad}">
                  ${p.disponibilidad === 'disponible' ? '✓ Disponible' : p.disponibilidad === 'agotado' ? '✗ Agotado' : '⏳ Próximamente'}
                </div>
              </div>
            </div>
          </div>
        `).join('');
      },

      _bindFilters() {
        const filterBtns = document.querySelectorAll('.inv-filter-btn');
        filterBtns.forEach(btn => {
          btn.addEventListener('click', e => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            const products = category === 'todos' ? getActive('todos') : getActive(category);
            const grid = document.getElementById('inv-grid');
            this._renderGrid(grid);
          });
        });
      }
    };

    App.register(InventoryPublic);
  }
})();
