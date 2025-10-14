// Carrito de compras - Funcionalidad completa
let carritoData = {
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0
};

// Variable para manejar la confirmación del modal
let confirmacionCallback = null;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar eventos
    inicializarEventos();
    
    // Sincronizar datos del carrito desde el servidor
    sincronizarCarritoDesdeServidor();
    
    // 🔒 Escuchar cambios de estado de autenticación desde headerUnificado
    document.addEventListener('userStateChanged', function(event) {
        verificarEstadoBotonPago();
        protegerBotonesCarrito();
    });
    
    // 🔒 Escuchar evento de limpieza de autenticación
    document.addEventListener('authStateCleared', function(event) {
        verificarEstadoBotonPago();
        protegerBotonesCarrito();
    });
});

function inicializarEventos() {
    // Evento para proceder al pago (con verificación de autenticación)
    const pagarBtn = document.getElementById('pagarBtn');
    if (pagarBtn) {
        pagarBtn.addEventListener('click', procesarPago);
        
        // 🔒 Verificar estado de autenticación para el botón
        verificarEstadoBotonPago();
    }
    
    // Evento para limpiar carrito
    const limpiarBtn = document.getElementById('limpiarCarritoBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarCarrito);
    }
    
    // 🔒 Proteger todos los botones del carrito
    protegerBotonesCarrito();
    
    // ✨ Evento para el modal de confirmación
    document.getElementById('confirmacionAceptar').addEventListener('click', () => {
        if (confirmacionCallback) {
            confirmacionCallback(true);
            confirmacionCallback = null;
        }
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmacionModal'));
        if (modal) modal.hide();
    });
    
    // ✨ Evento para cuando se cierra el modal sin confirmar
    document.getElementById('confirmacionModal').addEventListener('hidden.bs.modal', () => {
        if (confirmacionCallback) {
            confirmacionCallback(false);
            confirmacionCallback = null;
        }
    });
}

function sincronizarCarritoDesdeServidor() {
    try {
        // Obtener totales desde el DOM (que vienen del servidor)
        const subtotalElement = document.getElementById('subtotalAmount');
        const ivaElement = document.getElementById('ivaAmount');
        const totalElement = document.getElementById('totalAmount');
        
        if (subtotalElement && ivaElement && totalElement) {
            // Limpiar y parsear los valores
            const subtotal = parseInt(subtotalElement.textContent.replace(/[$.,]/g, '')) || 0;
            const iva = parseInt(ivaElement.textContent.replace(/[$.,]/g, '')) || 0;
            const total = parseInt(totalElement.textContent.replace(/[$.,]/g, '')) || 0;
            
            // Actualizar carritoData global
            carritoData.subtotal = subtotal;
            carritoData.iva = iva;
            carritoData.total = total;
            
            // Contar items desde el DOM
            const cartItems = document.querySelectorAll('.cart-item');
            carritoData.items = Array.from(cartItems).map(item => ({
                product: { _id: item.dataset.productId }
            }));
            
            
            
            // 🔒 Proteger botones después de sincronizar
            setTimeout(() => protegerBotonesCarrito(), 100);
        } else {
            console.warn('⚠️ No se encontraron elementos de total en el DOM');
        }
    } catch (error) {
        console.error('❌ Error sincronizando carrito desde servidor:', error);
    }
}

async function cargarCarrito() {
    try {
        mostrarCargando(true);
        
        const response = await fetch('/carrito/api/obtener', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            carritoData = await response.json();
            renderizarCarrito();
            actualizarContadorCarrito(carritoData.itemCount || 0);
        } else if (response.status === 401) {
            // Usuario no autenticado
            window.location.href = '/';
        } else {
            throw new Error('Error al cargar el carrito');
        }
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        mostrarToast('Error al cargar el carrito', 'error');
    } finally {
        mostrarCargando(false);
    }
}

