document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const correoInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginMessage = document.createElement("div");
    loginMessage.className = "form-message";
    loginForm.appendChild(loginMessage);

    // Placeholders por si no están en el HTML
    if (correoInput) correoInput.placeholder = correoInput.placeholder || "Ej: ejemplo@correo.com";
    if (passwordInput) passwordInput.placeholder = passwordInput.placeholder || "Tu contraseña";

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginMessage.textContent = "";

      const correo = correoInput.value.trim();
      const password = passwordInput.value.trim();

      if (!correo || !password) {
        loginMessage.textContent = "Completa todos los campos.";
        loginMessage.className = "form-message error";
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/usuarios/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, password })
        });

        if (response.ok) {
          const usuario = await response.json();
          localStorage.setItem("usuario", JSON.stringify(usuario));
          loginMessage.textContent = "Inicio de sesión exitoso. Redirigiendo...";
          loginMessage.className = "form-message success";
          setTimeout(() => window.location.href = "catalogo.html", 1500);
        } else {
          loginMessage.textContent = "Correo o contraseña incorrectos.";
          loginMessage.className = "form-message error";
        }
      } catch (error) {
        loginMessage.textContent = "Error de conexión con el servidor.";
        loginMessage.className = "form-message error";
      }
    });
  }
});