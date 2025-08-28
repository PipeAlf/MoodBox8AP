document.addEventListener("DOMContentLoaded", () => {
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    const nombre = document.getElementById("nombre");
    const telefono = document.getElementById("telefono");
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // Validadores
    const validators = {
      nombre: (v) => v.trim().length >= 3 || "Debe tener al menos 3 caracteres.",
      telefono: (v) => /^[0-9]{7,15}$/.test(v) || "Debe contener entre 7 y 15 números.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Formato de correo no válido.",
      password: (v) => v.length >= 6 || "La contraseña debe tener mínimo 6 caracteres."
    };

    // Función para validar un campo
    function validarCampo(input) {
      const value = input.value.trim();
      const validacion = validators[input.id](value);

      const errorElement = input.parentElement.querySelector(".error");
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

    // Validar todo al enviar
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
          email: email.value.trim(),
          password: password.value.trim()
        };
        localStorage.setItem("usuario", JSON.stringify(usuario));
        alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
        window.location.href = "login.html";
      }
    });
  }
});