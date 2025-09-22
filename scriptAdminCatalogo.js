// admin_catalogo.js
// Script completo del admin catálogo refactorizado para usar backend (fetch) en vez de localStorage para productos.

// ========================================
// CONFIG
// ========================================

const API_BASE = "https://8mq33rknsp.us-east-1.awsapprunner.com/api"; // <- ajusta si tu base difiere
const PRODUCTOS_ENDPOINT = `${API_BASE}/productos`;
const token = localStorage.getItem("accessToken");
const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};


// ========================================
// PROTECCIÓN SOLO ADMIN
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const adminActivo = localStorage.getItem("adminActivo");
  if (adminActivo !== "true") {
    alert("Acceso denegado");
    window.location.href = "index.html"; // Redirige fuera
    return;
  }
});

// ========================================
// VARIABLES GLOBALES
// ========================================

let productos = []; // siempre sincronizado desde backend
let editando = false;
let productoEditandoId = null;
let categoriasSeleccionadas = [];

const form = document.getElementById("formProducto");

// ========================================
// HELPERS: Normalización y utilidades
// ========================================

/**
 * Normaliza un objeto producto que venga del backend a la estructura
 * que usa el front (id, nombre, precio, descripcion, stock, codigo, categorias, imagen, activo, fechaCreacion)
 * Esto permite tolerar diferentes nombres de campos en backend (idProducto / id_producto / id).
 */
function normalizeProducto(raw) {
  if (!raw) return null;
  const id = raw.id ?? raw.idProducto ?? raw.id_producto ?? raw.id_producto_fk ?? null;
  const nombre = raw.nombre ?? raw.name ?? raw.title ?? "";
  const descripcion = raw.descripcion ?? raw.description ?? raw.desc ?? "";
  const precio = raw.precio ?? raw.price ?? 0;
  const stock = raw.stock ?? raw.cantidad ?? 0;
  const codigo = raw.codigo ?? raw.code ?? raw.sku ?? "";

  // categorías
  let categorias = [];
  if (Array.isArray(raw.categorias)) categorias = raw.categorias;
  else if (raw.categoria && typeof raw.categoria === "string") {
    try {
      const parsed = JSON.parse(raw.categoria);
      if (Array.isArray(parsed)) categorias = parsed;
      else categorias = raw.categoria.split(",").map(s => s.trim()).filter(Boolean);
    } catch (e) {
      categorias = raw.categoria.split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  const imagen = raw.imagen ?? raw.image ?? raw.imagenBase64 ?? "";

  // ✅ Guardar estado como string + boolean
  const estado = raw.estado ?? (raw.activo ? "activo" : "inactivo") ?? "activo";
  const activo = estado === "activo";

  const fechaCreacion = raw.fechaCreacion ?? raw.fecha_creacion ?? raw.createdAt ?? raw.created_at ?? raw.fecha ?? null;

  return {
    id,
    nombre,
    descripcion,
    precio: parseFloat(precio) || 0,
    stock: parseInt(stock) || 0,
    codigo,
    categorias,
    imagen,
    estado,   // <--- nuevo
    activo,   // <--- booleano derivado
    fechaCreacion
  };
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notificacion.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(notificacion);
  setTimeout(() => {
    if (notificacion.parentNode) notificacion.remove();
  }, 3500);
}

function showLoading(targetElement) {
  if (!targetElement) return;
  targetElement.dataset.loading = "true";
}

function hideLoading(targetElement) {
  if (!targetElement) return;
  delete targetElement.dataset.loading;
}

// ========================================
// CARGA INICIAL Y RENDER
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar navegación por secciones
  document.querySelectorAll('[data-seccion]').forEach(btn => {
    btn.addEventListener("click", () => mostrarSeccion(btn.dataset.seccion));
  });

  // Inicializar funcionalidades
  inicializarSistemaCategorias();
  inicializarDashboard();
  inicializarSidebar();

  // Si hay formulario, registrar listener
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Cargar productos desde backend
  cargarProductos();
});

/**
 * Carga productos desde backend y los renderiza
 */
