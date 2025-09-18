document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    // Placeholders por si no están en el HTML
    if (emailInput)
      emailInput.placeholder =
        emailInput.placeholder || "ej. usuario@correo.com";
    if (passwordInput)
      passwordInput.placeholder = passwordInput.placeholder || "Ej: M1Contra!";

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
        toggleBtn.setAttribute(
          "aria-label",
          type === "text" ? "Ocultar contraseña" : "Mostrar contraseña"
        );
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
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const response = await fetch("http://localhost:8080/api/usuarios/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ correo: email, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json(); // LoginResponse: { accessToken, usuario }

    const { accessToken, usuario } = data;

    // Guardar en localStorage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.setItem("usuarioActivo", "true");
    localStorage.setItem("adminActivo", usuario.rol === "ADMIN");

    loginMessage.textContent = "Inicio de sesión exitoso. Redirigiendo...";
    loginMessage.className = "form-message success";

    // Redirigir según rol
    setTimeout(() => {
      window.location.href = usuario.rol === "ADMIN" ? "adminview.html" : "catalogo.html";
    }, 1500);
    return;
  }
}

      // 🔹 Validación de usuarios registrados usando API REST
      try {
        const response = await fetch("http://localhost:8080/api/usuarios/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            correo: email,
            password: password
          })
        });

        if (response.ok) {
          const loginData = await response.json();
          const { accessToken, usuario } = loginData;

          // Guardar token y datos del usuario
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("usuarioActivo", "true");
          localStorage.setItem("adminActivo", "false");
          localStorage.setItem("usuario", JSON.stringify(usuario));

          loginMessage.textContent = "Inicio de sesión exitoso. Redirigiendo...";
          loginMessage.className = "form-message success";

          setTimeout(() => {
            window.location.href = "catalogo.html";
          }, 1500);
        } else {
          const errorText = await response.text();
          loginMessage.textContent = "Correo o contraseña incorrectos.";
          loginMessage.className = "form-message error";
        }
      } catch (error) {
        console.error("Error en el login:", error);
        loginMessage.textContent = "Error de conexión. Verifica que el servidor esté ejecutándose.";
        loginMessage.className = "form-message error";
      }
    });
  }
});