function renderizarCarrito() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');

    if (!carritoData.items || carritoData.items.length === 0) {
        // Mostrar carrito vacío
        cartContent.classList.add('d-none');
        emptyCart.classList.remove('d-none');
        document.getElementById('pagarBtn').disabled = true;
        return;
    }

    // Mostrar contenido del carrito
    cartContent.classList.remove('d-none');
    emptyCart.classList.add('d-none');
    document.getElementById('pagarBtn').disabled = false;

    // Renderizar items
    const itemsHTML = carritoData.items.map(item => {
        const producto = item.product;
        const subtotalItem = item.price * item.quantity;
        
        return `
            <div class="cart-item" data-product-id="${producto._id}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${producto.imagen || '/Imagenes/product-placeholder.svg'}" 
                             alt="${producto.nombre}" 
                             class="product-image">
                    </div>
                    <div class="col-md-4">
                        <h5 class="mb-1">${producto.nombre}</h5>
                        <p class="text-muted mb-1">${producto.categoria}</p>
                        <small class="text-success">
                            <i class="fas fa-check-circle me-1"></i>
                            En stock: ${producto.stock} disponibles
                        </small>
                    </div>
                    <div class="col-md-2">
                        <p class="mb-0 fw-bold">$${Number(item.price).toLocaleString('es-CO')}</p>
                        <small class="text-muted">Precio unitario</small>
                    </div>
                    <div class="col-md-2">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="cambiarCantidad('${producto._id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                   class="quantity-input" 
                                   value="${item.quantity}" 
                                   min="1" 
                                   max="${producto.stock}"
                                   onchange="cambiarCantidad('${producto._id}', this.value)">
                            <button class="quantity-btn" onclick="cambiarCantidad('${producto._id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-1">
                        <p class="mb-0 fw-bold">$${subtotalItem.toLocaleString('es-CO')}</p>
                        <small class="text-muted">Subtotal</small>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="eliminarItem('${producto._id}')"
                                title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    cartItemsContainer.innerHTML = itemsHTML;

    // Actualizar resumen
    actualizarResumen();
}

function actualizarResumen() {
    document.getElementById('subtotalAmount').textContent = `$${Number(carritoData.subtotal || 0).toLocaleString('es-CO')}`;
    document.getElementById('ivaAmount').textContent = `$${Number(carritoData.iva || 0).toLocaleString('es-CO')}`;
    document.getElementById('totalAmount').textContent = `$${Number(carritoData.total || 0).toLocaleString('es-CO')}`;
}

async function cambiarCantidad(productId, nuevaCantidad) {
    try {
        // 🔒 VERIFICAR AUTENTICACIÓN ANTES DE CAMBIAR CANTIDAD
        if (!verificarAutenticacion()) {
            return; // La función ya maneja el error y redirección
        }

        nuevaCantidad = parseInt(nuevaCantidad);
        
        if (nuevaCantidad < 0) {
            return;
        }

        // Deshabilitar controles temporalmente
        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (cartItem) {
            const controls = cartItem.querySelectorAll('button, input');
            controls.forEach(control => control.disabled = true);
        }

        const response = await fetch(`/carrito/api/actualizar/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ quantity: nuevaCantidad })
        });

        const data = await response.json();

        if (response.ok) {
            // Recargar la página para sincronizar con el servidor
            window.location.reload();
        } else {
            mostrarToast(data.mensaje || 'Error al actualizar cantidad', 'error');
            // Rehabilitar controles en caso de error
            if (cartItem) {
                const controls = cartItem.querySelectorAll('button, input');
                controls.forEach(control => control.disabled = false);
            }
        }
    } catch (error) {
        console.error('Error al cambiar cantidad:', error);
        mostrarToast('Error al actualizar cantidad', 'error');
        // Rehabilitar controles en caso de error
        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (cartItem) {
            const controls = cartItem.querySelectorAll('button, input');
            controls.forEach(control => control.disabled = false);
        }
    }
}

// Hacer la función global para que funcione desde EJS
window.cambiarCantidad = cambiarCantidad;