function cargarProductos() {
  const listaContainer = document.getElementById("listaProductos");
  if (listaContainer) showLoading(listaContainer);

  const token = localStorage.getItem("accessToken");
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  fetch(PRODUCTOS_ENDPOINT, {
    headers: {
      ...authHeaders
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`Error al cargar productos: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const arr = Array.isArray(data) ? data : (data.content ?? data.items ?? []);
      productos = arr.map(normalizeProducto);
      renderizarProductos();
      actualizarContadores();
      actualizarCategoriasDashboard();
    })
    .catch(err => {
      console.error("Error cargando productos:", err);
      mostrarNotificacion("No se pudieron cargar los productos. Revisa el backend.", "danger");
      productos = [];
      renderizarProductos();
    })
    .finally(() => {
      if (listaContainer) hideLoading(listaContainer);
    });
}


// ========================================
// FUNCIONALIDADES DEL FORMULARIO (CREAR / EDITAR)
// ========================================

function handleFormSubmit(e) {
  e.preventDefault();

  console.log("🚀 Formulario enviado");
  const nombre = document.getElementById("nombreProducto").value.trim();
  const precio = parseFloat(document.getElementById("precioProducto").value);
  const descripcion = document.getElementById("descripcionProducto").value.trim();
  const stock = parseInt(document.getElementById("stockProducto").value);
  const codigo = document.getElementById("codigoProducto").value.trim();
  const categorias = [...categoriasSeleccionadas];
  const imagenArchivo = document.getElementById("imagenArchivo").files[0];
  const imagenUrl = document.getElementById("imagenUrl").value.trim();

  // Validaciones
  if (!nombre) { mostrarNotificacion("El nombre del producto es obligatorio", "danger"); document.getElementById("nombreProducto").focus(); return; }
  if (!precio || precio <= 0) { mostrarNotificacion("El precio debe ser mayor a 0", "danger"); document.getElementById("precioProducto").focus(); return; }
  if (isNaN(stock) || stock < 0) { mostrarNotificacion("El stock debe ser mayor o igual a 0", "danger"); document.getElementById("stockProducto").focus(); return; }
  if (!codigo) { mostrarNotificacion("El código del producto es obligatorio", "danger"); document.getElementById("codigoProducto").focus(); return; }
  if (categorias.length === 0) { mostrarNotificacion("Debe agregar al menos una categoría", "danger"); document.getElementById("categoriaInput").focus(); return; }

  // Procesar imagen: si archivo -> convertir a base64 y comprimir; si url -> usarla; si nada -> imagen por defecto
  let imagenFinal = imagenUrl || "./assets/imagenes/logo.png";
  if (imagenArchivo) {
    if (imagenArchivo.size > 10 * 1024 * 1024) {
      mostrarNotificacion("La imagen es demasiado grande. Máximo 10MB permitido.", "danger");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      comprimirImagen(reader.result, (imagenComprimida) => {
        imagenFinal = imagenComprimida;
        guardarProductoAlBackend({ nombre, precio, descripcion, stock, codigo, categorias, imagen: imagenFinal });
      });
    };
    reader.readAsDataURL(imagenArchivo);
  } else {
    guardarProductoAlBackend({ nombre, precio, descripcion, stock, codigo, categorias, imagen: imagenFinal });
  }
}

function guardarProductoAlBackend(nuevoProductoFront) {
  const token = localStorage.getItem("accessToken");
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  const payload = {
    nombre: nuevoProductoFront.nombre,
    descripcion: nuevoProductoFront.descripcion,
    precio: nuevoProductoFront.precio,
    stock: nuevoProductoFront.stock,
    codigo: nuevoProductoFront.codigo,
    categoria: nuevoProductoFront.categorias.join(","),
    imagen: nuevoProductoFront.imagen,
    activo: true
  };

  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Guardando...';
  }

  // Si estamos editando -> PUT
  if (editando && productoEditandoId) {
    const id = productoEditandoId;
    const url = `${PRODUCTOS_ENDPOINT}/${id}`;
    fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error al actualizar producto: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        mostrarNotificacion(`Producto "${payload.nombre}" actualizado exitosamente`, "success");
        cargarProductos();
        cancelarEdicion();
      })
      .catch(err => {
        console.error("Error actualizando producto:", err);
        mostrarNotificacion("No se pudo actualizar el producto", "danger");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
        }
      });

  } else {
    // Crear producto -> POST
    fetch(PRODUCTOS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error al guardar producto: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        mostrarNotificacion(`Producto "${payload.nombre}" agregado exitosamente`, "success");
        cargarProductos();
        form.reset();
        categoriasSeleccionadas = [];
        renderizarCategorias();

        const imagePreview = document.getElementById("imagePreview");
        if (imagePreview) {
          imagePreview.innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
        }
      })
      .catch(err => {
        console.error("Error guardando producto:", err);
        mostrarNotificacion("No se pudo guardar el producto", "danger");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
        }
      });
  }
}


// ========================================
// RENDERIZADO DE PRODUCTOS
// ========================================

function renderizarProductos() {
  const contenedor = document.getElementById("listaProductos");
  const emptyState = document.getElementById("emptyState");
  if (!contenedor) return;

  actualizarContadores();

  if (!productos || productos.length === 0) {
    contenedor.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');
  contenedor.innerHTML = '';

  productos.forEach(producto => {
    const col = document.createElement("div");
    col.className = "col-lg-6 col-xl-4 mb-4";

    const imagenHtml = producto.imagen
      ? `<div class="product-image-wrapper">
       <img src="${producto.imagen}" alt="${escapeHtml(producto.nombre)}" class="product-image" onerror="this.onerror=null; this.src='./assets/imagenes/logo.png';">
     </div>`
      : `<div class="product-image-wrapper">
       <div class="placeholder d-flex align-items-center justify-content-center bg-light" style="width:100%;height:100%;">
         <i class="bi bi-image text-muted" style="font-size:3rem;"></i>
       </div>
     </div>`;
     
    const categoriasHtml = producto.categorias && producto.categorias.length > 0 ?
      producto.categorias.map(cat => `<span class="category-tag-small">${escapeHtml(cat)}</span>`).join('') :
      '<span class="category-tag-small">Sin categoría</span>';

    const fecha = producto.fechaCreacion ?
      new Date(producto.fechaCreacion).toLocaleDateString() :
      (producto.id ? new Date(parseInt(producto.id)).toLocaleDateString() : '');

    const precio = parseFloat(producto.precio) || 0;
    const stock = parseInt(producto.stock) || 0;
    const numCategorias = producto.categorias ? producto.categorias.length : 0;

    col.innerHTML = `
      <div class="product-card ${producto.activo ? '' : 'producto-inactivo'}">
        ${imagenHtml}
        <div class="product-info">
          <h4 class="product-title">${escapeHtml(producto.nombre) || 'Sin nombre'}</h4>
          <span class="product-code">Código: ${escapeHtml(producto.codigo) || 'Sin código'}</span>
          
          <div class="product-details">
            <div class="product-detail">
              <i class="bi bi-currency-dollar"></i>
              <span>$${precio.toFixed(2)}</span>
            </div>
            <div class="product-detail">
              <i class="bi bi-box-seam"></i>
              <span>Stock: ${stock}</span>
            </div>
            <div class="product-detail">
              <i class="bi bi-tag"></i>
              <span>${numCategorias} categoría${numCategorias !== 1 ? 's' : ''}</span>
            </div>
            <div class="product-detail">
              <i class="bi bi-calendar3"></i>
              <span>${fecha}</span>
            </div>
          </div>
          
          ${producto.descripcion ? `<p class="product-description">${escapeHtml(producto.descripcion)}</p>` : ''}
          
          <div class="product-categories">
            ${categoriasHtml}
          </div>
          
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="editarProducto('${producto.id}')" title="Editar producto">
              <i class="bi bi-pencil-square me-1"></i>Editar
            </button>
            <button class="btn ${producto.activo ? 'btn-success' : 'btn-outline-secondary'} btn-sm" onclick="toggleEstadoProducto('${producto.id}')" title="${producto.activo ? 'Desactivar' : 'Activar'} producto">
              <i class="bi ${producto.activo ? 'bi-check-circle' : 'bi-x-circle'} me-1"></i>${producto.activo ? 'Activo' : 'Inactivo'}
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto('${producto.id}')" title="Eliminar producto">
              <i class="bi bi-trash me-1"></i>Eliminar
            </button>
          </div>
        </div>
      </div>
    `;
    contenedor.appendChild(col);
  });
}

// ========================================
// OPERACIONES CRUD (backend)
// ========================================

let productoAEliminar = null;

function eliminarProducto(id) {
  productoAEliminar = id; // guardamos el id temporalmente
  const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
  modal.show();
}

// Acción al confirmar eliminación
document.getElementById('btnConfirmarEliminar').addEventListener('click', () => {
  if (!productoAEliminar) return;

  const token = localStorage.getItem("accessToken");
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  fetch(`${PRODUCTOS_ENDPOINT}/${productoAEliminar}`, {
    method: "DELETE",
    headers: {
      ...authHeaders
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`Error eliminando: ${res.status}`);
      mostrarNotificacion("Producto eliminado", "success");
      cargarProductos();
    })
    .catch(err => {
      console.error("Error eliminando producto:", err);
      mostrarNotificacion("No se pudo eliminar el producto", "danger");
    })
    .finally(() => {
      productoAEliminar = null;
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminar'));
      modal.hide();
    });
});



function toggleEstadoProducto(id) {
  const producto = productos.find(p => String(p.id) === String(id));
  if (!producto) return;

  const nuevoEstado = producto.estado === "activo" ? "inactivo" : "activo";

  const token = localStorage.getItem("accessToken");
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  fetch(`${PRODUCTOS_ENDPOINT}/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders
    },
    body: JSON.stringify({ estado: nuevoEstado })
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al cambiar estado");
      return res.json();
    })
    .then(data => {
      console.log("Estado actualizado:", data);
      mostrarNotificacion(
        nuevoEstado === "activo" ? "Producto activado" : "Producto desactivado",
        nuevoEstado === "activo" ? "success" : "warning"
      );
      cargarProductos();
    })
    .catch(err => {
      console.error("Error cambiando estado:", err);
      mostrarNotificacion("No se pudo cambiar el estado del producto", "danger");
    });
}




