// Script principal - Funcionalidades generales del sitio
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script principal cargado');
    
    // Aquí se pueden agregar funcionalidades generales del sitio
    // como navegación, efectos globales, etc.
    
    // Función para actualizar productos en tiempo real (solo si es necesario)
    function actualizarProductos() {
        // Escuchar cambios en el localStorage solo si estamos en una página que lo necesita
        if (document.getElementById("productos-container")) {
            window.addEventListener('storage', function(e) {
                if (e.key === 'productos') {
                    // Recargar la página para mostrar cambios
                    location.reload();
                }
            });
        }
    }
    
    // Inicializar funcionalidades generales
    actualizarProductos();
});

 