async function eliminarItem(productId) {
    try {
        // 🔒 VERIFICAR AUTENTICACIÓN ANTES DE ELIMINAR
        if (!verificarAutenticacion()) {
            return; // La función ya maneja el error y redirección
        }

        // ✨ Usar modal de confirmación elegante
        const confirmacion = await mostrarConfirmacion(
            'Eliminar Producto',
            '¿Estás seguro de que deseas eliminar este producto del carrito?',
            'fa-trash-alt',
            'text-danger'
        );
        
        if (!confirmacion) return;

        const response = await fetch(`/carrito/api/eliminar/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // Recargar la página para sincronizar con el servidor
            window.location.reload();
        } else {
            mostrarToast(data.mensaje || 'Error al eliminar producto', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar item:', error);
        mostrarToast('Error al eliminar producto', 'error');
    }
}

// Hacer la función global para que funcione desde EJS
window.eliminarItem = eliminarItem;

async function mostrarFacturaModal() {
    try {
        
        
        // Obtener información del usuario
        const userInfo = await obtenerInformacionUsuario();
        
        // Llenar información del cliente
        llenarInformacionCliente(userInfo);
        
        // Llenar productos de la factura
        llenarProductosFactura();
        
        // Llenar totales
        llenarTotalesFactura();
        
        // Generar número de factura y fecha
        generarDatosFactura();
        
        // Configurar evento del botón confirmar
        configurarBotonConfirmar();
        
        // Mostrar el modal
        const facturaModal = new bootstrap.Modal(document.getElementById('facturaModal'));
        facturaModal.show();
        
        
        
    } catch (error) {
        console.error('❌ Error mostrando factura modal:', error);
        mostrarToast('Error al preparar la factura', 'error');
    }
}

async function obtenerInformacionUsuario() {
    try {
        // Obtener info del usuario desde el token o API
        const token = localStorage.getItem('token');
        if (token) {
            const response = await fetch('/auth/perfil', {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            }
        }
        
        // Fallback: obtener del DOM o headerUnificado
        if (window.headerUnificado && window.headerUnificado.userInfo) {
            return window.headerUnificado.userInfo;
        }
        
        return {
            nombre: 'Cliente',
            email: 'cliente@example.com',
            telefono: 'No disponible',
            direccion: 'No disponible'
        };
    } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
        return {
            nombre: 'Cliente',
            email: 'cliente@example.com',
            telefono: 'No disponible',
            direccion: 'No disponible'
        };
    }
}

function llenarInformacionCliente(userInfo) {
    document.getElementById('customerName').textContent = userInfo.nombre || 'Cliente';
    document.getElementById('customerEmail').textContent = userInfo.email || 'No disponible';
    document.getElementById('customerPhone').textContent = userInfo.telefono || 'No disponible';
    document.getElementById('customerAddress').textContent = userInfo.direccion || 'No disponible';
}

function llenarProductosFactura() {
    const cartItems = document.querySelectorAll('.cart-item');
    const tbody = document.getElementById('invoiceItemsBody');
    tbody.innerHTML = '';
    
    cartItems.forEach(item => {
        const productName = item.querySelector('h5')?.textContent || 'Producto';
        const productCategory = item.querySelector('.text-muted')?.textContent || '';
        const quantity = item.querySelector('.quantity-display')?.textContent || '1';
        const priceElement = item.querySelector('.fw-bold');
        const priceText = priceElement ? priceElement.textContent.replace('$', '').replace(/[.,]/g, '') : '0';
        const unitPrice = parseInt(priceText) || 0;
        const subtotal = unitPrice * parseInt(quantity);
        
        const row = document.createElement('tr');
        row.className = 'invoice-item-row';
        row.innerHTML = `
            <td>
                <div class="invoice-product-name">${productName}</div>
                <div class="invoice-product-category">${productCategory}</div>
            </td>
            <td class="text-center">${quantity}</td>
            <td class="text-end">$${unitPrice.toLocaleString('es-CO')}</td>
            <td class="text-end fw-bold">$${subtotal.toLocaleString('es-CO')}</td>
        `;
        tbody.appendChild(row);
    });
}

function llenarTotalesFactura() {
    const subtotalElement = document.getElementById('subtotalAmount');
    const ivaElement = document.getElementById('ivaAmount');
    const totalElement = document.getElementById('totalAmount');
    
    const subtotal = subtotalElement ? subtotalElement.textContent : '$0';
    const iva = ivaElement ? ivaElement.textContent : '$0';
    const total = totalElement ? totalElement.textContent : '$0';
    
    document.getElementById('invoiceSubtotal').textContent = subtotal;
    document.getElementById('invoiceIva').textContent = iva;
    document.getElementById('invoiceTotal').textContent = total;
}

function generarDatosFactura() {
    // Generar número de factura único
    const now = new Date();
    const invoiceNumber = `FAC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Formatear fecha
    const invoiceDate = now.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('invoiceNumber').textContent = invoiceNumber;
    document.getElementById('invoiceDate').textContent = invoiceDate;
}

function configurarBotonConfirmar() {
    const confirmarBtn = document.getElementById('confirmarPagoBtn');
    
    // Remover listeners previos
    const newBtn = confirmarBtn.cloneNode(true);
    confirmarBtn.parentNode.replaceChild(newBtn, confirmarBtn);
    
    // Agregar nuevo listener
    newBtn.addEventListener('click', async () => {
        try {
            // Cerrar modal
            const facturaModal = bootstrap.Modal.getInstance(document.getElementById('facturaModal'));
            facturaModal.hide();
            
            // Proceder con el pago en Mercado Pago
            await procesarPagoMercadoPago();
            
        } catch (error) {
            console.error('Error al confirmar pago:', error);
            mostrarToast('Error al procesar el pago', 'error');
        }
    });
}

async function procesarPagoMercadoPago() {
    try {
        mostrarCargando(true);

        // Obtener items del localStorage
        const cart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
        
        if (cart.length === 0) {
            mostrarToast('El carrito está vacío', 'error');
            return;
        }

        

        // Crear preferencia en Mercado Pago con items del localStorage
        const response = await fetch('/mercadopago/create-preference', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: cart })
        });

        const data = await response.json();

        if (response.ok) {
            // ✨ Mostrar modal profesional de redirección
            mostrarModalRedirección();
            
            // Redirigir a la pasarela de pago
            setTimeout(() => {
                // Usar sandbox_init_point para modo prueba
                window.location.href = data.sandboxInitPoint || data.initPoint;
            }, 2500);
        } else {
            mostrarToast(data.mensaje || 'Error al crear preferencia de pago', 'error');
        }
    } catch (error) {
        console.error('Error al procesar pago en Mercado Pago:', error);
        mostrarToast('Error al procesar el pago', 'error');
    } finally {
        mostrarCargando(false);
    }
}

