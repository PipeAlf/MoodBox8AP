document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const correoInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const toggleBtn = loginForm.querySelector(".toggle-password");
    const loginMessage = document.createElement("div");
    loginMessage.className = "form-message";
    loginForm.appendChild(loginMessage);

    // Mostrar/ocultar contraseña con el ojito
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
          localStorage.setItem("sesionIniciada", "true"); // Marca sesión activa
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