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

    // helper para mostrar mensajes con icono, accesibilidad y auto-dismiss
    let _formMessageTimeout = null;

    function showFormMessage(text, type = 'info', { autoDismiss = 0 } = {}) {
      if (_formMessageTimeout) {
        clearTimeout(_formMessageTimeout);
        _formMessageTimeout = null;
      }

      // preparar contenedor
      loginMessage.textContent = '';
      loginMessage.className = `form-message ${type} show`;
      loginMessage.setAttribute('role', type === 'error' ? 'alert' : 'status');
      loginMessage.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
      loginMessage.tabIndex = -1;

      // icono (Bootstrap Icons)
      const icon = document.createElement('i');
      icon.className = 'bi ' + (type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill');
      icon.setAttribute('aria-hidden', 'true');

      const span = document.createElement('span');
      span.textContent = text;

      loginMessage.appendChild(icon);
      loginMessage.appendChild(span);

      // forzar reflow para animación
      void loginMessage.offsetWidth;

      // auto-dismiss opcional
      if (autoDismiss && typeof autoDismiss === 'number' && autoDismiss > 0) {
        _formMessageTimeout = setTimeout(() => {
          loginMessage.classList.remove('show');
          setTimeout(() => {
            loginMessage.textContent = '';
            loginMessage.className = 'form-message';
          }, 260);
        }, autoDismiss);
      }
    }


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

      // limpiar mensajes previos
      if (_formMessageTimeout) {
        clearTimeout(_formMessageTimeout);
        _formMessageTimeout = null;
      }
      loginMessage.classList.remove('show');
      loginMessage.textContent = '';

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Validación mínima cliente
      if (!email || !password) {
        showFormMessage("Ingresa correo y contraseña.", "error", { autoDismiss: 4000 });
        return;
      }

      try {
        const response = await fetch("https://main.drkoft4my5rgd.amplifyapp.com/api/usuarios/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: email, password })
        });

        // Si no es OK, intentamos diferenciar el error
        if (!response.ok) {
          // intentar parsear respuesta (prefiere JSON con { message } o { error })
          let serverMsg = "";
          try {
            const ct = response.headers.get("Content-Type") || "";
            if (ct.includes("application/json")) {
              const payload = await response.json();
              serverMsg = payload.message || payload.error || payload.msg || "";
            } else {
              const text = await response.text();
              serverMsg = text || "";
            }
          } catch (parseErr) {
            // ignore parse errors
          }

          // Mapear status a mensaje de usuario
          let userMsg = "Credenciales inválidas";
          if (response.status === 401) {
            // 401 común para contraseña incorrecta
            userMsg = serverMsg || "Contraseña incorrecta.";
          } else if (response.status === 404) {
            // 404 si el backend indica que no existe el usuario
            userMsg = serverMsg || "No existe una cuenta con ese correo.";
          } else if (response.status === 400) {
            userMsg = serverMsg || "Datos inválidos.";
          } else if (serverMsg) {
            userMsg = serverMsg; // usar mensaje del servidor si hay uno legible
          }

          showFormMessage(userMsg, "error", { autoDismiss: 6000 });
          return;
        }

        // OK: parsear respuesta y continuar con login
        const data = await response.json(); // { accessToken, usuario }
        const { accessToken, usuario } = data;

        // Guardar en localStorage
        localStorage.setItem("accessToken", accessToken);

        if (usuario.rol === "ADMIN") {
          localStorage.setItem("admin", JSON.stringify(usuario));
          localStorage.setItem("adminActivo", "true");
          localStorage.setItem("usuarioActivo", "false");
        } else {
          localStorage.setItem("usuario", JSON.stringify(usuario));
          localStorage.setItem("usuarioActivo", "true");
          localStorage.setItem("adminActivo", "false");
        }

        // mostrar mensaje de éxito y redirigir
        showFormMessage("Inicio de sesión exitoso. Redirigiendo...", "success", { autoDismiss: 2200 });
        setTimeout(() => {
          window.location.href = usuario.rol === "ADMIN" ? "adminview.html" : "catalogo.html";
        }, 1500);

      } catch (error) {
        console.error(error);
        showFormMessage(error.message || "Error al iniciar sesión", "error", { autoDismiss: 6000 });
      }
    });
  }
});
