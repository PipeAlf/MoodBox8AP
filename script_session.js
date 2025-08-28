document.addEventListener("DOMContentLoaded", () => {
  const perfilOpciones = document.getElementById("perfilOpciones");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const usuarioActivo = localStorage.getItem("usuarioActivo");

  perfilOpciones.innerHTML = "";

  if (usuario && usuarioActivo === "true") {
    // Usuario logueado
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${usuario.nombre}</span></li>
      <li><a class="dropdown-item" href="perfil.html">Perfil</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    // Evento para cerrar sesión
    document.getElementById("cerrarSesion").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("usuarioActivo", "false");
      window.location.reload();
    });

  } else {
    // No hay sesión
    perfilOpciones.innerHTML = `
      <li><a class="dropdown-item" href="login.html">Iniciar sesión</a></li>
      <li><a class="dropdown-item" href="register.html">Registrarse</a></li>
    `;
  }
});