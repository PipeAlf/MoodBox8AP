// ========================================
// CHECKOUT SCRIPT
// ========================================

let currentStep = 1;
let cart = []; // Se cargará desde el backend
let mercadopago = null;

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});


// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🛒 Checkout inicializado");

    function setupNavbar() {
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    const adminActivo = localStorage.getItem("adminActivo");

    const perfilOpciones = document.getElementById('perfilOpciones');
    const navFotoPerfil = document.getElementById('navFotoPerfil');

    if (!perfilOpciones || !navFotoPerfil) return;

    if (usuarioActivo === "true") {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.foto) {
            navFotoPerfil.src = usuario.foto;
        }

        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="catalogo.html">
                <i class="bi bi-shop me-2"></i>Catálogo
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
            </a></li>
        `;
    } else if (adminActivo === "true") {
        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="catalogo.html">
                <i class="bi bi-shop me-2"></i>Catálogo
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
            </a></li>
        `;
    } else {
        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="login.html">
                <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
            </a></li>
            <li><a class="dropdown-item" href="register.html">
                <i class="bi bi-person-plus me-2"></i>Registrarse
            </a></li>
        `;
    }
    console.log("setupNavbar ejecutado. navFotoPerfil:", document.getElementById("navFotoPerfil"));

}


async function loadComponents() {
  try {
    const navbarResponse = await fetch('./componentes/nav.html');
    const navbarContent = await navbarResponse.text();
    document.getElementById('navbar-container').innerHTML = navbarContent;

    const footerResponse = await fetch('./componentes/footer.html');
    const footerContent = await footerResponse.text();
    document.getElementById('footer-container').innerHTML = footerContent;

    // 👇 Esperar DOM completo antes de configurar
    await new Promise(resolve => setTimeout(resolve, 100)); // pequeño delay para asegurar renderizado

    setupNavbar(); // Asegúrate de que este usa correctamente los elementos insertados

    console.log(" Componentes cargados correctamente");
  } catch (error) {
    console.error(" Error cargando componentes:", error);
  }
}



    // Cargar componentes UI
    await loadComponents();

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("accessToken");

    if (!usuario || !token) {
        showAlert("Debes iniciar sesión para continuar", "warning");
        return setTimeout(() => window.location.href = "login.html", 1500);
    }

    await fetchCarritoDesdeServidor(usuario.idUsuario, token);

    if (cart.length === 0) {
        showAlert("Tu carrito está vacío", "warning");
        return setTimeout(() => window.location.href = "catalogo.html", 1500);
    }

    loadUserData(usuario);
    initializeMercadoPago();
    renderCartSummary();
    updateTotals();
    setupEventListeners();
});



// ========================================
// FETCH CARRITO DEL BACKEND
// ========================================

async function fetchCarritoDesdeServidor(usuarioId, token) {
    try {
        const response = await fetch(`http://localhost:8080/api/carrito/${usuarioId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("No se pudo obtener el carrito");

        const items = await response.json();
        cart = items.map(item => ({
            id: item.id,
            name: item.producto.nombre,
            price: item.producto.precio,
            qty: item.cantidad,
            image: item.producto.imagen || "./assets/imagenes/logo.png"
        }));
    } catch (error) {
        console.error("Error al cargar el carrito:", error);
        cart = [];
    }
}

// ========================================
// CREAR VENTA EN EL BACKEND
// ========================================

