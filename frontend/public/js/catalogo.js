// Catálogo de productos - Funcionalidad de filtrado y búsqueda con paginación
let productos = [];
let paginacionInfo = {};
let filtrosActivos = {
    categoria: 'todas',
    busqueda: '',
    pagina: 1
};

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar eventos
    inicializarEventos();
    
    // Cargar productos al inicio
    cargarProductos();
});

function inicializarEventos() {
    // Evento de búsqueda con debounce
    const busquedaInput = document.getElementById('busqueda');
    let timeoutBusqueda;
    
    busquedaInput.addEventListener('input', function() {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            filtrosActivos.busqueda = this.value.trim();
            filtrosActivos.pagina = 1; // Resetear a la primera página al buscar
            aplicarFiltros();
        }, 300);
    });

    // Evento de cambio de categoría
    document.getElementById('categoria').addEventListener('change', function() {
        filtrosActivos.categoria = this.value;
        filtrosActivos.pagina = 1; // Resetear a la primera página al filtrar
        aplicarFiltros();
    });

    // Evento para limpiar filtros
    document.getElementById('limpiarFiltros').addEventListener('click', function() {
        limpiarFiltros();
    });
}

async function cargarProductos() {
    try {
        mostrarCargando(true);
        
        // Construir URL con parámetros de paginación y filtros
        const params = new URLSearchParams({
            pagina: filtrosActivos.pagina,
            limite: 9
        });

        if (filtrosActivos.categoria !== 'todas') {
            params.append('categoria', filtrosActivos.categoria);
        }

        if (filtrosActivos.busqueda) {
            params.append('busqueda', filtrosActivos.busqueda);
        }

        const response = await fetch(`/productos/api/filtros?${params}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }
        
        const data = await response.json();
        productos = data.productos;
        paginacionInfo = data.paginacion;
        
        mostrarProductos(productos);
        actualizarContador();
        actualizarPaginacion();
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError('Error al cargar los productos. Por favor, intenta más tarde.');
    } finally {
        mostrarCargando(false);
    }
}

function aplicarFiltros() {
    cargarProductos();
}

function cambiarPagina(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= paginacionInfo.totalPaginas) {
        filtrosActivos.pagina = nuevaPagina;
        cargarProductos();
        // Scroll suave hacia arriba para ver los nuevos productos
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
    }
}

function mostrarProductos(productos) {
    const container = document.getElementById('productosContainer');
    const noProductosDiv = document.getElementById('noProductos');
    
    if (!productos || productos.length === 0) {
        container.innerHTML = '';
        noProductosDiv.classList.remove('d-none');
        return;
    }
    
    noProductosDiv.classList.add('d-none');
    
    const productosHTML = productos.map(producto => {
        const categoriaColores = {
            'alimentos': 'bg-success',
            'juguetes': 'bg-warning',
            'accesorios': 'bg-info',
            'ropa': 'bg-primary'
        };
        
        const colorCategoria = categoriaColores[producto.categoria] || 'bg-secondary';
        
        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card product-card h-100 border-0 shadow-sm">
                    <div class="position-relative">
                        <img src="${producto.imagen}" 
                             class="card-img-top product-image" 
                             alt="${producto.nombre}"
                             title="${producto.nombre}"
                             loading="lazy"
                             onerror="this.src='/Imagenes/HuellaPerro.png'">
                        <span class="badge ${colorCategoria} categoria-badge">
                            ${producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold" title="${producto.nombre}">
                            ${producto.nombre}
                        </h5>
                        <p class="card-text text-muted flex-grow-1 small">
                            ${producto.descripcion.length > 100 ? 
                              producto.descripcion.substring(0, 100) + '...' : 
                              producto.descripcion}
                        </p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span class="h5 text-primary fw-bold">
                                        $${producto.precio.toLocaleString('es-CO')} COP
                                    </span>
                                </div>
                                <small class="text-muted">
                                    <i class="fas fa-box me-1"></i>
                                    Stock: ${producto.stock}
                                </small>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-comprar" 
                                        data-producto="${producto._id}"
                                        ${producto.stock === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-shopping-cart me-2"></i>
                                    ${producto.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = productosHTML;
    
    // Reinicializar eventos de compra
    inicializarEventosCompra();
}

function inicializarEventosCompra() {
    const botonesComprar = document.querySelectorAll('.btn-comprar');
    botonesComprar.forEach(boton => {
        boton.addEventListener('click', function() {
            const productoId = this.getAttribute('data-producto');
            agregarAlCarrito(productoId);
        });
    });
}

async function agregarAlCarrito(productoId) {
    try {
        console.log('🛒 Intentando agregar producto al carrito:', productoId);
        
        // Verificar si el usuario está autenticado
        const isAuthenticated = await verificarAutenticacion();
        console.log('¿Usuario autenticado?:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('❌ Usuario no autenticado, mostrando toast');
            mostrarToast('Debes iniciar sesión para agregar productos al carrito', 'warning');
            return;
        }

        const producto = productos.find(p => p._id === productoId);
        if (!producto) {
            console.log('❌ Producto no encontrado en el array de productos');
            mostrarToast('Producto no encontrado', 'error');
            return;
        }

        if (producto.stock === 0) {
            console.log('❌ Producto sin stock');
            mostrarToast('Producto sin stock', 'error');
            return;
        }

        // Deshabilitar botón temporalmente
        const boton = document.querySelector(`[data-producto="${productoId}"]`);
        const textoOriginal = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Agregando...';

        console.log('📤 Enviando request al servidor...');
        const response = await fetch('/carrito/api/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                productId: productoId,
                quantity: 1
            })
        });

        console.log('📥 Respuesta del servidor:', response.status);
        
        if (response.status === 401) {
            console.log('❌ Error 401: No autenticado');
            mostrarToast('Debes iniciar sesión para agregar productos al carrito', 'warning');
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
            return;
        }
        
        const data = await response.json();
        console.log('📄 Datos de respuesta:', data);

        if (response.ok) {
            console.log('✅ Producto agregado exitosamente');
            mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
            actualizarContadorCarrito(data.itemCount);
        } else {
            console.log('❌ Error del servidor:', data.mensaje);
            mostrarToast(data.mensaje || 'Error al agregar producto al carrito', 'error');
        }

        // Restaurar botón
        boton.disabled = false;
        boton.innerHTML = textoOriginal;

    } catch (error) {
        console.error('💥 Error al agregar al carrito:', error);
        mostrarToast('Error al agregar producto al carrito', 'error');
        
        // Restaurar botón en caso de error
        const boton = document.querySelector(`[data-producto="${productoId}"]`);
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Agregar al carrito';
        }
    }
}

// Función para verificar autenticación
async function verificarAutenticacion() {
    try {
        console.log('🔍 Verificando autenticación...');
        const response = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('🔐 Respuesta de autenticación:', response.status);
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('🔐 Datos de respuesta:', data);
            console.log('🔐 ¿Autenticado?:', data.autenticado);
            return data.autenticado === true;
        } else {
            console.log('🔐 No autenticado (status !== 200)');
            return false;
        }
    } catch (error) {
        console.error('💥 Error al verificar autenticación:', error);
        return false;
    }
}

// Función para mostrar toasts/notificaciones
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

// Función para actualizar contador del carrito en el header
function actualizarContadorCarrito(cantidad) {
    const contador = document.getElementById('carritoContador');
    if (contador) {
        contador.textContent = cantidad;
        contador.style.display = cantidad > 0 ? 'inline' : 'none';
    }
}

function limpiarFiltros() {
    filtrosActivos = {
        categoria: 'todas',
        busqueda: '',
        pagina: 1
    };
    
    document.getElementById('busqueda').value = '';
    document.getElementById('categoria').value = 'todas';
    
    cargarProductos();
}

function actualizarContador() {
    const inicioRango = ((paginacionInfo.paginaActual - 1) * paginacionInfo.limite) + 1;
    const finRango = Math.min(paginacionInfo.paginaActual * paginacionInfo.limite, paginacionInfo.totalProductos);
    
    document.getElementById('contadorProductos').innerHTML = `
        <i class="fas fa-box me-2"></i>
        Mostrando ${inicioRango}-${finRango} de ${paginacionInfo.totalProductos} productos
        ${paginacionInfo.totalPaginas > 1 ? `(Página ${paginacionInfo.paginaActual} de ${paginacionInfo.totalPaginas})` : ''}
    `;
}

function actualizarPaginacion() {
    const paginacionContainer = document.getElementById('paginacionContainer');
    
    if (paginacionInfo.totalPaginas <= 1) {
        paginacionContainer.innerHTML = '';
        return;
    }
    
    let paginacionHTML = '<nav aria-label="Navegación de páginas"><ul class="pagination justify-content-center">';
    
    // Botón Anterior
    if (paginacionInfo.tienePaginaAnterior) {
        paginacionHTML += `
            <li class="page-item">
                <button class="page-link" onclick="cambiarPagina(${paginacionInfo.paginaAnterior})" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span>
                </button>
            </li>
        `;
    } else {
        paginacionHTML += `
            <li class="page-item disabled">
                <span class="page-link" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span>
                </span>
            </li>
        `;
    }
    
    // Números de página
    const maxPaginasVisibles = 5;
    let inicioRango = Math.max(1, paginacionInfo.paginaActual - Math.floor(maxPaginasVisibles / 2));
    let finRango = Math.min(paginacionInfo.totalPaginas, inicioRango + maxPaginasVisibles - 1);
    
    // Ajustar el rango si estamos cerca del final
    if (finRango - inicioRango < maxPaginasVisibles - 1) {
        inicioRango = Math.max(1, finRango - maxPaginasVisibles + 1);
    }
    
    // Mostrar primera página si no está en el rango
    if (inicioRango > 1) {
        paginacionHTML += `
            <li class="page-item">
                <button class="page-link" onclick="cambiarPagina(1)">1</button>
            </li>
        `;
        if (inicioRango > 2) {
            paginacionHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Páginas en el rango visible
    for (let i = inicioRango; i <= finRango; i++) {
        if (i === paginacionInfo.paginaActual) {
            paginacionHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginacionHTML += `<li class="page-item"><button class="page-link" onclick="cambiarPagina(${i})">${i}</button></li>`;
        }
    }
    
    // Mostrar última página si no está en el rango
    if (finRango < paginacionInfo.totalPaginas) {
        if (finRango < paginacionInfo.totalPaginas - 1) {
            paginacionHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        paginacionHTML += `
            <li class="page-item">
                <button class="page-link" onclick="cambiarPagina(${paginacionInfo.totalPaginas})">${paginacionInfo.totalPaginas}</button>
            </li>
        `;
    }
    
    // Botón Siguiente
    if (paginacionInfo.tienePaginaSiguiente) {
        paginacionHTML += `
            <li class="page-item">
                <button class="page-link" onclick="cambiarPagina(${paginacionInfo.paginaSiguiente})" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span>
                </button>
            </li>
        `;
    } else {
        paginacionHTML += `
            <li class="page-item disabled">
                <span class="page-link" aria-label="Siguiente">
                    <span aria-hidden="true">&raquo;</span>
                </span>
            </li>
        `;
    }
    
    paginacionHTML += '</ul></nav>';
    paginacionContainer.innerHTML = paginacionHTML;
}

function mostrarCargando(mostrar) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('productosContainer');
    
    if (mostrar) {
        spinner.style.display = 'block';
        container.innerHTML = '';
    } else {
        spinner.style.display = 'none';
    }
}

function mostrarError(mensaje) {
    const container = document.getElementById('productosContainer');
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger text-center" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${mensaje}
                <br>
                <button class="btn btn-outline-danger mt-2" onclick="cargarProductos()">
                    <i class="fas fa-redo me-2"></i>Intentar de nuevo
                </button>
            </div>
        </div>
    `;
}

// Funciones auxiliares para optimización
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}