// ========================================
// PROTECCIÓN SOLO ADMIN
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  const adminActivo = localStorage.getItem("adminActivo");

  if (adminActivo !== "true") {
    alert("Acceso denegado");
    window.location.href = "index.html"; // Redirige fuera
    return; // 👈 Detiene ejecución del script admin
  }
});


// ========================================
// SCRIPT ADMIN CATÁLOGO
// ========================================

// Variables globales
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let editando = false;
let productoEditandoId = null;
let categoriasSeleccionadas = [];

// Referencias DOM
const form = document.getElementById("formProducto");


document.addEventListener("DOMContentLoaded", () => {
  // Inicializar navegación por secciones
  document.querySelectorAll('[data-seccion]').forEach(btn => {
    btn.addEventListener("click", () => mostrarSeccion(btn.dataset.seccion));
  });

  // Inicializar funcionalidades
  inicializarSistemaCategorias();
  inicializarDashboard();

  // Solo renderizar productos si estamos en la vista admin
  if (document.getElementById("listaProductos")) {
    renderizarProductos();
    actualizarContadores();
  }

  // Inicializar sidebar
  inicializarSidebar();
});

// ========================================
// FUNCIONALIDADES DEL FORMULARARIO
// ========================================

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreProducto").value.trim();
  const precio = parseFloat(document.getElementById("precioProducto").value);
  const descripcion = document.getElementById("descripcionProducto").value.trim();
  const stock = parseInt(document.getElementById("stockProducto").value);
  const codigo = document.getElementById("codigoProducto").value.trim();
  const categorias = [...categoriasSeleccionadas];
  const imagenArchivo = document.getElementById("imagenArchivo").files[0];
  const imagenUrl = document.getElementById("imagenUrl").value.trim();
  
  // Validaciones
  if (!nombre) {
    mostrarNotificacion("El nombre del producto es obligatorio", "danger");
    document.getElementById("nombreProducto").focus();
    return;
  }
  
  if (!precio || precio <= 0) {
    mostrarNotificacion("El precio debe ser mayor a 0", "danger");
    document.getElementById("precioProducto").focus();
    return;
  }
  
  if (!stock || stock < 0) {
    mostrarNotificacion("El stock debe ser mayor o igual a 0", "danger");
    document.getElementById("stockProducto").focus();
    return;
  }
  
  if (!codigo) {
    mostrarNotificacion("El código del producto es obligatorio", "danger");
    document.getElementById("codigoProducto").focus();
    return;
  }
  
  if (categorias.length === 0) {
    mostrarNotificacion("Debe agregar al menos una categoría", "danger");
    document.getElementById("categoriaInput").focus();
    return;
  }
  
  // Procesar imagen
  let imagen = imagenUrl;
  
  if (imagenArchivo) {
    if (imagenArchivo.size > 5 * 1024 * 1024) {
      mostrarNotificacion("La imagen es demasiado grande. Máximo 5MB permitido.", "danger");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function () {
      comprimirImagen(reader.result, (imagenComprimida) => {
        imagen = imagenComprimida;
        guardarProducto();
      });
    };
    reader.readAsDataURL(imagenArchivo);
  } else if (!imagenUrl) {
    imagen = "./assets/imagenes/logo.png";
    guardarProducto();
  } else {
    guardarProducto();
  }

  function guardarProducto() {
    const nuevoProducto = {
      id: editando ? productoEditandoId : Date.now(),
      nombre,
      precio: parseFloat(precio),
      descripcion,
      stock: parseInt(stock),
      codigo,
      categorias,
      imagen,
      activo: editando ? productos.find(p => p.id === productoEditandoId)?.activo ?? true : true,
      fechaCreacion: editando ? productos.find(p => p.id === productoEditandoId)?.fechaCreacion ?? new Date().toISOString() : new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    try {
      if (editando) {
        const index = productos.findIndex(p => p.id === productoEditandoId);
        if (index !== -1) {
          productos[index] = nuevoProducto;
          mostrarNotificacion(`Producto "${nombre}" actualizado exitosamente`, "success");
        }
        editando = false;
        productoEditandoId = null;
      } else {
        productos.push(nuevoProducto);
        mostrarNotificacion(`Producto "${nombre}" agregado exitosamente`, "success");
      }

      // Guardar en localStorage
      localStorage.setItem("productos", JSON.stringify(productos));
      
      // Limpiar formulario
      form.reset();
      categoriasSeleccionadas = [];
      renderizarCategorias();
      
      // Resetear botón y ocultar botón de cancelar
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
      
      const btnCancelar = document.getElementById('btnCancelar');
      if (btnCancelar) btnCancelar.style.display = 'none';
      
      // Actualizar dashboard
      actualizarContadores();
      mostrarSeccion('dashboard');
      renderizarProductos();
      
      // Limpiar vista previa de imagen
      document.getElementById("imagePreview").innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
      
      // Actualizar categorías dinámicas
      actualizarCategoriasDashboard();
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        if (productos.length > 10) {
          productos = productos.slice(Math.floor(productos.length / 2));
          try {
            localStorage.setItem("productos", JSON.stringify(productos));
            mostrarNotificacion("Se eliminaron productos antiguos para liberar espacio. Intenta guardar nuevamente.", "warning");
            renderizarProductos();
          } catch (error2) {
            mostrarNotificacion("Error crítico de almacenamiento. Contacta al administrador.", "danger");
            console.error("Error crítico:", error2);
          }
        } else {
          mostrarNotificacion("Error de almacenamiento. Elimina algunos productos o usa imágenes más pequeñas.", "danger");
        }
      } else {
        mostrarNotificacion("Error al guardar el producto. Intenta nuevamente.", "danger");
        console.error("Error al guardar:", error);
      }
    }
  }
});