async function limpiarCarrito() {
    try {
        // 🔒 VERIFICAR AUTENTICACIÓN ANTES DE LIMPIAR CARRITO
        if (!verificarAutenticacion()) {
            return; // La función ya maneja el error y redirección
        }

        // Verificar si hay productos en el DOM en lugar de en carritoData
        const cartItems = document.querySelectorAll('.cart-item');
        if (cartItems.length === 0) {
            mostrarToast('El carrito ya está vacío', 'info');
            return;
        }

        // ✨ Usar modal de confirmación elegante
        const confirmacion = await mostrarConfirmacion(
            'Limpiar Carrito',
            '¿Estás seguro de que deseas limpiar todo el carrito? Esta acción no se puede deshacer.',
            'fa-broom',
            'text-warning'
        );
        
        if (!confirmacion) return;

        mostrarCargando(true);

        const response = await fetch('/carrito/api/limpiar', {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            carritoData = data.cart;
            // Recargar la página para sincronizar con el servidor
            window.location.reload();
        } else {
            mostrarToast(data.mensaje || 'Error al limpiar carrito', 'error');
        }
    } catch (error) {
        console.error('Error al limpiar carrito:', error);
        mostrarToast('Error al limpiar carrito', 'error');
    } finally {
        mostrarCargando(false);
    }
}

async function procesarPago() {
    try {
        // 🔒 VERIFICAR AUTENTICACIÓN ANTES DE PROCEDER
        if (!verificarAutenticacion()) {
            return; // La función ya maneja el error y redirección
        }

        // Verificar si hay productos en el DOM
        const cartItems = document.querySelectorAll('.cart-item');
        if (cartItems.length === 0) {
            mostrarToast('No hay productos en el carrito', 'warning');
            return;
        }

        // Obtener el total del DOM con debug mejorado
        const totalElement = document.getElementById('totalAmount');
        
        
        let totalAmount = 0;
        
        if (totalElement && totalElement.textContent) {
            // Limpiar el texto del total
            const totalText = totalElement.textContent
                .replace('$', '')           // Quitar símbolo de peso
                .replace(/\./g, '')         // Quitar puntos de miles (formato colombiano)
                .replace(/,/g, '')          // Quitar comas si las hay
                .trim();                    // Quitar espacios
                
            totalAmount = parseInt(totalText) || 0;
        }
        
        // Verificar que el total sea válido
        if (isNaN(totalAmount) || totalAmount <= 0) {
            console.error('Total inválido:', totalAmount);
            
            // Intentar obtener el total desde carritoData como fallback
            if (carritoData && carritoData.total) {
                totalAmount = carritoData.total;
            } else {
                mostrarToast('Error: No se pudo calcular el total del carrito', 'error');
                return;
            }
        }
        
        // Mostrar factura modal en lugar del confirm
        await mostrarFacturaModal();

    } catch (error) {
        console.error('Error al procesar pago:', error);
        mostrarToast('Error al procesar el pago', 'error');
    }
}

// Funciones auxiliares
function mostrarCargando(mostrar) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = mostrar ? 'flex' : 'none';
}