async function createOrder(paymentResult) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("accessToken");
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 5000;

    // Crear venta en el backend
    const ventaData = {
      usuarioId: usuario.idUsuario,
      metodoPago: paymentResult.id.startsWith("MP") ? "tarjeta" : "transferencia"
    };

    console.log("Token JWT enviado:", token);
    const response = await fetch("http://localhost:8080/api/ventas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(ventaData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error creando la venta");
    }

    const venta = await response.json();
    console.log(" Venta creada:", venta);

    // 🧹 Vaciar carrito en el backend
    await fetch(`http://localhost:8080/api/carrito/vaciar/${usuario.idUsuario}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    // 🧹 Limpiar carrito en localStorage
    localStorage.removeItem("cart");

    // Mostrar confirmación
    hideLoadingModal();
    showOrderConfirmation(venta, paymentResult);

  } catch (error) {
    console.error(" Error creando la orden:", error);
    hideLoadingModal();
    showAlert("Error finalizando la compra: " + error.message, "danger");
  }
}


// ========================================
// FUNCIONES DE INTERFAZ Y LÓGICA
// ========================================

function loadUserData(usuario) {
    document.getElementById("firstName").value = usuario.nombre || "";
    document.getElementById("lastName").value = usuario.apellido || "";
    document.getElementById("email").value = usuario.correo || "";
    document.getElementById("phone").value = usuario.telefono || "";
}

function setupEventListeners() {
    document.getElementById("checkoutForm").addEventListener("submit", handleFormSubmit);

    document.querySelectorAll(".payment-option").forEach(option => {
        option.addEventListener("click", () => {
            document.querySelectorAll(".payment-option").forEach(o => o.classList.remove("active"));
            option.classList.add("active");
            option.querySelector("input[type='radio']").checked = true;
        });
    });
}

function renderCartSummary() {
    const cartSummary = document.getElementById("cartSummary");
    if (!cartSummary) return;

    cartSummary.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">Cantidad: ${item.qty}</div>
            </div>
            <div class="cart-item-price">${formatter.format(item.price * item.qty)}</div>
        </div>
    `).join("");
}

function updateOrderSummary() {
    const orderItems = document.getElementById("orderItems");
    const shippingInfo = document.getElementById("shippingInfo");
    const paymentInfo = document.getElementById("paymentInfo");

    if (orderItems) {
        orderItems.innerHTML = cart.map(item => `
            <div class="d-flex justify-content-between mb-2">
                <span>${item.name} x${item.qty}</span>
                <span>${formatter.format(item.price * item.qty)}</span>
            </div>
        `).join("");
    }

    if (shippingInfo) {
        shippingInfo.innerHTML = `
            <p><strong>Dirección:</strong> ${document.getElementById("address").value}</p>
            <p><strong>Ciudad:</strong> ${document.getElementById("city").value}, ${document.getElementById("state").value}</p>
            <p><strong>Código Postal:</strong> ${document.getElementById("zipCode").value}</p>
        `;
    }

    if (paymentInfo) {
        const method = document.querySelector("input[name='paymentMethod']:checked")?.value;
        paymentInfo.innerHTML = `<p><strong>Método:</strong> ${method === "mercadopago" ? "MercadoPago" : "Transferencia Bancaria"}</p>`;
    }
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = 5000.00; // En pesos colombianos
  const total = subtotal + shipping;

  const formatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById("sidebarSubtotal").textContent = formatter.format(subtotal);
  document.getElementById("sidebarShipping").textContent = formatter.format(shipping);
  document.getElementById("sidebarTotal").textContent = formatter.format(total);

  document.getElementById("subtotal").textContent = formatter.format(subtotal);
  document.getElementById("shipping").textContent = formatter.format(shipping);
  document.getElementById("total").textContent = formatter.format(total);
}


// ========================================
// PROCESAMIENTO DE PAGO
// ========================================

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateConfirmation()) return;

    showLoadingModal();

    const selected = document.querySelector("input[name='paymentMethod']:checked");

    if (selected.value === "mercadopago") {
        await processMercadoPagoPayment();
    } else {
        await processTransferPayment();
    }
}

async function processMercadoPagoPayment() {
    await new Promise(res => setTimeout(res, 3000));
const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 5000;

const paymentResult = {
  id: "SIMULADO-" + Date.now(),
  status: "approved",
  amount: total
};


    await createOrder(paymentResult);
}