function editarProducto(id) {
  const token = localStorage.getItem("accessToken");
  const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

  fetch(`${PRODUCTOS_ENDPOINT}/${id}`, {
    headers: {
      ...authHeaders
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("No se encontró el producto");
      return res.json();
    })
    .then(raw => {
      const producto = normalizeProducto(raw);
      if (!producto) throw new Error("Producto inválido");

      // Llenar formulario
      document.getElementById("nombreProducto").value = producto.nombre || '';
      document.getElementById("precioProducto").value = producto.precio || '';
      document.getElementById("descripcionProducto").value = producto.descripcion || "";
      document.getElementById("stockProducto").value = producto.stock || 0;
      document.getElementById("codigoProducto").value = producto.codigo || "";
      document.getElementById("imagenArchivo").value = "";
      document.getElementById("imagenUrl").value = producto.imagen || "";

      // Configurar categorías
      categoriasSeleccionadas = [...(producto.categorias || [])];
      renderizarCategorias();

      // Vista previa
      const imagePreview = document.getElementById("imagePreview");
      if (producto.imagen && imagePreview) {
        imagePreview.innerHTML = `<img src="${producto.imagen}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">`;
      }

      // Cambiar estado edición
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Actualizar Producto';

      editando = true;
      productoEditandoId = producto.id;
      mostrarSeccion('agregar');
      document.getElementById("agregar").scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => {
      console.error("Error al preparar edición:", err);
      mostrarNotificacion("No se pudo cargar el producto para editar", "danger");
    });
}


function cancelarEdicion() {
  editando = false;
  productoEditandoId = null;
  if (form) form.reset();
  categoriasSeleccionadas = [];
  renderizarCategorias();
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) btnCancelar.style.display = 'none';
  const imagePreview = document.getElementById("imagePreview");
  if (imagePreview) imagePreview.innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
  mostrarSeccion('dashboard');
}

// ========================================
// IMAGEN: compresión / preview
// ========================================

function comprimirImagen(base64String, callback) {
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let width = img.width;
    let height = img.height;
    const maxSize = 1200;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imagenComprimida = canvas.toDataURL('image/jpeg', 0.75);

    if (imagenComprimida.length > 1_000_000) {
      mostrarNotificacion("La imagen sigue siendo muy grande después de la compresión. Intenta con una imagen más pequeña.", "warning");
      callback("./assets/imagenes/logo.png");
    } else {
      callback(imagenComprimida);
    }
  };

  img.onerror = function () {
    mostrarNotificacion("Error al procesar la imagen. Se usará la imagen por defecto.", "warning");
    callback("./assets/imagenes/logo.png");
  };

  img.src = base64String;
}

