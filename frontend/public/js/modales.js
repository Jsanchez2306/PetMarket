/**
 * Sistema de Modales Unificado - PetMarket
 * Reemplaza los alerts nativos por modales bonitas
 */

class ModalManager {
  constructor() {
    this.currentModal = null;
    this.init();
  }

  init() {
    // Crear contenedor de modales si no existe
    if (!document.getElementById('modalContainer')) {
      const container = document.createElement('div');
      container.id = 'modalContainer';
      document.body.appendChild(container);
    }
  }

  /**
   * Muestra un modal de éxito
   * @param {string} message - Mensaje principal
   * @param {string} details - Detalles adicionales (opcional)
   * @param {function} callback - Callback al cerrar (opcional)
   */
  showSuccess(message, details = '', callback = null) {
    this.showModal({
      type: 'success',
      title: 'Éxito',
      icon: 'fas fa-check-circle',
      message: message,
      details: details,
      callback: callback,
      buttons: [
        {
          text: 'Aceptar',
          class: 'btn-modal-success',
          action: 'close'
        }
      ]
    });
  }

  /**
   * Muestra un modal de error
   * @param {string} message - Mensaje principal
   * @param {string} details - Detalles adicionales (opcional)
   * @param {function} callback - Callback al cerrar (opcional)
   */
  showError(message, details = '', callback = null) {
    this.showModal({
      type: 'error',
      title: 'Error',
      icon: 'fas fa-exclamation-triangle',
      message: message,
      details: details,
      callback: callback,
      buttons: [
        {
          text: 'Entendido',
          class: 'btn-modal-error',
          action: 'close'
        }
      ]
    });
  }

  /**
   * Muestra un modal de advertencia
   * @param {string} message - Mensaje principal
   * @param {string} details - Detalles adicionales (opcional)
   * @param {function} callback - Callback al cerrar (opcional)
   */
  showWarning(message, details = '', callback = null) {
    this.showModal({
      type: 'warning',
      title: 'Advertencia',
      icon: 'fas fa-exclamation-circle',
      message: message,
      details: details,
      callback: callback,
      buttons: [
        {
          text: 'Entendido',
          class: 'btn-modal-success',
          action: 'close'
        }
      ]
    });
  }

  /**
   * Muestra un modal informativo
   * @param {string} message - Mensaje principal
   * @param {string} details - Detalles adicionales (opcional)
   * @param {function} callback - Callback al cerrar (opcional)
   */
  showInfo(message, details = '', callback = null) {
    this.showModal({
      type: 'info',
      title: 'Información',
      icon: 'fas fa-info-circle',
      message: message,
      details: details,
      callback: callback,
      buttons: [
        {
          text: 'Aceptar',
          class: 'btn-modal-success',
          action: 'close'
        }
      ]
    });
  }

  /**
   * Muestra un modal de confirmación
   * @param {string} message - Mensaje principal
   * @param {function} onConfirm - Callback al confirmar
   * @param {function} onCancel - Callback al cancelar (opcional)
   * @param {string} details - Detalles adicionales (opcional)
   */
  showConfirm(message, onConfirm, onCancel = null, details = '') {
    this.showModal({
      type: 'confirm',
      title: 'Confirmar acción',
      icon: 'fas fa-question-circle',
      message: message,
      details: details,
      buttons: [
        {
          text: 'Cancelar',
          class: 'btn-modal-secondary',
          action: 'custom',
          callback: () => {
            this.closeModal();
            if (onCancel) onCancel();
          }
        },
        {
          text: 'Confirmar',
          class: 'btn-modal-success',
          action: 'custom',
          callback: () => {
            this.closeModal();
            if (onConfirm) onConfirm();
          }
        }
      ]
    });
  }

