// Script para el catálogo - Filtra productos activos
document.addEventListener('DOMContentLoaded', function() {
    // Función para cargar productos activos desde el localStorage
    function cargarProductosActivos() {
        const productos = JSON.parse(localStorage.getItem("productos")) || [];
        const productosActivos = productos.filter(producto => producto.activo !== false);
        
        // Si no hay productos activos, mostrar mensaje
        if (productosActivos.length === 0) {
            mostrarMensajeSinProductos();
            return;
        }
        
        // Renderizar productos activos
        renderizarProductosActivos(productosActivos);
    }
    
    // Función para mostrar mensaje cuando no hay productos
    function mostrarMensajeSinProductos() {
        const contenedor = document.getElementById('productos-container');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info" role="alert">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>No hay productos disponibles en este momento.</strong>
                        <br>
                        <small>Vuelve más tarde para ver nuestros productos.</small>
                    </div>
                </div>
            `;
        }
    }
    
    // Función para renderizar productos activos
    function renderizarProductosActivos(productos) {
        const contenedor = document.getElementById('productos-container');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';
        
        productos.forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col';
            
            // Crear la tarjeta del producto
            col.innerHTML = `
                <div class="card h-100 tarjeta-borde position-relative hover-card">
                    <img src="${producto.imagen || './assets/imagenes_catalogo/cajita.png'}" class="card-img-top" alt="${producto.nombre}">
                    <div class="card-body">
                        <h5 class="card-titulo text-start">${producto.nombre}</h5>
                        <p class="card-texto text-start">${producto.descripcion || 'Descripción no disponible'}</p>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <div class="card-footer bg-white border-0">
                            ★ 4.5
                        </div>
                    </div>
                    <div class="hover-info p-3 rounded shadow">
                        <img src="${producto.imagen || './assets/imagenes_catalogo/cajita.png'}" class="img-fluid rounded mb-2" alt="Preview">
                        <h6 class="text-start">${producto.nombre}</h6>
                        <p id="precio">$${parseFloat(producto.precio).toLocaleString()}</p>
                        <button class="btn btn-sm btn-custom add-to-cart" 
                                data-name="${producto.nombre}" 
                                data-price="${producto.precio}" 
                                data-image="${producto.imagen || './assets/imagenes_catalogo/cajita.png'}">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `;
            
            contenedor.appendChild(col);
        });
        
        // Agregar funcionalidad de carrito si existe
        inicializarCarrito();
    }
    
    // Función para inicializar funcionalidad del carrito
    function inicializarCarrito() {
        const botonesCarrito = document.querySelectorAll('.add-to-cart');
        
        botonesCarrito.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.preventDefault();
                
                const nombre = this.getAttribute('data-name');
                const precio = this.getAttribute('data-price');
                const imagen = this.getAttribute('data-image');
                
                // Agregar al carrito (localStorage)
                agregarAlCarrito(nombre, precio, imagen);
                
                // Mostrar notificación
                mostrarNotificacionAgregado(nombre);
            });
        });
    }
    
    // Función para agregar producto al carrito
    function agregarAlCarrito(nombre, precio, imagen) {
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        
        // Verificar si el producto ya está en el carrito
        const productoExistente = carrito.find(item => item.nombre === nombre);
        
        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            carrito.push({
                nombre: nombre,
                precio: parseFloat(precio),
                imagen: imagen,
                cantidad: 1
            });
        }
        
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }
    
    // Función para mostrar notificación de producto agregado
    function mostrarNotificacionAgregado(nombre) {
        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notificacion.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            <strong>¡Producto agregado!</strong><br>
            ${nombre} se agregó al carrito
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
    
    // Función para actualizar productos en tiempo real
    function actualizarProductos() {
        // Escuchar cambios en el localStorage
        window.addEventListener('storage', function(e) {
            if (e.key === 'productos') {
                cargarProductosActivos();
            }
        });
    }
    
    // Inicializar
    cargarProductosActivos();
    actualizarProductos();
    
    // Actualizar cada 5 segundos para cambios locales
    if (document.getElementById("listaProductos")) {
  setInterval(cargarProductosActivos, 5000);
}
});

 