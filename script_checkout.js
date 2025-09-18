// ========================================
// CHECKOUT SCRIPT
// ========================================

// Variables globales
let currentStep = 1;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let mercadopago = null;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("🛒 Checkout inicializado");
    
    // Cargar componentes
    loadComponents();
    
    // Verificar si hay productos en el carrito
    if (cart.length === 0) {
        showAlert("No hay productos en el carrito", "warning");
        setTimeout(() => {
            window.location.href = "catalogo.html";
        }, 2000);
        return;
    }
    
    // Verificar autenticación
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    if (usuarioActivo !== "true") {
        showAlert("Debes iniciar sesión para continuar", "warning");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
        return;
    }
    
    // Cargar datos del usuario
    loadUserData();
    
    // Inicializar MercadoPago
    initializeMercadoPago();
    
    // Renderizar resumen del carrito
    renderCartSummary();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar totales
    updateTotals();
});

// ========================================
// FUNCIONES DE INICIALIZACIÓN
// ========================================

async function loadComponents() {
    try {
        // Cargar navbar
        const navbarResponse = await fetch('./componentes/nav.html');
        const navbarContent = await navbarResponse.text();
        document.getElementById('navbar-container').innerHTML = navbarContent;
        
        // Cargar footer
        const footerResponse = await fetch('./componentes/footer.html');
        const footerContent = await footerResponse.text();
        document.getElementById('footer-container').innerHTML = footerContent;
        
        // Configurar navbar después de cargar
        setupNavbar();
        
        console.log("✅ Componentes cargados correctamente");
    } catch (error) {
        console.error("❌ Error cargando componentes:", error);
    }
}

function setupNavbar() {
    // Agregar funcionalidad de sesión a la navbar si es necesario
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    const adminActivo = localStorage.getItem("adminActivo");
    
    if (usuarioActivo === "true" || adminActivo === "true") {
        console.log("👤 Usuario autenticado detectado en navbar");
        setupProfileDropdown();
    }
}

