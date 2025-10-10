// Carrito de compras - Sistema localStorage
let carritoData = {
    items: [],
    subtotal: 0,
    total: 0
};

// Variable para manejar la confirmación del modal
let confirmacionCallback = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Inicializando carrito localStorage');
    
    // Inicializar eventos
    inicializarEventos();
    
    // Cargar carrito desde localStorage
    cargarCarritoDesdeLocalStorage();
    
    // Escuchar evento de carrito vaciado desde pago exitoso
    window.addEventListener('carritoVaciado', function(event) {
        console.log('🎉 Carrito vaciado detectado:', event.detail);
        if (event.detail.origen === 'pagoExitoso') {
            mostrarMensajePagoExitoso();
        }
    });
    
    // Escuchar cambios de estado de autenticación
    document.addEventListener('userStateChanged', function(event) {
        console.log('🔄 Estado de usuario cambió, actualizando protecciones del carrito');
        verificarEstadoBotonPago();
    });
});

function inicializarEventos() {
    // Evento para proceder al pago (con verificación de autenticación)
    const pagarBtn = document.getElementById('pagarBtn');
    if (pagarBtn) {
        pagarBtn.addEventListener('click', procesarPago);
        verificarEstadoBotonPago();
    }
    
    // Evento para limpiar carrito
    const limpiarBtn = document.getElementById('limpiarCarritoBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarCarrito);
    }
    
    // Eventos delegados para botones dinámicos
    document.addEventListener('click', function(e) {
        console.log('🖱️ Click detectado en:', e.target.tagName, e.target.className);
        
        // Buscar el botón más cercano para manejar clics en iconos
        let target = e.target.closest('.btn-eliminar-item, .btn-cantidad-menos, .btn-cantidad-mas');
        
        if (target) {
            console.log('🔍 Botón encontrado:', target.className, 'ProductID:', target.dataset.productId);
            e.preventDefault(); // Prevenir comportamiento por defecto
            e.stopPropagation(); // Detener propagación
            
            if (target.classList.contains('btn-eliminar-item')) {
                console.log('🗑️ Iniciando eliminación de producto');
                eliminarDelCarrito(target.dataset.productId);
            } else if (target.classList.contains('btn-cantidad-menos')) {
                console.log('➖ Disminuyendo cantidad');
                cambiarCantidad(target.dataset.productId, -1);
            } else if (target.classList.contains('btn-cantidad-mas')) {
                console.log('➕ Aumentando cantidad');
                cambiarCantidad(target.dataset.productId, 1);
            }
        } else {
            console.log('❌ No se encontró botón objetivo para:', e.target.className);
        }
    });
    
    // Eventos para inputs de cantidad
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('cantidad-input')) {
            const nuevaCantidad = parseInt(e.target.value) || 1;
            actualizarCantidadDirecta(e.target.dataset.productId, nuevaCantidad);
        }
    });
}

// === FUNCIONES DE LOCALSTORAGE ===

function cargarCarritoDesdeLocalStorage() {
    try {
        const rawData = localStorage.getItem('petmarket_cart');
        console.log('🔍 Raw localStorage data:', rawData);
        
        const cartData = JSON.parse(rawData || '[]');
        console.log('🔍 Parsed cart data:', cartData);
        
        // MIGRACIÓN: Agregar categoría a productos existentes que no la tengan
        const migratedCartData = cartData.map(item => {
            if (!item.categoria) {
                console.log('🔄 Migrando producto sin categoría:', item.nombre);
                return {
                    ...item,
                    categoria: 'Sin categoría'
                };
            }
            return item;
        });
        
        // Si hubo migración, guardar los datos actualizados
        if (migratedCartData.some((item, index) => item.categoria !== cartData[index]?.categoria)) {
            console.log('💾 Guardando datos migrados del carrito');
            localStorage.setItem('petmarket_cart', JSON.stringify(migratedCartData));
        }
        
        carritoData.items = migratedCartData;
        calcularTotales();
        renderizarCarrito();
        
        console.log('🛒 Carrito cargado desde localStorage:', migratedCartData.length, 'productos');
        console.log('🛒 Estado completo del carrito:', carritoData);
    } catch (error) {
        console.error('❌ Error cargando carrito desde localStorage:', error);
        carritoData.items = [];
        renderizarCarrito();
    }
}