function mostrarSeccion(id) {
  const secciones = document.querySelectorAll('.seccion-admin');
  secciones.forEach(seccion => seccion.classList.add('d-none'));
  document.getElementById(id).classList.remove('d-none');
  if (id === "usuarios") cargarUsuarios();

}


// ========================================
// SISTEMA DE CATEGORÍAS / VISTA PREVIA
// ========================================

function inicializarSistemaCategorias() {
  const categoriaInput = document.getElementById('categoriaInput');
  const agregarBtn = document.getElementById('agregarCategoria');

  if (categoriaInput) {
    categoriaInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarCategoria();
      }
    });
  }

  if (agregarBtn) {
    agregarBtn.addEventListener('click', agregarCategoria);
  }

  inicializarVistaPreviaImagen();
}

function inicializarVistaPreviaImagen() {
  const imagenArchivo = document.getElementById('imagenArchivo');
  const imagenUrl = document.getElementById('imagenUrl');
  const imagePreview = document.getElementById('imagePreview');

  if (imagenArchivo) {
    imagenArchivo.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (imagenUrl) {
    imagenUrl.addEventListener('input', function (e) {
      const url = e.target.value.trim();
      if (url) {
        imagePreview.innerHTML = `<img src="${url}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-image text-muted\\'></i><p class=\\'text-muted\\'>Error al cargar imagen</p>'">`;
      } else {
        imagePreview.innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
      }
    });
  }
}

function agregarCategoria() {
  const input = document.getElementById('categoriaInput');
  if (!input) return;
  const categoria = input.value.trim();
  if (categoria && !categoriasSeleccionadas.includes(categoria)) {
    categoriasSeleccionadas.push(categoria);
    renderizarCategorias();
    input.value = '';
    input.focus();
  }
}

function eliminarCategoria(categoria) {
  categoriasSeleccionadas = categoriasSeleccionadas.filter(cat => cat !== categoria);
  renderizarCategorias();
}

function renderizarCategorias() {
  const contenedor = document.getElementById('categoriasTags');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  categoriasSeleccionadas.forEach(categoria => {
    const tag = document.createElement('div');
    tag.className = 'categoria-tag';
    tag.innerHTML = `
      ${escapeHtml(categoria)}
      <span class="remove-tag" onclick="eliminarCategoria('${escapeJs(categoria)}')">&times;</span>
    `;
    contenedor.appendChild(tag);
  });
}

// ========================================
// DASHBOARD Y FILTROS
// ========================================

function cargarCategoriasDinamicas() {
  const filtroCategoria = document.getElementById('filtroCategoria');
  if (!filtroCategoria) return;

  const categoriasUnicas = new Set();
  productos.forEach(producto => {
    if (producto.categorias && Array.isArray(producto.categorias)) {
      producto.categorias.forEach(categoria => {
        if (categoria && typeof categoria === 'string') categoriasUnicas.add(categoria.trim());
      });
    }
  });

  filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';
  Array.from(categoriasUnicas).sort().forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    filtroCategoria.appendChild(option);
  });
}