async function processTransferPayment() {
    await new Promise(res => setTimeout(res, 2000));
    const paymentResult = {
        id: "TR-" + Date.now(),
        status: "pending",
        amount: cart.reduce((sum, item) => sum + item.price * item.qty, 0) + 5000
    };
    await createOrder(paymentResult);
}

// ========================================
// VALIDACIONES
// ========================================

function validateConfirmation() {
    if (!document.getElementById("acceptTerms").checked) {
        showAlert("Debes aceptar los términos y condiciones", "warning");
        return false;
    }
    return true;
}

// ========================================
// MERCADO PAGO
// ========================================

function initializeMercadoPago() {
    console.log("🧪 Simulación de MercadoPago habilitada. No se cargó SDK real.");
}


// ========================================
// MODALES / ALERTAS
// ========================================

function showLoadingModal() {
    new bootstrap.Modal(document.getElementById("loadingModal")).show();
}

function hideLoadingModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    if (modal) modal.hide();
}

function showAlert(message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
}

function showOrderConfirmation(venta, paymentResult) {
    hideLoadingModal();

    const confirmationModal = document.createElement("div");
    confirmationModal.className = "modal fade";
    confirmationModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">
                        <i class="bi bi-check-circle me-2"></i>¡Pedido Confirmado!
                    </h5>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        <h4 class="mt-3">¡Gracias por tu compra!</h4>
                        <p class="text-muted">Tu pedido ha sido procesado exitosamente</p>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información del Pedido</h6>
                            <p><strong>Número de Pedido:</strong> #${venta.idVenta}</p>
                            <p><strong>Total:</strong> $${venta.total.toLocaleString()}</p>
                            <p><strong>Estado:</strong> ${venta.estado}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Información de Pago</h6>
                            <p><strong>Método:</strong> ${venta.metodoPago}</p>
                            <p><strong>Referencia:</strong> ${paymentResult.id}</p>
                            <p><strong>Estado:</strong> ${paymentResult.status}</p>
                        </div>
                    </div>
                    <div class="alert alert-info mt-3">
                        <i class="bi bi-info-circle me-2"></i>
                        Te enviaremos un correo electrónico con los detalles de tu pedido.
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="goToCatalog()">
                        <i class="bi bi-shop me-2"></i>Seguir Comprando
                    </button>
                    <button class="btn btn-success" onclick="verFactura(${venta.idVenta}, ${paymentResult.amount})">
    <i class="bi bi-receipt me-2"></i>Ver Factura
</button>

                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmationModal);
    const modalInstance = new bootstrap.Modal(confirmationModal);
    modalInstance.show();

    confirmationModal.addEventListener("hidden.bs.modal", () => {
        document.body.removeChild(confirmationModal);
    });
}

// ========================================
// NAVEGACIÓN
// ========================================

function goToCatalog() {
    window.location.href = "catalogo.html";
}

function goToOrders() {
  // Mostrar un modal dinámico (puedes crearlo similar al de confirmación)
  showAlert("Pronto podrás ver tus pedidos en una sección dedicada.", "info");
}




// ========================================
// FLUJO DE PASOS DEL CHECKOUT
// ========================================

function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < 3) {
      currentStep++;
      showStep(currentStep);
      updateProgressSteps();
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
    updateProgressSteps();
  }
}

function showStep(step) {
  const steps = document.querySelectorAll(".form-step");
  steps.forEach(s => s.classList.remove("active"));

  const currentStepElement = document.getElementById(`step${step}`);
  if (currentStepElement) {
    currentStepElement.classList.add("active");
  }

  if (step === 2) {
    // Paso de pago: actualizar método seleccionado
    console.log("Paso 2 - Métodos de pago");
  } else if (step === 3) {
    // Paso de confirmación: mostrar resumen
    updateOrderSummary();
  }
}

function updateProgressSteps() {
  const steps = document.querySelectorAll(".step");
  steps.forEach((stepElem, index) => {
    stepElem.classList.remove("active", "completed");

    if (index + 1 < currentStep) {
      stepElem.classList.add("completed");
    } else if (index + 1 === currentStep) {
      stepElem.classList.add("active");
    }
  });
}