function mostrarToast(mensaje, tipo = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    // Agregar al contenedor de toasts
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);
    
    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Eliminar elemento después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function actualizarContadorCarrito(cantidad) {
    const contador = document.getElementById('carritoContador');
    if (contador) {
        contador.textContent = cantidad;
        contador.style.display = cantidad > 0 ? 'inline' : 'none';
    }
}

// ✨ Función para mostrar modal de confirmación elegante
function mostrarConfirmacion(titulo, mensaje, iconoClase = 'fa-question-circle', iconoColor = 'text-warning') {
    return new Promise((resolve) => {
        // Configurar el contenido del modal
        document.getElementById('confirmacionModalLabel').textContent = titulo;
        document.getElementById('confirmacionMensaje').textContent = mensaje;
        
        // Configurar el icono
        const icono = document.getElementById('confirmacionIcon');
        icono.className = `fas ${iconoClase} ${iconoColor}`;
        icono.style.fontSize = '3rem';
        
        // Configurar el callback
        confirmacionCallback = resolve;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('confirmacionModal'));
        modal.show();
    });
}

// ✨ Función para mostrar modal profesional de redirección
function mostrarModalRedirección() {
    // Crear overlay de fondo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;

    // Crear modal de redirección
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.5s ease-out;
    `;

    modal.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                <i class="fas fa-credit-card text-white" style="font-size: 2rem;"></i>
            </div>
            <h3 style="color: #2c3e50; margin-bottom: 10px; font-weight: 600;">Procesando Pago</h3>
            <p style="color: #6c757d; font-size: 16px; margin-bottom: 20px;">
                Te estamos redirigiendo a nuestra pasarela de pago segura
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #28a745;">
                <i class="fas fa-shield-alt"></i>
                <span style="font-size: 14px; font-weight: 500;">Conexión SSL segura</span>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(90deg, #28a745, #20c997); width: 0%; animation: progressBar 2.5s ease-out forwards;"></div>
            </div>
            <p style="color: #6c757d; font-size: 12px; margin-top: 10px;">
                Por favor espera, no cierres esta ventana...
            </p>
        </div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 20px rgba(40, 167, 69, 0.3);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(40, 167, 69, 0.5);
            }
        }
        
        @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
        }
    `;
    
    document.head.appendChild(style);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Limpiar después de la redirección
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

// Cargar contador del carrito al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/carrito/api/obtener', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            actualizarContadorCarrito(data.itemCount || 0);
        }
    } catch (error) {
        console.error('Error al cargar contador del carrito:', error);
    }
});

