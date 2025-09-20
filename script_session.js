document.addEventListener("DOMContentLoaded", async () => {
  const perfilOpciones = document.getElementById("perfilOpciones");
  const navFotoPerfil = document.getElementById("navFotoPerfil");
  const accessToken = localStorage.getItem("accessToken");
  const adminActivo = localStorage.getItem("adminActivo");
  const usuarioActivo = localStorage.getItem("usuarioActivo");

  // 👤 ADMIN
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
    document.getElementById("cerrarSesion").addEventListener("click", cerrarSesion);
    return;
  }

  // 👤 CLIENTE (obtener desde backend)
  if (accessToken && usuarioActivo === "true") {
    try {
      const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
      const id = usuarioGuardado?.idUsuario;

      const response = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error("No se pudo cargar perfil");
      const usuario = await response.json();

      localStorage.setItem("usuario", JSON.stringify(usuario)); // Actualiza con versión más reciente

      if (navFotoPerfil) {
        navFotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";
      }

      perfilOpciones.innerHTML = `
        <li><span class="dropdown-item-text">Hola, ${usuario.nombre}</span></li>
        <li><a class="dropdown-item" href="#" id="abrirPerfil">Perfil</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
      `;

      document.getElementById("abrirPerfil").addEventListener("click", () => {
        inicializarPerfilModal(usuario);
        const modal = new bootstrap.Modal(document.getElementById("perfilModal"));
        modal.show();
      });

      document.getElementById("cerrarSesion").addEventListener("click", cerrarSesion);

    } catch (err) {
      console.error("Error al cargar perfil desde backend:", err);
      cerrarSesion(); // Forzar logout si hay fallo de carga
    }
  } else {
    // 🔒 Usuario no logueado
    if (navFotoPerfil) navFotoPerfil.src = "./assets/imagenes/user.png";
    perfilOpciones.innerHTML = `
      <li><a class="dropdown-item" href="login.html">Iniciar sesión</a></li>
      <li><a class="dropdown-item" href="register.html">Registrarse</a></li>
    `;
  }
});

function cerrarSesion() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("usuario");
  localStorage.removeItem("admin");
  localStorage.setItem("usuarioActivo", "false");
  localStorage.setItem("adminActivo", "false");
  window.location.href = "index.html";
}

function inicializarPerfilModal(usuario) {
  const fotoPerfil = document.getElementById("fotoPerfil");
  const inputNombre = document.getElementById("inputNombre");
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");
  const inputFoto = document.getElementById("inputFoto");
  const guardarBtn = document.getElementById("guardarCambios");

  if (!usuario || !guardarBtn) return;

  inputNombre.value = usuario.nombre || "";
  inputEmail.value = usuario.correo || "";
  fotoPerfil.src = usuario.foto || "./assets/imagenes/user.png";

guardarBtn.onclick = async () => {
  const nuevoNombre = inputNombre.value.trim();
  const nuevoCorreo = inputEmail.value.trim();
  const nuevaPassword = inputPassword.value.trim();
  const nuevaFoto = inputFoto.files[0];
  const mensaje = document.getElementById("mensajePerfil");

  if (mensaje) {
    mensaje.textContent = "";
    mensaje.className = "form-message";
  }

  const accessToken = localStorage.getItem("accessToken");
  const id = usuario.idUsuario;

  let fotoBase64 = usuario.foto || "";

  if (nuevaFoto) {
    fotoBase64 = await convertirA64(nuevaFoto);
  }

  const payload = {
    nombre: nuevoNombre,
    correo: nuevoCorreo,
    foto: fotoBase64 || null,
    apellido: usuario.apellido,
    telefono: usuario.telefono
  };

  if (nuevaPassword && nuevaPassword.trim() !== "") {
    payload.password = nuevaPassword;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Error al actualizar el perfil");

const actualizado = await response.json();
localStorage.setItem("usuario", JSON.stringify(actualizado));

// ✅ Actualiza imágenes
document.getElementById("navFotoPerfil").src = actualizado.foto || "./assets/imagenes/user.png";
document.getElementById("fotoPerfil").src = actualizado.foto || "./assets/imagenes/user.png";

// ✅ Actualiza el nombre en el navbar
const perfilOpciones = document.getElementById("perfilOpciones");
if (perfilOpciones) {
  perfilOpciones.innerHTML = `
    <li><span class="dropdown-item-text">Hola, ${actualizado.nombre}</span></li>
    <li><a class="dropdown-item" href="#" id="abrirPerfil">Perfil</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#" id="cerrarSesion">Cerrar sesión</a></li>
  `;

  document.getElementById("abrirPerfil").addEventListener("click", () => {
    inicializarPerfilModal(actualizado);
    const modal = new bootstrap.Modal(document.getElementById("perfilModal"));
    modal.show();
  });

  document.getElementById("cerrarSesion").addEventListener("click", cerrarSesion);
}

const modalInstance = bootstrap.Modal.getInstance(document.getElementById("perfilModal"));
if (modalInstance) modalInstance.hide();


// ✅ Mensaje de éxito
if (mensaje) {
  mensaje.textContent = "Perfil actualizado correctamente";
  mensaje.classList.add("success");
}

// Limpia contraseña
inputPassword.value = "";




  } catch (err) {
    console.error("Error actualizando perfil:", err);
    if (mensaje) {
      mensaje.textContent = "No se pudo actualizar el perfil";
      mensaje.classList.add("error");
    }
  }
};
}

function convertirA64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}