function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      return validateCustomerInfo();  // Ya lo tienes implementado
    case 2:
      return validatePaymentMethod(); // Ya lo tienes implementado
    case 3:
      return validateConfirmation();  // Ya lo tienes implementado
    default:
      return true;
  }
}

function validateCustomerInfo() {
  const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode"];
  let isValid = true;

  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      field.classList.add("is-invalid");
      isValid = false;
    } else {
      field.classList.remove("is-invalid");
    }
  });

  const email = document.getElementById("email");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value && !emailRegex.test(email.value)) {
    email.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    showAlert("Por favor completa todos los campos requeridos correctamente", "warning");
  }

  return isValid;
}

function validatePaymentMethod() {
  const selectedMethod = document.querySelector("input[name='paymentMethod']:checked");
  if (!selectedMethod) {
    showAlert("Por favor selecciona un método de pago", "warning");
    return false;
  }
  return true;
}

window.goBack = function () {
    window.history.back();
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioActivo");
  localStorage.removeItem("adminActivo");
  localStorage.removeItem("cart"); // por si guardas el carrito temporalmente

  window.location.href = "login.html";
}

function verFactura(idVenta, total) {
  const fecha = new Date().toLocaleString("es-CO");

  const facturaHTML = `
    <div class="modal fade" id="facturaModal" tabindex="-1" aria-labelledby="facturaLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" style="font-family: 'Segoe UI', sans-serif; padding: 20px;">
          <div class="modal-header" style="background-color: #f8f9fa; color: #212529;">
            <h5 class="modal-title" id="facturaLabel"><i class="bi bi-receipt me-2"></i>Factura Electrónica</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>

          <div class="modal-body">
            <!-- Encabezado -->
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 class="mb-1">MoodBox</h5>
                <p class="mb-0">NIT: 900123456-7</p>
                <p class="mb-0">Carrera 123 #45-67, Bogotá</p>
                <p class="mb-0">Tel: +57 300 123 4567</p>
              </div>
              <div class="text-end">
                <h6 class="mb-1">Factura N° <strong>#${idVenta}</strong></h6>
                <p class="mb-0"><strong>Fecha:</strong> ${fecha}</p>
              </div>
            </div>

            <!-- Cliente -->
            <div class="mb-3">
              <h6>Datos del Cliente</h6>
              <p class="mb-1"><strong>Nombre:</strong> ${JSON.parse(localStorage.getItem("usuario")).nombre}</p>
              <p class="mb-1"><strong>Email:</strong> ${JSON.parse(localStorage.getItem("usuario")).correo}</p>
            </div>

            <!-- Detalle -->
            <h6 class="mt-4 mb-2">Detalle de la Compra</h6>
            <table class="table table-bordered table-sm">
              <thead class="table-light">
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-end">Precio Unitario</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-end">$${item.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                    <td class="text-end">$${(item.price * item.qty).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3" class="text-end">Envío:</th>
                  <td class="text-end">$5.000,00</td>
                </tr>
                <tr>
                  <th colspan="3" class="text-end">Total:</th>
                  <td class="text-end fw-bold text-success">
                    $${total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Pie de página -->
            <div class="text-center mt-4 text-muted" style="font-size: 0.9rem;">
              Esta factura es un comprobante electrónico generado por MoodBox. No requiere firma ni sello.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insertar y mostrar el modal
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = facturaHTML;
  document.body.appendChild(tempDiv);
  const modal = new bootstrap.Modal(tempDiv.querySelector("#facturaModal"));
  modal.show();

  // Limpiar después de cerrar
  tempDiv.querySelector("#facturaModal").addEventListener("hidden.bs.modal", () => {
    tempDiv.remove();
  });
}



// ========================================
// EXPORTAR
// ========================================

window.goToCatalog = goToCatalog;
window.goToOrders = goToOrders;
window.nextStep = nextStep;
window.prevStep = prevStep;