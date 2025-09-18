// script_session.js
document.addEventListener("DOMContentLoaded", async () => {
  const perfilOpciones = document.getElementById("perfilOpciones");
  const navFotoPerfil = document.getElementById("navFotoPerfil");
  const usuarioActivo = localStorage.getItem("usuarioActivo");
  const adminActivo = localStorage.getItem("adminActivo");
  const token = localStorage.getItem("accessToken");
const usuario = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
}).then(res => res.json());


  perfilOpciones.innerHTML = "";

 // 🔹 Caso: Admin
if (adminActivo === "true") {
  const adminData = JSON.parse(localStorage.getItem("admin")) || {};
  
  if (navFotoPerfil) {
    navFotoPerfil.src = adminData.foto || "./assets/imagenes/user.png";
  }

  perfilOpciones.innerHTML = `
    <li><span class="dropdown-item-text">Hola, ${adminData.nombre || "Admin"}</span></li>
    <li><a class="dropdown-item" href="adminview.html">Vista Administrador</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
  `;

  document.getElementById("cerrarSesion").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    localStorage.setItem("adminActivo", "false");
    localStorage.setItem("usuarioActivo", "false");
    window.location.href = "index.html";
  });
}

  // 🔹 Caso: Usuario normal
  else if (usuario && usuarioActivo === "true") {
    if (navFotoPerfil) {
      navFotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";
    }

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
      localStorage.removeItem("accessToken");
      localStorage.setItem("usuarioActivo", "false");
      localStorage.setItem("adminActivo", "false");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });

  // 🔹 Caso: Nadie logueado
  } else {
    if (navFotoPerfil) {
      navFotoPerfil.src = "./assets/imagenes/user.png";
    }

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

  // Evitar abrir modal si es admin
  const adminActivo = localStorage.getItem("adminActivo");
  if (adminActivo === "true") return;

  // Obtener datos de usuario normal
  let usuario = JSON.parse(localStorage.getItem("usuario"));
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioActivoFlag = localStorage.getItem("usuarioActivo");
  if (!usuario || usuarioActivoFlag !== "true") {
    console.warn("No hay usuario activo logueado");
    return;
  }

  // Mostrar datos actuales
  inputNombre.value = usuario.nombre || "";
  inputEmail.value = usuario.email || usuario.correo || "";
  fotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";

  // Guardar cambios
guardarBtn.addEventListener("click", function () {
  const nuevoNombre = inputNombre.value.trim();
  const nuevoEmail = inputEmail.value.trim();
  const nuevaPassword = inputPassword.value.trim();
  const nuevaFoto = inputFoto.files[0];

  // Actualizar datos del usuario actual
  usuario.nombre = nuevoNombre;
  usuario.email = nuevoEmail;
  if (nuevaPassword) usuario.password = nuevaPassword;

  if (nuevaFoto) {
    const lector = new FileReader();
    lector.onload = function (e) {
      usuario.foto = e.target.result;
      fotoPerfil.src = e.target.result;

      // 🔹 Guardar cambios y refrescar nav con la función unificada
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

async function actualizarUsuario(usuario, usuarios) {
  // Actualizar en la lista de usuarios
  const index = usuarios.findIndex(
    (u) => (u.email || u.correo) === (usuario.email || usuario.correo)
  );

  if (index !== -1) {
    usuarios[index] = usuario;
  }

  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  await fetch(`http://localhost:8080/api/usuarios/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(usuarioActualizado)
});


  // 🔹 Refrescar inmediatamente el nav
  const navFotoPerfil = document.getElementById("navFotoPerfil");
  const perfilOpciones = document.getElementById("perfilOpciones");

  if (navFotoPerfil) {
    navFotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";
  }

  if (perfilOpciones) {
    perfilOpciones.innerHTML = `
      <li><span class="dropdown-item-text">Hola, ${usuario.nombre}</span></li>
      <li><a class="dropdown-item" href="#" id="abrirPerfil">Perfil</a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
    `;

    // Volver a asignar eventos
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
      localStorage.removeItem("accessToken");
      localStorage.setItem("usuarioActivo", "false");
      localStorage.setItem("adminActivo", "false");
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });
  }

  console.log("Usuario actualizado y nav refrescado:", usuario);
}



document.addEventListener("DOMContentLoaded", inicializarPerfilUsuario);
