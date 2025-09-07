document.addEventListener("DOMContentLoaded", () => {
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    const nombre = document.getElementById("nombre");
    const telefono = document.getElementById("telefono");
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // Mensaje general de formulario
    const registerMessage = document.createElement("div");
    registerMessage.className = "form-message";
    registroForm.appendChild(registerMessage);

    // Placeholders (por si no están en el HTML)
    if (nombre) nombre.placeholder = nombre.placeholder || "Ej: Ana Gómez";
    if (telefono) telefono.placeholder = telefono.placeholder || "Ej: 3123456789";
    if (email) email.placeholder = email.placeholder || "Ej: ejemplo@correo.com";
    if (password) password.placeholder = password.placeholder || "Mínimo 6 caracteres (ej: S3gura!)";

    // Toggle password (ojito)
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
      telefono: (v) => /^[0-9]{7,15}$/.test(v) || "Debe contener entre 7 y 15 números.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Formato de correo no válido.",
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
    [nombre, telefono, email, password].forEach((input) => {
      input.addEventListener("input", () => validarCampo(input));
    });

    // Enviar formulario
    registroForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const validNombre = validarCampo(nombre);
      const validTel = validarCampo(telefono);
      const validEmail = validarCampo(email);
      const validPass = validarCampo(password);

      if (validNombre && validTel && validEmail && validPass) {
        const usuario = {
          nombre: nombre.value.trim(),
          telefono: telefono.value.trim(),
          correo: email.value.trim(), // 👈 usamos "correo"
          password: password.value.trim()
        };

        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

        // Verificar duplicado
        const existe = usuarios.some(
          (u) => (u.correo || u.email) === usuario.correo
        );
        if (existe) {
          registerMessage.textContent = "Este correo ya está registrado. Inicia sesión o usa otro.";
          registerMessage.className = "form-message error";
          return;
        }

        // Guardar usuario
        usuarios.push(usuario);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        localStorage.setItem("usuario", JSON.stringify(usuario));

        registerMessage.textContent = "Registro exitoso. Redirigiendo a inicio de sesión...";
        registerMessage.className = "form-message success";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        registerMessage.textContent = "Corrige los errores antes de continuar.";
        registerMessage.className = "form-message error";
      }
    });
  }
});