function setupProfileDropdown() {
    const perfilOpciones = document.getElementById('perfilOpciones');
    const navFotoPerfil = document.getElementById('navFotoPerfil');
    
    if (!perfilOpciones || !navFotoPerfil) return;
    
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    const adminActivo = localStorage.getItem("adminActivo");
    
    if (usuarioActivo === "true") {
        // Usuario normal
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario && usuario.foto) {
            navFotoPerfil.src = usuario.foto;
        }
        
        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="showProfileModal()">
                <i class="bi bi-person me-2"></i>Mi Perfil
            </a></li>
            <li><a class="dropdown-item" href="catalogo.html">
                <i class="bi bi-shop me-2"></i>Catálogo
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
            </a></li>
        `;
    } else if (adminActivo === "true") {
        // Administrador
        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="adminview.html">
                <i class="bi bi-gear me-2"></i>Panel Admin
            </a></li>
            <li><a class="dropdown-item" href="catalogo.html">
                <i class="bi bi-shop me-2"></i>Catálogo
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
            </a></li>
        `;
    } else {
        // Usuario no autenticado
        perfilOpciones.innerHTML = `
            <li><a class="dropdown-item" href="login.html">
                <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
            </a></li>
            <li><a class="dropdown-item" href="register.html">
                <i class="bi bi-person-plus me-2"></i>Registrarse
            </a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("adminActivo");
    localStorage.removeItem("usuario");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("admin");
    
    showAlert("Sesión cerrada correctamente", "success");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

function showProfileModal() {
    // Esta función se puede implementar si se necesita un modal de perfil
    console.log("Mostrar modal de perfil");
}

function loadUserData() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) {
        document.getElementById("firstName").value = usuario.nombre || "";
        document.getElementById("lastName").value = usuario.apellido || "";
        document.getElementById("email").value = usuario.correo || "";
        document.getElementById("phone").value = usuario.telefono || "";
    }
}

async function initializeMercadoPago() {
    try {
        // Inicializar MercadoPago SDK
        mercadopago = new MercadoPago("TEST-12345678-1234-1234-1234-123456789012", {
            locale: "es-CO"
        });
        console.log("✅ MercadoPago inicializado");
    } catch (error) {
        console.error("❌ Error inicializando MercadoPago:", error);
    }
}

function setupEventListeners() {
    // Formulario de checkout
    const checkoutForm = document.getElementById("checkoutForm");
    checkoutForm.addEventListener("submit", handleFormSubmit);
    
    // Métodos de pago
    const paymentOptions = document.querySelectorAll(".payment-option");
    paymentOptions.forEach(option => {
        option.addEventListener("click", () => selectPaymentMethod(option));
    });
}

// Ya no hay formularios de pago que formatear

// ========================================
// NAVEGACIÓN ENTRE PASOS
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
    // Ocultar todos los pasos
    const steps = document.querySelectorAll(".form-step");
    steps.forEach(s => s.classList.remove("active"));
    
    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add("active");
    }
    
    // Acciones específicas por paso
    if (step === 2) {
        updatePaymentInfo();
    } else if (step === 3) {
        updateOrderSummary();
    }
}

function updateProgressSteps() {
    const steps = document.querySelectorAll(".step");
    steps.forEach((step, index) => {
        step.classList.remove("active", "completed");
        if (index + 1 < currentStep) {
            step.classList.add("completed");
        } else if (index + 1 === currentStep) {
            step.classList.add("active");
        }
    });
}

// ========================================
// VALIDACIÓN DE FORMULARIOS
// ========================================

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateCustomerInfo();
        case 2:
            return validatePaymentMethod();
        case 3:
            return validateConfirmation();
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
    
    // Validar email
    const email = document.getElementById("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailRegex.test(email.value)) {
        email.classList.add("is-invalid");
        isValid = false;
    }
    
    if (!isValid) {
        showAlert("Por favor completa todos los campos requeridos", "warning");
    }
    
    return isValid;
}

function validatePaymentMethod() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!selectedMethod) {
        showAlert("Por favor selecciona un método de pago", "warning");
        return false;
    }
    
    return true;
}

// Ya no hay campos de tarjeta que validar

function validateConfirmation() {
    const acceptTerms = document.getElementById("acceptTerms");
    if (!acceptTerms.checked) {
        showAlert("Debes aceptar los términos y condiciones", "warning");
        return false;
    }
    return true;
}

// ========================================
// MÉTODOS DE PAGO
// ========================================

function selectPaymentMethod(option) {
    // Remover selección anterior
    document.querySelectorAll(".payment-option").forEach(opt => {
        opt.classList.remove("active");
    });
    
    // Seleccionar opción actual
    option.classList.add("active");
    
    // Actualizar radio button
    const radio = option.querySelector('input[type="radio"]');
    radio.checked = true;
}

// Ya no hay secciones de formularios que mostrar/ocultar

// Ya no hay campos de formulario que formatear

// ========================================
// RENDERIZADO
// ========================================

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
            <div class="cart-item-price">$${(item.price * item.qty).toLocaleString()}</div>
        </div>
    `).join("");
}

function updateOrderSummary() {
    // Actualizar items del pedido
    const orderItems = document.getElementById("orderItems");
    if (orderItems) {
        orderItems.innerHTML = cart.map(item => `
            <div class="d-flex justify-content-between mb-2">
                <span>${item.name} x${item.qty}</span>
                <span>$${(item.price * item.qty).toLocaleString()}</span>
            </div>
        `).join("");
    }
    
    // Actualizar información de envío
    const shippingInfo = document.getElementById("shippingInfo");
    if (shippingInfo) {
        const address = document.getElementById("address").value;
        const city = document.getElementById("city").value;
        const state = document.getElementById("state").value;
        const zipCode = document.getElementById("zipCode").value;
        
        shippingInfo.innerHTML = `
            <p><strong>Dirección:</strong> ${address}</p>
            <p><strong>Ciudad:</strong> ${city}, ${state}</p>
            <p><strong>Código Postal:</strong> ${zipCode}</p>
        `;
    }
    
    // Actualizar información de pago
    const paymentInfo = document.getElementById("paymentInfo");
    if (paymentInfo) {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedMethod) {
            const methodName = selectedMethod.value === "mercadopago" ? "MercadoPago" : "Transferencia Bancaria";
            paymentInfo.innerHTML = `<p><strong>Método:</strong> ${methodName}</p>`;
        }
    }
}

function updatePaymentInfo() {
    // Esta función se ejecuta cuando se va al paso 2
    console.log("Actualizando información de pago");
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = 5000; // Costo fijo de envío
    const total = subtotal + shipping;
    
    // Actualizar en el sidebar
    document.getElementById("sidebarSubtotal").textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById("sidebarShipping").textContent = `$${shipping.toLocaleString()}`;
    document.getElementById("sidebarTotal").textContent = `$${total.toLocaleString()}`;
    
    // Actualizar en el resumen del pedido
    document.getElementById("subtotal").textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById("shipping").textContent = `$${shipping.toLocaleString()}`;
    document.getElementById("total").textContent = `$${total.toLocaleString()}`;
}

