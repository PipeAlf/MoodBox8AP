  let productos = JSON.parse(localStorage.getItem("productos")) || [];
  let editando = false;
  let productoEditandoId = null;
  let categoriasSeleccionadas = [];

  const form = document.getElementById("formProducto");

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[data-seccion]').forEach(btn => {
      btn.addEventListener("click", () => mostrarSeccion(btn.dataset.seccion));
    });

    inicializarSistemaCategorias();
    inicializarDashboard();
    renderizarProductos();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombreProducto").value;
    const precio = document.getElementById("precioProducto").value;
    const descripcion = document.getElementById("descripcionProducto").value;
    const stock = document.getElementById("stockProducto").value;
    const codigo = document.getElementById("codigoProducto").value;
    const categorias = [...categoriasSeleccionadas];
    const imagenArchivo = document.getElementById("imagenArchivo").files[0];
    const imagenUrl = document.getElementById("imagenUrl").value;
    
    let imagen = imagenUrl;
    
    if (imagenArchivo) {
      const reader = new FileReader();
      reader.onload = function () {
        imagen = reader.result;
        guardarProducto();
      };
      reader.readAsDataURL(imagenArchivo);
    } else {
      guardarProducto();
    }

      function guardarProducto() {
    const nuevoProducto = {
      id: editando ? productoEditandoId : Date.now(),
      nombre,
      precio,
      descripcion,
      stock,
      codigo,
      categorias,
      imagen,
      activo: editando ? productos.find(p => p.id === productoEditandoId)?.activo ?? true : true
    };

      if (editando) {
        const index = productos.findIndex(p => p.id === productoEditandoId);
        productos[index] = nuevoProducto;
        editando = false;
        productoEditandoId = null;
      } else {
        productos.push(nuevoProducto);
      }

      localStorage.setItem("productos", JSON.stringify(productos));
      form.reset();
      categoriasSeleccionadas = [];
      renderizarCategorias();
      mostrarSeccion('dashboard');
      renderizarProductos();
    }
  });

  function renderizarProductos() {
    const contenedor = document.getElementById("listaProductos");
    const emptyState = document.getElementById("emptyState");
    
    // Actualizar contador de productos
    document.getElementById("totalProductos").textContent = productos.length;
    
    if (productos.length === 0) {
      contenedor.innerHTML = '';
      emptyState.classList.remove('d-none');
      return;
    }
    
    emptyState.classList.add('d-none');
    contenedor.innerHTML = '';

    productos.forEach(producto => {
      const col = document.createElement("div");
      col.className = "col-lg-6 col-xl-4";
      
      const imagenHtml = producto.imagen ? 
        `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">` : 
        `<div class="product-image d-flex align-items-center justify-content-center bg-light">
           <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
         </div>`;

      const categoriasHtml = producto.categorias.map(cat => 
        `<span class="category-tag-small">${cat}</span>`
      ).join('');

      col.innerHTML = `
        <div class="product-card ${producto.activo ? '' : 'producto-inactivo'}">
          ${imagenHtml}
          <div class="product-info">
            <h4>${producto.nombre}</h4>
            <span class="product-code">${producto.codigo}</span>
            
            <div class="product-details">
              <div class="product-detail">
                <i class="bi bi-currency-dollar"></i>
                <span>$${producto.precio}</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-box-seam"></i>
                <span>Stock: ${producto.stock}</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-tag"></i>
                <span>${producto.categorias.length} categorías</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-calendar3"></i>
                <span>${new Date(producto.id).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="product-categories">
              ${categoriasHtml}
            </div>
            
            <div class="product-actions">
              <button class="btn btn-primary" onclick="editarProducto(${producto.id})">
                <i class="bi bi-pencil-square me-2"></i>Editar
              </button>
              <button class="btn ${producto.activo ? 'btn-success' : 'btn-outline-secondary'}" onclick="toggleEstadoProducto(${producto.id})">
                <i class="bi ${producto.activo ? 'bi-check-circle' : 'bi-x-circle'} me-2"></i>${producto.activo ? 'Activo' : 'Inactivo'}
              </button>
              <button class="btn btn-outline-danger" onclick="eliminarProducto(${producto.id})">
                <i class="bi bi-trash me-2"></i>Eliminar
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
    if (!producto) return;

    document.getElementById("nombreProducto").value = producto.nombre;
    document.getElementById("precioProducto").value = producto.precio;
    document.getElementById("descripcionProducto").value = producto.descripcion;
    document.getElementById("stockProducto").value = producto.stock;
    document.getElementById("codigoProducto").value = producto.codigo;
    document.getElementById("imagenArchivo").value = "";
    document.getElementById("imagenUrl").value = producto.imagen || "";

    categoriasSeleccionadas = [...producto.categorias];
    renderizarCategorias();

    editando = true;
    productoEditandoId = id;
    mostrarSeccion('agregar');
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
    
    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '';
      emptyState.classList.remove('d-none');
      return;
    }
    
    emptyState.classList.add('d-none');
    contenedor.innerHTML = '';

    productosFiltrados.forEach(producto => {
      const col = document.createElement("div");
      col.className = "col-lg-6 col-xl-4";
      
      const imagenHtml = producto.imagen ? 
        `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">` : 
        `<div class="product-image d-flex align-items-center justify-content-center bg-light">
           <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
         </div>`;

      const categoriasHtml = producto.categorias.map(cat => 
        `<span class="category-tag-small">${cat}</span>`
      ).join('');

      col.innerHTML = `
        <div class="product-card ${producto.activo ? '' : 'producto-inactivo'}">
          ${imagenHtml}
          <div class="product-info">
            <h4>${producto.nombre}</h4>
            <span class="product-code">${producto.codigo}</span>
            
            <div class="product-details">
              <div class="product-detail">
                <i class="bi bi-currency-dollar"></i>
                <span>$${producto.precio}</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-box-seam"></i>
                <span>Stock: ${producto.stock}</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-tag"></i>
                <span>${producto.categorias.length} categorías</span>
              </div>
              <div class="product-detail">
                <i class="bi bi-calendar3"></i>
                <span>${new Date(producto.id).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="product-categories">
              ${categoriasHtml}
            </div>
            
            <div class="product-actions">
              <button class="btn btn-primary" onclick="editarProducto(${producto.id})">
                <i class="bi bi-pencil-square me-2"></i>Editar
              </button>
              <button class="btn ${producto.activo ? 'btn-success' : 'btn-outline-secondary'}" onclick="toggleEstadoProducto(${producto.id})">
                <i class="bi ${producto.activo ? 'bi-check-circle' : 'bi-x-circle'} me-2"></i>${producto.activo ? 'Activo' : 'Inactivo'}
              </button>
              <button class="btn btn-outline-danger" onclick="eliminarProducto(${producto.id})">
                <i class="bi bi-trash me-2"></i>Eliminar
              </button>
            </div>
          </div>
        </div>
      `;
      
      contenedor.appendChild(col);
    });
  }



  // ASIDE

  const sidebar = document.getElementById("sidebar");
      const toggleBtn = document.getElementById("toggleBtn");
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        toggleBtn.innerHTML = sidebar.classList.contains("collapsed") ? ">" : "<";
      });