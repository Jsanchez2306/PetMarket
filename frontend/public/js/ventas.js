/**
 * Gestión de Ventas - JavaScript
 * Maneja la visualización y gestión de ventas con filtros y paginación
 */

class VentasManager {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.init();
  }

  init() {
    console.log('🏪 Inicializando gestor de ventas');
    
    this.setupEventListeners();
    this.loadEstadisticas();
    this.loadVentas();
  }

  setupEventListeners() {
    // Filtros
    document.getElementById('aplicarFiltros')?.addEventListener('click', () => this.aplicarFiltros());
    document.getElementById('limpiarFiltros')?.addEventListener('click', () => this.limpiarFiltros());
    
    // Cambio de estado
    document.getElementById('confirmarCambioEstado')?.addEventListener('click', () => this.confirmarCambioEstado());
    
    // Enter en campos de fecha
    document.getElementById('fechaInicio')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.aplicarFiltros();
    });
    document.getElementById('fechaFin')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.aplicarFiltros();
    });
  }

  async loadEstadisticas() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        if (window.showModal) {
          window.showModal.warning('No hay token de autenticación', 'Por favor, inicia sesión nuevamente.');
        }
        return;
      }

      const response = await fetch('/ventas/api/ventas/estadisticas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updateEstadisticas(data.estadisticas);
      } else {
        console.error('Error cargando estadísticas:', response.statusText);
        if (window.showModal) {
          window.showModal.warning('Error cargando estadísticas', 'No se pudieron cargar las estadísticas de ventas.');
        }
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      if (window.showModal) {
        window.showModal.error('Error de conexión', 'No se pudieron cargar las estadísticas. Verifica tu conexión a internet.');
      }
    }
  }

  updateEstadisticas(stats) {
    document.getElementById('totalVentas').textContent = stats.totalVentas || 0;
    document.getElementById('ventasSinEntregar').textContent = stats.ventasSinEntregar || 0;
    document.getElementById('ventasEnCamino').textContent = stats.ventasEnCamino || 0;
    document.getElementById('ventasEntregadas').textContent = stats.ventasEntregadas || 0;
  }

  async loadVentas(page = 1) {
    try {
      // Mostrar loading con modal personalizado si está disponible
      const loadingId = window.showModal ? 
        window.showModal.loading('Cargando ventas...') : null;
      
      if (!loadingId) this.showLoading(); // Fallback
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.showError('No hay token de autenticación');
        return;
      }

      // Construir URL con filtros y paginación
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...this.currentFilters
      });

      const response = await fetch(`/ventas/api/ventas?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.renderVentas(data.ventas);
        this.renderPagination(data.pagination);
        this.currentPage = page;
      } else {
        this.showError('Error cargando ventas: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      this.showError('Error de conexión al cargar ventas');
    } finally {
      // Ocultar loading
      if (window.showModal) {
        window.showModal.hideLoading();
      } else {
        this.hideLoading();
      }
    }
  }

  renderVentas(ventas) {
    const tbody = document.getElementById('ventasTableBody');
    
    if (!ventas || ventas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p class="text-muted mb-0">No se encontraron ventas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = ventas.map(venta => `
      <tr>
        <td>
          <strong>#${venta._id.slice(-6)}</strong>
          <br>
          <small class="text-muted">${venta.paymentId || 'N/A'}</small>
        </td>
        <td>
          <div>
            <strong>${venta.cliente?.nombre || venta.clienteNombre || 'Sin cliente'}</strong>
            <br>
            <small class="text-muted">${venta.cliente?.email || venta.clienteEmail || ''}</small>
            ${venta.cliente?.telefono || venta.clienteTelefono ? `<br><small class="text-muted">${venta.cliente?.telefono || venta.clienteTelefono}</small>` : ''}
          </div>
        </td>
        <td>
          <div class="d-flex flex-wrap gap-1">
            ${venta.productos.slice(0, 3).map(item => `
              <div class="d-flex align-items-center" title="${item.producto?.nombre || item.nombre || 'Producto eliminado'}">
                <small>${item.cantidad}x ${item.producto?.nombre || item.nombre || 'Producto eliminado'}</small>
              </div>
            `).join('')}
            ${venta.productos.length > 3 ? `<small class="text-muted">+${venta.productos.length - 3} más</small>` : ''}
          </div>
        </td>
        <td>
          <strong>$${this.formatCurrency(venta.total)}</strong>
        </td>
        <td>
          <div>
            ${this.formatDate(venta.fechaCompra)}
            <br>
            <small class="text-muted">${this.formatTime(venta.fechaCompra)}</small>
          </div>
        </td>
        <td>
          <span class="badge status-badge status-${venta.estadoEntrega.replace(' ', '-')}">
            ${this.getEstadoIcon(venta.estadoEntrega)} ${this.capitalizeFirst(venta.estadoEntrega)}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-info" onclick="ventasManager.verDetalles('${venta._id}')" 
                    title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="ventasManager.cambiarEstado('${venta._id}', '${venta.estadoEntrega}')" 
                    title="Cambiar estado">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    
    if (!pagination || pagination.pages <= 1) {
      container.innerHTML = '';
      return;
    }

    const { page, pages } = pagination;
    let paginationHTML = '<nav><ul class="pagination">';

    // Botón anterior
    paginationHTML += `
      <li class="page-item ${page <= 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="ventasManager.loadVentas(${page - 1}); return false;">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;

    // Páginas
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    if (startPage > 1) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="ventasManager.loadVentas(1); return false;">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="ventasManager.loadVentas(${i}); return false;">${i}</a>
        </li>
      `;
    }

    if (endPage < pages) {
      if (endPage < pages - 1) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="ventasManager.loadVentas(${pages}); return false;">${pages}</a></li>`;
    }

    // Botón siguiente
    paginationHTML += `
      <li class="page-item ${page >= pages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="ventasManager.loadVentas(${page + 1}); return false;">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;

    paginationHTML += '</ul></nav>';
    container.innerHTML = paginationHTML;
  }

  aplicarFiltros() {
    const formData = new FormData(document.getElementById('filtrosForm'));
    this.currentFilters = {};
    
    for (let [key, value] of formData.entries()) {
      if (value && value !== 'todos') {
        this.currentFilters[key] = value;
      }
    }
    
    this.currentPage = 1;
    this.loadVentas(1);
  }

  limpiarFiltros() {
    document.getElementById('filtrosForm').reset();
    this.currentFilters = {};
    this.currentPage = 1;
    this.loadVentas(1);
  }

  async verDetalles(ventaId) {
    try {
      // Mostrar loading
      const loadingId = window.showModal ? 
        window.showModal.loading('Cargando detalles de la venta...') : null;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/ventas/api/ventas?page=1&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Ocultar loading
      if (loadingId) window.showModal.hideLoading(loadingId);

      if (response.ok) {
        const data = await response.json();
        const venta = data.ventas.find(v => v._id === ventaId);
        
        if (venta) {
          this.mostrarDetallesVenta(venta);
        } else {
          this.showError('Venta no encontrada');
        }
      } else {
        this.showError('Error cargando detalles: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
      this.showError('Error cargando detalles de la venta');
    }
  }

  mostrarDetallesVenta(venta) {
    const content = document.getElementById('detallesVentaContent');
    
    content.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h6>Información de la Venta</h6>
          <p><strong>ID:</strong> ${venta._id}</p>
          <p><strong>Payment ID:</strong> ${venta.paymentId || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${this.formatDate(venta.fechaCompra)} ${this.formatTime(venta.fechaCompra)}</p>
          <p><strong>Estado:</strong> 
            <span class="badge status-badge status-${venta.estadoEntrega.replace(' ', '-')}">
              ${this.capitalizeFirst(venta.estadoEntrega)}
            </span>
          </p>
          <p><strong>Total:</strong> $${this.formatCurrency(venta.total)}</p>
        </div>
        <div class="col-md-6">
          <h6>Información del Cliente</h6>
          <p><strong>Nombre:</strong> ${venta.cliente?.nombre || venta.clienteNombre || 'N/A'}</p>
          <p><strong>Email:</strong> ${venta.cliente?.email || venta.clienteEmail || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${venta.cliente?.telefono || venta.clienteTelefono || 'N/A'}</p>
          <p><strong>Dirección:</strong> ${venta.cliente?.direccion || venta.clienteDireccion || 'N/A'}</p>
        </div>
      </div>
      <hr>
      <h6>Productos</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio Unit.</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${venta.productos.map(item => `
              <tr>
                <td>
                  ${item.producto?.nombre || item.nombre || 'Producto eliminado'}
                </td>
                <td>$${this.formatCurrency(item.precio)}</td>
                <td>${item.cantidad}</td>
                <td>$${this.formatCurrency(item.precio * item.cantidad)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="table-dark">
              <th colspan="3">Total</th>
              <th>$${this.formatCurrency(venta.total)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    
    new bootstrap.Modal(document.getElementById('detallesVentaModal')).show();
  }

  cambiarEstado(ventaId, estadoActual) {
    // Si existe el modal tradicional, usarlo
    if (document.getElementById('cambiarEstadoModal')) {
      document.getElementById('ventaId').value = ventaId;
      document.getElementById('nuevoEstado').value = estadoActual;
      new bootstrap.Modal(document.getElementById('cambiarEstadoModal')).show();
    } else {
      // Usar modal de confirmación personalizado
      const estados = [
        { value: 'sin entregar', text: 'Sin entregar' },
        { value: 'en camino', text: 'En camino' },
        { value: 'entregado', text: 'Entregado' }
      ];
      
      let selectHTML = '<select id="tempNuevoEstado" class="form-select mt-2">';
      estados.forEach(estado => {
        const selected = estado.value === estadoActual ? 'selected' : '';
        selectHTML += `<option value="${estado.value}" ${selected}>${estado.text}</option>`;
      });
      selectHTML += '</select>';
      
      if (window.showModal) {
        window.showModal.confirm(
          '¿Deseas cambiar el estado de esta venta?',
          () => {
            const nuevoEstado = document.getElementById('tempNuevoEstado').value;
            this.procesarCambioEstado(ventaId, nuevoEstado);
          },
          null,
          `Selecciona el nuevo estado: ${selectHTML}`
        );
      }
    }
  }

  async confirmarCambioEstado() {
    try {
      const ventaId = document.getElementById('ventaId').value;
      const nuevoEstado = document.getElementById('nuevoEstado').value;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/ventas/api/ventas/${ventaId}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estadoEntrega: nuevoEstado })
      });

      if (response.ok) {
        this.showSuccess('Estado actualizado correctamente');
        bootstrap.Modal.getInstance(document.getElementById('cambiarEstadoModal')).hide();
        this.loadVentas(this.currentPage);
        this.loadEstadisticas();
        
        // Actualizar contador en header si existe
        if (window.headerUnificado) {
          window.headerUnificado.loadSalesCount();
        }
      } else {
        const error = await response.json();
        this.showError(error.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      this.showError('Error de conexión al actualizar estado');
    }
  }

  async procesarCambioEstado(ventaId, nuevoEstado) {
    try {
      // Mostrar loading
      const loadingId = window.showModal ? 
        window.showModal.loading('Actualizando estado...') : null;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/ventas/api/ventas/${ventaId}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estadoEntrega: nuevoEstado })
      });

      // Ocultar loading
      if (loadingId) window.showModal.hideLoading(loadingId);

      if (response.ok) {
        this.showSuccess('Estado actualizado correctamente');
        this.loadVentas(this.currentPage);
        this.loadEstadisticas();
        
        // Actualizar contador en header si existe
        if (window.headerUnificado) {
          window.headerUnificado.loadSalesCount();
        }
      } else {
        const error = await response.json();
        this.showError(error.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      this.showError('Error de conexión al actualizar estado');
    }
  }

  // Utilidades
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CO');
  }

  formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getEstadoIcon(estado) {
    switch (estado) {
      case 'sin entregar': return '<i class="fas fa-clock"></i>';
      case 'en camino': return '<i class="fas fa-truck"></i>';
      case 'entregado': return '<i class="fas fa-check-circle"></i>';
      default: return '<i class="fas fa-question"></i>';
    }
  }

  showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('d-none');
  }

  hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('d-none');
  }

  showSuccess(message) {
    if (window.showModal) {
      window.showModal.success(message);
    } else {
      this.showNotification('success', 'Éxito', message);
    }
  }

  showError(message) {
    if (window.showModal) {
      window.showModal.error(message);
    } else {
      this.showNotification('error', 'Error', message);
    }
  }

  showNotification(type, title, message) {
    // Usar el sistema de modales personalizados
    if (window.showModal) {
      if (type === 'success') {
        window.showModal.success(message, title);
      } else if (type === 'error') {
        window.showModal.error(message, title);
      } else if (type === 'warning') {
        window.showModal.warning(message, title);
      } else {
        window.showModal.info(message, title);
      }
    } else if (window.headerUnificado) {
      // Fallback al sistema del header
      if (type === 'success') {
        window.headerUnificado.showSuccessMessage(title, message);
      } else {
        window.headerUnificado.showErrorMessage(title, message);
      }
    } else {
      // Fallback simple
      alert(`${title}: ${message}`);
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.ventasManager = new VentasManager();
});

// Exportar para uso global
window.VentasManager = VentasManager;