// 🔒 Función para verificar autenticación antes de proceder al pago
function verificarAutenticacion() {
    try {
        // Verificar si hay token en localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No hay token de autenticación');
            mostrarErrorAutenticacion();
            return false;
        }

        // Verificar si el token no está expirado
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            
            if (payload.exp && payload.exp < now) {
                console.log('❌ Token expirado');
                mostrarErrorAutenticacion();
                return false;
            }

            // Verificar el rol del usuario
            if (payload.rol === 'admin') {
                mostrarToast('Los administradores no pueden realizar compras', 'error');
                return false;
            }

            console.log('✅ Usuario autenticado:', payload.email);
            return true;

        } catch (error) {
            console.error('❌ Error al decodificar token:', error);
            mostrarErrorAutenticacion();
            return false;
        }

    } catch (error) {
        console.error('❌ Error en verificación de autenticación:', error);
        mostrarErrorAutenticacion();
        return false;
    }
}

// 🔒 Función para mostrar error de autenticación y redirigir al login
function mostrarErrorAutenticacion() {
    console.log('🔒 Mostrando error de autenticación');
    
    // Guardar la URL actual para redirigir después del login
    try {
        sessionStorage.setItem('postLoginRedirect', window.location.pathname);
    } catch (e) {
        console.warn('No se pudo guardar redirect:', e);
    }
    
    // Intentar usar las modales bonitas si están disponibles
    if (typeof showModal !== 'undefined' && showModal.error) {
        showModal.error(
            'Autenticación Requerida',
            'Debes iniciar sesión para proceder al pago. Te redirigiremos al login.',
            () => {
                // Callback cuando se cierre la modal
                mostrarModalLogin();
            }
        );
    } else {
        // Fallback a toast si no hay modales bonitas
        mostrarToast('Debes iniciar sesión para proceder al pago', 'error');
        
        // Esperar un momento antes de mostrar el modal de login
        setTimeout(() => {
            mostrarModalLogin();
        }, 1500);
    }
}

// 🔒 Función auxiliar para mostrar modal de login
function mostrarModalLogin() {
    // Intentar abrir el modal de login si existe
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        const modal = new bootstrap.Modal(loginModal);
        modal.show();
    } else {
        // Si no hay modal, redirigir a la página principal
        console.log('🔄 No hay modal de login, redirigiendo a página principal');
        window.location.href = '/?needLogin=true';
    }
}

// 🔒 Función para verificar autenticación al cargar la página
function verificarAccesoCarrito() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ Sin token, redirigiendo...');
        window.location.href = '/restriccion?reason=unauthorized';
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp && payload.exp < now) {
            console.log('❌ Token expirado, redirigiendo...');
            localStorage.removeItem('token');
            window.location.href = '/restriccion?reason=expired';
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Token inválido, redirigiendo...');
        localStorage.removeItem('token');
        window.location.href = '/restriccion?reason=invalid';
        return false;
    }
}

