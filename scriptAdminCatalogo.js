let productos = JSON.parse(localStorage.getItem("productos")) || [];
let editando = false;
let productoEditandoId = null;
let categoriasSeleccionadas = [];

const form = document.getElementById("formProducto");

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-seccion]').forEach(btn => {
    btn.addEventListener("click", () => mostrarSeccion(btn.dataset.seccion));
  });

  // Inicializar datos de ejemplo si no hay productos
  if (productos.length === 0) {
    inicializarDatosEjemplo();
  }

  inicializarSistemaCategorias();
  inicializarDashboard();
  renderizarProductos();
  actualizarContadores();
});

function inicializarDatosEjemplo() {
  const productosEjemplo = [
    {
      id: Date.now() - 1000,
      nombre: "Camiseta MoodBox",
      precio: 25.99,
      descripcion: "Camiseta de algodón con diseño exclusivo de MoodBox",
      stock: 50,
      codigo: "CM001",
      categorias: ["Ropa", "Algodón"],
      imagen: "./assets/imagenes_catalogo/camiseta.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 1000).toISOString(),
      fechaModificacion: new Date(Date.now() - 1000).toISOString()
    },
    {
      id: Date.now() - 2000,
      nombre: "Mug Personalizado",
      precio: 15.50,
      descripcion: "Taza de cerámica con logo de MoodBox",
      stock: 30,
      codigo: "MG001",
      categorias: ["Hogar", "Cerámica"],
      imagen: "./assets/imagenes_catalogo/mug.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 2000).toISOString(),
      fechaModificacion: new Date(Date.now() - 2000).toISOString()
    },
    {
      id: Date.now() - 3000,
      nombre: "Llavero LED",
      precio: 8.99,
      descripcion: "Llavero con luz LED y diseño de MoodBox",
      stock: 100,
      codigo: "LL001",
      categorias: ["Accesorios", "Electrónica"],
      imagen: "./assets/imagenes_catalogo/llavero.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 3000).toISOString(),
      fechaModificacion: new Date(Date.now() - 3000).toISOString()
    },
    {
      id: Date.now() - 4000,
      nombre: "Bolsa Hogwarts",
      precio: 6.99,
      descripcion: "Bolsa de tela con tematica de Harry Potter y su escuela Hogwarts",
      stock: 100,
      codigo: "BH001",
      categorias: ["Accesorios", "Hogar"],
      imagen: "./assets/imagenes_catalogo/bolsa.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 4000).toISOString(),
      fechaModificacion: new Date(Date.now() - 4000).toISOString()
    },
    {
      id: Date.now() - 5000,
      nombre: "Botilito día de la madre",
      precio: 10.99,
      descripcion: "Botilito para frio/caliente con diseño para el día de la madre y capacidad de 300mL",
      stock: 100,
      codigo: "BM001",
      categorias: ["Accesorios", "Hogar"],
      imagen: "./assets/imagenes_catalogo/botilito.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 5000).toISOString(),
      fechaModificacion: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: Date.now() - 6000,
      nombre: "Cojin Minecraft",
      precio: 7.99,
      descripcion: "Cojín de sofá con diseño de Minecraft",
      stock: 100,
      codigo: "CM001",
      categorias: ["Accesorios", "Hogar", "Anime"],
      imagen: "./assets/imagenes_catalogo/cojin.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 6000).toISOString(),
      fechaModificacion: new Date(Date.now() - 6000).toISOString()
    },
    {
      id: Date.now() - 7000,
      nombre: "Case de celular para papá",
      precio: 4.99,
      descripcion: "Case protector de celular Iphone 15 con mensaje para papá",
      stock: 100,
      codigo: "CP001",
      categorias: ["Accesorios", "Hogar"],
      imagen: "./assets/imagenes_catalogo/fundacel.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 7000).toISOString(),
      fechaModificacion: new Date(Date.now() - 7000).toISOString()
    },
    {
      id: Date.now() - 8000,
      nombre: "Gorra de dragón",
      precio: 5.99,
      descripcion: "Gorra negra con estampado de dragón rojo",
      stock: 100,
      codigo: "GD001",
      categorias: ["Accesorios", "Hogar", "Ropa"],
      imagen: "./assets/imagenes_catalogo/gorra.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 8000).toISOString(),
      fechaModificacion: new Date(Date.now() - 8000).toISOString()
    },
    {
      id: Date.now() - 9000,
      nombre: "Morral Superman",
      precio: 15.99,
      descripcion: "Morral negro con logo de Superman",
      stock: 100,
      codigo: "MS001",
      categorias: ["Accesorios", "Ropa"],
      imagen: "./assets/imagenes_catalogo/morral.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 9000).toISOString(),
      fechaModificacion: new Date(Date.now() - 9000).toISOString()
    }
    ,
    {
      id: Date.now() - 10000,
      nombre: "PADMouse de Rick & Morty",
      precio: 3.99,
      descripcion: "PADMouse con estampado de Rick & Morty en un portal",
      stock: 100,
      codigo: "PM001",
      categorias: ["Accesorios", "Anime"],
      imagen: "./assets/imagenes_catalogo/padmouse.png",
      activo: true,
      fechaCreacion: new Date(Date.now() - 10000).toISOString(),
      fechaModificacion: new Date(Date.now() - 10000).toISOString()
    }
  ];
  
  productos.push(...productosEjemplo);
  localStorage.setItem("productos", JSON.stringify(productos));
}

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
  
  let imagen = imagenUrl;
  
  if (imagenArchivo) {
    // Comprobar el tamaño del archivo (máximo 5MB)
    if (imagenArchivo.size > 5 * 1024 * 1024) {
      mostrarNotificacion("La imagen es demasiado grande. Máximo 5MB permitido.", "danger");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function () {
      // Comprimir la imagen antes de guardar
      comprimirImagen(reader.result, (imagenComprimida) => {
        imagen = imagenComprimida;
        guardarProducto();
      });
    };
    reader.readAsDataURL(imagenArchivo);
  } else if (!imagenUrl) {
    // Si no hay imagen de archivo ni URL, usar imagen por defecto
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
        console.log("Producto agregado:", nuevoProducto);
      }

      // Intentar guardar en localStorage
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
      
      // Actualizar contadores y dashboard
      actualizarContadores();
      mostrarSeccion('dashboard');
      renderizarProductos();
      
      // Limpiar vista previa de imagen
      document.getElementById("imagePreview").innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Si el localStorage está lleno, intentar limpiar productos antiguos
        if (productos.length > 10) {
          const productosAntiguos = productos.slice(0, Math.floor(productos.length / 2));
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

function renderizarProductos() {
  const contenedor = document.getElementById("listaProductos");
  const emptyState = document.getElementById("emptyState");
  
  if (!contenedor) return;
  
  // Actualizar contador de productos
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

    // Asegurar que precio sea un número
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

function eliminarProducto(id) {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem("productos", JSON.stringify(productos));
    renderizarProductos();
  }
}

function toggleEstadoProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  
  producto.activo = !producto.activo;
  localStorage.setItem("productos", JSON.stringify(productos));
  renderizarProductos();
  
  // Mostrar notificación
  const mensaje = producto.activo ? 
    `Producto "${producto.nombre}" activado exitosamente` : 
    `Producto "${producto.nombre}" desactivado exitosamente`;
  
  mostrarNotificacion(mensaje, producto.activo ? 'success' : 'warning');
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear notificación temporal
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notificacion.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notificacion);
  
  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.remove();
    }
  }, 3000);
}

