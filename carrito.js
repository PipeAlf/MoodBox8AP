// ========================================
// SCRIPT DEL CARRITO DE COMPRAS CON BACKEND CORREGIDO
// ========================================

let carritoItems = [];
const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});


// Referencias DOM del carrito
let cartPanel, cartOverlay, toggleCartBtn, closeCartBtn, cartItems, cartTotal;

document.addEventListener("DOMContentLoaded", async () => {
  if (!initializeCartReferences()) return;

  setupCartEventListeners();
  setupProductEventListeners();

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("accessToken");

  if (usuario && token) {
    await fetchCarritoDelServidor(usuario.idUsuario, token);
    renderCart();
  }

  updateCartBadge();
});

function initializeCartReferences() {
  cartPanel = document.getElementById("cartPanel");
  cartOverlay = document.getElementById("cartOverlay");
  toggleCartBtn = document.getElementById("toggleCartBtn");
  closeCartBtn = document.getElementById("closeCartBtn");
  cartItems = document.getElementById("cartItems");
  cartTotal = document.getElementById("cartTotal");

  return cartPanel && cartOverlay && toggleCartBtn && closeCartBtn && cartItems && cartTotal;
}

function setupCartEventListeners() {
  toggleCartBtn?.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("accessToken");

    if (!usuario || !token) {
      window.location.href = "login.html";
      return;
    }

    await fetchCarritoDelServidor(usuario.idUsuario, token);
    cartPanel.classList.add("open");
    cartOverlay.classList.add("show");
    renderCart();
  });

  closeCartBtn?.addEventListener("click", closeCart);
  cartOverlay?.addEventListener("click", closeCart);

  
}

function setupProductEventListeners() {
  const contenedor = document.getElementById("productos-container");
  if (contenedor) {
    contenedor.addEventListener("click", handleProductClick);
  }
}

