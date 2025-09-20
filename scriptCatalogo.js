// assets/js/scriptCatalogo.js
(function () {
  "use strict";

  // ✅ Utilidades DOM
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => ctx.querySelectorAll(selector);

  // -------------------------------
  // Estado
  // -------------------------------
  let productos = [];
  let filtrosActivos = false;
  let categoriasDisponibles = new Set();
  let categoriasSeleccionadas = new Set();

  const el = {
    grid: $("#productos-container"),
    selectCols: $("#mostrarPorPagina"),
    categoriasDinamicas: $("#categoriasDinamicas"),
    btnAplicar: $(".btnAplicarFiltros"),
    formFiltros: $(".formFiltros"),
    searchInput: $("#searchProducts"),
    clearSearchBtn: $("#clearSearch"),
  };

  // -------------------------------
  // Cargar productos del backend
  // -------------------------------
  async function cargarProductos() {
    try {
      const response = await fetch("http://localhost:8080/api/productos/activos");
      if (!response.ok) throw new Error("Error al cargar productos");
      const productosApi = await response.json();
      productos = productosApi.filter(p => p.activo !== false);
    } catch (error) {
      console.error("Error cargando productos:", error);
      productos = [];
    }
  }

  // -------------------------------
  // Lógica de columnas
  // -------------------------------
  function applyColumns() {
    if (!el.grid) return;
    el.grid.classList.remove("row-cols-md-3", "row-cols-md-4", "row-cols-lg-3", "row-cols-lg-4");
    const val = (el.selectCols?.value || "3").trim();
    el.grid.classList.add(val === "3" ? "row-cols-md-3" : "row-cols-md-4");
    el.grid.classList.add(val === "3" ? "row-cols-lg-3" : "row-cols-lg-4");
  }

  // -------------------------------
  // Categorías dinámicas
  // -------------------------------
  function extraerCategoriasDeProductos() {
    const categorias = new Set();
    productos.forEach(producto => {
      if (producto.categorias && Array.isArray(producto.categorias)) {
        producto.categorias.forEach(categoria => {
          if (categoria && typeof categoria === 'string') {
            categorias.add(categoria.trim());
          }
        });
      }
    });
    return Array.from(categorias).sort();
  }

  function renderizarCategoriasDinamicas() {
    if (!el.categoriasDinamicas) return;

    categoriasDisponibles = new Set(extraerCategoriasDeProductos());

    if (categoriasDisponibles.size === 0) {
      el.categoriasDinamicas.innerHTML = `
        <div class="categorias-vacio">
          <i class="bi bi-tags"></i>
          <p>No hay categorías disponibles</p>
          <small>Agrega productos desde el panel de administración para crear categorías</small>
        </div>`;
      return;
    }

    const header = document.createElement('div');
    header.className = 'categorias-header';
    header.innerHTML = `
      <span><i class="bi bi-tags me-2"></i>Categorías disponibles</span>
      <span class="categorias-count">${categoriasDisponibles.size}</span>
    `;

    el.categoriasDinamicas.innerHTML = '';
    el.categoriasDinamicas.appendChild(header);

    categoriasDisponibles.forEach(categoria => {
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'categoria-checkbox';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `cat_${categoria.replace(/\s+/g, '_')}`;
      checkbox.checked = categoriasSeleccionadas.has(categoria);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          categoriasSeleccionadas.add(categoria);
        } else {
          categoriasSeleccionadas.delete(categoria);
        }
        renderProductos(filtrar());
      });

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = categoria;

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      el.categoriasDinamicas.appendChild(checkboxContainer);
    });
  }

  // -------------------------------
  // Búsqueda y filtros
  // -------------------------------
  function getCategoriasSeleccionadas() {
    return Array.from(categoriasSeleccionadas);
  }

  function getSearchTerm() {
    return el.searchInput?.value?.trim().toLowerCase() || "";
  }

  function clearSearch() {
    if (el.searchInput) {
      el.searchInput.value = "";
      el.searchInput.focus();
    }
  }

  function filtrar() {
    const searchTerm = getSearchTerm();
    const categoriasSel = getCategoriasSeleccionadas();

    const hayFiltros = searchTerm.length > 0 || categoriasSel.length > 0;

    const list = productos.filter(p => {
      const matchSearch =
        searchTerm.length === 0 ||
        p.nombre?.toLowerCase().includes(searchTerm) ||
        p.descripcion?.toLowerCase().includes(searchTerm);

      const matchCategorias =
        categoriasSel.length === 0 ||
        (p.categorias && Array.isArray(p.categorias) &&
          categoriasSel.some(cat => p.categorias.includes(cat)));

      return matchSearch && matchCategorias;
    });

    filtrosActivos = hayFiltros;
    return list;
  }

  // -------------------------------
  // Render de productos
  // -------------------------------
  function renderProductos(lista) {
    if (!el.grid) return;
    el.grid.innerHTML = "";

    if (!lista || lista.length === 0) {
      el.grid.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <i class="bi bi-search" style="font-size:2rem;"></i>
          <p class="mt-2 mb-0">No se encontraron productos con los filtros seleccionados.</p>
        </div>`;
      return;
    }

    for (const p of lista) {
      const precio = parseFloat(p.precio) || 0;
      const img = p.imagen || "./assets/imagenes/logo.png";

      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <div class="card h-100 tarjeta-borde position-relative hover-card">
          <img src="${img}" class="card-img-top" alt="${p.nombre || "Producto"}"
               onerror="this.onerror=null;this.src='./assets/imagenes/logo.png';">
          <div class="card-body">
            <h5 class="card-titulo text-start">${p.nombre || "Sin nombre"}</h5>
            <p class="card-texto text-start">${p.descripcion || "Descripción no disponible"}</p>
          </div>
          <div class="card-footer bg-white border-0">★ 4.5</div>
          <div class="hover-info p-3 rounded shadow">
            <img src="${img}" class="img-fluid rounded mb-2" alt="Preview">
            <h6 class="text-start">${p.nombre || "Sin nombre"}</h6>
            <p>$${precio.toLocaleString()}</p>
            <button class="btn btn-sm btn-custom add-to-cart" 
              data-id="${p.id}" 
              data-name="${p.nombre}" 
              data-price="${precio}" 
              data-image="${img}">
              Agregar al carrito
            </button>
          </div>
        </div>`;
      el.grid.appendChild(col);
    }
  }

  // -------------------------------
  // Inicialización principal
  // -------------------------------
  function inicializarCatalogo() {
    if (!el.grid || !el.selectCols) return;

    cargarProductos().then(() => {
      applyColumns();
      renderizarCategoriasDinamicas();
      renderProductos(productos);
    });

    el.selectCols?.addEventListener("change", applyColumns);

    if (el.searchInput) {
      let searchTimeout;
      el.searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          renderProductos(filtrar());
        }, 300);
      });

      el.searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          renderProductos(filtrar());
        }
      });
    }

    if (el.clearSearchBtn) {
      el.clearSearchBtn.addEventListener("click", () => {
        clearSearch();
        renderProductos(filtrar());
      });
    }

    el.btnAplicar?.addEventListener("click", () => {
      renderProductos(filtrar());
    });

    el.formFiltros?.addEventListener("reset", () => {
      setTimeout(() => {
        clearSearch();
        categoriasSeleccionadas.clear();
        renderizarCategoriasDinamicas();
        renderProductos(productos);
      }, 0);
    });

    window.addEventListener("storage", (e) => {
      if (e.key === "productos") {
        cargarProductos().then(() => {
          renderizarCategoriasDinamicas();
          renderProductos(filtrar());
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCatalogo);
  } else {
    inicializarCatalogo();
  }

})();