function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    mostrarNotificacion("Producto no encontrado", "danger");
    return;
  }

  // Llenar formulario con datos del producto
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
  
  // Scroll hacia arriba del formulario
  document.getElementById("agregar").scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
  editando = false;
  productoEditandoId = null;
  
  // Limpiar formulario
  form.reset();
  categoriasSeleccionadas = [];
  renderizarCategorias();
  
  // Resetear botón
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Producto';
  
  // Ocultar botón de cancelar
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) btnCancelar.style.display = 'none';
  
  // Limpiar vista previa
  document.getElementById("imagePreview").innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
  
  mostrarSeccion('dashboard');
}

function limpiarDatos() {
  if (confirm("¿Estás seguro de que quieres eliminar todos los productos? Esta acción no se puede deshacer.")) {
    productos = [];
    localStorage.removeItem("productos");
    renderizarProductos();
    mostrarNotificacion("Todos los datos han sido eliminados", "info");
  }
}

function comprimirImagen(base64String, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calcular nuevas dimensiones (máximo 800x800)
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
    
    // Dibujar imagen redimensionada
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convertir a base64 con calidad reducida
    const imagenComprimida = canvas.toDataURL('image/jpeg', 0.7);
    
    // Verificar tamaño después de compresión
    if (imagenComprimida.length > 500000) { // Máximo 500KB
      mostrarNotificacion("La imagen sigue siendo muy grande después de la compresión. Intenta con una imagen más pequeña.", "warning");
      callback("./assets/imagenes/logo.png"); // Usar imagen por defecto
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

// Sistema de categorías con tags
function inicializarSistemaCategorias() {
  const categoriaInput = document.getElementById('categoriaInput');
  const agregarBtn = document.getElementById('agregarCategoria');

  // Agregar categoría con Enter
  categoriaInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarCategoria();
    }
  });

  // Agregar categoría con botón
  agregarBtn.addEventListener('click', agregarCategoria);

  // Vista previa de imagen
  inicializarVistaPreviaImagen();
}

