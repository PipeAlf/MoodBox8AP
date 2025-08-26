// --- Carrito con LocalStorage ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Referencias
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const toggleCartBtn = document.getElementById("toggleCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

// Abrir / Cerrar carrito
toggleCartBtn.addEventListener("click", () => {
  cartPanel.classList.add("open");
  cartOverlay.classList.add("show");
  renderCart();
});
closeCartBtn.addEventListener("click", () => {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("show");
});
cartOverlay.addEventListener("click", () => {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("show");
});

// Renderizar carrito
function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
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
}

// Cambiar cantidad
function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart();
}

// Eliminar producto
function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

// Agregar producto desde catálogo (ejemplo)
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({...product, qty: 1});
  }
  renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("productos-container");
  if (contenedor) {
    contenedor.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        const btn = e.target;
        const product = {
          id: btn.dataset.id || btn.dataset.name, // si tu JSON tiene un id, mejor usarlo
          name: btn.dataset.name,
          price: parseFloat(btn.dataset.price) || 0,
          image: btn.dataset.image || "./assets/imagenes/logo.png"
        };
        addToCart(product);
      }
    });
  }
});