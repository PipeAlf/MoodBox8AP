document.addEventListener("DOMContentLoaded", () => {
  // Registro
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    registroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
 
      if (!nombre || !telefono || !email || !password) {
        alert("Por favor completa todos los campos.");
        return;
      }
 
      const usuario = { nombre, telefono, email, password };
      localStorage.setItem("usuario", JSON.stringify(usuario));
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      window.location.href = "login.html";
    });
  }
 
  // Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
 
      const usuario = JSON.parse(localStorage.getItem("usuario"));
 
      if (usuario && usuario.email === email && usuario.password === password) {
        alert("Login exitoso. Bienvenido/a " + usuario.nombre);
        // Aquí rediriges al catálogo o dashboard
        window.location.href = "catalogo.html";
      } else {
        alert("Credenciales incorrectas.");
      }
    });
  }
});