function guardarCarritoEnLocalStorage() {
    try {
        localStorage.setItem('petmarket_cart', JSON.stringify(carritoData.items));
        
        // Actualizar contador en header
        if (window.headerUnificado) {
            window.headerUnificado.loadCartCountFromLocalStorage();
        }
        
        console.log('💾 Carrito guardado en localStorage');
    } catch (error) {
        console.error('❌ Error guardando carrito en localStorage:', error);
    }
}

// === FUNCIONES DE MANIPULACIÓN DEL CARRITO ===

function eliminarDelCarrito(productId) {
    console.log('🗑️ Eliminando producto del carrito:', productId);
    mostrarConfirmacion(
        '¿Eliminar producto?',
        '¿Estás seguro de que deseas eliminar este producto del carrito?',
        () => {
            console.log('✅ Confirmado eliminar producto:', productId);
            carritoData.items = carritoData.items.filter(item => item.productId !== productId);
            guardarCarritoEnLocalStorage();
            calcularTotales();
            renderizarCarrito();
            
            // Mostrar notificación
            if (typeof showModal !== 'undefined') {
                showModal.success('Producto eliminado', 'El producto ha sido eliminado del carrito');
            }
        }
    );
}

function cambiarCantidad(productId, cambio) {
    console.log('📊 Cambiando cantidad. ProductID:', productId, 'Cambio:', cambio);
    const item = carritoData.items.find(item => item.productId === productId);
    if (!item) {
        console.error('❌ Item no encontrado:', productId);
        return;
    }
    
    const nuevaCantidad = item.cantidad + cambio;
    console.log('📊 Nueva cantidad:', nuevaCantidad, 'Stock disponible:', item.stock);
    
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productId);
        return;
    }
    
    if (nuevaCantidad > item.stock) {
        console.warn('⚠️ Stock insuficiente:', nuevaCantidad, '>', item.stock);
        if (typeof showModal !== 'undefined') {
            showModal.error('Stock insuficiente', `Stock máximo disponible: ${item.stock}`);
        }
        return;
    }
    
    item.cantidad = nuevaCantidad;
    console.log('✅ Cantidad actualizada:', item.cantidad);
    guardarCarritoEnLocalStorage();
    calcularTotales();
    renderizarCarrito();
}

function actualizarCantidadDirecta(productId, nuevaCantidad) {
    const item = carritoData.items.find(item => item.productId === productId);
    if (!item) return;
    
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productId);
        return;
    }
    
    if (nuevaCantidad > item.stock) {
        if (typeof showModal !== 'undefined') {
            showModal.error('Stock insuficiente', `Stock máximo disponible: ${item.stock}`);
        }
        // Restaurar valor anterior
        document.querySelector(`input[data-product-id="${productId}"]`).value = item.cantidad;
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarCarritoEnLocalStorage();
    calcularTotales();
    renderizarCarrito();
}

function limpiarCarrito() {
    if (carritoData.items.length === 0) {
        if (typeof showModal !== 'undefined') {
            showModal.info('Carrito vacío', 'No hay productos en el carrito para eliminar');
        }
        return;
    }
    
    mostrarConfirmacion(
        '¿Limpiar carrito?',
        '¿Estás seguro de que deseas eliminar todos los productos del carrito?',
        () => {
            carritoData.items = [];
            localStorage.removeItem('petmarket_cart');
            
            // Actualizar contador en header
            if (window.headerUnificado) {
                window.headerUnificado.loadCartCountFromLocalStorage();
            }
            
            calcularTotales();
            renderizarCarrito();
            
            if (typeof showModal !== 'undefined') {
                showModal.success('Carrito limpiado', 'Todos los productos han sido eliminados del carrito');
            }
        }
    );
}

// === FUNCIÓN DE PAGO (REQUIERE AUTENTICACIÓN) ===

function procesarPago() {
    console.log('💳 Iniciando proceso de pago');
    
    // Verificar si hay productos en el carrito
    if (carritoData.items.length === 0) {
        if (typeof showModal !== 'undefined') {
            showModal.error('Carrito vacío', 'No hay productos en el carrito para procesar el pago');
        }
        return;
    }
    
    // 🔒 VERIFICAR AUTENTICACIÓN OBLIGATORIA PARA PAGO
    if (!verificarAutenticacion()) {
        console.log('❌ Usuario no autenticado, mostrando modal de login');
        mostrarModalLogin();
        return;
    }
    
    // Si está autenticado, proceder con el pago
    procesarPagoAutenticado();
}

