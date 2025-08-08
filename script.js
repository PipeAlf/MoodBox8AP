// JS Formulario

document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("formulario-contacto");
    const mensajeDiv = document.getElementById("mensaje-confirmacion");
    const contadorCaracteres = document.getElementById("contador-caracteres");
    const mensajeTextarea = document.getElementById("mensaje");
    const progresoBar = document.getElementById("progreso-formulario");
    const submitBtn = formulario.querySelector('button[type="submit"]');
    const spinner = submitBtn.querySelector('.spinner-border');

    // Contador de caracteres para el mensaje formulario
    mensajeTextarea.addEventListener('input', function() {
        const caracteresActuales = this.value.length;
        contadorCaracteres.textContent = caracteresActuales;
        
        if (caracteresActuales > 800) {
            contadorCaracteres.style.color = '#ff6b6b';
        } else if (caracteresActuales > 500) {
            contadorCaracteres.style.color = '#ffd93d';
        } else {
            contadorCaracteres.style.color = '#6bcf7f';
        }
    });

    // Progreso del formulario
    function actualizarProgreso() {
        const campos = formulario.querySelectorAll('input[required], select[required], textarea[required]');
        let camposCompletos = 0;

        campos.forEach(campo => {
            if (campo.type === 'checkbox') {
                if (campo.checked) camposCompletos++;
            } else if (campo.value.trim() !== '') {
                camposCompletos++;
            }
        });

        const progreso = (camposCompletos / campos.length) * 100;
        progresoBar.style.width = progreso + '%';
    }

    // Escuchar cambios en todos los campos requeridos
    const camposRequeridos = formulario.querySelectorAll('input[required], select[required], textarea[required]');
    camposRequeridos.forEach(campo => {
        campo.addEventListener('input', actualizarProgreso);
        campo.addEventListener('change', actualizarProgreso);
    });

    // Bootstrap Comprobar 
    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        if (formulario.checkValidity()) {
            // Mostrar spinner
            spinner.classList.remove('d-none');
            submitBtn.disabled = true;

            // Simular envío
            setTimeout(() => {
                // Ocultar spinner
                spinner.classList.add('d-none');
                submitBtn.disabled = false;

                // Mostrar mensaje de éxito
                mensajeDiv.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>¡Mensaje enviado exitosamente!</strong> 
                        Gracias por contactarnos. Te responderemos pronto.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                // Limpiar formulario
                formulario.reset();
                actualizarProgreso();
                contadorCaracteres.textContent = '0';
                contadorCaracteres.style.color = '#6bcf7f';

                // Scroll al mensaje
                mensajeDiv.scrollIntoView({ behavior: 'smooth' });
            }, 2000);
        }

        formulario.classList.add('was-validated');
    });

    // Limpiar validación al resetear
    formulario.addEventListener('reset', function() {
        this.classList.remove('was-validated');
        actualizarProgreso();
        contadorCaracteres.textContent = '0';
        contadorCaracteres.style.color = '#6bcf7f';
    });

    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Progreso inicial
    actualizarProgreso();
});
