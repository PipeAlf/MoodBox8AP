document.addEventListener("DOMContentLoaded", () => {
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    const nombre = document.getElementById("nombre");
    const apellido = document.getElementById("apellido");
    const telefono = document.getElementById("telefono");
    const correo = document.getElementById("correo");
    const password = document.getElementById("password");

    // Mensaje general de formulario
    const registerMessage = document.createElement("div");
    registerMessage.className = "form-message";
    registroForm.appendChild(registerMessage);

    // helper para mostrar mensajes con icono, accesibilidad y auto-dismiss
    let _formMessageTimeout = null;

    function showFormMessage(text, type = 'info', { autoDismiss = 0 } = {}) {
      // limpiar timeout previo
      if (_formMessageTimeout) {
        clearTimeout(_formMessageTimeout);
        _formMessageTimeout = null;
      }

      // limpiar y preparar
      registerMessage.textContent = '';             // vacía contenido anterior
      registerMessage.className = `form-message ${type} show`;
      registerMessage.setAttribute('role', type === 'error' ? 'alert' : 'status');
      registerMessage.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
      registerMessage.tabIndex = -1;                 // accesible para screenreaders si se necesita foco

      // icono accesible (usa Bootstrap Icons "bi" que ya usas)
      const icon = document.createElement('i');
      icon.className = 'bi ' + (type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill');
      icon.setAttribute('aria-hidden', 'true');

      const span = document.createElement('span');
      span.textContent = text;                       // usar textContent evita XSS

      registerMessage.appendChild(icon);
      registerMessage.appendChild(span);

      // Forzar reflow para que la animación funcione cuando se reaplique
      void registerMessage.offsetWidth;

      // si piden autoDismiss, lo manejamos
      if (autoDismiss && typeof autoDismiss === 'number' && autoDismiss > 0) {
        _formMessageTimeout = setTimeout(() => {
          registerMessage.classList.remove('show');
          // limpiar contenido después de la transición
          setTimeout(() => {
            registerMessage.textContent = '';
          }, 260);
        }, autoDismiss);
      }
    }


    // Placeholders
    if (nombre) nombre.placeholder = nombre.placeholder || "Ej: Ana";
    if (apellido) apellido.placeholder = apellido.placeholder || "Ej: Pérez";
    if (telefono) telefono.placeholder = telefono.placeholder || "Ej: 3123456789";
    if (correo) correo.placeholder = correo.placeholder || "Ej: ejemplo@correo.com";
    if (password) password.placeholder = password.placeholder || "Mínimo 6 caracteres (ej: S3gura!)";

    // Toggle password
    const toggleBtn = registroForm.querySelector(".toggle-password");
    if (toggleBtn && password) {
      toggleBtn.addEventListener("click", () => {
        const type = password.type === "password" ? "text" : "password";
        password.type = type;
        const icon = toggleBtn.querySelector("i");
        if (icon) {
          icon.classList.toggle("bi-eye");
          icon.classList.toggle("bi-eye-slash");
        }
        toggleBtn.setAttribute("aria-label", type === "text" ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    }

    // Validadores
    const validators = {
      nombre: (v) => v.trim().length >= 3 || "Debe tener al menos 3 caracteres.",
      apellido: (v) => v.trim().length >= 3 || "Debe tener al menos 3 caracteres.",
      telefono: (v) => /^[0-9]{7,15}$/.test(v) || "Debe contener entre 7 y 15 números.",
      correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Formato de correo no válido.",
      password: (v) => v.length >= 6 || "La contraseña debe tener mínimo 6 caracteres."
    };

    function validarCampo(input) {
      const value = input.value.trim();
      const validacion = validators[input.id](value);
      const errorElement = input.closest(".campo").querySelector(".error");

      if (validacion === true) {
        input.classList.remove("invalid");
        input.classList.add("valid");
        errorElement.textContent = "";
        errorElement.classList.remove("visible");
        return true;
      } else {
        input.classList.remove("valid");
        input.classList.add("invalid");
        errorElement.textContent = validacion;
        errorElement.classList.add("visible");
        return false;
      }
    }

    // Eventos en tiempo real
    [nombre, apellido, telefono, correo, password].forEach((input) => {
      if (input) {
        input.addEventListener("input", () => validarCampo(input));
      }
    });

    // Enviar formulario
    registroForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ocultar mensaje previo (si existe)
      if (_formMessageTimeout) {
        clearTimeout(_formMessageTimeout);
        _formMessageTimeout = null;
      }
      registerMessage.classList.remove('show');
      registerMessage.textContent = '';

      // validaciones
      const validNombre = validarCampo(nombre);
      const validApellido = validarCampo(apellido);
      const validTel = validarCampo(telefono);
      const validcorreo = validarCampo(correo);
      const validPass = validarCampo(password);

      if (validNombre && validApellido && validTel && validcorreo && validPass) {
        const usuario = {
          nombre: nombre.value.trim(),
          apellido: apellido.value.trim(),
          correo: correo.value.trim(),
          telefono: telefono.value.trim(),
          password: password.value.trim(),
          rol: "CLIENTE"
        };

        try {
          const response = await fetch("https://main.drkoft4my5rgd.amplifyapp.com/api/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
          });

          if (response.ok) {
            // éxito: mensaje visible y luego redirecciona
            showFormMessage("  Registro exitoso. Redirigiendo a inicio de sesión...", "success", { autoDismiss: 2200 });
            setTimeout(() => (window.location.href = "login.html"), 1500);
          } else if (response.status === 409) {
            // conflicto (correo ya registrado)
            showFormMessage("  Este correo ya está registrado. Inicia sesión o usa otro.", "error", { autoDismiss: 5000 });
          } else {
            // otros errores: leer texto de respuesta si viene
            const errorText = await response.text();
            const msg = errorText ? `Error en el registro: ${errorText}` : "Error en el registro.";
            showFormMessage(msg, "error", { autoDismiss: 7000 });
          }
        } catch (error) {
          console.error(error);
          showFormMessage("  Hubo un error en el servidor. Intenta más tarde.", "error", { autoDismiss: 6000 });
        }
      } else {
        // validación fallida en cliente
        showFormMessage("  Corrige los errores antes de continuar.", "error", { autoDismiss: 4000 });
      }
    });
  }
});