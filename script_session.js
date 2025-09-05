// script_session.js
document.addEventListener("DOMContentLoaded", () => {
  const perfilOpciones = document.getElementById("perfilOpciones");
  const usuario = JSON.parse(localStorage.getItem("usuario")); // usuario actual logueado
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  const adminActivo = localStorage.getItem("adminActivo");

  perfilOpciones.innerHTML = "";

  // 🔹 Caso: Admin
  if (adminActivo === "true") {
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, Admin</span></li>
      <li><a class="dropdown-item" href="adminview.html">Vista Administrador</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    document.getElementById("cerrarSesion").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("adminActivo", "false");
      localStorage.setItem("usuarioActivo", "false");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });

  // 🔹 Caso: Usuario normal
  } else if (usuario && usuarioActivo === "true") {
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${usuario.nombre}</span></li>
      <li><a class="dropdown-item" href="#" id="abrirPerfil">Perfil</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    const abrirPerfilBtn = document.getElementById("abrirPerfil");
    if (abrirPerfilBtn) {
      abrirPerfilBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = new bootstrap.Modal(document.getElementById("perfilModal"));
        modal.show();
      });
    }

    document.getElementById("cerrarSesion").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("usuarioActivo", "false");
      localStorage.setItem("adminActivo", "false");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });

  // 🔹 Caso: No hay sesión
  } else {
    perfilOpciones.innerHTML = `
      <li><a class="dropdown-item" href="login.html">Iniciar sesión</a></li>
      <li><a class="dropdown-item" href="register.html">Registrarse</a></li>
    `;
  }
});


// Modal Perfil (solo aplica para usuario normal)
function inicializarPerfilUsuario() {
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");

  if (!guardarBtn) return;

  // Evitar abrir modal en caso de admin
  const adminActivo = localStorage.getItem("adminActivo");
  if (adminActivo === "true") return;

  // Obtener datos usuario actual
  let usuario = JSON.parse(localStorage.getItem("usuario"));
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioActivoFlag = localStorage.getItem("usuarioActivo");
  if (!usuario || usuarioActivoFlag !== "true") {
    console.warn("No hay usuario activo logueado");
    return;
  }

  // Mostrar datos actuales en el modal
  inputNombre.value = usuario.nombre || "";
  inputEmail.value = usuario.email || usuario.correo || "";
  fotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";

  // Guardar cambios
  guardarBtn.addEventListener("click", function () {
    const nuevoNombre = inputNombre.value.trim();
    const nuevoEmail = inputEmail.value.trim();
    const nuevaPassword = inputPassword.value.trim();
    const nuevaFoto = inputFoto.files[0];

    usuario.nombre = nuevoNombre;
    usuario.email = nuevoEmail;  // normalizamos siempre a "email"
    if (nuevaPassword) usuario.password = nuevaPassword;

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

    const modal = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
    if (modal) modal.hide();
  });
}

function actualizarUsuario(usuario, usuarios) {
  // Buscar usuario por correo/email
  const index = usuarios.findIndex(
    (u) => (u.email || u.correo) === (usuario.email || usuario.correo)
  );

  if (index !== -1) {
    usuarios[index] = usuario;
  }

  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  localStorage.setItem("usuario", JSON.stringify(usuario));
  console.log("Perfil actualizado:", usuario);
}

document.addEventListener("DOMContentLoaded", inicializarPerfilUsuario);
