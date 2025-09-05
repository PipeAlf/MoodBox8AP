document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    // Placeholders por si no están en el HTML
    if (emailInput) emailInput.placeholder = emailInput.placeholder || "ej. usuario@correo.com";
    if (passwordInput) passwordInput.placeholder = passwordInput.placeholder || "Ej: M1Contra!";

    // Crear mensajes de error dinámicos
    const emailError = document.createElement("small");
    emailError.className = "error-text";
    emailInput.insertAdjacentElement("afterend", emailError);

    const loginMessage = document.createElement("div");
    loginMessage.className = "form-message";
    loginForm.appendChild(loginMessage);

    // Validación de correo en vivo
    emailInput.addEventListener("input", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = "Ingresa un correo electrónico válido.";
      } else {
        emailError.textContent = "";
      }
    });

    // --- Validación al enviar ---
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // 🔹 Validación de Admin por defecto
      if (email === "admin@moodbox.com" && password === "admin123") {
        localStorage.setItem("adminActivo", "true");
        localStorage.setItem("usuarioActivo", "false");

        loginMessage.textContent = "Bienvenido administrador. Redirigiendo...";
        loginMessage.className = "form-message success";

        setTimeout(() => {
          window.location.href = "adminview.html";
        }, 1500);
        return;
      }

      // 🔹 Validación de usuarios registrados
      const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

      // Buscar usuario que coincida con correo + contraseña
      const usuario = usuarios.find(
        (u) =>
          (u.correo === email || u.email === email) && // soporte a "correo" y "email"
          u.password === password
      );

      if (usuario) {
        localStorage.setItem("usuarioActivo", "true");
        localStorage.setItem("adminActivo", "false");
        localStorage.setItem("usuario", JSON.stringify(usuario)); // guardamos usuario actual

        loginMessage.textContent = "Inicio de sesión exitoso. Redirigiendo...";
        loginMessage.className = "form-message success";

        setTimeout(() => {
          window.location.href = "catalogo.html";
        }, 1500);
      } else {
        loginMessage.textContent = "Correo o contraseña incorrectos.";
        loginMessage.className = "form-message error";
      }
    });
  }
});