function actualizarCategoriasDashboard() {
  cargarCategoriasDinamicas();
}

function inicializarDashboard() {
  const buscarInput = document.getElementById('buscarProducto');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const ordenarPor = document.getElementById('ordenarPor');

  cargarCategoriasDinamicas();

  if (buscarInput) buscarInput.addEventListener('input', filtrarProductos);
  if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarProductos);
  if (ordenarPor) ordenarPor.addEventListener('change', filtrarProductos);
}

function filtrarProductos() {
  const busqueda = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
  const categoria = document.getElementById('filtroCategoria')?.value || '';
  const orden = document.getElementById('ordenarPor')?.value || '';

  let productosFiltrados = productos.filter(producto => {
    const nombre = (producto.nombre || '').toString().toLowerCase();
    const descripcion = (producto.descripcion || '').toString().toLowerCase();
    const codigo = (producto.codigo || '').toString().toLowerCase();

    const coincideBusqueda = nombre.includes(busqueda) || descripcion.includes(busqueda) || codigo.includes(busqueda);
    const coincideCategoria = !categoria || (producto.categorias && producto.categorias.includes(categoria));
    return coincideBusqueda && coincideCategoria;
  });

  productosFiltrados.sort((a, b) => {
    switch (orden) {
      case 'nombre': return a.nombre.localeCompare(b.nombre);
      case 'precio': return parseFloat(a.precio) - parseFloat(b.precio);
      case 'stock': return parseInt(a.stock) - parseInt(b.stock);
      case 'fecha': return (b.fechaCreacion || 0) - (a.fechaCreacion || 0);
      default: return 0;
    }
  });

  renderizarProductosFiltrados(productosFiltrados);
}

function renderizarProductosFiltrados(productosFiltrados) {
  const contenedor = document.getElementById("listaProductos");
  const emptyState = document.getElementById("emptyState");
  if (!contenedor) return;

  if (productosFiltrados.length === 0) {
    contenedor.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');
  contenedor.innerHTML = '';
  productosFiltrados.forEach(producto => {
    // reuse HTML generation from renderizarProductos by temporarily setting productos = productosFiltrados and calling renderizarProductos,
    // but to avoid reassignments we replicate minimal HTML generation (omitted here for brevity)
    // For simplicity call renderizarProductos directly after setting productos global
  });

  // Simpler: set global temporal and call render
  const backup = productos;
  productos = productosFiltrados;
  renderizarProductos();
  productos = backup;
}

// ========================================
// CONTADORES Y ESTADÍSTICAS
// ========================================

function actualizarContadores() {
  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => p.activo).length;

  if (document.getElementById("totalProductos")) document.getElementById("totalProductos").textContent = totalProductos;
  if (document.getElementById("totalProductosForm")) document.getElementById("totalProductosForm").textContent = totalProductos;
  if (document.getElementById("productosActivos")) document.getElementById("productosActivos").textContent = productosActivos;

  verificarUsoLocalStorage(); // seguimos chequeando espacio del navegador por si otras cosas lo usan
}

function verificarUsoLocalStorage() {
  try {
    // verificamos solo admin/profiles que aún usamos
    const adminSize = new Blob([localStorage.getItem("admin") || ""]).size;
    const tamanoMB = (adminSize / (1024 * 1024)).toFixed(2);
    if (tamanoMB > 4) mostrarNotificacion(`Admin localStorage: ${tamanoMB}MB usado.`, "warning");
  } catch (error) {
    console.warn("Error al verificar uso del localStorage:", error);
  }
}

// ========================================
// SIDEBAR Y PERFIL del ADMIN con conexión al backend
// ========================================

function inicializarSidebar() {
  const toggleBtn = document.getElementById("toggleBtn");
  const sidebar = document.getElementById("sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      toggleBtn.innerHTML = sidebar.classList.contains("collapsed") ? ">" : "<";
    });
  }
  inicializarPerfil();
}

