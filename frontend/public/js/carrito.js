// Carrito de compras - Funcionalidad completa
let carritoData = {
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    // No cargar carrito al inicio ya que viene del servidor
    // cargarCarrito();
    
    // Inicializar eventos
    inicializarEventos();
});

function inicializarEventos() {
    // Evento para proceder al pago
    document.getElementById('pagarBtn').addEventListener('click', procesarPago);
    
    // Evento para limpiar carrito
    document.getElementById('limpiarCarritoBtn').addEventListener('click', limpiarCarrito);
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

        // Obtener el total del DOM
        const totalElement = document.getElementById('totalAmount');
        const totalText = totalElement ? totalElement.textContent.replace('$', '').replace(/,/g, '') : '0';
        
        const confirmacion = confirm(`¿Proceder con el pago por $${Number(totalText).toLocaleString('es-CO')} con Mercado Pago?`);
        if (!confirmacion) return;

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
        console.error('Error al procesar pago:', error);
        mostrarToast('Error al procesar el pago', 'error');
    } finally {
        mostrarCargando(false);
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