function inicializarVistaPreviaImagen() {
  const imagenArchivo = document.getElementById('imagenArchivo');
  const imagenUrl = document.getElementById('imagenUrl');
  const imagePreview = document.getElementById('imagePreview');

  // Vista previa desde archivo
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

  // Vista previa desde URL
  imagenUrl.addEventListener('input', function(e) {
    const url = e.target.value.trim();
    if (url) {
      imagePreview.innerHTML = `<img src="${url}" alt="Vista previa" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-image text-muted\\'></i><p class=\\'text-muted\\'>Error al cargar imagen</p>'">`;
    } else {
      imagePreview.innerHTML = '<i class="bi bi-image text-muted"></i><p class="text-muted">Vista previa de imagen</p>';
    }
  });
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

// Funcionalidades del Dashboard
function inicializarDashboard() {
  const buscarInput = document.getElementById('buscarProducto');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const ordenarPor = document.getElementById('ordenarPor');

  // Búsqueda en tiempo real
  buscarInput.addEventListener('input', filtrarProductos);
  filtroCategoria.addEventListener('change', filtrarProductos);
  ordenarPor.addEventListener('change', filtrarProductos);
}

function filtrarProductos() {
  const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;
  const orden = document.getElementById('ordenarPor').value;

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

    // Asegurar que precio sea un número
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

function actualizarContadores() {
  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => p.activo).length;
  
  // Actualizar contador en dashboard
  if (document.getElementById("totalProductos")) {
    document.getElementById("totalProductos").textContent = totalProductos;
  }
  
  // Actualizar contador en formulario
  if (document.getElementById("totalProductosForm")) {
    document.getElementById("totalProductosForm").textContent = totalProductos;
  }
  
  // Actualizar contador de productos activos si existe
  if (document.getElementById("productosActivos")) {
    document.getElementById("productosActivos").textContent = productosActivos;
  }
  
  // Verificar uso del localStorage
  verificarUsoLocalStorage();
}

function verificarUsoLocalStorage() {
  try {
    const datosActuales = JSON.stringify(productos);
    const tamanoBytes = new Blob([datosActuales]).size;
    const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(2);
    
    // Si el tamaño es mayor a 4MB, mostrar advertencia
    if (tamanoMB > 4) {
      mostrarNotificacion(`Almacenamiento: ${tamanoMB}MB usado. Considera eliminar productos antiguos.`, "warning");
    }
    
    // Si es mayor a 4.5MB, mostrar error crítico
    if (tamanoMB > 4.5) {
      mostrarNotificacion("¡Almacenamiento crítico! Elimina productos o usa imágenes más pequeñas.", "danger");
    }
  } catch (error) {
    console.warn("Error al verificar uso del localStorage:", error);
  }
}


// ASIDE

const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleBtn");
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      toggleBtn.innerHTML = sidebar.classList.contains("collapsed") ? ">" : "<";
    });




document.addEventListener("DOMContentLoaded", function () {
  // Referencias a elementos
  const nombreSidebar = document.querySelector(".profile h3");
  const fotoSidebar = document.querySelector(".profile img");
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputCorreo = document.getElementById("inputCorreo");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");
 
  // 🔹 Cargar datos guardados del localStorage al abrir la página
  if (localStorage.getItem("nombre")) {
    inputNombre.value = localStorage.getItem("nombre");
    nombreSidebar.textContent = localStorage.getItem("nombre");
  }
  if (localStorage.getItem("correo")) {
    inputCorreo.value = localStorage.getItem("correo");
  }
  if (localStorage.getItem("foto")) {
    fotoPerfil.src = localStorage.getItem("foto");
    fotoSidebar.src = localStorage.getItem("foto");
  }
 
  // Evento guardar cambios
  guardarBtn.addEventListener("click", function () {
    const nuevoNombre = inputNombre.value;
    const nuevoCorreo = inputCorreo.value;
    const nuevaPassword = inputPassword.value;
    const nuevaFoto = inputFoto.files[0];
 
    // Cambiar nombre en el sidebar
    nombreSidebar.textContent = nuevoNombre;
 
    // Guardar en localStorage
    localStorage.setItem("nombre", nuevoNombre);
    localStorage.setItem("correo", nuevoCorreo);
    if (nuevaPassword.trim() !== "") {
      localStorage.setItem("password", nuevaPassword); 
    }
 
    // Guardar foto si se subió
    if (nuevaFoto) {
      const lector = new FileReader();
      lector.onload = function (e) {
        fotoPerfil.src = e.target.result;
        fotoSidebar.src = e.target.result;
        localStorage.setItem("foto", e.target.result); // Guardar en localStorage
      };
      lector.readAsDataURL(nuevaFoto);
    }
 
    // Mostrar en consola (solo demostración)
    console.log("Correo actualizado:", nuevoCorreo);
    console.log("Contraseña nueva:", nuevaPassword);
 
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
    modal.hide();
  });
});