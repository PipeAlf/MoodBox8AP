// ========================================
// SCRIPT DEL CARRITO DE COMPRAS
// ========================================

// Variables globales
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Referencias DOM del carrito
let cartPanel, cartOverlay, toggleCartBtn, closeCartBtn, cartItems, cartTotal;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar referencias del carrito
  if (!initializeCartReferences()) {
    console.warn('No se pudo inicializar el carrito');
    return;
  }
  
  // Configurar event listeners del carrito
  setupCartEventListeners();
  
  // Configurar event listener para productos del catálogo
  setupProductEventListeners();
  
  // Renderizar carrito inicial si hay productos
  if (cart.length > 0) {
    renderCart();
  }
  
  // Inicializar el badge del carrito
  updateCartBadge();
});

// ========================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================

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

function setupCartEventListeners() {
  if (!toggleCartBtn || !closeCartBtn || !cartOverlay) return;
  
  // Abrir carrito
  toggleCartBtn.addEventListener("click", () => {
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    if (usuarioActivo !== "true") {
      window.location.href = "login.html"; // 🔒 Redirigir a login
      return;
    }
    cartPanel?.classList.add("open");
    cartOverlay?.classList.add("show");
    renderCart();
  });
  
  // Cerrar carrito con botón
  closeCartBtn.addEventListener("click", closeCart);
  
  // Cerrar carrito con overlay
  cartOverlay.addEventListener("click", closeCart);
}

function setupProductEventListeners() {
  const contenedor = document.getElementById("productos-container");
  if (contenedor) {
    contenedor.addEventListener("click", handleProductClick);
  }
}

// ========================================
// FUNCIONES DEL CARRITO
// ========================================

function renderCart() {
  if (!cartItems || !cartTotal) return;
  
  cartItems.innerHTML = "";
  let total = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    cartItems.appendChild(createCartItemElement(item, index));
  });
  
  cartTotal.textContent = `$${total.toFixed(2)}`;
  saveCartToStorage();
  updateCartBadge();
}

function createCartItemElement(item, index) {
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
  return div;
}

function addToCart(product) {
  if (!isValidProduct(product)) {
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
  
  updateCartBadge();
  renderCart();
}

function changeQty(index, delta) {
  if (!isValidIndex(index)) return;
  
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  
  updateCartBadge();
  renderCart();
}

function removeItem(index) {
  if (!isValidIndex(index)) return;
  
  const itemName = cart[index].name;
  cart.splice(index, 1);
  
  showCartAlert(`${itemName} se eliminó del carrito`, "¡Producto eliminado!", "remove");
  
  updateCartBadge();
  renderCart();
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

function isValidProduct(product) {
  return product && product.name && typeof product.price === 'number';
}

function isValidIndex(index) {
  return index >= 0 && index < cart.length;
}

function closeCart() {
  cartPanel?.classList.remove("open");
  cartOverlay?.classList.remove("show");
}

function handleProductClick(e) {
  if (e.target.classList.contains("add-to-cart")) {
    const btn = e.target;

    // 🔑 Validar si hay usuario logueado
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
    if (!usuarioActivo) {
      // Si no hay sesión → redirigir a login
      window.location.href = "login.html";
      return;
    }

    const product = {
      id: btn.dataset.id || btn.dataset.name,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price) || 0,
      image: btn.dataset.image || "./assets/imagenes/logo.png"
    };
    addToCart(product);
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

function showCartAlert(message, title = "¡Producto agregado!", type = "success") {
  const alert = createAlertElement(message, title, type);
  document.body.appendChild(alert);
  
  // Mostrar con animación
  setTimeout(() => alert.classList.add('show'), 100);
  
  // Configurar botón de cerrar
  setupAlertCloseButton(alert);
  
  // Auto-ocultar después de 3 segundos
  setTimeout(() => autoHideAlert(alert), 3000);
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
    update: { iconClass: 'bi-arrow-up-circle-fill', iconColor: '#08E2E3' }
  };
  
  return icons[type] || icons.success;
}

function setupAlertCloseButton(alert) {
  const closeBtn = alert.querySelector('.cart-alert-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideAlert(alert);
    });
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

function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  if (!cartBadge) return;

  const usuarioActivo = localStorage.getItem("usuarioActivo");
  if (usuarioActivo !== "true") {
    cartBadge.classList.add("hidden"); // 🔒 Ocultar badge
    return;
  }
  
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