// ========================================
// MANEJO DEL FORMULARIO
// ========================================

async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateConfirmation()) {
        return;
    }
    
    // Mostrar loading
    showLoadingModal();
    
    try {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        
        if (selectedMethod.value === "mercadopago") {
            await processMercadoPagoPayment();
        } else if (selectedMethod.value === "transfer") {
            await processTransferPayment();
        }
        
    } catch (error) {
        console.error("❌ Error procesando pago:", error);
        hideLoadingModal();
        showAlert(`Error procesando el pago: ${error.message}`, "error");
    }
}

async function processMercadoPagoPayment() {
    try {
        // Simular procesamiento de pago con MercadoPago
        console.log("🔄 Procesando pago con MercadoPago...");
        
        // Aquí iría la integración real con MercadoPago
        // Por ahora simulamos un delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simular respuesta exitosa
        const paymentResult = {
            id: "MP-" + Date.now(),
            status: "approved",
            amount: cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 5000
        };
        
        console.log("✅ Pago procesado:", paymentResult);
        
        // Crear venta en el backend
        await createOrder(paymentResult);
        
    } catch (error) {
        throw new Error("Error procesando pago con MercadoPago");
    }
}

async function processTransferPayment() {
    try {
        console.log("🔄 Procesando pago por transferencia...");
        
        // Simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const paymentResult = {
            id: "TR-" + Date.now(),
            status: "pending",
            amount: cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 5000
        };
        
        console.log("✅ Transferencia registrada:", paymentResult);
        
        // Crear venta en el backend
        await createOrder(paymentResult);
        
    } catch (error) {
        throw new Error("Error procesando transferencia");
    }
}

async function createOrder(paymentResult) {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 5000;
        
        // Crear venta
        const ventaData = {
            idUsuario: usuario.idUsuario,
            total: total,
            estado: paymentResult.status === "approved" ? "pagada" : "pendiente",
            metodoPago: paymentResult.id.startsWith("MP") ? "mercadopago" : "transferencia"
        };
        
        console.log("🛒 Creando venta:", ventaData);
        
        // Aquí iría la llamada real a la API
        // const response = await fetch("http://localhost:8080/api/ventas", { ... });
        
        // Simular creación exitosa
        const venta = {
            idVenta: Date.now(),
            ...ventaData
        };
        
        console.log("✅ Venta creada:", venta);
        
        // Limpiar carrito
        cart = [];
        localStorage.removeItem("cart");
        
        // Mostrar confirmación
        hideLoadingModal();
        showOrderConfirmation(venta, paymentResult);
        
    } catch (error) {
        throw new Error("Error creando la orden");
    }
}

// ========================================
// CONFIRMACIÓN DE PEDIDO
// ========================================

function showOrderConfirmation(venta, paymentResult) {
    const modal = new bootstrap.Modal(document.getElementById("loadingModal"));
    modal.hide();
    
    // Crear modal de confirmación
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
                    <button type="button" class="btn btn-primary" onclick="goToCatalog()">
                        <i class="bi bi-shop me-2"></i>Continuar Comprando
                    </button>
                    <button type="button" class="btn btn-success" onclick="goToOrders()">
                        <i class="bi bi-list-check me-2"></i>Ver Mis Pedidos
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationModal);
    const modalInstance = new bootstrap.Modal(confirmationModal);
    modalInstance.show();
    
    // Limpiar modal después de cerrar
    confirmationModal.addEventListener("hidden.bs.modal", () => {
        document.body.removeChild(confirmationModal);
    });
}

// ========================================
// UTILIDADES
// ========================================

function showLoadingModal() {
    const modal = new bootstrap.Modal(document.getElementById("loadingModal"));
    modal.show();
}

function hideLoadingModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    if (modal) {
        modal.hide();
    }
}

function showAlert(message, type = "info") {
    // Crear alerta temporal
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function goBack() {
    window.history.back();
}

function goToCatalog() {
    window.location.href = "catalogo.html";
}

function goToOrders() {
    // Aquí iría la página de pedidos del usuario
    window.location.href = "catalogo.html";
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

window.nextStep = nextStep;
window.prevStep = prevStep;
window.goBack = goBack;
window.goToCatalog = goToCatalog;
window.goToOrders = goToOrders;