// ========================================
// RENDERIZADO DE PRODUCTOS
// ========================================

function renderizarProductos() {
  const contenedor = document.getElementById("listaProductos");
  const emptyState = document.getElementById("emptyState");
  
  if (!contenedor) return;
  
  actualizarContadores();
  
  if (productos.length === 0) {
    contenedor.innerHTML = '';
    if (emptyState) emptyState.classList.remove('d-none');
    return;
  }
  
  if (emptyState) emptyState.classList.add('d-none');
  contenedor.innerHTML = '';

  productos.forEach(producto => {
    const col = document.createElement("div");
    col.className = "col-lg-6 col-xl-4 mb-4";
    
    const imagenHtml = producto.imagen ? 
      `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image" onerror="this.onerror=null; this.src='./assets/imagenes/logo.png';">` : 
      `<div class="product-image d-flex align-items-center justify-content-center bg-light">
         <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
       </div>`;

    const categoriasHtml = producto.categorias && producto.categorias.length > 0 ? 
      producto.categorias.map(cat => `<span class="category-tag-small">${cat}</span>`).join('') : 
      '<span class="category-tag-small">Sin categoría</span>';

    const fecha = producto.fechaCreacion ? 
      new Date(producto.fechaCreacion).toLocaleDateString() : 
      new Date(producto.id).toLocaleDateString();

    const precio = parseFloat(producto.precio) || 0;
    const stock = parseInt(producto.stock) || 0;
    const numCategorias = producto.categorias ? producto.categorias.length : 0;

    col.innerHTML = `
      <div class="product-card ${producto.activo ? '' : 'producto-inactivo'}">
        ${imagenHtml}
        <div class="product-info">
          <h4 class="product-title">${producto.nombre || 'Sin nombre'}</h4>
          <span class="product-code">Código: ${producto.codigo || 'Sin código'}</span>
          
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
          
          ${producto.descripcion ? `<p class="product-description">${producto.descripcion}</p>` : ''}
          
          <div class="product-categories">
            ${categoriasHtml}
          </div>
          
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="editarProducto(${producto.id})" title="Editar producto">
              <i class="bi bi-pencil-square me-1"></i>Editar
            </button>
            <button class="btn ${producto.activo ? 'btn-success' : 'btn-outline-secondary'} btn-sm" onclick="toggleEstadoProducto(${producto.id})" title="${producto.activo ? 'Desactivar' : 'Activar'} producto">
              <i class="bi ${producto.activo ? 'bi-check-circle' : 'bi-x-circle'} me-1"></i>${producto.activo ? 'Activo' : 'Inactivo'}
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto(${producto.id})" title="Eliminar producto">
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
// OPERACIONES CRUD
// ========================================

function eliminarProducto(id) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem("productos", JSON.stringify(productos));
    renderizarProductos();
    actualizarCategoriasDashboard();
  }
}

function toggleEstadoProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  
  producto.activo = !producto.activo;
  localStorage.setItem("productos", JSON.stringify(productos));
  renderizarProductos();
  
  const mensaje = producto.activo ? 
    `Producto "${producto.nombre}" activado exitosamente` : 
    `Producto "${producto.nombre}" desactivado exitosamente`;
  
  mostrarNotificacion(mensaje, producto.activo ? 'success' : 'warning');
}

function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    mostrarNotificacion("Producto no encontrado", "danger");
    return;
  }

  // Llenar formulario
  document.getElementById("nombreProducto").value = producto.nombre;
  document.getElementById("precioProducto").value = producto.precio;
  document.getElementById("descripcionProducto").value = producto.descripcion || "";
  document.getElementById("stockProducto").value = producto.stock;
  document.getElementById("codigoProducto").value = producto.codigo;
  document.getElementById("imagenArchivo").value = "";
  document.getElementById("imagenUrl").value = producto.imagen || "";

  // Configurar categorías
  categoriasSeleccionadas = [...producto.categorias];
  renderizarCategorias();

  // Configurar vista previa de imagen
  const imagePreview = document.getElementById("imagePreview");
  if (producto.imagen) {
    imagePreview.innerHTML = `<img src="${producto.imagen}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">`;
  } else {
    imagePreview.innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
  }

  // Cambiar texto del botón y mostrar botón de cancelar
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Actualizar Producto';
  
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) btnCancelar.style.display = 'block';

  editando = true;
  productoEditandoId = id;
  mostrarSeccion('agregar');
  
  document.getElementById("agregar").scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
  editando = false;
  productoEditandoId = null;
  
  form.reset();
  categoriasSeleccionadas = [];
  renderizarCategorias();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
  
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) btnCancelar.style.display = 'none';
  
  document.getElementById("imagePreview").innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
  
  mostrarSeccion('dashboard');
}

function limpiarDatos() {
  if (confirm("¿Estás seguro de que quieres eliminar todos los productos? Esta acción no se puede deshacer.")) {
    productos = [];
    localStorage.removeItem("productos");
    renderizarProductos();
    mostrarNotificacion("Todos los datos han sido eliminados", "info");
    actualizarCategoriasDashboard();
  }
}

// ========================================
// UTILIDADES
// ========================================

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
    if (notificacion.parentNode) {
      notificacion.remove();
    }
  }, 3000);
}

function comprimirImagen(base64String, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let { width, height } = img;
    const maxSize = 800;
    
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
    
    const imagenComprimida = canvas.toDataURL('image/jpeg', 0.7);
    
    if (imagenComprimida.length > 500000) {
      mostrarNotificacion("La imagen sigue siendo muy grande después de la compresión. Intenta con una imagen más pequeña.", "warning");
      callback("./assets/imagenes/logo.png");
    } else {
      callback(imagenComprimida);
    }
  };
  
  img.onerror = function() {
    mostrarNotificacion("Error al procesar la imagen. Se usará la imagen por defecto.", "warning");
    callback("./assets/imagenes/logo.png");
  };
  
  img.src = base64String;
}

function mostrarSeccion(id) {
  const secciones = document.querySelectorAll('.seccion-admin');
  secciones.forEach(seccion => seccion.classList.add('d-none'));
  document.getElementById(id).classList.remove('d-none');
}

// ========================================
// SISTEMA DE CATEGORÍAS
// ========================================

function inicializarSistemaCategorias() {
  const categoriaInput = document.getElementById('categoriaInput');
  const agregarBtn = document.getElementById('agregarCategoria');

  if (categoriaInput) {
    categoriaInput.addEventListener('keypress', function(e) {
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
    imagenArchivo.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (imagenUrl) {
    imagenUrl.addEventListener('input', function(e) {
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
      ${categoria}
      <span class="remove-tag" onclick="eliminarCategoria('${categoria}')">&times;</span>
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
        if (categoria && typeof categoria === 'string') {
          categoriasUnicas.add(categoria.trim());
        }
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

  if (buscarInput) {
    buscarInput.addEventListener('input', filtrarProductos);
  }
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', filtrarProductos);
  }
  if (ordenarPor) {
    ordenarPor.addEventListener('change', filtrarProductos);
  }
}

function filtrarProductos() {
  const busqueda = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
  const categoria = document.getElementById('filtroCategoria')?.value || '';
  const orden = document.getElementById('ordenarPor')?.value || '';

  let productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda) ||
                             producto.descripcion.toLowerCase().includes(busqueda) ||
                             producto.codigo.toLowerCase().includes(busqueda);
    
    const coincideCategoria = !categoria || producto.categorias.includes(categoria);
    
    return coincideBusqueda && coincideCategoria;
  });

  // Ordenar productos
  productosFiltrados.sort((a, b) => {
    switch (orden) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre);
      case 'precio':
        return parseFloat(a.precio) - parseFloat(b.precio);
      case 'stock':
        return parseInt(a.stock) - parseInt(b.stock);
      case 'fecha':
        return b.id - a.id;
      default:
        return 0;
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
    const col = document.createElement("div");
    col.className = "col-lg-6 col-xl-4 mb-4";
    
    const imagenHtml = producto.imagen ? 
      `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image" onerror="this.onerror=null; this.src='./assets/imagenes/logo.png';">` : 
      `<div class="product-image d-flex align-items-center justify-content-center bg-light">
         <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
       </div>`;

    const categoriasHtml = producto.categorias && producto.categorias.length > 0 ? 
      producto.categorias.map(cat => `<span class="category-tag-small">${cat}</span>`).join('') : 
      '<span class="category-tag-small">Sin categoría</span>';

    const fecha = producto.fechaCreacion ? 
      new Date(producto.fechaCreacion).toLocaleDateString() : 
      new Date(producto.id).toLocaleDateString();

    const precio = parseFloat(producto.precio) || 0;
    const stock = parseInt(producto.stock) || 0;
    const numCategorias = producto.categorias ? producto.categorias.length : 0;

    col.innerHTML = `
      <div class="product-card ${producto.activo ? '' : 'producto-inactivo'}">
        ${imagenHtml}
        <div class="product-info">
          <h4 class="product-title">${producto.nombre || 'Sin nombre'}</h4>
          <span class="product-code">Código: ${producto.codigo || 'Sin código'}</span>
          
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
          
          ${producto.descripcion ? `<p class="product-description">${producto.descripcion}</p>` : ''}
          
          <div class="product-categories">
            ${categoriasHtml}
          </div>
          
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" onclick="editarProducto(${producto.id})" title="Editar producto">
              <i class="bi bi-pencil-square me-1"></i>Editar
            </button>
            <button class="btn ${producto.activo ? 'btn-success' : 'btn-outline-secondary'} btn-sm" onclick="toggleEstadoProducto(${producto.id})" title="${producto.activo ? 'Desactivar' : 'Activar'} producto">
              <i class="bi ${producto.activo ? 'bi-check-circle' : 'bi-x-circle'} me-1"></i>${producto.activo ? 'Activo' : 'Inactivo'}
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto(${producto.id})" title="Eliminar producto">
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
// CONTADORES Y ESTADÍSTICAS
// ========================================

function actualizarContadores() {
  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => p.activo).length;
  
  if (document.getElementById("totalProductos")) {
    document.getElementById("totalProductos").textContent = totalProductos;
  }
  
  if (document.getElementById("totalProductosForm")) {
    document.getElementById("totalProductosForm").textContent = totalProductos;
  }
  
  if (document.getElementById("productosActivos")) {
    document.getElementById("productosActivos").textContent = productosActivos;
  }
  
  verificarUsoLocalStorage();
}

function verificarUsoLocalStorage() {
  try {
    const datosActuales = JSON.stringify(productos);
    const tamanoBytes = new Blob([datosActuales]).size;
    const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(2);
    
    if (tamanoMB > 4) {
      mostrarNotificacion(`Almacenamiento: ${tamanoMB}MB usado. Considera eliminar productos antiguos.`, "warning");
    }
    
    if (tamanoMB > 4.5) {
      mostrarNotificacion("¡Almacenamiento crítico! Elimina productos o usa imágenes más pequeñas.", "danger");
    }
  } catch (error) {
    console.warn("Error al verificar uso del localStorage:", error);
  }
}

// ========================================
// SIDEBAR Y PERFIL
// ========================================

function inicializarSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      toggleBtn.innerHTML = sidebar.classList.contains("collapsed") ? ">" : "<";
    });
  }

  // Inicializar funcionalidades del perfil
  inicializarPerfil();
}

function inicializarPerfil() {
  const nombreSidebar = document.querySelector(".profile h3");
  const fotoSidebar = document.querySelector(".profile img");
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputCorreo = document.getElementById("inputCorreo");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");

  let adminData = JSON.parse(localStorage.getItem("admin")) || {};

  // 🔹 Cargar datos al abrir
  inputNombre.value = adminData.nombre || "Admin";
  inputCorreo.value = adminData.correo || "admin@moodbox.com";
  fotoPerfil.src = adminData.foto || "./assets/imagenes/user.png";
  if (nombreSidebar) nombreSidebar.textContent = adminData.nombre || "Admin";
  if (fotoSidebar) fotoSidebar.src = adminData.foto || "./assets/imagenes/user.png";

guardarBtn.addEventListener("click", function () {
  const nuevoNombre = inputNombre?.value || '';
  const nuevoCorreo = inputCorreo?.value || '';
  const nuevaPassword = inputPassword?.value || '';
  const nuevaFoto = inputFoto?.files[0];

  // Actualizar datos del admin en localStorage
  let adminData = JSON.parse(localStorage.getItem("admin")) || {};
  adminData.nombre = nuevoNombre;
  adminData.correo = nuevoCorreo;
  if (nuevaPassword.trim() !== "") {
    adminData.password = nuevaPassword;
  }

  // Si cambia la foto
  if (nuevaFoto) {
    const lector = new FileReader();
    lector.onload = function (e) {
      adminData.foto = e.target.result;
      fotoPerfil.src = e.target.result;
      fotoSidebar.src = e.target.result;

      localStorage.setItem("admin", JSON.stringify(adminData));

      // 🔹 Refrescar nav inmediatamente
      actualizarNavAdmin(adminData);
    };
    lector.readAsDataURL(nuevaFoto);
  } else {
    localStorage.setItem("admin", JSON.stringify(adminData));

    // 🔹 Refrescar nav inmediatamente
    actualizarNavAdmin(adminData);
  }

  // Sidebar nombre
  if (nombreSidebar) {
    nombreSidebar.textContent = nuevoNombre;
  }

  console.log("Perfil actualizado:", adminData);

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
  if (modal) modal.hide();
});
}
function actualizarNavAdmin(adminData) {
  const navFotoPerfil = document.getElementById("navFotoPerfil");
  const perfilOpciones = document.getElementById("perfilOpciones");

  if (navFotoPerfil) {
    navFotoPerfil.src = adminData.foto || "./assets/imagenes/user.png";
  }

  if (perfilOpciones) {
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${adminData.nombre}</span></li>
      <li><a class="dropdown-item" href="adminview.html">Vista Administrador</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    document.getElementById("cerrarSesion").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("adminActivo", "false");
      localStorage.setItem("usuarioActivo", "false");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });
  }
}
