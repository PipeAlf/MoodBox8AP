document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById("formulario-contacto");

    if (!formulario) return;
 
    const mensajeDiv = document.getElementById("mensaje-confirmacion");

    const contadorCaracteres = document.getElementById("contador-caracteres");

    const progresoBar = document.getElementById("progreso-formulario");

    const submitBtn = formulario.querySelector('button[type="submit"]');

    const spinner = submitBtn?.querySelector('.spinner-border');
 
    // Buscar elementos dentro del form (más seguro)

    const mensajeTextarea = formulario.querySelector('#mensaje');

    const nameInput = formulario.querySelector('#nombre');

    const mailInput = formulario.querySelector('#correo');

    const phoneInput = formulario.querySelector('#telefono');
 
    const max = mensajeTextarea?.maxLength || 800;
 
    // Función robusta de progreso

    function actualizarProgreso() {

        if (!progresoBar) return;
 
        // solo controles "relevantes" (excluye botones/hidden)

        const camposTodos = formulario.querySelectorAll(

            'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]), select, textarea'

        );
 
        // preferimos contar sólo los required (si existen)

        const requeridos = Array.from(camposTodos).filter(c => c.hasAttribute('required'));

        const listaParaEvaluar = requeridos.length ? requeridos : Array.from(camposTodos);
 
        if (listaParaEvaluar.length === 0) {

            progresoBar.style.width = '0%';

            return;

        }
 
        let completos = 0;

        listaParaEvaluar.forEach(campo => {

            if (campo.type === 'checkbox') {

                if (campo.checked) completos++;

            } else if (campo.value && campo.value.toString().trim() !== '') {

                completos++;

            }

        });
 
        const progreso = (completos / listaParaEvaluar.length) * 100;

        progresoBar.style.width = progreso + '%';

    }
 
    // Escuchar cambios a nivel form (captura todos los inputs/selects/textarea)

    formulario.addEventListener('input', actualizarProgreso);

    formulario.addEventListener('change', actualizarProgreso);
 
    // textarea: contador de caracteres + filtrado de caracteres no permitidos

    if (mensajeTextarea) {

        mensajeTextarea.addEventListener('input', function () {

            // Si quieres permitir más caracteres, ajusta la regex

            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
 
            const caracteresActuales = this.value.length;

            if (contadorCaracteres) contadorCaracteres.textContent = caracteresActuales;
 
            if (contadorCaracteres) {

                if (caracteresActuales > max) {

                    contadorCaracteres.style.color = '#ff6b6b';

                } else if (caracteresActuales > max * 0.625) {

                    contadorCaracteres.style.color = '#ffd93d';

                } else {

                    contadorCaracteres.style.color = '#6bcf7f';

                }

            }
 
            // actualizar progreso cuando se escribe en el textarea

            actualizarProgreso();

        });

    }
 
    // submit: validación + spinner (no hacer prevent si válido)

    formulario.addEventListener('submit', function (event) {

        if (!formulario.checkValidity()) {

            event.preventDefault();

            event.stopPropagation();

        } else {

            // aquí puedes poner la lógica de envío (fetch / email API)

            spinner?.classList.remove('d-none');

            if (submitBtn) submitBtn.disabled = true;

        }
 
        formulario.classList.add('was-validated');

    });
 
    // reset: esperar al ciclo para que el navegador limpie los campos

    formulario.addEventListener('reset', function () {

        this.classList.remove('was-validated');

        setTimeout(() => {

            if (contadorCaracteres) {

                contadorCaracteres.textContent = '0';

                contadorCaracteres.style.color = '#6bcf7f';

            }

            actualizarProgreso();

        }, 0);

    });
 
    // Validaciones puntuales (solo si existen los inputs)

    if (nameInput) {

        nameInput.addEventListener("input", function () {

            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');

            if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}$/.test(this.value)) {

                this.classList.add("is-valid");

                this.classList.remove("is-invalid");

            } else {

                this.classList.add("is-invalid");

                this.classList.remove("is-valid");

            }

        });

    }
 
    if (phoneInput) {

        phoneInput.addEventListener("input", function () {

            this.value = this.value.replace(/\D/g, '');

            if (/^\d{7,15}$/.test(this.value)) {

                this.classList.add("is-valid");

                this.classList.remove("is-invalid");

            } else {

                this.classList.add("is-invalid");

                this.classList.remove("is-valid");

            }

        });

    }
 
    if (mailInput) {

        mailInput.addEventListener("input", function () {

            const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

            if (regex.test(this.value)) {

                this.classList.add("is-valid");

                this.classList.remove("is-invalid");

            } else {

                this.classList.add("is-invalid");

                this.classList.remove("is-valid");

            }

        });

    }
 
    // tooltips bootstrap (si los usas)

    [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))

        .map(el => new bootstrap.Tooltip(el));
 
    // estado inicial

    actualizarProgreso();

});

 