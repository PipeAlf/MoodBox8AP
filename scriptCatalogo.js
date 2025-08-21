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