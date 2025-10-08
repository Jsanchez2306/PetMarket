// Catálogo de productos - Funcionalidad de filtrado y búsqueda con paginación
let productos = [];
let paginacionInfo = {};
let filtrosActivos = {
    categoria: 'todas',
    busqueda: '',
    pagina: 1
};

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar eventos
    inicializarEventos();

    // Cargar contador del carrito (headerUnificado maneja los eventos de compra)
    cargarContadorCarrito();

    // Solo cargar productos si estamos en la página del catálogo
    if (document.getElementById('productosContainer')) {
        cargarProductos();
    }

    // Escuchar cambios en el estado del usuario
    document.addEventListener('userStateChanged', updateCatalogoButtons);
});

function inicializarEventos() {
    // Evento de búsqueda con debounce (solo si existe el elemento)
    const busquedaInput = document.getElementById('busqueda');
    if (busquedaInput) {
        let timeoutBusqueda;
        busquedaInput.addEventListener('input', function () {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                filtrosActivos.busqueda = this.value.trim();
                filtrosActivos.pagina = 1; // Resetear a la primera página al buscar
                aplicarFiltros();
            }, 300);
        });
    }

    // Evento de cambio de categoría (solo si existe el elemento)
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', function () {
            filtrosActivos.categoria = this.value;
            filtrosActivos.pagina = 1; // Resetear a la primera página al filtrar
            aplicarFiltros();
        });
    }

    // Evento para limpiar filtros (solo si existe el elemento)
    const limpiarFiltrosBtn = document.getElementById('limpiarFiltros');
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener('click', function () {
            limpiarFiltros();
        });
    }

    // ✨ NUEVO: Evento para agregar efectos visuales al botón de compra
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-comprar');
        if (button && !button.disabled) {
            // Agregar efecto visual al botón
            button.classList.add('adding');
            
            // Agregar efecto a la tarjeta
            const card = button.closest('.product-card, .card');
            if (card) {
                card.classList.add('animating');
                
                // Quitar efectos después de la animación
                setTimeout(() => {
                    card.classList.remove('animating');
                }, 1500);
            }
            
            // Quitar efecto del botón
            setTimeout(() => {
                button.classList.remove('adding');
            }, 600);
        }
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

function safeText(txt) {
    return (txt || '').toString().replace(/"/g, '&quot;');
}

function capitalizar(cat) {
    if (!cat) return '';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
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

    const categoriaColores = {
        'alimentos': 'bg-success',
        'juguetes': 'bg-warning',
        'accesorios': 'bg-info',
        'ropa': 'bg-primary',
        'higiene': 'badge-higiene'
    };

    // Verificar si el usuario es administrador
    const isAdmin = verificarSiEsAdmin();

    const productosHTML = productos.map(producto => {
        const colorCategoria = categoriaColores[producto.categoria] || 'bg-secondary';
        const nombre = safeText(producto.nombre);
        const descripcion = (producto.descripcion || '').toString();
        const descripcionCorta = descripcion.length > 100 ? descripcion.substring(0, 100) + '...' : descripcion;

        return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card product-card h-100 shadow-sm">
          <div class="thumb-wrapper">
            <img
              src="${producto.imagen}"
              class="thumb-img"
              alt="${nombre}"
              title="${nombre}"
              loading="lazy"
              onerror="this.src='/Imagenes/HuellaPerro.png'">
            <span class="badge ${colorCategoria} categoria-badge">
              ${capitalizar(producto.categoria)}
            </span>
          </div>

          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold" title="${nombre}">
              ${nombre}
            </h5>
            <p class="card-text text-muted flex-grow-1 small">
              ${descripcionCorta}
            </p>

            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <span class="h5 text-primary fw-bold">
                    $${Number(producto.precio || 0).toLocaleString('es-CO')} COP
                  </span>
                </div>
                <small class="text-muted">
                  <i class="fas fa-box me-1"></i>
                  Stock: ${producto.stock}
                </small>
              </div>

              <div class="d-grid gap-2">
                <button class="btn ${isAdmin ? 'btn-secondary' : 'btn-primary'} btn-comprar"
                        data-producto="${producto._id}"
                        ${producto.stock === 0 || isAdmin ? 'disabled' : ''}>
                  <i class="fas fa-${isAdmin ? 'lock' : 'shopping-cart'} me-2"></i>
                  ${isAdmin ? 'Admin - No disponible' : (producto.stock === 0 ? 'Sin stock' : 'Agregar al carrito')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = productosHTML;
}

// Función para verificar autenticación
async function verificarAutenticacion() {
    try {
        const response = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 200) {
            const data = await response.json();
            return data.autenticado === true;
        }
        return false;
    } catch {
        return false;
    }
}

// Toasts
function mostrarToast(mensaje, tipo = 'info') {
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

    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Actualiza contador carrito (si hay sesión)
function actualizarContadorCarrito(cantidad) {
    const contador = document.getElementById('carritoContador');
    if (contador) {
        contador.textContent = cantidad;
        contador.style.display = cantidad > 0 ? 'inline' : 'none';
    }
}

async function cargarContadorCarrito() {
    try {
        const isAuthenticated = await verificarAutenticacion();
        if (!isAuthenticated) return;

        const response = await fetch('/carrito/api/count', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            actualizarContadorCarrito(data.itemCount || 0);
        }
    } catch { }
}

function limpiarFiltros() {
    filtrosActivos = { categoria: 'todas', busqueda: '', pagina: 1 };
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

    if (finRango - inicioRango < maxPaginasVisibles - 1) {
        inicioRango = Math.max(1, finRango - maxPaginasVisibles + 1);
    }

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

    for (let i = inicioRango; i <= finRango; i++) {
        if (i === paginacionInfo.paginaActual) {
            paginacionHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginacionHTML += `<li class="page-item"><button class="page-link" onclick="cambiarPagina(${i})">${i}</button></li>`;
        }
    }

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

// Función para verificar si el usuario actual es administrador
function verificarSiEsAdmin() {
    try {
        // Verificar si existe headerUnificado y tiene información del usuario
        if (window.headerUnificado && window.headerUnificado.userInfo) {
            const userInfo = window.headerUnificado.userInfo;
            return userInfo.rol === 'admin';
        }
        
        // Verificación alternativa usando localStorage
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.rol === 'admin';
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando rol de admin:', error);
        return false;
    }
}

// Función para actualizar botones cuando cambia el estado del usuario
function updateCatalogoButtons() {
    // Re-renderizar productos con el nuevo estado de admin
    if (productos && productos.length > 0) {
        mostrarProductos(productos);
    }
}

// Exponer función global para que headerUnificado pueda llamarla
window.updateCatalogoButtons = updateCatalogoButtons;

// debounce auxiliar (por si lo usas luego)
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