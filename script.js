// Script principal - Funcionalidades generales del sitio
document.addEventListener("DOMContentLoaded", function () {
  console.log("Script principal cargado");

  // Inicializar funcionalidades generales
  inicializarFuncionalidadesGenerales();

  // Función para actualizar productos en tiempo real (solo si es necesario)
  function actualizarProductos() {
    // Escuchar cambios en el localStorage solo si estamos en una página que lo necesita
    if (document.getElementById("productos-container")) {
      window.addEventListener("storage", function (e) {
        if (e.key === "productos") {
          // Recargar la página para mostrar cambios
          location.reload();
        }
      });
    }
  }

  // Inicializar funcionalidades generales
  function inicializarFuncionalidadesGenerales() {
    // Verificar si config.js está disponible
    if (typeof window.MoodBoxConfig !== "undefined") {
      console.log("Configuración cargada:", window.MoodBoxConfig);

      // Aplicar configuración global
      aplicarConfiguracionGlobal();
    } else {
      console.warn(
        "Config.js no está disponible, usando configuración por defecto"
      );
    }

    // Inicializar funcionalidades específicas según la página
    inicializarFuncionalidadesPorPagina();

    // Actualizar productos si es necesario
    actualizarProductos();
  }

  // Aplicar configuración global
  function aplicarConfiguracionGlobal() {
    // Aplicar duración de alertas si está configurada
    if (window.getConfig("cart.alertDuration")) {
      const alertDuration = window.getConfig("cart.alertDuration");
      console.log("Duración de alertas configurada:", alertDuration);
    }

    // Aplicar breakpoint móvil si está configurado
    if (window.getConfig("ui.mobileBreakpoint")) {
      const mobileBreakpoint = window.getConfig("ui.mobileBreakpoint");
      console.log("Breakpoint móvil configurado:", mobileBreakpoint);
    }
  }

  // Inicializar funcionalidades según la página actual
  function inicializarFuncionalidadesPorPagina() {
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    switch (currentPage) {
      case "index.html":
      case "":
        console.log("Página de inicio detectada");
        inicializarPaginaInicio();
        break;
      case "catalogo.html":
        console.log("Página de catálogo detectada");
        // Las funcionalidades del catálogo se manejan en scriptCatalogo.js
        break;
      case "adminview.html":
        console.log("Página de administración detectada");
        // Las funcionalidades del admin se manejan en scriptAdminCatalogo.js
        break;
      case "contact.html":
        console.log("Página de contacto detectada");
        inicializarPaginaContacto();
        break;
      case "about.html":
        console.log("Página about detectada");
        inicializarPaginaAbout();
        break;
      default:
        console.log("Página no reconocida:", currentPage);
    }
  }

  // Funcionalidades específicas para la página de inicio
  function inicializarPaginaInicio() {
    // Agregar efectos de scroll suave para los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });

    // Agregar animación de entrada para las tarjetas de características
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    document.querySelectorAll(".feature-card").forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(card);
    });
  }

  // Funcionalidades específicas para la página de contacto
  function inicializarPaginaContacto() {
    console.log("Funcionalidades de contacto inicializadas");

    const formulario = document.getElementById("formulario-contacto");
    if (!formulario) return;

    const inputs = formulario.querySelectorAll("input, select, textarea");
    const progreso = document.getElementById("progreso-formulario");
    const mensaje = document.getElementById("mensaje");
    const contador = document.getElementById("contador-caracteres");
    const mensajeConfirmacion = document.getElementById("mensaje-confirmacion");

    const telefono = document.getElementById("telefono");

    telefono.addEventListener("input", () => {
      telefono.value = telefono.value.replace(/\D/g, ""); // elimina todo lo que no sea número
    });

    // === Contador de caracteres ===
    mensaje.addEventListener("input", () => {
      contador.textContent = mensaje.value.length;
    });

    // === Barra de progreso ===
    function actualizarProgreso() {
      let completados = 0;
      inputs.forEach((input) => {
        if (
          (input.type === "checkbox" && input.checked) ||
          (input.type !== "checkbox" && input.value.trim() !== "")
        ) {
          completados++;
        }
      });
      const porcentaje = (completados / inputs.length) * 100;
      progreso.style.width = porcentaje + "%";
    }
    inputs.forEach((input) => {
      input.addEventListener("input", actualizarProgreso);
      input.addEventListener("change", actualizarProgreso);
    });

    const textarea = document.getElementById("mensaje");
    const contadorM = document.getElementById("contador-caracteres");
    const limite = 1000;

    textarea.addEventListener("input", () => {
      const caracteres = textarea.value.length;
      contadorM.textContent = caracteres;

      // Resetear colores
      contadorM.classList.remove("verde", "amarillo", "rojo");

      if (caracteres < limite * 0.5) {
        contadorM.classList.add("verde"); // 0 - 499
      } else if (caracteres < limite * 0.8) {
        contadorM.classList.add("amarillo"); // 500 - 799
      } else {
        contadorM.classList.add("rojo"); // 800 - 1000
      }
    });

    // === Reset ===
    formulario.addEventListener("reset", () => {
      setTimeout(() => {
        progreso.style.width = "0%";
        contador.textContent = "0";
      }, 50);
    });

    // === Envío con confirmación y Formspree ===
    formulario.addEventListener("submit", function (e) {
      e.preventDefault(); // prevenimos envío automático

      fetch(formulario.action, {
        method: formulario.method,
        body: new FormData(formulario),
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            mensajeConfirmacion.innerHTML = `
                    <div class="alert alert-success mt-3">
                        ¡Tu mensaje ha sido enviado con éxito!
                    </div>`;
            formulario.reset();
            progreso.style.width = "0%";
            contador.textContent = "0";
          } else {
            mensajeConfirmacion.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        Ocurrió un error, por favor intenta nuevamente.
                    </div>`;
          }
        })
        .catch(() => {
          mensajeConfirmacion.innerHTML = `
                <div class="alert alert-danger mt-3">
                    Error de conexión, intenta más tarde.
                </div>`;
        });
    });
  }

  // Funcionalidades específicas para la página about
  function inicializarPaginaAbout() {
    // Aquí se pueden agregar funcionalidades específicas del about
    console.log("Funcionalidades de about inicializadas");
  }
});
