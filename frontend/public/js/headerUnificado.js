/**
 * Header Unificado - Sistema de autenticación y roles dinámico
 * Maneja la visualización del header según el rol del usuario
 */

class HeaderUnificado {
  constructor() {
    this.token = localStorage.getItem('token');
    this.userInfo = null;
    this.init();
  }

  init() {
    console.log('🎯 Inicializando Header Unificado');
    this.setupEventListeners();
    this.loadUserInfo();
    this.updateHeader();
    this.setupCartButtons();
  }

  setupEventListeners() {
    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Event listeners para formularios de login y registro
    this.setupAuthForms();
    
    // Event listener para cargar datos de perfil
    this.setupProfileModal();
  }

  setupAuthForms() {
    // Formulario de login
    const loginForm = document.getElementById('formLogin');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Formulario de registro
    const registerForm = document.getElementById('formRegistro');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
  }

  setupProfileModal() {
    const perfilModal = document.getElementById('perfilModal');
    if (perfilModal) {
      perfilModal.addEventListener('show.bs.modal', () => {
        this.loadProfileData();
      });
    }

    const profileForm = document.getElementById('formActualizarPerfil');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }
  }

  loadUserInfo() {
    if (!this.token) {
      console.log('❌ No hay token disponible');
      return;
    }

    try {
      // Decodificar token JWT
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      this.userInfo = payload;
      console.log('✅ Información del usuario cargada:', this.userInfo);
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      this.clearAuth();
    }
  }

  updateHeader() {
    if (!this.userInfo) {
      this.showPublicHeader();
    } else {
      this.showAuthenticatedHeader();
    }
  }

  showPublicHeader() {
    console.log('🌐 Mostrando header público');
    
    // Mostrar botones de auth, ocultar área de usuario
    this.show('#authButtons');
    this.hide('#userArea');
    
    // Mostrar solo navegación pública
    this.showElements('.public-nav');
    this.hideElements('.client-nav:not(.public-nav), .employee-nav, .admin-nav');
    
    // Ocultar badge de rol
    this.hide('#roleBadge');
  }

  showAuthenticatedHeader() {
    const { rol, tipoUsuario, nombre, email } = this.userInfo;
    console.log(`👤 Mostrando header para: ${tipoUsuario} - ${rol}`);

    // Ocultar botones de auth, mostrar área de usuario
    this.hide('#authButtons');
    this.show('#userArea');

    // Actualizar información del usuario
    this.updateUserInfo(nombre, email, rol, tipoUsuario);

    // Mostrar navegación según rol
    this.updateNavigation(rol, tipoUsuario);

    // Mostrar/ocultar carrito según rol
    this.updateCartButton(rol, tipoUsuario);

    // Actualizar dropdown del usuario
    this.updateUserDropdown(rol, tipoUsuario);
  }

  updateUserInfo(nombre, email, rol, tipoUsuario) {
    // Actualizar nombre mostrado
    const userDisplayName = document.getElementById('userDisplayName');
    const dropdownUserName = document.getElementById('dropdownUserName');
    
    if (userDisplayName) userDisplayName.textContent = nombre || email;
    if (dropdownUserName) dropdownUserName.textContent = nombre || email;

    // Actualizar icono según tipo de usuario
    const userIcon = document.getElementById('userIcon');
    const dropdownUserIcon = document.getElementById('dropdownUserIcon');
    const roleBadge = document.getElementById('roleBadge');

    let iconClass = 'fas fa-user';
    let badgeClass = 'badge bg-primary';
    let badgeText = '';

    if (rol === 'admin') {
      iconClass = 'fas fa-user-shield';
      badgeClass = 'badge bg-danger';
      badgeText = 'Admin';
    } else if (tipoUsuario === 'empleado') {
      iconClass = 'fas fa-user-tie';
      badgeClass = 'badge bg-warning text-dark';
      badgeText = 'Empleado';
    } else {
      iconClass = 'fas fa-user';
      badgeClass = 'badge bg-info';
      badgeText = 'Cliente';
    }

    if (userIcon) userIcon.className = iconClass + ' me-2';
    if (dropdownUserIcon) dropdownUserIcon.className = iconClass + ' me-2';
    
    if (roleBadge) {
      roleBadge.className = badgeClass + ' ms-2 small';
      roleBadge.textContent = badgeText;
      this.show('#roleBadge');
    }
  }

  updateNavigation(rol, tipoUsuario) {
    // Ocultar toda la navegación específica primero
    this.hideElements('.client-nav:not(.public-nav), .employee-nav, .admin-nav');

    if (rol === 'admin') {
      // Admin ve todo
      this.showElements('.public-nav, .client-nav, .admin-nav, .employee-nav');
    } else if (tipoUsuario === 'empleado') {
      // Empleado ve navegación pública y de empleado
      this.showElements('.public-nav, .employee-nav');
    } else {
      // Cliente ve navegación pública y de cliente
      this.showElements('.public-nav, .client-nav');
    }
  }

  updateCartButton(rol, tipoUsuario) {
    const cartBtn = document.getElementById('carritoBtn');
    
    if (tipoUsuario === 'cliente' || rol === 'admin') {
      // Solo los clientes (y admin para testing) ven el carrito
      this.show('.client-only');
      if (tipoUsuario === 'cliente') {
        this.loadCartCount();
      }
    } else {
      // Empleados no ven el carrito
      this.hide('.client-only');
    }
  }

  updateUserDropdown(rol, tipoUsuario) {
    // Ocultar todas las opciones específicas primero
    this.hideElements('.client-only, .employee-only, .admin-only');

    if (rol === 'admin') {
      // Admin ve todas las opciones
      this.showElements('.admin-only, .employee-only');
    } else if (tipoUsuario === 'empleado') {
      // Empleado ve opciones de empleado
      this.showElements('.employee-only');
    } else {
      // Cliente ve opciones de cliente
      this.showElements('.client-only');
    }
  }

  async loadCartCount() {
    if (!this.token) return;
    
    try {
      const response = await fetch('/carrito/api', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const counter = document.getElementById('carritoContador');
        
        if (counter) {
          const itemCount = data.itemCount || data.items?.length || 0;
          if (itemCount > 0) {
            counter.textContent = itemCount;
            counter.classList.remove('d-none');
          } else {
            counter.classList.add('d-none');
          }
        }
      }
    } catch (error) {
      console.log('No se pudo cargar el contador del carrito:', error);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginCorreo').value;
    const contrasena = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, contrasena })
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token y actualizar header
        this.token = data.token;
        localStorage.setItem('token', data.token);
        this.loadUserInfo();
        this.updateHeader();

        // Cerrar modal y mostrar éxito
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();

        this.showSuccessMessage('¡Bienvenido!', `Has iniciado sesión correctamente, ${data.usuario.nombre}`);

        // Redirigir según rol si es necesario
        this.handlePostLoginRedirect(data);
      } else {
        this.showErrorMessage('Error de login', data.mensaje);
      }
    } catch (error) {
      console.error('Error en login:', error);
      this.showErrorMessage('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = Object.fromEntries(formData.entries());

    // Validación de contraseñas
    if (registerData.contrasena !== registerData.confirmarContrasena) {
      this.showErrorInElement('registroMensajeError', 'Las contraseñas no coinciden');
      return;
    }

    // Limpiar campos vacijos para campos opcionales
    if (!registerData.telefono) delete registerData.telefono;
    if (!registerData.direccion) delete registerData.direccion;
    
    // Eliminar el campo de confirmación de contraseña
    delete registerData.confirmarContrasena;

    console.log('📝 Datos de registro:', registerData);

    try {
      const response = await fetch('/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();
      console.log('📨 Respuesta del servidor:', data);

      if (response.ok) {
        // Guardar token si viene (auto-login)
        if (data.token) {
          this.token = data.token;
          localStorage.setItem('token', data.token);
          this.loadUserInfo();
          this.updateHeader();
        }

        // Cerrar modal y mostrar éxito
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) registerModal.hide();

        this.showSuccessMessage('¡Cuenta creada!', 'Tu cuenta ha sido creada exitosamente');
        
        // Limpiar formulario
        document.getElementById('formRegistro').reset();
        this.hideErrorInElement('registroMensajeError');
      } else {
        this.showErrorInElement('registroMensajeError', data.mensaje || 'Error en el registro');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      this.showErrorInElement('registroMensajeError', 'Error de conexión con el servidor');
    }
  }

  handlePostLoginRedirect(data) {
    // Solo redirigir empleados a su área de trabajo
    setTimeout(() => {
      if (data.tipoUsuario === 'empleado') {
        window.location.href = '/productos';
      } else if (data.rol === 'admin') {
        window.location.href = '/panel';
      }
      // Los clientes se quedan en la página actual
    }, 1500);
  }

  async loadProfileData() {
    if (!this.token) return;

    try {
      const response = await fetch('/auth/perfil', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.fillProfileForm(userData);
      }
    } catch (error) {
      console.error('Error cargando datos de perfil:', error);
    }
  }

  fillProfileForm(userData) {
    const fields = {
      'perfilNombre': userData.nombre,
      'perfilCorreo': userData.email,
      'perfilTelefono': userData.telefono,
      'perfilDireccion': userData.direccion
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value || '';
    });
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/auth/actualizar-perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          this.token = data.token;
          localStorage.setItem('token', data.token);
          this.loadUserInfo();
          this.updateHeader();
        }

        this.showSuccessMessage('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
        
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(document.getElementById('perfilModal'));
          if (modal) modal.hide();
        }, 2000);
      } else {
        this.showErrorInElement('perfilMensajeError', data.mensaje);
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      this.showErrorInElement('perfilMensajeError', 'Error de conexión');
    }
  }

  logout() {
    console.log('🚪 Cerrando sesión');
    
    // Limpiar datos de autenticación
    this.clearAuth();
    
    // Actualizar header
    this.updateHeader();
    
    // Redirigir a home
    window.location.href = '/';
  }

  clearAuth() {
    this.token = null;
    this.userInfo = null;
    localStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
  }

  // Utilidades para mostrar/ocultar elementos
  show(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove('d-none'));
  }

  hide(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add('d-none'));
  }

  showElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove('d-none'));
  }

  hideElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add('d-none'));
  }

  showSuccessMessage(title, message) {
    console.log(`✅ ${title}: ${message}`);
    
    // Crear notificación temporal
    this.createNotification('success', title, message);
  }

  showErrorMessage(title, message) {
    console.error(`❌ ${title}: ${message}`);
    
    // Crear notificación temporal
    this.createNotification('error', title, message);
  }

  createNotification(type, title, message) {
    // Crear contenedor si no existe
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    }

    // Crear notificación
    const notification = document.createElement('div');
    const bgClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    
    notification.className = `alert ${bgClass} alert-dismissible fade show`;
    notification.innerHTML = `
      <i class="fas fa-${icon} me-2"></i>
      <strong>${title}</strong><br>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  showErrorInElement(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove('d-none');
    }
  }

  hideErrorInElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('d-none');
    }
  }

  // Configurar botones de carrito
  setupCartButtons() {
    console.log('🛒 Configurando botones de carrito');
    
    // Interceptar clicks en botones de compra usando delegación de eventos
    document.addEventListener('click', (e) => {
      const button = e.target.classList.contains('btn-comprar') ? e.target : e.target.closest('.btn-comprar');
      
      if (button) {
        console.log('🛒 Click en botón de comprar detectado');
        e.preventDefault();
        e.stopPropagation();
        
        const productoId = button.getAttribute('data-producto');
        console.log('🆔 ID del producto:', productoId);
        
        if (!this.checkAuthForPurchase()) {
          return;
        }
        
        // Si está autenticado, agregar al carrito
        this.agregarAlCarrito(productoId, button);
      }
    });

    // También configurar botones existentes al cargar
    setTimeout(() => {
      const botonesComprar = document.querySelectorAll('.btn-comprar');
      console.log(`🛒 Botones de comprar encontrados: ${botonesComprar.length}`);
    }, 1000);
  }

  // Verificar autenticación antes de comprar
  checkAuthForPurchase() {
    if (!this.token || !this.userInfo) {
      console.log('🔒 Usuario no autenticado, mostrando modal de login');
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();
      return false;
    }
    return true;
  }

  // Agregar producto al carrito
  async agregarAlCarrito(productoId, button) {
    if (!productoId) {
      this.showErrorMessage('Error', 'ID de producto no válido');
      return;
    }

    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Agregando...';
    button.disabled = true;

    try {
      const response = await fetch('/carrito/api/agregar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          productId: productoId,
          quantity: 1 
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.showSuccessMessage('¡Agregado!', 'Producto agregado al carrito exitosamente');
        this.loadCartCount(); // Actualizar contador del carrito
        
        // Efecto visual en el botón
        button.innerHTML = '<i class="fas fa-check me-2"></i>¡Agregado!';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('btn-success');
          button.classList.add('btn-primary');
          button.disabled = false;
        }, 2000);
      } else {
        throw new Error(data.mensaje || 'Error al agregar producto');
      }
    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
      this.showErrorMessage('Error', error.message || 'No se pudo agregar el producto al carrito');
      
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.headerUnificado = new HeaderUnificado();
});

// También inicializar si el DOM ya está cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.headerUnificado) {
      window.headerUnificado = new HeaderUnificado();
    }
  });
} else {
  // DOM ya está cargado
  if (!window.headerUnificado) {
    window.headerUnificado = new HeaderUnificado();
  }
}

// Exportar para uso global
window.HeaderUnificado = HeaderUnificado;