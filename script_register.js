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
      registerMessage.textContent = "";

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
          const response = await fetch("http://localhost:8080/api/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
          });

          if (response.ok) {
            registerMessage.textContent = "Registro exitoso. Redirigiendo a inicio de sesión...";
            registerMessage.className = "form-message success";
            setTimeout(() => (window.location.href = "login.html"), 1500);
          } else if (response.status === 409) {
            registerMessage.textContent = "Este correo ya está registrado. Inicia sesión o usa otro.";
            registerMessage.className = "form-message error";
          } else {
            const errorText = await response.text();
            registerMessage.textContent = "Error en el registro: " + errorText;
            registerMessage.className = "form-message error";
          }
        } catch (error) {
          console.error(error);
          registerMessage.textContent = "Hubo un error en el servidor. Intenta más tarde.";
          registerMessage.className = "form-message error";
        }
      } else {
        registerMessage.textContent = "Corrige los errores antes de continuar.";
        registerMessage.className = "form-message error";
      }
    });
  }
});