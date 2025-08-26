// assets/js/scriptCatalogo.js
(function () {
  "use strict";

  // -------------------------------
  // Utilidades
  // -------------------------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // -------------------------------
  // Estado
  // -------------------------------
  let productos = [];
  let filtrosActivos = false;
  let categoriasDisponibles = new Set();
  let categoriasSeleccionadas = new Set();

  function cargarProductos() {
    try {
      const arr = JSON.parse(localStorage.getItem("productos")) || [];
      productos = arr.filter((p) => p && p.activo !== false);
    } catch {
      productos = [];
    }
  }

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
  // Sistema de categorías dinámicas
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
        </div>
      `;
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

  function getCategoriasSeleccionadas() {
    return Array.from(categoriasSeleccionadas);
  }

  // -------------------------------
  // Búsqueda por nombre
  // -------------------------------
  function getSearchTerm() {
    return el.searchInput?.value?.trim().toLowerCase() || "";
  }

  function clearSearch() {
    if (el.searchInput) {
      el.searchInput.value = "";
      el.searchInput.focus();
    }
  }

  // -------------------------------
  // Filtro
  // -------------------------------
  function filtrar() {
    const searchTerm = getSearchTerm();
    const categoriasSel = getCategoriasSeleccionadas();

    const hayFiltros = searchTerm.length > 0 || categoriasSel.length > 0;

    let list = productos.filter((p) => {
      // Filtro por búsqueda de nombre
      const matchSearch = 
        searchTerm.length === 0 || 
        p.nombre?.toLowerCase().includes(searchTerm) ||
        p.descripcion?.toLowerCase().includes(searchTerm);
      
      // Filtro por categorías seleccionadas
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
  // Render
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
                    data-name="${p.nombre || "Sin nombre"}" 
                    data-price="${precio}" 
                    data-image="${img}">
              Agregar al carrito
            </button>
          </div>
        </div>`;
      el.grid.appendChild(col);
    }

    // El carrito se inicializa automáticamente desde carrito.js
    // No es necesario llamar a inicializarCarrito aquí
  }

  // -------------------------------
  // Inicializar
  // -------------------------------
  function inicializarCatalogo() {
    if (!el.grid || !el.selectCols) return;
    cargarProductos();
    applyColumns();
    el.selectCols?.addEventListener("change", applyColumns);

    // Event listeners para búsqueda
    if (el.searchInput) {
      // Búsqueda en tiempo real con debounce
      let searchTimeout;
      el.searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          renderProductos(filtrar());
        }, 300); // Esperar 300ms después de que el usuario deje de escribir
      });

      // Búsqueda al presionar Enter
      el.searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          renderProductos(filtrar());
        }
      });
    }

    // Botón para limpiar búsqueda
    if (el.clearSearchBtn) {
      el.clearSearchBtn.addEventListener("click", () => {
        clearSearch();
        renderProductos(filtrar());
      });
    }

    // Aplicar filtros solo al presionar el botón
    el.btnAplicar?.addEventListener("click", () => {
      renderProductos(filtrar());
    });

    // Limpiar filtros vuelve a todos
    el.formFiltros?.addEventListener("reset", () => {
      setTimeout(() => {
        clearSearch();
        categoriasSeleccionadas.clear();
        renderizarCategoriasDinamicas();
        renderProductos(productos);
      }, 0);
    });

    // Listener para cambios en localStorage (nuevos productos)
    window.addEventListener('storage', (e) => {
      if (e.key === 'productos') {
        cargarProductos();
        renderizarCategoriasDinamicas();
        renderProductos(filtrar());
      }
    });

    // Renderizar categorías dinámicas
    renderizarCategoriasDinamicas();

    // 👇 al inicio mostrar TODOS los productos
    renderProductos(productos);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCatalogo);
  } else {
    inicializarCatalogo();
  }
})();
