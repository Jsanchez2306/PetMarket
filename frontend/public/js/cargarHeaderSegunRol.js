
    document.addEventListener('DOMContentLoaded', async function() {
    await detectarUsuarioYCargarHeader();
});

async function detectarUsuarioYCargarHeader() {
    try {
        const response = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.autenticado && data.usuario) {
                const tipoUsuario = data.usuario.tipoUsuario;
                const rol = data.usuario.rol;
                
                // Determinar si es empleado o admin
                const esEmpleado = (tipoUsuario === 'empleado' && rol === 'empleado');
                const esAdmin = (rol === 'admin');
                
                console.log('Usuario detectado:', { tipoUsuario, rol, esEmpleado, esAdmin });
                
                // Si es empleado y está en el panel, redirigir a gestión de productos
                if (esEmpleado && window.location.pathname === '/panel') {
                    console.log('🔄 Empleado detectado en panel, redirigiendo a gestión de productos...');
                    window.location.href = '/productos';
                    return;
                }
                
                // Mostrar el header apropiado
                mostrarHeader(esEmpleado ? 'empleado' : 'admin');
                
                // Si estamos en el panel y es admin, cargar contenido específico
                if (document.getElementById('estadisticasContainer') && document.getElementById('gestionContainer') && esAdmin) {
                    // Actualizar título de la página para admin
                    const pageTitle = document.getElementById('pageTitle');
                    pageTitle.textContent = 'Panel Administrador - PetMarket';
                    document.querySelector('meta[name="description"]').setAttribute('content', 'PetMarket - Panel Administrador.');
                    
                    await cargarEstadisticas('admin');
                    cargarGestion('admin');
                }
            } else {
                // Si no está autenticado, redirigir al inicio
                window.location.href = '/';
            }
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error al verificar usuario:', error);
        window.location.href = '/';
    }
}

function mostrarHeader(rolUsuario) {
    const headerEmpleado = document.getElementById('headerEmpleado');
    const headerAdmin = document.getElementById('headerAdmin');
    
    if (rolUsuario === 'empleado') {
        headerEmpleado.style.display = 'block';
        headerAdmin.style.display = 'none';
    } else {
        headerEmpleado.style.display = 'none';
        headerAdmin.style.display = 'block';
    }
}

// Función específica para el panel - cargar estadísticas
async function cargarEstadisticas(rolUsuario) {
    const estadisticasContainer = document.getElementById('estadisticasContainer');
    
    try {
        console.log('📊 Cargando estadísticas...');
        
        // Obtener estadísticas del servidor
        const response = await fetch('/api/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('📊 Response status:', response.status);
        
        let estadisticas = { productos: 0, clientes: 0, empleados: 0 };
        if (response.ok) {
            estadisticas = await response.json();
            console.log('📊 Estadísticas recibidas:', estadisticas);
        } else {
            console.error('❌ Error en respuesta:', response.statusText);
            const errorText = await response.text();
            console.error('❌ Error detalle:', errorText);
        }

        let estadisticasHTML = '';
        
        if (rolUsuario === 'empleado') {
            // Solo mostrar estadísticas de productos para empleados
           
        } else {
            // Mostrar todas las estadísticas para administradores
            estadisticasHTML = `
                <div class="col-md-4">
                    <div class="card tarjetaProductos mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Productos</h5>
                            <p class="card-text fs-4">${estadisticas.productos}</p>
                            <i class="fas fa-box fa-2x"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card tarjetaFacturas mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Clientes registrados</h5>
                            <p class="card-text fs-4">${estadisticas.clientes}</p>
                            <i class="fas fa-file-invoice fa-2x"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card tarjetaClientes mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Empleados</h5>
                            <p class="card-text fs-4">${estadisticas.empleados}</p>
                            <i class="fas fa-users fa-2x"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log('📊 Insertando HTML de estadísticas');
        estadisticasContainer.innerHTML = estadisticasHTML;
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
    }
}

// Función específica para el panel - cargar gestión
function cargarGestion(rolUsuario) {
    const gestionContainer = document.getElementById('gestionContainer');
    
    let gestionHTML = '';
    
    if (rolUsuario === 'empleado') {
        // No mostrar opciones de gestión para empleados
     
    } else {
        // Mostrar todas las opciones para administradores
        gestionHTML = `
            <div class="col-md-4 mb-3">
                <a href="/productos" class="btn btn-primary w-100 py-3">
                    <i class="fas fa-box"></i> Gestión de Productos
                </a>
            </div>
            <div class="col-md-4 mb-3">
                <a href="/clientes" class="btn btn-primary w-100 py-3">
                    <i class="fas fa-users"></i> Gestión de Clientes
                </a>
            </div>
            <div class="col-md-4 mb-3">
                <a href="/empleados" class="btn btn-primary w-100 py-3">
                    <i class="fas fa-user-tie"></i> Gestión de Empleados
                </a>
            </div>
            <div class="col-md-6 mb-3">
                <a href="/facturas/crear" class="btn btn-success w-100 py-3">
                    <i class="fas fa-file-invoice"></i> Crear Factura
                </a>
            </div>
        `;
    }
    
    gestionContainer.innerHTML = gestionHTML;
}
