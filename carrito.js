// --- Carrito con LocalStorage ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Referencias - con verificación de existencia
let cartPanel, cartOverlay, toggleCartBtn, closeCartBtn, cartItems, cartTotal;

// Función para inicializar referencias del carrito
function initializeCartReferences() {
  cartPanel = document.getElementById("cartPanel");
  cartOverlay = document.getElementById("cartOverlay");
  toggleCartBtn = document.getElementById("toggleCartBtn");
  closeCartBtn = document.getElementById("closeCartBtn");
  cartItems = document.getElementById("cartItems");
  cartTotal = document.getElementById("cartTotal");
  
  // Verificar que todos los elementos existan
  if (!cartPanel || !cartOverlay || !toggleCartBtn || !closeCartBtn || !cartItems || !cartTotal) {
    console.warn('Algunos elementos del carrito no se encontraron');
    return false;
  }
  
  return true;
}

// Abrir / Cerrar carrito
function setupCartEventListeners() {
  if (!toggleCartBtn || !closeCartBtn || !cartOverlay) return;
  
  toggleCartBtn.addEventListener("click", () => {
    if (cartPanel) cartPanel.classList.add("open");
    if (cartOverlay) cartOverlay.classList.add("show");
    renderCart();
  });
  
  closeCartBtn.addEventListener("click", () => {
    if (cartPanel) cartPanel.classList.remove("open");
    if (cartOverlay) cartOverlay.classList.remove("show");
  });
  
  cartOverlay.addEventListener("click", () => {
    if (cartPanel) cartPanel.classList.remove("open");
    if (cartOverlay) cartOverlay.classList.remove("show");
  });
}

// Renderizar carrito
function renderCart() {
  if (!cartItems || !cartTotal) return;
  
  cartItems.innerHTML = "";
  let total = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.src='./assets/imagenes/logo.png'">
      <div class="cart-item-info">
        <h6>${item.name}</h6>
        <p>$${item.price.toFixed(2)}</p>
        <div class="cart-qty">
          <button onclick="changeQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>
      </div>
      <button class="cart-remove" onclick="removeItem(${index})">Eliminar</button>
    `;
    cartItems.appendChild(div);
  });
  
  cartTotal.textContent = `$${total.toFixed(2)}`;
  localStorage.setItem("cart", JSON.stringify(cart));
  
  // Actualizar el badge del carrito
  updateCartBadge();
}

// Cambiar cantidad
function changeQty(index, delta) {
  if (index < 0 || index >= cart.length) return;
  
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  renderCart();
}

// Eliminar producto
function removeItem(index) {
  if (index < 0 || index >= cart.length) return;
  
  const itemName = cart[index].name;
  cart.splice(index, 1);
  showCartAlert(`${itemName} se eliminó del carrito`, "¡Producto eliminado!", "remove");
  renderCart();
}

// Agregar producto desde catálogo
function addToCart(product) {
  if (!product || !product.name) {
    console.warn('Producto inválido:', product);
    return;
  }
  
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty++;
    showCartAlert(`${product.name} se actualizó en el carrito`, "¡Cantidad actualizada!", "update");
  } else {
    cart.push({...product, qty: 1});
    showCartAlert(`${product.name} se agregó al carrito`, "¡Producto agregado!", "success");
  }
  renderCart();
}

// Función para mostrar alert personalizado
function showCartAlert(message, title = "¡Producto agregado!", type = "success") {
  // Crear el elemento del alert
  const alert = document.createElement('div');
  alert.className = 'cart-alert';
  
  // Determinar el icono según el tipo
  let iconClass = 'bi-check-circle-fill';
  let iconColor = '#08E2E3';
  
  if (type === 'remove') {
    iconClass = 'bi-trash-fill';
    iconColor = '#F74380';
  } else if (type === 'update') {
    iconClass = 'bi-arrow-up-circle-fill';
    iconColor = '#08E2E3';
  }
  
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
  
  // Agregar al body
  document.body.appendChild(alert);
  
  // Mostrar con animación
  setTimeout(() => alert.classList.add('show'), 100);
  
  // Configurar el botón de cerrar
  const closeBtn = alert.querySelector('.cart-alert-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    });
  }
  
  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    if (alert.parentNode) {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }
  }, 3000);
}

// Función para actualizar el badge del carrito
function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  if (!cartBadge) return;
  
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);
  
  if (totalItems > 0) {
    cartBadge.textContent = totalItems;
    cartBadge.classList.remove("hidden");
    
    // Agregar animación cuando cambia la cantidad
    cartBadge.style.animation = "none";
    cartBadge.offsetHeight; // Trigger reflow
    cartBadge.style.animation = "badgePop 0.3s ease-out";
  } else {
    cartBadge.classList.add("hidden");
  }
}

// Inicialización del carrito
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar referencias del carrito
  if (!initializeCartReferences()) {
    console.warn('No se pudo inicializar el carrito');
    return;
  }
  
  // Configurar event listeners del carrito
  setupCartEventListeners();
  
  // Configurar event listener para productos
  const contenedor = document.getElementById("productos-container");
  if (contenedor) {
    contenedor.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        const btn = e.target;
        const product = {
          id: btn.dataset.id || btn.dataset.name,
          name: btn.dataset.name,
          price: parseFloat(btn.dataset.price) || 0,
          image: btn.dataset.image || "./assets/imagenes/logo.png"
        };
        addToCart(product);
      }
    });
  }
  
  // Renderizar carrito inicial si hay productos
  if (cart.length > 0) {
    renderCart();
  }
});