// 🔒 Función para verificar el estado del botón de pago
function verificarEstadoBotonPago() {
    const pagarBtn = document.getElementById('pagarBtn');
    if (!pagarBtn) return;

    const token = localStorage.getItem('token');
    
    if (!token) {
        // Sin token: cambiar texto y estilo del botón
        pagarBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Inicia sesión para pagar';
        pagarBtn.classList.remove('btn-pagar');
        pagarBtn.classList.add('btn-warning');
        pagarBtn.title = 'Debes iniciar sesión para proceder al pago';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp && payload.exp < now) {
            // Token expirado
            pagarBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sesión expirada - Inicia sesión';
            pagarBtn.classList.remove('btn-pagar');
            pagarBtn.classList.add('btn-warning');
            pagarBtn.title = 'Tu sesión ha expirado, inicia sesión nuevamente';
            return;
        }

        if (payload.rol === 'admin') {
            // Admin no puede comprar
            pagarBtn.innerHTML = '<i class="fas fa-ban me-2"></i>Admins no pueden comprar';
            pagarBtn.classList.remove('btn-pagar');
            pagarBtn.classList.add('btn-secondary');
            pagarBtn.disabled = true;
            pagarBtn.title = 'Los administradores no pueden realizar compras';
            return;
        }

        // Usuario válido: restaurar botón normal
        pagarBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Proceder al pago';
        pagarBtn.classList.remove('btn-warning', 'btn-secondary');
        pagarBtn.classList.add('btn-pagar');
        pagarBtn.disabled = false;
        pagarBtn.title = 'Proceder al pago con Mercado Pago';

    } catch (error) {
        // Token inválido
        pagarBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Token inválido - Inicia sesión';
        pagarBtn.classList.remove('btn-pagar');
        pagarBtn.classList.add('btn-warning');
        pagarBtn.title = 'Token de sesión inválido, inicia sesión nuevamente';
    }
}

// 🔒 Función para proteger todos los botones del carrito
function protegerBotonesCarrito() {
    const token = localStorage.getItem('token');
    const isAuthenticated = token && verificarTokenValido(token);
    
    console.log('🔒 Protegiendo botones del carrito. Autenticado:', isAuthenticated);
    
    // Proteger botones de cantidad
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    quantityButtons.forEach(btn => {
        if (!isAuthenticated) {
            btn.disabled = true;
            btn.title = 'Inicia sesión para modificar la cantidad';
            btn.classList.add('auth-required-tooltip');
            btn.style.opacity = '0.5';
        } else {
            btn.disabled = false;
            btn.title = '';
            btn.classList.remove('auth-required-tooltip');
            btn.style.opacity = '1';
        }
    });
    
    // Proteger inputs de cantidad
    const quantityInputs = document.querySelectorAll('input[onchange*="cambiarCantidad"]');
    quantityInputs.forEach(input => {
        if (!isAuthenticated) {
            input.disabled = true;
            input.title = 'Inicia sesión para modificar la cantidad';
            input.classList.add('auth-required-tooltip');
            input.style.opacity = '0.5';
        } else {
            input.disabled = false;
            input.title = '';
            input.classList.remove('auth-required-tooltip');
            input.style.opacity = '1';
        }
    });
    
    // Proteger botones de eliminar
    const deleteButtons = document.querySelectorAll('[onclick*="eliminarItem"]');
    deleteButtons.forEach(btn => {
        if (!isAuthenticated) {
            btn.disabled = true;
            btn.title = 'Inicia sesión para eliminar productos';
            btn.classList.add('auth-required-tooltip');
            btn.style.opacity = '0.5';
        } else {
            btn.disabled = false;
            btn.title = 'Eliminar producto del carrito';
            btn.classList.remove('auth-required-tooltip');
            btn.style.opacity = '1';
        }
    });
    
    // Proteger botón de limpiar carrito
    const limpiarBtn = document.getElementById('limpiarCarritoBtn');
    if (limpiarBtn) {
        if (!isAuthenticated) {
            limpiarBtn.disabled = true;
            limpiarBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Inicia sesión para limpiar';
            limpiarBtn.title = 'Inicia sesión para limpiar el carrito';
            limpiarBtn.classList.add('btn-protected-disabled');
        } else {
            limpiarBtn.disabled = false;
            limpiarBtn.innerHTML = '<i class="fas fa-trash me-2"></i>Limpiar carrito';
            limpiarBtn.title = 'Limpiar todo el carrito';
            limpiarBtn.classList.remove('btn-protected-disabled');
        }
    }
}

// 🔒 Función auxiliar para verificar si un token es válido
function verificarTokenValido(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        return payload.exp && payload.exp > now;
    } catch (error) {
        return false;
    }
}

// Verificar acceso al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    verificarAccesoCarrito();
});