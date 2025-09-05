document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    // Placeholders (por si no están en el HTML)
    if (emailInput) emailInput.placeholder = emailInput.placeholder || "ej. usuario@correo.com";
    if (passwordInput) passwordInput.placeholder = passwordInput.placeholder || "Ej: M1Contra!";

    // Crear mensajes de error dinámicos
    const emailError = document.createElement("small");
    emailError.className = "error-text";
    emailInput.insertAdjacentElement("afterend", emailError);

    const loginMessage = document.createElement("div");
    loginMessage.className = "form-message";
    loginForm.appendChild(loginMessage);

    // Toggle password (ojito)
    const toggleBtn = loginForm.querySelector(".toggle-password");
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener("click", () => {
        const type = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = type;
        const icon = toggleBtn.querySelector("i");
        if (icon) {
          icon.classList.toggle("bi-eye");
          icon.classList.toggle("bi-eye-slash");
        }
        toggleBtn.setAttribute("aria-label", type === "text" ? "Ocultar contraseña" : "Mostrar contraseña");
      });
    }

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

      // Recuperar usuario del localStorage
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (!usuario) {
        loginMessage.textContent = "No hay usuarios registrados. Regístrate primero.";
        loginMessage.className = "form-message error";
        return;
      }

      if (usuario.email === email && usuario.password === password) {
        // Guardar estado de sesión
        localStorage.setItem("usuarioActivo", "true");

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
