// assets/js/scriptCatalogo.js
(function () {
  "use strict";

  // -------------------------------
  // Utilidades
  // -------------------------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const norm = (s) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const MAPEO = {
    subcategorias: {
      camisas: ["camisas", "camisa", "playera", "remera", "tshirt", "t-shirt"],
      pantalones: ["pantalones", "pantalon", "jeans"],
      accesorios: ["accesorios", "accesorio"],
      otros: ["otros", "varios", "miscelanea", "misc", "other"],
    },
    tematicas: {
      peliculas: ["peliculas", "pelicula", "cine", "movie", "film"],
      anime: ["anime", "manga", "otaku"],
      series: ["series", "serie", "tv", "show"],
      musica: ["musica", "music", "bandas", "cantantes"],
    },
  };

  function categorizarTags(categorias = []) {
    const res = {
      subcategorias: new Set(),
      tematicas: new Set(),
      originales: [],
    };

    categorias.forEach((raw) => {
      const c = norm(raw);
      if (!c) return;
      res.originales.push(raw);

      for (const [grupo, valores] of Object.entries(MAPEO)) {
        for (const [canon, sinonimos] of Object.entries(valores)) {
          if (sinonimos.some((s) => c === norm(s))) {
            res[grupo].add(canon);
          }
        }
      }
    });

    return res;
  }

  // -------------------------------
  // Estado
  // -------------------------------
  let productos = [];
  let filtrosActivos = false;

  function cargarProductos() {
    try {
      const arr = JSON.parse(localStorage.getItem("productos")) || [];
      productos = arr
        .filter((p) => p && p.activo !== false)
        .map((p) => ({
          ...p,
          __cat: categorizarTags(Array.isArray(p.categorias) ? p.categorias : []),
        }));
    } catch {
      productos = [];
    }
  }

  const el = {
    grid: $("#productos-container"),
    selectCols: $("#mostrarPorPagina"),
    subcat: $("#subcategoriaSeleccionada"),
    temPeliculas: $("#tematicaPeliculas"),
    temAnime: $("#tematicaAnime"),
    temSeries: $("#tematicaSeries"),
    temMusica: $("#tematicaMusica"),
    btnAplicar: $(".btnAplicarFiltros"),
    formFiltros: $(".formFiltros"),
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

  function getSelectedTematicas() {
    const map = {
      peliculas: el.temPeliculas?.checked,
      anime: el.temAnime?.checked,
      series: el.temSeries?.checked,
      musica: el.temMusica?.checked,
    };
    return Object.entries(map)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }

  // -------------------------------
  // Filtro
  // -------------------------------
  function filtrar() {
    const subcatSel = (el.subcat?.value || "todas").toString();
    const tematicasSel = new Set(getSelectedTematicas());

    const hayFiltros =
      (subcatSel && subcatSel !== "todas") || tematicasSel.size > 0;

    let list = productos.filter((p) => {
      const matchSubcat =
        !subcatSel || subcatSel === "todas" || p.__cat.subcategorias.has(norm(subcatSel));
      const matchTematica =
        tematicasSel.size === 0 || [...tematicasSel].some((t) => p.__cat.tematicas.has(t));
      return matchSubcat && matchTematica;
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

  // Aplicar filtros solo al presionar el botón
  el.btnAplicar?.addEventListener("click", () => {
    renderProductos(filtrar());
  });

  // Limpiar filtros vuelve a todos
  el.formFiltros?.addEventListener("reset", () => {
    setTimeout(() => renderProductos(productos), 0);
  });

  // 👇 al inicio mostrar TODOS los productos
  renderProductos(productos);
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCatalogo);
  } else {
    inicializarCatalogo();
  }
})();