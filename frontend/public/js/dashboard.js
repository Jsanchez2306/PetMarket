class DashboardManager {
    constructor() {
        this.estadisticas = null;
        this.intervalId = null;
        this.init();
    }

    init() {
        this.cargarEstadisticas();
        this.configurarActualizacionAutomatica();
        this.configurarGestion();
    }

    async cargarEstadisticas() {
        try {
            this.mostrarCargando();
            
            const response = await fetch('/dashboard/api/estadisticas', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.estadisticas = data.estadisticas;
                this.renderizarEstadisticas();
                this.actualizarTituloPagina();
            } else {
                console.error('Error al cargar estadísticas:', response.status);
                this.mostrarError();
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.mostrarError();
        }
    }

    mostrarCargando() {
        const container = document.getElementById('estadisticasContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-muted">Cargando estadísticas del dashboard...</p>
                </div>
            `;
        }
    }

    mostrarError() {
        const container = document.getElementById('estadisticasContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle mb-2"></i>
                        <h5>Error al cargar estadísticas</h5>
                        <p class="mb-0">No se pudieron cargar las estadísticas del dashboard.</p>
                        <button class="btn btn-outline-danger btn-sm mt-2" onclick="dashboard.cargarEstadisticas()">
                            <i class="fas fa-refresh me-1"></i>Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
    }

    renderizarEstadisticas() {
        const container = document.getElementById('estadisticasContainer');
        if (!container || !this.estadisticas) return;

        const stats = this.estadisticas;
        
        container.innerHTML = `
            <!-- Fila 1 - Métricas Principales -->
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-primary text-white h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-users fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.clientes.total.toLocaleString()}</h2>
                        <p class="mb-1">Clientes Registrados</p>
                        <small class="opacity-75">
                            <i class="fas fa-plus-circle me-1"></i>
                            ${stats.clientes.nuevosDelMes} nuevos este mes
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-info text-white h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-user-tie fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.empleados.total}</h2>
                        <p class="mb-1">Empleados Activos</p>
                        <small class="opacity-75">
                            <i class="fas fa-check-circle me-1"></i>
                            Personal disponible
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-warning text-dark h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-box fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.productos.total}</h2>
                        <p class="mb-1">Total Productos</p>
                        <small class="text-muted">
                            <i class="fas fa-check me-1"></i>
                            ${stats.productos.disponibles} disponibles
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-success text-white h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-shopping-cart fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.ventas.hoy}</h2>
                        <p class="mb-1">Ventas de Hoy</p>
                        <small class="opacity-75">
                            <i class="fas fa-dollar-sign me-1"></i>
                            $${stats.ingresos.hoy.toLocaleString()}
                        </small>
                    </div>
                </div>
            </div>

            <!-- Fila 2 - Estado del Negocio -->
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-danger text-white h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.pedidos.sinEntregar}</h2>
                        <p class="mb-1">Pedidos Pendientes</p>
                        <small class="opacity-75">
                            <i class="fas fa-truck me-1"></i>
                            ${stats.pedidos.enCamino} en camino
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card ${stats.alertas.totalAlertas > 0 ? 'bg-warning text-dark' : 'bg-secondary text-white'} h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.alertas.totalAlertas}</h2>
                        <p class="mb-1">Alertas de Stock</p>
                        <small class="${stats.alertas.totalAlertas > 0 ? 'text-muted' : 'opacity-75'}">
                            <i class="fas fa-box-open me-1"></i>
                            ${stats.productos.bajoStock} bajo stock
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-purple text-white h-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="card-body text-center">
                        <i class="fas fa-chart-line fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">${stats.ventas.mes}</h2>
                        <p class="mb-1">Ventas del Mes</p>
                        <small class="opacity-75">
                            <i class="fas fa-${stats.ventas.cambioMensual.diferencia >= 0 ? 'arrow-up' : 'arrow-down'} me-1"></i>
                            ${stats.ventas.cambioMensual.porcentaje}% vs mes anterior
                        </small>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card stats-card bg-dark text-white h-100">
                    <div class="card-body text-center">
                        <i class="fas fa-money-bill-wave fa-3x mb-3 opacity-75"></i>
                        <h2 class="fw-bold">$${stats.ingresos.mes.toLocaleString()}</h2>
                        <p class="mb-1">Ingresos del Mes</p>
                        <small class="opacity-75">
                            <i class="fas fa-calendar me-1"></i>
                            Total acumulado
                        </small>
                    </div>
                </div>
            </div>
        `;

        this.animarContadores();
    }

    configurarGestion() {
        const container = document.getElementById('gestionContainer');
        if (!container) return;

        container.innerHTML = `
            <!-- Fila 3 - Acciones Rápidas -->
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card action-card h-100 border-0 shadow-sm">
                    <div class="card-body text-center p-4">
                        <div class="action-icon bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                            <i class="fas fa-user-plus fa-2x text-primary"></i>
                        </div>
                        <h5 class="card-title">Gestión Clientes</h5>
                        <p class="card-text text-muted small">Administrar clientes del sistema</p>
                        <a href="/clientes" class="btn btn-primary btn-sm">
                            <i class="fas fa-users me-1"></i>Gestionar Clientes
                        </a>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card action-card h-100 border-0 shadow-sm">
                    <div class="card-body text-center p-4">
                        <div class="action-icon bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                            <i class="fas fa-box fa-2x text-warning"></i>
                        </div>
                        <h5 class="card-title">Gestión Productos</h5>
                        <p class="card-text text-muted small">Administrar inventario de productos</p>
                        <a href="/productos" class="btn btn-warning btn-sm">
                            <i class="fas fa-boxes me-1"></i>Gestionar Productos
                        </a>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card action-card h-100 border-0 shadow-sm">
                    <div class="card-body text-center p-4">
                        <div class="action-icon bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                            <i class="fas fa-file-invoice fa-2x text-success"></i>
                        </div>
                        <h5 class="card-title">Nueva Factura</h5>
                        <p class="card-text text-muted small">Crear factura manual de venta</p>
                        <a href="/facturas/crear" class="btn btn-success btn-sm">
                            <i class="fas fa-plus me-1"></i>Crear Factura
                        </a>
                    </div>
                </div>
            </div>

            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card action-card h-100 border-0 shadow-sm">
                    <div class="card-body text-center p-4">
                        <div class="action-icon bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                            <i class="fas fa-chart-bar fa-2x text-info"></i>
                        </div>
                        <h5 class="card-title">Ver Reportes</h5>
                        <p class="card-text text-muted small">Acceder a gestión de ventas</p>
                        <a href="/ventas" class="btn btn-info btn-sm">
                            <i class="fas fa-chart-line me-1"></i>Ver Ventas
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    animarContadores() {
        // Animación simple para los contadores
        const cards = document.querySelectorAll('.stats-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    configurarActualizacionAutomatica() {
        // Actualizar cada 5 minutos
        this.intervalId = setInterval(() => {
            this.cargarEstadisticas();
        }, 300000);
    }

    actualizarTituloPagina() {
        if (this.estadisticas) {
            const titulo = document.getElementById('pageTitle');
            if (titulo) {
                titulo.textContent = `Dashboard - ${this.estadisticas.ventas.hoy} ventas hoy`;
            }
        }
    }

    destruir() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// Inicializar dashboard cuando se carga la página
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new DashboardManager();
});

// Limpiar interval al salir de la página
window.addEventListener('beforeunload', function() {
    if (dashboard) {
        dashboard.destruir();
    }
});