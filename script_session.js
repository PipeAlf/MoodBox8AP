//script_session.js
document.addEventListener("DOMContentLoaded", () => {
  const perfilOpciones = document.getElementById("perfilOpciones");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const usuarioActivo = localStorage.getItem("usuarioActivo");

  perfilOpciones.innerHTML = "";

  if (usuario && usuarioActivo === "true") {
    // Usuario logueado
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${usuario.nombre}</span></li>
      <li><a class="dropdown-item" href="#" id="abrirPerfil">Perfil</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    // Evento para abrir modal de perfil
    const abrirPerfilBtn = document.getElementById("abrirPerfil");
    if (abrirPerfilBtn) {
      abrirPerfilBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = new bootstrap.Modal(document.getElementById("perfilModal"));
        modal.show();
      });
    }

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

// Modal Perfil
function inicializarPerfilUsuario() {
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");

  if (!guardarBtn) return;

  // Obtener datos de usuario logueado
  let usuario = JSON.parse(localStorage.getItem("usuario")); 
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  // Validar que haya un usuario activo
  const usuarioActivoFlag = localStorage.getItem("usuarioActivo");
  if (!usuario || usuarioActivoFlag !== "true") {
    console.warn("No hay usuario activo logueado");
    return;
  }

  // Mostrar datos actuales en el modal
  inputNombre.value = usuario.nombre || "";
  inputEmail.value = usuario.email || "";
  fotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";

  // Guardar cambios
  guardarBtn.addEventListener("click", function () {
    const nuevoNombre = inputNombre.value.trim();
    const nuevoEmail = inputEmail.value.trim();
    const nuevaPassword = inputPassword.value.trim();
    const nuevaFoto = inputFoto.files[0];

    // Actualizar datos en el objeto usuario
    usuario.nombre = nuevoNombre;
    usuario.email = nuevoEmail;
    if (nuevaPassword) usuario.password = nuevaPassword;

    // Si cambia la foto
    if (nuevaFoto) {
      const lector = new FileReader();
      lector.onload = function (e) {
        usuario.foto = e.target.result;
        fotoPerfil.src = e.target.result;
        actualizarUsuario(usuario, usuarios);
      };
      lector.readAsDataURL(nuevaFoto);
    } else {
      actualizarUsuario(usuario, usuarios);
    }

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
    if (modal) modal.hide();
  });
}

function actualizarUsuario(usuario, usuarios) {
  // Buscar índice en la lista de usuarios por email
  const index = usuarios.findIndex(u => u.email === usuario.email);
  if (index !== -1) {
    usuarios[index] = usuario;
  }

  // Guardar cambios
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("usuario", JSON.stringify(usuario));

  console.log("Perfil actualizado:", usuario);
}

document.addEventListener("DOMContentLoaded", inicializarPerfilUsuario);