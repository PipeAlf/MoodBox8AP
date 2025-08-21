// assets/js/scriptCatalogo.js
// Catálogo con filtros conectados a las "categorías" (tags) creadas en la vista de administración.
// Requiere Bootstrap para el colapso del panel de filtros (ya presente en tu HTML).

(function () {
  "use strict";

  // -------------------------------
  // Utilidades
  // -------------------------------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Normaliza cadenas: minusculas + sin tildes/diacríticos
  const norm = (s) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, ""); // requiere navegadores modernos

  // Diccionario de sinónimos → valor canónico
  const MAPEO = {
    colores: {
      negro: ["negro", "black"],
      blanco: ["blanco", "white"],
      azul: ["azul", "blue"],
      rojo: ["rojo", "red"],
      verde: ["verde", "green"],
      amarillo: ["amarillo", "yellow"],
    },
    subcategorias: {
      camisas: ["camisas", "camisa", "playera", "remera", "tshirt", "t-shirt"],
      pantalones: ["pantalones", "pantalon", "jeans"],
      accesorios: ["accesorios", "accesorio"],
      otros: ["otros", "varios", "miscelanea", "misc", "other"],
    },
    etiqueta: {
      nuevo: ["nuevo", "new", "novedad", "nueva"],
      destacado: ["destacado", "featured", "top", "recomendado", "popular"],
      oferta: ["oferta", "sale", "descuento", "rebaja", "promo", "promocion"],
    },
    tematicas: {
      peliculas: ["peliculas", "pelicula", "cine", "movie", "film"],
      anime: ["anime", "manga", "otaku"],
      series: ["series", "serie", "tv", "show"],
      musica: ["musica", "music", "bandas", "cantantes"],
    },
  };

  // Convierte arreglo de strings (categorias) a sets por grupo (colores, subcategorías, etc.)
  function categorizarTags(categorias = []) {
    const res = {
      colores: new Set(),
      subcategorias: new Set(),
      etiqueta: new Set(),
      tematicas: new Set(),
      // También devolvemos las categorías limpias originales
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
  let productosAll = [];
  let productos = [];
  let filtrosActivos = false;
  let ultimaBusqueda = "";

  function cargarProductos() {
    try {
      const arr = JSON.parse(localStorage.getItem("productos")) || [];
      productosAll = arr.filter((p) => p && p.activo !== false);
      productos = productosAll.map((p) => ({
        ...p,
        __cat: categorizarTags(Array.isArray(p.categorias) ? p.categorias : []),
      }));
    } catch {
      productosAll = [];
      productos = [];
    }
  }

  // Elementos UI del catálogo
  const el = {
    grid: $("#productos-container"),
    selectCols: $("#mostrarPorPagina"),
    buscar: $("#buscarProducto"),
    ordenarPor: $("#ordenarPorCampo"),
    ordenarDir: $("#ordenarDireccion"),

    // Colores
    colorNegro: $("#colorNegro"),
    colorBlanco: $("#colorBlanco"),
    colorAzul: $("#colorAzul"),
    colorRojo: $("#colorRojo"),
    colorVerde: $("#colorVerde"),
    colorAmarillo: $("#colorAmarillo"),

    // Subcategorías
    subcat: $("#subcategoriaSeleccionada"),

    // Etiqueta
    etiquetaNuevo: $("#etiquetaNuevo"),
    etiquetaDestacado: $("#etiquetaDestacado"),
    etiquetaOferta: $("#etiquetaOferta"),

    // Temáticas
    temPeliculas: $("#tematicaPeliculas"),
    temAnime: $("#tematicaAnime"),
    temSeries: $("#tematicaSeries"),
    temMusica: $("#tematicaMusica"),

    btnAplicar: $(".btnAplicarFiltros"),
    formFiltros: $(".formFiltros"),
  };

  // -------------------------------
  // Lógica de columnas (3 / 4 por fila) - Mantiene compatibilidad con script.js
  // -------------------------------
  function applyColumns() {
    if (!el.grid) return;
    
    // Remover clases anteriores
    el.grid.classList.remove("row-cols-md-3", "row-cols-md-4", "row-cols-lg-3", "row-cols-lg-4");
    
    const val = (el.selectCols?.value || "3").trim();
    if (val === "3") {
      el.grid.classList.add("row-cols-md-3", "row-cols-lg-3");
    } else {
      el.grid.classList.add("row-cols-md-4", "row-cols-lg-4");
    }
  }

  // -------------------------------
  // Lectura de filtros seleccionados
  // -------------------------------
  function getSelectedColores() {
    const map = {
      negro: el.colorNegro?.checked,
      blanco: el.colorBlanco?.checked,
      azul: el.colorAzul?.checked,
      rojo: el.colorRojo?.checked,
      verde: el.colorVerde?.checked,
      amarillo: el.colorAmarillo?.checked,
    };
    return Object.entries(map)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }

  function getSelectedEtiquetas() {
    const map = {
      nuevo: el.etiquetaNuevo?.checked,
      destacado: el.etiquetaDestacado?.checked,
      oferta: el.etiquetaOferta?.checked,
    };
    return Object.entries(map)
      .filter(([, v]) => v)
      .map(([k]) => k);
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
  // Filtro + orden
  // -------------------------------
  function filtrarYOrdenar() {
    const term = norm(el.buscar?.value || "");
    const coloresSel = new Set(getSelectedColores());
    const etiquetasSel = new Set(getSelectedEtiquetas());
    const tematicasSel = new Set(getSelectedTematicas());
    const subcatSel = (el.subcat?.value || "todas").toString();

    // Verificar si hay filtros activos
    const hayFiltros = term || coloresSel.size > 0 || etiquetasSel.size > 0 || 
                      tematicasSel.size > 0 || (subcatSel && subcatSel !== "todas");

    let list = productos.filter((p) => {
      // Texto: nombre, descripcion, codigo
      const tNombre = norm(p.nombre);
      const tDesc = norm(p.descripcion);
      const tCod = norm(p.codigo);
      const matchTexto = term
        ? tNombre.includes(term) || tDesc.includes(term) || tCod.includes(term)
        : true;

      // Colores (al menos uno)
      const matchColor =
        coloresSel.size === 0 ||
        [...coloresSel].some((c) => p.__cat.colores.has(c));

      // Subcategoría (una sola seleccionable)
      const matchSubcat =
        !subcatSel || subcatSel === "todas" || p.__cat.subcategorias.has(norm(subcatSel));

      // Etiquetas (al menos una)
      const matchEtiqueta =
        etiquetasSel.size === 0 ||
        [...etiquetasSel].some((e) => p.__cat.etiqueta.has(e));

      // Temáticas (al menos una)
      const matchTematica =
        tematicasSel.size === 0 ||
        [...tematicasSel].some((t) => p.__cat.tematicas.has(t));

      return matchTexto && matchColor && matchSubcat && matchEtiqueta && matchTematica;
    });

    // Orden
    const campo = (el.ordenarPor?.value || "catalogo").toString();
    const dir = (el.ordenarDir?.value || "asc").toString();

    list.sort((a, b) => {
      let va, vb;
      if (campo === "nombre") {
        va = (a.nombre || "").toString();
        vb = (b.nombre || "").toString();
        return va.localeCompare(vb, "es");
      }
      if (campo === "precio") {
        va = parseFloat(a.precio) || 0;
        vb = parseFloat(b.precio) || 0;
        return va - vb;
      }
      // "catalogo" → por fechaCreacion (o id)
      const fa = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : Number(a.id) || 0;
      const fb = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : Number(b.id) || 0;
      return fa - fb;
    });

    if (dir === "desc") list.reverse();

    // Actualizar estado de filtros
    filtrosActivos = hayFiltros;
    ultimaBusqueda = term;

    return list;
  }

  // -------------------------------
  // Prevención de sobrescritura por script.js
  // -------------------------------
  function protegerContenido() {
    if (!el.grid) return;
    
    // Crear un observer para detectar cambios en el contenedor
    const observer = new MutationObserver((mutations) => {
      // Solo restaurar si hay filtros activos Y no es un cambio interno nuestro
      if (filtrosActivos && !el.grid.dataset.filtradoInterno) {
        // Usar requestAnimationFrame para evitar parpadeos
        requestAnimationFrame(() => {
          if (filtrosActivos && !el.grid.dataset.filtradoInterno) {
            renderProductos(filtrarYOrdenar());
          }
        });
      }
    });

    observer.observe(el.grid, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // -------------------------------
  // Render - Mantiene el estilo original de las tarjetas
  // -------------------------------
  function renderProductos(lista) {
    if (!el.grid) return;

    // Marcar que estamos haciendo un filtrado interno
    el.grid.dataset.filtradoInterno = 'true';

    // Limpiar spinner/placeholder
    el.grid.innerHTML = "";

    if (!lista || lista.length === 0) {
      const vacio = document.createElement("div");
      vacio.className = "col-12 text-center text-muted";
      vacio.innerHTML = `
        <div class="py-5">
          <i class="bi bi-search" style="font-size:2rem;"></i>
          <p class="mt-2 mb-0">No se encontraron productos con los filtros seleccionados.</p>
        </div>`;
      el.grid.appendChild(vacio);
      
      // Remover marca de filtrado interno
      delete el.grid.dataset.filtradoInterno;
      return;
    }

    // Crear tarjetas manteniendo el estilo original de script.js
    for (const p of lista) {
      const precio = parseFloat(p.precio) || 0;
      const img = p.imagen || "./assets/imagenes/logo.png";
      const cats = (Array.isArray(p.categorias) ? p.categorias : []).map((c) => c || "").filter(Boolean);

      const col = document.createElement("div");
      // Mantener la estructura original de columnas
      col.className = "col";

      col.innerHTML = `
        <div class="card h-100 tarjeta-borde position-relative hover-card">
          <img src="${img}" class="card-img-top" alt="${escapeHtml(p.nombre || "Producto")}"
               onerror="this.onerror=null;this.src='./assets/imagenes/logo.png';">
          <div class="card-body">
            <h5 class="card-titulo text-start">${escapeHtml(p.nombre || "Sin nombre")}</h5>
            <p class="card-texto text-start">${escapeHtml(p.descripcion || "Descripción no disponible")}</p>
          </div>
          <div class="card-footer bg-white border-0">
            <div class="card-footer bg-white border-0">
              ★ 4.5
            </div>
          </div>
          <div class="hover-info p-3 rounded shadow">
            <img src="${img}" class="img-fluid rounded mb-2" alt="Preview">
            <h6 class="text-start">${escapeHtml(p.nombre || "Sin nombre")}</h6>
            <p id="precio">$${precio.toLocaleString()}</p>
            <button class="btn btn-sm btn-custom add-to-cart" 
                    data-name="${escapeHtml(p.nombre || "Sin nombre")}" 
                    data-price="${precio}" 
                    data-image="${img}">
              Agregar al carrito
            </button>
          </div>
        </div>
      `;

      el.grid.appendChild(col);
    }

    // Reinicializar funcionalidad del carrito después de renderizar
    if (typeof inicializarCarrito === 'function') {
      inicializarCarrito();
    }

    // Remover marca de filtrado interno después de un pequeño delay
    setTimeout(() => {
      delete el.grid.dataset.filtradoInterno;
    }, 50);
  }

  function escapeHtml(s) {
    return (s || "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // -------------------------------
  // Eventos - Solo se ejecuta si estamos en la página de catálogo
  // -------------------------------
  function inicializarCatalogo() {
    // Verificar que estamos en la página de catálogo
    if (!el.grid || !el.selectCols) {
      return; // No estamos en la página de catálogo
    }

    // Cargar productos inicialmente
    cargarProductos();

    // Columnas
    applyColumns();
    el.selectCols?.addEventListener("change", applyColumns);

    // Aplicar filtros
    el.btnAplicar?.addEventListener("click", () => {
      filtrosActivos = true;
      renderProductos(filtrarYOrdenar());
    });

    // Cambios en ordenar - NO reiniciar filtros
    el.ordenarPor?.addEventListener("change", () => {
      // Solo reordenar, mantener filtros activos
      if (filtrosActivos) {
        renderProductos(filtrarYOrdenar());
      } else {
        // Si no hay filtros, solo ordenar todos los productos
        const productosOrdenados = [...productos].sort((a, b) => {
          const campo = (el.ordenarPor?.value || "catalogo").toString();
          const dir = (el.ordenarDir?.value || "asc").toString();
          
          let va, vb;
          if (campo === "nombre") {
            va = (a.nombre || "").toString();
            vb = (b.nombre || "").toString();
            return va.localeCompare(vb, "es");
          }
          if (campo === "precio") {
            va = parseFloat(a.precio) || 0;
            vb = parseFloat(b.precio) || 0;
            return va - vb;
          }
          // "catalogo" → por fechaCreacion (o id)
          const fa = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : Number(a.id) || 0;
          const fb = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : Number(b.id) || 0;
          return fa - fb;
        });

        if ((el.ordenarDir?.value || "asc") === "desc") {
          productosOrdenados.reverse();
        }
        
        renderProductos(productosOrdenados);
      }
    });

    el.ordenarDir?.addEventListener("change", () => {
      // Solo reordenar, mantener filtros activos
      if (filtrosActivos) {
        renderProductos(filtrarYOrdenar());
      } else {
        // Si no hay filtros, solo ordenar todos los productos
        const productosOrdenados = [...productos].sort((a, b) => {
          const campo = (el.ordenarPor?.value || "catalogo").toString();
          const dir = (el.ordenarDir?.value || "asc").toString();
          
          let va, vb;
          if (campo === "nombre") {
            va = (a.nombre || "").toString();
            vb = (b.nombre || "").toString();
            return va.localeCompare(vb, "es");
          }
          if (campo === "precio") {
            va = parseFloat(a.precio) || 0;
            vb = parseFloat(b.precio) || 0;
            return va - vb;
          }
          // "catalogo" → por fechaCreacion (o id)
          const fa = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : Number(a.id) || 0;
          const fb = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : Number(b.id) || 0;
          return fa - fb;
        });

        if ((el.ordenarDir?.value || "asc") === "desc") {
          productosOrdenados.reverse();
        }
        
        renderProductos(productosOrdenados);
      }
    });

    // Buscar en vivo
    el.buscar?.addEventListener("input", () => {
      filtrosActivos = true;
      renderProductos(filtrarYOrdenar());
    });

    // Reset (botón "Limpiar" del form)
    el.formFiltros?.addEventListener("reset", () => {
      // Esperar al reset completo del form antes de renderizar
      setTimeout(() => {
        filtrosActivos = false;
        ultimaBusqueda = "";
        applyColumns();
        renderProductos(productos); // Mostrar todos los productos
      }, 0);
    });

    // Proteger contra sobrescritura
    const observer = protegerContenido();

    // Primer render
    renderProductos(productos);
  }

  // -------------------------------
  // Inicialización única y segura
  // -------------------------------
  // Solo inicializar si no se ha hecho antes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCatalogo);
  } else {
    // Si el DOM ya está cargado, inicializar inmediatamente
    inicializarCatalogo();
  }

  // Exponer funciones para uso externo si es necesario
  window.catalogoFiltros = {
    renderProductos,
    filtrarYOrdenar,
    applyColumns,
    cargarProductos
  };

})();