  /**
   * Muestra un modal de carga
   * @param {string} message - Mensaje de carga
   */
  showLoading(message = 'Cargando...') {
    const modalId = 'loadingModal_' + Date.now();
    const modalHTML = `
      <div class="modal fade modal-loading" id="${modalId}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <div class="loading-text">${message}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modalContainer').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    this.currentModal = {
      element: document.getElementById(modalId),
      instance: modal
    };
    
    return modalId;
  }

  /**
   * Cierra el modal de carga
   * @param {string} modalId - ID del modal de carga
   */
  hideLoading(modalId = null) {
    if (modalId) {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
          setTimeout(() => modalElement.remove(), 300);
        }
      }
    } else if (this.currentModal) {
      this.currentModal.instance.hide();
      setTimeout(() => this.currentModal.element.remove(), 300);
      this.currentModal = null;
    }
  }

  /**
   * Función principal para mostrar modales
   * @param {object} options - Opciones del modal
   */
  showModal(options) {
    const {
      type = 'info',
      title = 'Información',
      icon = 'fas fa-info-circle',
      message = '',
      details = '',
      buttons = [],
      callback = null
    } = options;

    const modalId = 'customModal_' + Date.now();
    
    // Generar botones
    let buttonsHTML = '';
    buttons.forEach(button => {
      buttonsHTML += `
        <button type="button" class="btn ${button.class}" data-action="${button.action}" data-callback="${button.callback ? 'custom' : ''}">
          ${button.text}
        </button>
      `;
    });

    const modalHTML = `
      <div class="modal fade modal-custom" id="${modalId}" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header modal-${type}">
              <h5 class="modal-title">
                <i class="${icon} modal-icon-${type}"></i>
                ${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="modal-message">${message}</p>
              ${details ? `<p class="modal-details">${details}</p>` : ''}
            </div>
            <div class="modal-footer">
              ${buttonsHTML}
            </div>
          </div>
        </div>
      </div>
    `;

    // Insertar modal en el DOM
    document.getElementById('modalContainer').innerHTML = modalHTML;
    const modalElement = document.getElementById(modalId);
    
    // Event listeners para botones
    modalElement.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const hasCallback = e.target.getAttribute('data-callback') === 'custom';
        
        if (hasCallback) {
          // Encontrar el callback correspondiente
          const buttonIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
          if (buttons[buttonIndex] && buttons[buttonIndex].callback) {
            buttons[buttonIndex].callback();
          }
        } else if (action === 'close') {
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal.hide();
        }
      });
    });

    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Callback al cerrar
    modalElement.addEventListener('hidden.bs.modal', () => {
      if (callback) callback();
      modalElement.remove();
    });

    this.currentModal = {
      element: modalElement,
      instance: modal
    };
  }

  /**
   * Cierra el modal actual
   */
  closeModal() {
    if (this.currentModal) {
      this.currentModal.instance.hide();
    }
  }

  /**
   * Función de compatibilidad para reemplazar alert()
   * @param {string} message - Mensaje del alert
   * @param {string} type - Tipo de modal (success, error, warning, info)
   */
  alert(message, type = 'info') {
    switch (type) {
      case 'success':
        this.showSuccess(message);
        break;
      case 'error':
        this.showError(message);
        break;
      case 'warning':
        this.showWarning(message);
        break;
      default:
        this.showInfo(message);
    }
  }
}

// Instancia global
window.modalManager = new ModalManager();

// Función de conveniencia global
window.showModal = {
  success: (message, details, callback) => window.modalManager.showSuccess(message, details, callback),
  error: (message, details, callback) => window.modalManager.showError(message, details, callback),
  warning: (message, details, callback) => window.modalManager.showWarning(message, details, callback),
  info: (message, details, callback) => window.modalManager.showInfo(message, details, callback),
  confirm: (message, onConfirm, onCancel, details) => window.modalManager.showConfirm(message, onConfirm, onCancel, details),
  loading: (message) => window.modalManager.showLoading(message),
  hideLoading: (modalId) => window.modalManager.hideLoading(modalId)
};

// Para compatibilidad, sobrescribir alert nativo (opcional)
// window.alert = (message) => window.modalManager.alert(message);

console.log('✅ Sistema de Modales PetMarket cargado correctamente');