document.addEventListener('DOMContentLoaded', function () {
  const selectMostrar = document.getElementById('mostrarPorPagina');
  const productosRow = document.getElementById('productosRow');

  function updateColumns() {
    // limpiamos clases md/lg anteriores
    productosRow.classList.remove('row-cols-md-3', 'row-cols-md-4', 'row-cols-lg-3', 'row-cols-lg-4');

    const val = selectMostrar.value;
    if (val === '3') {
      // por defecto 3 columnas en md y lg
      productosRow.classList.add('row-cols-md-3', 'row-cols-lg-3');
    } else {
      // 4 columnas en md y lg
      productosRow.classList.add('row-cols-md-4', 'row-cols-lg-4');
    }
  }

  // estado inicial (por defecto está en 3)
  updateColumns();

  // escucha cambios en el select
  selectMostrar.addEventListener('change', updateColumns);
});

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
  const productosAll = (function cargarProductos() {
    // Lee los productos creados en Admin (localStorage)
    // Solo mostramos los activos
    try {
      const arr = JSON.parse(localStorage.getItem("productos")) || [];
      return arr.filter((p) => p && p.activo !== false);
    } catch {
      return [];
    }
  })();

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

  // Pre-procesar productos con sets categorizados
  const productos = productosAll.map((p) => ({
    ...p,
    __cat: categorizarTags(Array.isArray(p.categorias) ? p.categorias : []),
  }));

  // -------------------------------
  // Lógica de columnas (3 / 4 por fila)
  // -------------------------------
  function applyColumns() {
    if (!el.grid) return;
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

    return list;
  }

  // -------------------------------
  // Render
  // -------------------------------
  function renderProductos(lista) {
    if (!el.grid) return;

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
      return;
    }

    // Crear tarjetas
    for (const p of lista) {
      const precio = parseFloat(p.precio) || 0;
      const img = p.imagen || "./assets/imagenes/logo.png";
      const cats = (Array.isArray(p.categorias) ? p.categorias : []).map((c) => c || "").filter(Boolean);

      const col = document.createElement("div");
      // En layout con row-cols-* no es obligatorio .col-*, pero agregamos una clase ligera
      col.className = "d-flex";

      col.innerHTML = `
        <div class="card h-100 flex-fill product-card">
          <img src="${img}" class="card-img-top" alt="${escapeHtml(p.nombre || "Producto")}"
               onerror="this.onerror=null;this.src='./assets/imagenes/logo.png';">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-1">${escapeHtml(p.nombre || "Sin nombre")}</h6>
            <div class="small text-muted mb-2">Código: ${escapeHtml(p.codigo || "—")}</div>
            ${p.descripcion ? `<p class="card-text small flex-grow-1">${escapeHtml(p.descripcion)}</p>` : `<div class="flex-grow-1"></div>`}
            <div class="d-flex align-items-center justify-content-between mt-2">
              <span class="fw-semibold">$${precio.toFixed(2)}</span>
              <span class="badge text-bg-light">Stock: ${Number.parseInt(p.stock || 0)}</span>
            </div>
          </div>
          ${
            cats.length
              ? `<div class="card-footer bg-transparent border-0 pt-0 pb-3">
                   ${cats.map((c) => `<span class="badge text-bg-secondary me-1 mb-1">${escapeHtml(c)}</span>`).join("")}
                 </div>`
              : ""
          }
        </div>
      `;

      el.grid.appendChild(col);
    }
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
  // Eventos
  // -------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // Columnas
    applyColumns();
    el.selectCols?.addEventListener("change", applyColumns);

    // Aplicar filtros
    el.btnAplicar?.addEventListener("click", () => {
      renderProductos(filtrarYOrdenar());
    });

    // Cambios en ordenar
    el.ordenarPor?.addEventListener("change", () => {
      renderProductos(filtrarYOrdenar());
    });
    el.ordenarDir?.addEventListener("change", () => {
      renderProductos(filtrarYOrdenar());
    });

    // Buscar en vivo (opcional puedes dejarlo solo con “Aplicar filtros”)
    el.buscar?.addEventListener("input", () => {
      renderProductos(filtrarYOrdenar());
    });

    // Reset (botón “Limpiar” del form)
    el.formFiltros?.addEventListener("reset", () => {
      // Esperar al reset completo del form antes de renderizar
      setTimeout(() => {
        applyColumns();
        renderProductos(filtrarYOrdenar());
      }, 0);
    });

    // Primer render
    renderProductos(filtrarYOrdenar());
  });
})();
