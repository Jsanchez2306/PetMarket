// Carrito de compras - Funcionalidad completa
let carritoData = {
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar eventos
    inicializarEventos();
    
    // Sincronizar datos del carrito desde el servidor
    sincronizarCarritoDesdeServidor();
});

function inicializarEventos() {
    // Evento para proceder al pago
    document.getElementById('pagarBtn').addEventListener('click', procesarPago);
    
    // Evento para limpiar carrito
    document.getElementById('limpiarCarritoBtn').addEventListener('click', limpiarCarrito);
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
            
            console.log('🔄 Carrito sincronizado desde servidor:', carritoData);
            console.log('💰 Totales sincronizados:');
            console.log('  - Subtotal:', subtotal);
            console.log('  - IVA:', iva);
            console.log('  - Total:', total);
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
        const confirmacion = confirm('¿Estás seguro de que deseas eliminar este producto del carrito?');
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
        console.log('📄 Preparando factura modal...');
        
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
        
        console.log('✅ Factura modal mostrada');
        
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

        // Crear preferencia en Mercado Pago
        const response = await fetch('/mercadopago/create-preference', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Redirigiendo a Mercado Pago...', 'success');
            
            // Redirigir a Mercado Pago
            setTimeout(() => {
                // Usar sandbox_init_point para modo prueba
                window.location.href = data.sandboxInitPoint || data.initPoint;
            }, 1500);
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
        // Verificar si hay productos en el DOM en lugar de en carritoData
        const cartItems = document.querySelectorAll('.cart-item');
        if (cartItems.length === 0) {
            mostrarToast('El carrito ya está vacío', 'info');
            return;
        }

        const confirmacion = confirm('¿Estás seguro de que deseas limpiar todo el carrito?');
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
        // Verificar si hay productos en el DOM
        const cartItems = document.querySelectorAll('.cart-item');
        if (cartItems.length === 0) {
            mostrarToast('No hay productos en el carrito', 'warning');
            return;
        }

        // Obtener el total del DOM con debug mejorado
        const totalElement = document.getElementById('totalAmount');
        console.log('🔍 Total element:', totalElement);
        console.log('🔍 Total element content:', totalElement?.textContent);
        
        let totalAmount = 0;
        
        if (totalElement && totalElement.textContent) {
            // Limpiar el texto del total
            const totalText = totalElement.textContent
                .replace('$', '')           // Quitar símbolo de peso
                .replace(/\./g, '')         // Quitar puntos de miles (formato colombiano)
                .replace(/,/g, '')          // Quitar comas si las hay
                .trim();                    // Quitar espacios
                
            console.log('🔍 Total text cleaned:', totalText);
            totalAmount = parseInt(totalText) || 0;
            console.log('🔍 Total amount parsed:', totalAmount);
        }
        
        // Verificar que el total sea válido
        if (isNaN(totalAmount) || totalAmount <= 0) {
            console.error('❌ Total inválido:', totalAmount);
            
            // Intentar obtener el total desde carritoData como fallback
            if (carritoData && carritoData.total) {
                totalAmount = carritoData.total;
                console.log('🔄 Usando total desde carritoData:', totalAmount);
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