async function inicializarPerfil() {
  const token = localStorage.getItem("accessToken");
  const adminActivo = localStorage.getItem("adminActivo");

  if (adminActivo !== "true" || !token) return;

  const nombreSidebar = document.querySelector(".profile h3");
  const fotoSidebar = document.querySelector(".profile img");
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputCorreo = document.getElementById("inputCorreo");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");

  try {
    const storedAdmin = JSON.parse(localStorage.getItem("admin"));
    const idAdmin = storedAdmin?.idUsuario;

    if (!idAdmin) throw new Error("No se encontró ID del administrador");

    const response = await fetch(`https://8mq33rknsp.us-east-1.awsapprunner.com/api/usuarios/${idAdmin}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("No se pudo obtener el perfil del admin");

    const admin = await response.json();

    inputNombre.value = admin.nombre || "";
    inputCorreo.value = admin.correo || "";
    fotoPerfil.src = admin.foto || "./assets/imagenes/user.png";
    if (nombreSidebar) nombreSidebar.textContent = admin.nombre;
    if (fotoSidebar) fotoSidebar.src = admin.foto || "./assets/imagenes/user.png";

    localStorage.setItem("admin", JSON.stringify(admin)); // refresca cache local

    guardarBtn.onclick = async () => {
      const nuevoNombre = inputNombre.value.trim();
      const nuevoCorreo = inputCorreo.value.trim();
      const nuevaPassword = inputPassword.value.trim();
      const nuevaFoto = inputFoto.files[0];

      const actualizado = {
        ...admin,
        nombre: nuevoNombre,
        correo: nuevoCorreo,
      };

      if (nuevaPassword && nuevaPassword.trim() !== "") {
        actualizado.password = nuevaPassword;
      }

      if (nuevaFoto) {
        const reader = new FileReader();
        reader.onload = async function (e) {
          actualizado.foto = e.target.result;
          await actualizarPerfilAdmin(idAdmin, actualizado, token, fotoPerfil, fotoSidebar);
        };
        reader.readAsDataURL(nuevaFoto);
      } else {
        await actualizarPerfilAdmin(idAdmin, actualizado, token, fotoPerfil, fotoSidebar);
      }
    };

  } catch (error) {
    console.error("Error cargando perfil admin:", error);
  }
}

async function actualizarPerfilAdmin(id, datos, token, fotoPerfil, fotoSidebar) {
  try {
    const response = await fetch(`https://8mq33rknsp.us-east-1.awsapprunner.com/api/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    if (!response.ok) throw new Error("Error al actualizar el perfil");

    const actualizado = await response.json();
    const mensaje = document.getElementById("mensajePerfil");

    if (mensaje) {
      mensaje.textContent = "";
      mensaje.className = "form-message";
    }

    fotoPerfil.src = actualizado.foto || "./assets/imagenes/user.png";
    if (fotoSidebar) fotoSidebar.src = actualizado.foto || "./assets/imagenes/user.png";
    document.querySelector(".profile h3").textContent = actualizado.nombre;

    localStorage.setItem("admin", JSON.stringify(actualizado));

    // ✅ Refrescar nav
    actualizarNavAdmin(actualizado);

    const modal = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
    if (modal) modal.hide();
    if (mensaje) {
      mensaje.textContent = "Perfil actualizado correctamente ";
      mensaje.classList.add("success");
    }
  } catch (err) {
    console.error("Error actualizando perfil:", err);
    if (mensaje) {
      mensaje.textContent = "No se pudo actualizar el perfil";
      mensaje.classList.add("error");
    }
  }
}

function actualizarNavAdmin(adminData) {
  const navFotoPerfil = document.getElementById("navFotoPerfil");
  const perfilOpciones = document.getElementById("perfilOpciones");

  if (navFotoPerfil) navFotoPerfil.src = adminData.foto || "./assets/imagenes/user.png";

  if (perfilOpciones) {
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${escapeHtml(adminData.nombre || "Admin")}</span></li>
      <li><a class="dropdown-item" href="adminview.html">Vista Administrador</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;
    document.getElementById("cerrarSesion").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("accessToken");
      localStorage.setItem("adminActivo", "false");
      localStorage.setItem("usuarioActivo", "false");
      localStorage.removeItem("usuario");
      localStorage.removeItem("admin");
      window.location.href = "index.html";
    });
  }
}

// (Opcional) si usas escapeHtml
function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  const cerrarSesionSidebar = document.getElementById("cerrarSesionSidebar");
  if (cerrarSesionSidebar) {
    cerrarSesionSidebar.addEventListener("click", (e) => {
      e.preventDefault();
      cerrarSesion(); // Reutiliza la función global
    });
  }
});