function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        return payload.exp > now;
    } catch (error) {
        return false;
    }
}

function mostrarModalLogin() {
    // Guardar información para redirigir después del login
    sessionStorage.setItem('postLoginAction', 'checkout');
    
    // Mostrar modal de login
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    
    // Mostrar mensaje específico para checkout
    const errorElement = document.getElementById('loginMensajeError');
    if (errorElement) {
        errorElement.textContent = 'Debes iniciar sesión para proceder con el pago';
        errorElement.classList.remove('d-none');
    }
}

async function procesarPagoAutenticado() {
    console.log('💳 Iniciando proceso de pago autenticado');
    
    const pagarBtn = document.getElementById('pagarBtn');
    if (pagarBtn) {
        pagarBtn.disabled = true;
        pagarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
    }
    
    try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');
        
        // Preparar datos del carrito para enviar al backend
        const orderData = {
            items: carritoData.items.map(item => ({
                productId: item.productId,
                cantidad: item.cantidad,
                precio: item.precio
            })),
            subtotal: carritoData.subtotal,
            total: carritoData.total
        };
        
        console.log('📦 Datos del pedido:', orderData);
        console.log('🛒 Items a procesar:', orderData.items.length);
        console.log('💰 Total a pagar:', orderData.total);
        
        const response = await fetch('/carrito/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });
        
        console.log('📡 Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📄 Datos de respuesta:', data);
        
        if (response.ok) {
            console.log('✅ Checkout exitoso, redirigiendo a Mercado Pago...');
            
            // NO limpiar carrito aún - se limpiará cuando el pago sea exitoso
            console.log('⚠️ Carrito mantenido hasta confirmación de pago');
            
            // Redirigir a Mercado Pago
            if (data.redirectUrl) {
                console.log('🔗 Redirigiendo a:', data.redirectUrl);
                window.location.href = data.redirectUrl;
            } else {
                throw new Error('No se recibió URL de redirección de Mercado Pago');
            }
        } else {
            throw new Error(data.mensaje || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        if (typeof showModal !== 'undefined') {
            showModal.error('Error en el pago', error.message || 'No se pudo procesar el pago');
        }
    } finally {
        if (pagarBtn) {
            pagarBtn.disabled = false;
            pagarBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Proceder al Pago';
        }
    }
}

// === FUNCIONES DE RENDERIZADO ===

function calcularTotales() {
    carritoData.subtotal = carritoData.items.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
    
    carritoData.total = carritoData.subtotal; // Sin IVA
}

function renderizarCarrito() {
    const container = document.getElementById('carrito-items');
    const resumenContainer = document.getElementById('resumen-carrito');
    
    if (!container) return;
    
    // Evitar renderizado múltiple - limpiar contenido existente
    if (resumenContainer) {
        resumenContainer.innerHTML = '';
    }
    
    if (carritoData.items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5" id="carrito-vacio-content">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Tu carrito está vacío</h5>
                <p class="text-muted">¡Agrega algunos productos para comenzar!</p>
                <a href="/productos/catalogo" class="btn btn-primary">
                    <i class="fas fa-shopping-bag me-2"></i>Ver Productos
                </a>
            </div>
        `;
        
        if (resumenContainer) {
            resumenContainer.innerHTML = '';
        }
        return;
    }
    
    // Renderizar items con el estilo original
    const itemsHTML = carritoData.items.map(item => {
        const subtotalItem = item.precio * item.cantidad;
        
        return `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.imagen || '/Imagenes/product-placeholder.svg'}" 
                             alt="${item.nombre}" 
                             class="product-image">
                    </div>
                    <div class="col-md-4">
                        <h5 class="mb-1">${item.nombre}</h5>
                        <p class="text-muted mb-1">${item.categoria || 'Sin categoría'}</p>
                        <small class="text-success">
                            <i class="fas fa-check-circle me-1"></i>
                            En stock: ${item.stock} disponibles
                        </small>
                    </div>
                    <div class="col-md-2">
                        <p class="mb-0 fw-bold">$${Number(item.precio).toLocaleString('es-CO')}</p>
                        <small class="text-muted">Precio unitario</small>
                    </div>
                    <div class="col-md-2">
                        <div class="quantity-controls">
                            <button class="quantity-btn btn-cantidad-menos" data-product-id="${item.productId}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                   class="quantity-input cantidad-input" 
                                   value="${item.cantidad}" 
                                   min="1" 
                                   max="${item.stock}"
                                   data-product-id="${item.productId}">
                            <button class="quantity-btn btn-cantidad-mas" data-product-id="${item.productId}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-1">
                        <p class="mb-0 fw-bold">$${subtotalItem.toLocaleString('es-CO')}</p>
                        <small class="text-muted">Subtotal</small>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-outline-danger btn-sm btn-eliminar-item" 
                                data-product-id="${item.productId}"
                                title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = itemsHTML;
    
    // Renderizar resumen con el estilo original
    if (resumenContainer) {
        resumenContainer.innerHTML = `
            <div class="cart-summary">
                <h5 class="mb-4">Resumen del Pedido</h5>
                
                <div class="summary-row">
                    <span>Total:</span>
                    <span id="totalAmount">$${Number(carritoData.total).toLocaleString('es-CO')}</span>
                </div>
                
                <hr class="my-4" />
                
                <div class="d-grid gap-2">
                    <button class="btn btn-pagar" id="pagarBtn" ${carritoData.items.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-credit-card me-2"></i>
                        Proceder al pago
                    </button>
                    <button class="btn btn-outline-secondary" id="limpiarCarritoBtn">
                        <i class="fas fa-trash me-2"></i>
                        Limpiar carrito
                    </button>
                    <a href="/productos/catalogo" class="btn btn-outline-primary">
                        <i class="fas fa-arrow-left me-2"></i>
                        Seguir comprando
                    </a>
                </div>
            </div>
        `;
        
        // Re-inicializar eventos para los nuevos botones
        const nuevoPagarBtn = document.getElementById('pagarBtn');
        if (nuevoPagarBtn) {
            nuevoPagarBtn.addEventListener('click', procesarPago);
            verificarEstadoBotonPago();
        }
        
        const nuevoLimpiarBtn = document.getElementById('limpiarCarritoBtn');
        if (nuevoLimpiarBtn) {
            nuevoLimpiarBtn.addEventListener('click', limpiarCarrito);
        }
    }
}

function verificarEstadoBotonPago() {
    const pagarBtn = document.getElementById('pagarBtn');
    if (!pagarBtn) return;
    
    const isAuthenticated = verificarAutenticacion();
    
    if (!isAuthenticated) {
        pagarBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Iniciar Sesión para Pagar';
        pagarBtn.classList.remove('btn-success');
        pagarBtn.classList.add('btn-warning');
        pagarBtn.title = 'Debes iniciar sesión para proceder con el pago';
    } else {
        pagarBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Proceder al Pago';
        pagarBtn.classList.remove('btn-warning');
        pagarBtn.classList.add('btn-success');
        pagarBtn.title = '';
    }
}

// === FUNCIONES DE UTILIDAD ===

function mostrarConfirmacion(titulo, mensaje, callback) {
    console.log('❓ Mostrando confirmación:', titulo);
    confirmacionCallback = callback;
    
    if (typeof showModal !== 'undefined') {
        console.log('✅ Usando showModal.confirm');
        // Parámetros correctos: (message, onConfirm, onCancel, details)
        showModal.confirm(
            `${titulo}\n\n${mensaje}`, // message
            () => {                     // onConfirm
                console.log('✅ Usuario confirmó la acción');
                callback();
            },
            () => {                     // onCancel
                console.log('❌ Usuario canceló la acción');
                // No hacer nada - solo cancelar
            },
            ''                          // details (vacío)
        );
    } else {
        console.log('⚠️ showModal no disponible, usando confirm nativo');
        // Fallback a confirm nativo
        if (confirm(`${titulo}\n\n${mensaje}`)) {
            console.log('✅ Usuario confirmó la acción');
            callback();
        } else {
            console.log('❌ Usuario canceló la acción');
        }
    }
}

// Función para agregar producto desde otras páginas
window.agregarAlCarritoLocalStorage = function(productoId, nombre, precio, imagen, stock, categoria = 'Sin categoría') {
    try {
        const cart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.productId === productoId);
        
        if (existingItemIndex >= 0) {
            if (cart[existingItemIndex].cantidad >= stock) {
                throw new Error(`Stock máximo disponible: ${stock}`);
            }
            cart[existingItemIndex].cantidad += 1;
        } else {
            cart.push({
                productId: productoId,
                nombre: nombre,
                precio: precio,
                imagen: imagen,
                categoria: categoria, // ✅ AGREGADO
                cantidad: 1,
                stock: stock,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('petmarket_cart', JSON.stringify(cart));
        
        // Actualizar contador en header
        if (window.headerUnificado) {
            window.headerUnificado.loadCartCountFromLocalStorage();
        }
        
        // Si estamos en la página del carrito, actualizar vista
        if (window.location.pathname.includes('/carrito')) {
            cargarCarritoDesdeLocalStorage();
        }
        
        return true;
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        throw error;
    }
};

// FUNCIÓN DE DEBUG PARA TESTEAR ELIMINACIÓN
window.testEliminarProducto = function(productId) {
    console.log('🧪 TEST: Eliminando producto:', productId);
    eliminarDelCarrito(productId);
};

// Función para mostrar mensaje especial cuando viene de pago exitoso
function mostrarMensajePagoExitoso() {
    const container = document.getElementById('carrito-vacio-content');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success mb-4">
                <i class="fas fa-check-circle me-2"></i>
                <strong>¡Pago exitoso!</strong> Tu compra ha sido procesada correctamente.
            </div>
            <i class="fas fa-shopping-cart fa-3x text-success mb-3"></i>
            <h5 class="text-success">¡Tu carrito está ahora vacío!</h5>
            <p class="text-muted">Tu pedido fue procesado exitosamente. El carrito se ha limpiado automáticamente.</p>
            <div class="mt-4">
                <a href="/productos/catalogo" class="btn btn-primary me-2">
                    <i class="fas fa-shopping-bag me-2"></i>Seguir Comprando
                </a>
                <a href="/panel" class="btn btn-outline-secondary">
                    <i class="fas fa-user me-2"></i>Mi Cuenta
                </a>
            </div>
        `;
        
        // Después de 5 segundos, volver al mensaje normal
        setTimeout(() => {
            if (carritoData.items.length === 0) {
                renderizarCarrito();
            }
        }, 10000);
    }
}

// Escuchar evento de login exitoso para continuar con checkout
document.addEventListener('loginSuccess', function(event) {
    console.log('🎉 Login exitoso detectado', event.detail);
    
    // VERIFICAR CARRITO INMEDIATAMENTE DESPUÉS DEL LOGIN
    const carritoInmediato = localStorage.getItem('petmarket_cart');
    console.log('🛒 Estado del carrito INMEDIATAMENTE después del login:', carritoInmediato);
    
    const postLoginAction = sessionStorage.getItem('postLoginAction');
    console.log('📋 Acción post-login:', postLoginAction);
    
    if (postLoginAction === 'checkout') {
        console.log('🛒 Continuando con checkout después del login...');
        sessionStorage.removeItem('postLoginAction');
        
        // RE-CARGAR carrito desde localStorage por si se perdió
        cargarCarritoDesdeLocalStorage();
        
        // Verificar que el carrito siga teniendo productos
        console.log('📦 Items en carrito antes del pago:', carritoData.items.length);
        
        // Actualizar estado de botón de pago
        verificarEstadoBotonPago();
        
        // Pequeño delay para asegurar que el estado se actualizó
        setTimeout(() => {
            if (carritoData.items.length > 0) {
                console.log('✅ Procesando pago con', carritoData.items.length, 'productos');
                procesarPagoAutenticado(); // Llamar directamente a la función autenticada
            } else {
                console.error('❌ No hay productos en el carrito para procesar');
                if (typeof showModal !== 'undefined') {
                    showModal.error('Error', 'No hay productos en el carrito para procesar el pago');
                }
            }
        }, 500);
    }
});

// DEBUG: Función para monitorear cambios en localStorage
if (window.location.pathname.includes('/carrito')) {
    console.log('🔍 Monitoreando cambios en localStorage...');
    
    // Monitorear cambios en localStorage
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.setItem = function(key, value) {
        if (key === 'petmarket_cart') {
            console.log('🛒 CARRITO MODIFICADO - setItem:', value);
            console.trace('📍 Stack trace:');
        }
        return originalSetItem.apply(this, arguments);
    };
    
    localStorage.removeItem = function(key) {
        if (key === 'petmarket_cart') {
            console.log('🗑️ CARRITO ELIMINADO - removeItem');
            console.trace('📍 Stack trace:');
        }
        return originalRemoveItem.apply(this, arguments);
    };
    
    localStorage.clear = function() {
        console.log('🧹 LOCALSTORAGE COMPLETO LIMPIADO - clear()');
        console.trace('📍 Stack trace:');
        return originalClear.apply(this, arguments);
    };
}