async function fetchCarritoDelServidor(usuarioId, token) {
  try {
    const response = await fetch(`http://localhost:8080/api/carrito/${usuarioId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("No se pudo obtener el carrito");
    carritoItems = await response.json();
    updateCartBadge();
  } catch (error) {
    console.error("Error cargando carrito:", error);
    carritoItems = [];
  }
}

function renderCart() {
  if (!cartItems || !cartTotal) return;

  cartItems.innerHTML = "";
  let total = 0;

  carritoItems.forEach((item, index) => {
    const precioUnitario = item.producto?.precio ?? item.precio ?? 0;
    total += precioUnitario * item.cantidad;
    cartItems.appendChild(createCartItemElement(item, index));
  });

  cartTotal.textContent = formatter.format(total);
  updateCartBadge();

  
}

function createCartItemElement(item, index) {
  const nombre = item.producto?.nombre || item.nombre || "Producto";
  const precio = item.producto?.precio ?? item.precio ?? 0;
  const imagen = item.producto?.imagen || item.imagen || "./assets/imagenes/logo.png";
  const cantidad = item.cantidad ?? 1;

  const div = document.createElement("div");
  div.classList.add("cart-item");
  div.innerHTML = `
    <img src="${imagen}" alt="${nombre}" onerror="this.src='./assets/imagenes/logo.png'">
    <div class="cart-item-info">
      <h6>${nombre}</h6>
      <p>${formatter.format(precio)}</p>
      <div class="cart-qty">
        <button onclick="changeQty(${item.id}, -1)">-</button>
        <span>${cantidad}</span>
        <button onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
    <button class="cart-remove" onclick="removeItem(${item.id})">Eliminar</button>
  `;
  return div;
}

function createAlertElement(message, title, type) {
  const alert = document.createElement('div');
  alert.className = 'cart-alert';

  const { iconClass, iconColor } = getAlertIcon(type);

  alert.innerHTML = `
    <div class="cart-alert-content">
      <div class="cart-alert-icon" style="color: ${iconColor}">
        <i class="bi ${iconClass}"></i>
      </div>
      <div class="cart-alert-text">
        <h6>${title}</h6>
        <p>${message}</p>
      </div>
      <button class="cart-alert-close">&times;</button>
    </div>
  `;

  return alert;
}

function getAlertIcon(type) {
  const icons = {
    success: { iconClass: 'bi-check-circle-fill', iconColor: '#08E2E3' },
    remove: { iconClass: 'bi-trash-fill', iconColor: '#F74380' },
    update: { iconClass: 'bi-arrow-up-circle-fill', iconColor: '#08E2E3' },
    error: { iconClass: 'bi-exclamation-triangle-fill', iconColor: '#f44336' }
  };
  return icons[type] || icons.success;
}

function setupAlertCloseButton(alert) {
  const closeBtn = alert.querySelector('.cart-alert-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hideAlert(alert));
  }
}

function hideAlert(alert) {
  alert.classList.remove('show');
  setTimeout(() => alert.remove(), 300);
}

function autoHideAlert(alert) {
  if (alert.parentNode) {
    hideAlert(alert);
  }
}

function showCartAlert(message, title = "¡Producto agregado!", type = "success") {
  const alert = createAlertElement(message, title, type);
  document.body.appendChild(alert);
  setTimeout(() => alert.classList.add('show'), 100);
  setupAlertCloseButton(alert);
  setTimeout(() => autoHideAlert(alert), 3000);
}

async function addToCart(product) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("accessToken");

  if (!usuario || !token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const body = {
      usuarioId: usuario.idUsuario,
      productoId: product.id,
      cantidad: 1
    };

    const response = await fetch("http://localhost:8080/api/carrito", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const mensaje = await response.text();
      showCartAlert(mensaje, "Error", "error");
      return;
    }

    await fetchCarritoDelServidor(usuario.idUsuario, token);
    showCartAlert(`${product.name} se agregó al carrito`, "¡Producto agregado!", "success");
    renderCart();

  } catch (error) {
    console.error("Error agregando producto al carrito:", error);
  }
}

async function changeQty(itemId, delta) {
  const item = carritoItems.find(i => i.id === itemId);
  if (!item) return;

  const nuevaCantidad = item.cantidad + delta;
  if (nuevaCantidad <= 0) {
    await removeItem(itemId);
    return;
  }

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("accessToken");

  const productoId = item.producto?.idProducto ?? item.productoId;

  try {
    const body = {
      usuarioId: usuario.idUsuario,
      productoId,
      cantidad: nuevaCantidad
    };

    const response = await fetch("http://localhost:8080/api/carrito", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const mensaje = await response.text();
      showCartAlert(mensaje, "No se pudo actualizar", "error");
      return;
    }

    await fetchCarritoDelServidor(usuario.idUsuario, token);
    renderCart();
    showCartAlert("Cantidad actualizada", "update");

  } catch (error) {
    console.error("Error cambiando cantidad:", error);
  }
}

async function removeItem(itemId) {
  const token = localStorage.getItem("accessToken");
  await fetch(`http://localhost:8080/api/carrito/${itemId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  await fetchCarritoDelServidor(usuario.idUsuario, token);
  renderCart();
}

function closeCart() {
  cartPanel?.classList.remove("open");
  cartOverlay?.classList.remove("show");
}

function handleProductClick(e) {
  if (e.target.classList.contains("add-to-cart")) {
    const btn = e.target;
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image
    };
    addToCart(product);
  }
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  const total = carritoItems.reduce((acc, item) => acc + item.cantidad, 0);
  badge.textContent = total;
  badge.classList.toggle("hidden", total === 0);
}

document.getElementById("btnFinalizarCompra")?.addEventListener("click", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("accessToken");

  if (!usuario || !token) {
    showCartAlert("Debes iniciar sesión para continuar", "Acceso restringido", "error");
    setTimeout(() => window.location.href = "login.html", 2000);
    return;
  }

  if (!carritoItems || carritoItems.length === 0) {
    showCartAlert("Tu carrito está vacío", "No puedes continuar", "warning");
    return;
  }

  // Guardar el carrito para el checkout
  const cartToStore = carritoItems.map(item => ({
    id: item.producto?.idProducto ?? item.productoId,
    name: item.producto?.nombre ?? item.nombre,
    price: item.producto?.precio ?? item.precio,
    qty: item.cantidad,
    image: item.producto?.imagen ?? item.imagen
  }));

  localStorage.setItem("cart", JSON.stringify(cartToStore));
  window.location.href = "checkout.html";
});