// ========================================
// UTIL: seguridad y escape
// ========================================

function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str) {
  return String(str || "").replace(/'/g, "\\'");
}

// ========================================
// USUARIOS REGISTRADOS Y VENTAS (SECCIÓN ADMIN)
// ========================================

if (document.getElementById("usuarios")) {
  cargarUsuarios();
}

async function cargarUsuarios() {
  const token = localStorage.getItem("accessToken");
  const listaUsuarios = document.getElementById("listaUsuarios");
  const emptyState = document.getElementById("emptyStateUsuarios");
  const totalUsuariosEl = document.getElementById("totalUsuarios");

  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error cargando usuarios");

    const usuarios = await res.json();

    if (totalUsuariosEl) totalUsuariosEl.textContent = usuarios.length;

    if (usuarios.length === 0) {
      listaUsuarios.innerHTML = "";
      emptyState.classList.remove("d-none");
      return;
    }

    emptyState.classList.add("d-none");
    listaUsuarios.innerHTML = "";

    usuarios.forEach(usuario => {
      const estadoClase = usuario.estado === "activo" ? "active" : "inactive";
      const tarjeta = document.createElement("div");
      tarjeta.className = "col-lg-6 col-xl-4";
      tarjeta.innerHTML = `
        <div class="user-card">
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="user-info">
            <h4 class="user-name">${escapeHtml(usuario.nombre)}</h4>
            <p class="user-email">${escapeHtml(usuario.correo)}</p>
            <div class="user-status ${estadoClase}">${usuario.estado}</div>
            <div class="user-details">
              <span><i class="bi bi-calendar3"></i> Registrado: ${formatFecha(usuario.fechaRegistro)}</span>
              <span><i class="bi bi-geo-alt"></i> ${usuario.ciudad || "Sin ciudad"}</span>
            </div>
          </div>
          <div class="user-actions">
            <button class="btn btn-sm btn-outline-primary btn-ver-usuario"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning btn-editar-usuario"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-eliminar-usuario"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      `;
      listaUsuarios.appendChild(tarjeta);
    });
  } catch (err) {
    console.error("Error cargando usuarios:", err);
    mostrarNotificacion("Error al cargar usuarios", "danger");
  }
}

function formatFecha(fechaStr) {
  try {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-CO");
  } catch {
    return fechaStr;
  }
}

if (document.getElementById("compras")) {
  cargarCompras();
}

async function cargarCompras() {
  const token = localStorage.getItem("accessToken");
  const listaCompras = document.getElementById("listaCompras");
  const emptyState = document.getElementById("emptyStateCompras");
  const totalComprasEl = document.getElementById("totalCompras");

  try {
    const res = await fetch(`${API_BASE}/ventas`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error cargando ventas");

    const ventas = await res.json();

    if (totalComprasEl) totalComprasEl.textContent = ventas.length;

    if (ventas.length === 0) {
      listaCompras.innerHTML = "";
      emptyState.classList.remove("d-none");
      return;
    }

    emptyState.classList.add("d-none");
    listaCompras.innerHTML = "";

    ventas.forEach((venta, index) => {
      const productosHTML = venta.detalles.map(
        d => `<span class="producto-tag">${escapeHtml(d.producto.nombre)}</span>`
      ).join("");

      const row = document.createElement("tr");
      row.className = "compra-row";
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div class="user-compra">
            <div class="user-avatar-small"><i class="bi bi-person-circle"></i></div>
            <div class="user-info-compra">
              <strong>${escapeHtml(venta.usuario.correo)}</strong>
              <small class="text-muted d-block">${escapeHtml(venta.usuario.nombre)}</small>
            </div>
          </div>
        </td>
        <td><div class="productos-compra">${productosHTML}</div></td>
        <td><div class="fecha-compra"><i class="bi bi-calendar3 text-primary"></i> ${formatFecha(venta.fechaVenta)}</div></td>
        <td><span class="badge bg-${getEstadoClase(venta.estado)}">${venta.estado}</span></td>
        <td><strong class="text-success">$${venta.total.toLocaleString("es-CO")}</strong></td>
        <td>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-primary btn-ver-venta" data-id="${venta.idVenta}">
              <i class="bi bi-eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-warning btn-editar-venta" data-id="${venta.idVenta}">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger btn-cancelar-venta" data-id="${venta.idVenta}">
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        </td>
      `;
      listaCompras.appendChild(row);
    });

    // Resumen de compras
    let totalVentas = 0;
    let totalProductos = 0;
    const usuariosSet = new Set();

    ventas.forEach(venta => {
      totalVentas += venta.total;
      usuariosSet.add(venta.usuario.idUsuario);
      venta.detalles.forEach(detalle => {
        totalProductos += detalle.cantidad;
      });
    });

    const promedioCompra = ventas.length > 0 ? totalVentas / ventas.length : 0;

    document.getElementById("totalVentas").textContent = `$${totalVentas.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
    document.getElementById("promedioCompra").textContent = `$${promedioCompra.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
    document.getElementById("usuariosUnicos").textContent = usuariosSet.size;
    document.getElementById("productosVendidos").textContent = totalProductos;

  } catch (err) {
    console.error("Error cargando compras:", err);
    mostrarNotificacion("Error al cargar compras", "danger");
  }
}

function getEstadoClase(estado) {
  switch ((estado || "").toLowerCase()) {
    case "completada": return "success";
    case "pendiente": return "warning";
    case "cancelada": return "danger";
    default: return "secondary";
  }
}

// ===========================
// VENTAS: Acciones
// ===========================
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("btn-ver-venta")) verVenta(id);
  if (btn.classList.contains("btn-editar-venta")) editarVenta(id);
  if (btn.classList.contains("btn-cancelar-venta")) {
    mostrarModalConfirmacion("¿Seguro que deseas cancelar esta venta?", () => cancelarVenta(id));
  }

  const tarjeta = btn.closest(".user-card");
  if (!tarjeta) return;

  const correo = tarjeta.querySelector(".user-email")?.textContent;
  const nombre = tarjeta.querySelector(".user-name")?.textContent;

  if (btn.classList.contains("btn-ver-usuario")) mostrarModalDetalleUsuario(nombre, correo);
  if (btn.classList.contains("btn-editar-usuario")) mostrarNotificacion("Funcionalidad aún no implementada", "info");
  if (btn.classList.contains("btn-eliminar-usuario")) {
    mostrarModalConfirmacion(`¿Eliminar al usuario <strong>${nombre}</strong>?`, () => eliminarUsuario(correo));
  }
});

function verVenta(id) {
  const token = localStorage.getItem("accessToken");

  fetch(`${API_BASE}/ventas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(venta => {
      const productos = venta.detalles.map(
        d => `<li>${escapeHtml(d.producto.nombre)} x${d.cantidad} - $${d.subtotal}</li>`
      ).join("");

      const html = `
        <p><strong>Usuario:</strong> ${escapeHtml(venta.usuario.nombre)} (${escapeHtml(venta.usuario.correo)})</p>
        <p><strong>Fecha:</strong> ${formatFecha(venta.fechaVenta)}</p>
        <p><strong>Estado:</strong> ${venta.estado}</p>
        <p><strong>Método de Pago:</strong> ${venta.metodoPago}</p>
        <p><strong>Total:</strong> $${venta.total.toLocaleString("es-CO")}</p>
        <p><strong>Productos:</strong></p>
        <ul>${productos}</ul>
      `;

      document.getElementById("modalVerDetalleBody").innerHTML = html;
      new bootstrap.Modal(document.getElementById("modalVerDetalle")).show();
    })
    .catch(err => {
      console.error("Error al cargar venta:", err);
      mostrarNotificacion("No se pudo mostrar la venta", "danger");
    });
}

function editarVenta(id) {
  mostrarNotificacion("Funcionalidad de edición aún no implementada", "info");
}

function cancelarVenta(id) {
  const token = localStorage.getItem("accessToken");

  fetch(`${API_BASE}/ventas/${id}/cancelar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al cancelar venta");
      mostrarNotificacion("Venta cancelada", "warning");
      cargarCompras();
    })
    .catch(err => {
      console.error("Error cancelando venta:", err);
      mostrarNotificacion("No se pudo cancelar la venta", "danger");
    });
}

function mostrarModalDetalleUsuario(nombre, correo) {
  const html = `
    <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
  `;
  document.getElementById("modalVerDetalleBody").innerHTML = html;
  new bootstrap.Modal(document.getElementById("modalVerDetalle")).show();
}

function eliminarUsuario(correo) {
  const token = localStorage.getItem("accessToken");

  fetch(`${API_BASE}/usuarios/eliminar-por-correo?correo=${encodeURIComponent(correo)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error("Error eliminando usuario");
      mostrarNotificacion("Usuario eliminado", "danger");
      cargarUsuarios();
    })
    .catch(err => {
      console.error("Error eliminando usuario:", err);
      mostrarNotificacion("No se pudo eliminar el usuario", "danger");
    });
}

function mostrarModalConfirmacion(mensaje, onConfirm) {
  const body = document.getElementById("modalConfirmarBody");
  const btnConfirmar = document.getElementById("btnConfirmarAccion");

  body.innerHTML = mensaje;

  const modal = new bootstrap.Modal(document.getElementById("modalConfirmar"));
  modal.show();

  const confirmarHandler = () => {
    onConfirm();
    btnConfirmar.removeEventListener("click", confirmarHandler);
    modal.hide();
  };

  btnConfirmar.addEventListener("click", confirmarHandler);
}

