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
    
    // Verificar sesión cada 30 segundos para mantenerla activa si el usuario está logueado
    setInterval(() => {
      if (this.token && this.userInfo) {
        this.verifyServerSession();
      }
    }, 30000);
  }

  setupEventListeners() {
    // Logout: abrir modal de confirmación (no cerrar de inmediato)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmEl = document.getElementById('confirmarLogoutModal');
        if (confirmEl) {
          new bootstrap.Modal(confirmEl).show();
        } else {
          this.logout(); // fallback
        }
      });
    }
    // Confirmar logout
    const btnConfirmarLogout = document.getElementById('btnConfirmarLogout');
    if (btnConfirmarLogout) {
      btnConfirmarLogout.addEventListener('click', () => this.logout());
    }

    // Event listeners para formularios de login y registro
    this.setupAuthForms();
    
    // Event listener para cargar datos de perfil
    this.setupProfileModal();
  }

  setupAuthForms() {
    const loginForm = document.getElementById('formLogin');
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

    const registerForm = document.getElementById('formRegistro');
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

    const recuperarForm = document.getElementById('formRecuperarPassword');
    if (recuperarForm) recuperarForm.addEventListener('submit', (e) => this.handlePasswordRecovery(e));

    const recuperarModal = document.getElementById('recuperarPasswordModal');
    if (recuperarModal) {
      recuperarModal.addEventListener('show.bs.modal', () => {
        this.clearRecoveryErrors();
      });
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
    if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));

    const deleteForm = document.getElementById('formEliminarCuenta');
    if (deleteForm) deleteForm.addEventListener('submit', (e) => this.handleDeleteAccount(e));
  }

  loadUserInfo() {
    if (!this.token) {
      console.log('❌ No hay token disponible');
      return;
    }
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token expirado');
        this.clearAuth();
        return;
      }
      this.userInfo = payload;
      console.log('✅ Información del usuario cargada:', this.userInfo);
      this.verifyServerSession();
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      this.clearAuth();
    }
  }

  async verifyServerSession() {
    try {
      const response = await fetch('/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        console.log('⚠️ Sesión del servidor inactiva, revalidando...');
        await this.revalidateSession();
      }
    } catch (error) {
      console.log('❌ Error verificando sesión del servidor:', error);
    }
  }

  async revalidateSession() {
    if (!this.token || !this.userInfo) return;
    try {
      const response = await fetch('/auth/revalidate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: this.userInfo.id,
          email: this.userInfo.email
        })
      });
      if (response.ok) {
        console.log('✅ Sesión del servidor revalidada');
      } else {
        console.log('❌ No se pudo revalidar la sesión del servidor');
      }
    } catch (error) {
      console.log('❌ Error revalidando sesión:', error);
    }
  }

  updateHeader() {
    if (!this.userInfo) this.showPublicHeader();
    else this.showAuthenticatedHeader();
  }

  showPublicHeader() {
    this.show('#authButtons');
    this.hide('#userArea');
    this.showElements('.public-nav');
    this.hideElements('.client-nav:not(.public-nav), .employee-nav, .admin-nav');
    this.hide('#roleBadge');
  }

  showAuthenticatedHeader() {
    const { rol, tipoUsuario, nombre, email } = this.userInfo;
    this.hide('#authButtons');
    this.show('#userArea');
    this.updateUserInfo(nombre, email, rol, tipoUsuario);
    this.updateNavigation(rol, tipoUsuario);
    this.updateCartButton(rol, tipoUsuario);
    this.updateUserDropdown(rol, tipoUsuario);
  }

  updateUserInfo(nombre, email, rol, tipoUsuario) {
    const userDisplayName = document.getElementById('userDisplayName');
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (userDisplayName) userDisplayName.textContent = nombre || email;
    if (dropdownUserName) dropdownUserName.textContent = nombre || email;

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
    this.hideElements('.client-nav:not(.public-nav), .employee-nav, .admin-nav');
    if (rol === 'admin') {
      this.showElements('.public-nav, .client-nav, .admin-nav, .employee-nav');
    } else if (tipoUsuario === 'empleado') {
      this.showElements('.public-nav, .employee-nav');
    } else {
      this.showElements('.public-nav, .client-nav');
    }
  }

  updateCartButton(rol, tipoUsuario) {
    if (tipoUsuario === 'cliente' || rol === 'admin') {
      this.show('.client-only');
      if (tipoUsuario === 'cliente') this.loadCartCount();
    } else {
      this.hide('.client-only');
    }
  }

  updateUserDropdown(rol, tipoUsuario) {
    this.hideElements('.client-only, .employee-only, .admin-only');
    if (rol === 'admin') {
      this.showElements('.admin-only, .employee-only');
    } else if (tipoUsuario === 'empleado') {
      this.showElements('.employee-only');
    } else {
      this.showElements('.client-only');
    }
  }

  async loadCartCount() {
    if (!this.token) return;
    try {
      const response = await fetch('/carrito/api', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}` },
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

  // === NUEVO: detector de rutas realmente protegidas en cliente ===
  isProtectedPath(href) {
    try {
      const url = new URL(href, window.location.origin);
      const p = url.pathname;

      // Protegidas por rol
      if (/^\/(panel|clientes|empleados|facturas)(\/|$)/.test(p)) return true;

      // Gestión de productos (solo raíz /productos o /productos/)
      if (/^\/productos\/?$/.test(p)) return true;

      // Todo lo demás bajo /productos es público (catalogo, detalle, api, etc.)
      return false;
    } catch {
      return false;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginCorreo').value;
    const contrasena = document.getElementById('loginPassword').value;
    const errorAlert = document.getElementById('loginMensajeError');
    if (errorAlert) { errorAlert.classList.add('d-none'); errorAlert.textContent = ''; }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, contrasena })
      });
      const data = await this.parseJSONSafe(response);
      if (response.ok) {
        this.token = data.token;
        if (data.token) localStorage.setItem('token', data.token);
        this.loadUserInfo();
        this.updateHeader();
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();

        // Redirección inteligente:
        // 1) Si guardamos un destino, úsalo.
        let redirectUrl = '/';
        try {
          const saved = sessionStorage.getItem('postLoginRedirect');
          if (saved) {
            redirectUrl = saved;
            sessionStorage.removeItem('postLoginRedirect');
          } else {
            // 2) Si no hay destino guardado, usa la lógica por rol
            if (data.rol === 'admin') redirectUrl = '/panel';
            else if (data.tipoUsuario === 'empleado') redirectUrl = '/productos';
            // clientes: '/' por defecto
          }
        } catch {}

        const nombreUsuario = (data.usuario && (data.usuario.nombre || data.usuario.email)) || email;
        const tipoTexto = data.rol === 'admin' ? 'admin' : (data.tipoUsuario === 'empleado' ? 'empleado' : 'cliente');

        const msg = document.getElementById('loginBienvenidaMensaje');
        if (msg) msg.textContent = `¡Bienvenido ${tipoTexto}, ${nombreUsuario}!`;
        const bonitoEl = document.getElementById('loginExitosoModal');
        if (bonitoEl) {
          const bonitoModal = new bootstrap.Modal(bonitoEl);
          bonitoModal.show();
          const btnContinuar = document.getElementById('loginContinuarBtn');
          let timerId = setTimeout(() => { window.location.href = redirectUrl; }, 1200);
          if (btnContinuar) { btnContinuar.onclick = () => { if (timerId) clearTimeout(timerId); window.location.href = redirectUrl; }; }
        } else {
          window.location.href = redirectUrl;
        }
      } else {
        const loginError = document.getElementById('loginMensajeError');
        if (loginError) {
          loginError.textContent = data.mensaje || 'Verifica tu correo y contraseña e intenta nuevamente.';
          loginError.classList.remove('d-none');
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      const loginError = document.getElementById('loginMensajeError');
      if (loginError) {
        loginError.textContent = 'Error de conexión. No se pudo conectar con el servidor.';
        loginError.classList.remove('d-none');
      }
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const registerData = Object.fromEntries(formData.entries());

    if (registerData.contrasena !== registerData.confirmarContrasena) {
      this.showErrorInElement('registroMensajeError', 'Las contraseñas no coinciden');
      return;
    }
    if (!registerData.telefono) delete registerData.telefono;
    if (!registerData.direccion) delete registerData.direccion;
    delete registerData.confirmarContrasena;

    try {
      const response = await fetch('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registerData)
      });
      const data = await this.parseJSONSafe(response);

      if (response.ok) {
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) registerModal.hide();

        let redirectUrl = '/';
        let mensaje = 'Tu cuenta ha sido creada. Ya puedes iniciar sesión.';
        if (data.token) {
          this.token = data.token;
          localStorage.setItem('token', data.token);
          this.loadUserInfo();
          this.updateHeader();
          const nombreUsuario = (data.usuario && (data.usuario.nombre || data.usuario.email)) || registerData.email;
          const tipoTexto = data.rol === 'admin' ? 'admin' : (data.tipoUsuario === 'empleado' ? 'empleado' : 'cliente');
          mensaje = `¡Bienvenido ${tipoTexto}, ${nombreUsuario}!`;
          if (data.rol === 'admin') redirectUrl = '/panel';
          else if (data.tipoUsuario === 'empleado') redirectUrl = '/productos';
        }

        const msgEl = document.getElementById('registroExitosoMensaje');
        if (msgEl) msgEl.textContent = mensaje;
        const regModalEl = document.getElementById('registroExitosoModal');
        if (regModalEl) {
          const modal = new bootstrap.Modal(regModalEl);
          modal.show();
          let timerId = setTimeout(() => { window.location.href = redirectUrl; }, 1200);
          const btn = document.getElementById('registroContinuarBtn');
          if (btn) btn.onclick = () => { if (timerId) clearTimeout(timerId); window.location.href = redirectUrl; };
        } else {
          window.location.href = redirectUrl;
        }

        const form = document.getElementById('formRegistro');
        if (form) form.reset();
        this.hideErrorInElement('registroMensajeError');
      } else {
        this.showErrorInElement('registroMensajeError', data.mensaje || 'Error en el registro');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      this.showErrorInElement('registroMensajeError', 'Error de conexión con el servidor');
    }
  }

  async loadProfileData() {
    if (!this.token) return;
    try {
      const response = await fetch('/auth/perfil', {
        headers: { 'Authorization': `Bearer ${this.token}` }
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
    this.hideErrorInElement('perfilMensajeError');
    this.hideErrorInElement('perfilMensajeExito');
    const formData = new FormData(e.target);
    const profileData = Object.fromEntries(formData.entries());

    if (!profileData.nombre?.trim()) {
      this.showErrorInElement('perfilMensajeError', 'El nombre es obligatorio');
      return;
    }
    if (!profileData.contrasenaActual?.trim()) {
      this.showErrorInElement('perfilMensajeError', 'La contraseña actual es obligatoria para confirmar los cambios');
      return;
    }
    if ((profileData.contrasenaNueva?.trim() || profileData.confirmarContrasena?.trim()) &&
        profileData.contrasenaNueva !== profileData.confirmarContrasena) {
      this.showErrorInElement('perfilMensajeError', 'Las contraseñas nuevas no coinciden');
      return;
    }

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
        this.showSuccessInElement('perfilMensajeExito', 'Perfil actualizado correctamente');
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(document.getElementById('perfilModal'));
          if (modal) modal.hide();
        }, 2000);
      } else {
        this.showErrorInElement('perfilMensajeError', data.mensaje || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      this.showErrorInElement('perfilMensajeError', 'Error de conexión al actualizar el perfil');
    }
  }

  async handleDeleteAccount(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const deleteData = Object.fromEntries(formData.entries());

    if (!deleteData.contrasena?.trim()) {
      this.showErrorInElement('eliminarMensajeError', 'Debes ingresar tu contraseña');
      return;
    }
    if (deleteData.confirmar !== 'on') {
      this.showErrorInElement('eliminarMensajeError', 'Debes confirmar que entiendes que esta acción es irreversible');
      return;
    }

    try {
      const response = await fetch('/auth/eliminar-cuenta', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ contrasena: deleteData.contrasena })
      });
      const data = await response.json();

      if (response.ok) {
        alert('Tu cuenta ha sido eliminada exitosamente. Serás redirigido a la página principal.');
        const modal = bootstrap.Modal.getInstance(document.getElementById('eliminarCuentaModal'));
        if (modal) modal.hide();
        this.clearAuth();
        window.location.href = '/';
      } else {
        this.showErrorInElement('eliminarMensajeError', data.mensaje || 'Error al eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      this.showErrorInElement('eliminarMensajeError', 'Error de conexión al eliminar la cuenta');
    }
  }

  // IMPORTANTE: cerrar sesión del servidor también
  async logout() {
    console.log('🚪 Cerrando sesión');
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('No se pudo cerrar sesión en el servidor:', e);
    }
    this.clearAuth();
    this.updateHeader();
    window.location.href = '/';
  }

  clearAuth() {
    this.token = null;
    this.userInfo = null;
    localStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
  }

  async handlePasswordRecovery(e) {
    e.preventDefault();
    const email = document.getElementById('recuperarEmail').value.trim();
    const btnRecuperar = document.getElementById('btnRecuperar');
    const spinner = document.getElementById('recuperarSpinner');
    const errorAlert = document.getElementById('recuperarMensajeError');

    if (!email) {
      this.showErrorInElement('recuperarMensajeError', 'Debes ingresar tu correo electrónico');
      return;
    }
    if (spinner) spinner.classList.remove('d-none');
    if (btnRecuperar) btnRecuperar.disabled = true;
    if (errorAlert) errorAlert.classList.add('d-none');

    try {
      const response = await fetch('/auth/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (spinner) spinner.classList.add('d-none');
      if (btnRecuperar) btnRecuperar.disabled = false;

      if (response.ok) {
        const recuperarModal = bootstrap.Modal.getInstance(document.getElementById('recuperarPasswordModal'));
        if (recuperarModal) recuperarModal.hide();
        const exitoMensaje = document.getElementById('recuperarExitoMensaje');
        if (exitoMensaje) {
          exitoMensaje.textContent = data.mensaje || 'Hemos enviado una nueva contraseña temporal a tu correo electrónico. Úsala para iniciar sesión y luego cámbiala desde tu perfil.';
        }
        const exitoModal = new bootstrap.Modal(document.getElementById('recuperarExitosoModal'));
        exitoModal.show();
        const form = document.getElementById('formRecuperarPassword');
        if (form) form.reset();
      } else {
        this.showErrorInElement('recuperarMensajeError', data.mensaje || 'El correo electrónico no está registrado en nuestro sistema.');
      }
    } catch (error) {
      console.error('❌ Error al recuperar contraseña:', error);
      if (spinner) spinner.classList.add('d-none');
      if (btnRecuperar) btnRecuperar.disabled = false;
      this.showErrorInElement('recuperarMensajeError', 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    }
  }

  clearRecoveryErrors() {
    const errorAlert = document.getElementById('recuperarMensajeError');
    if (errorAlert) errorAlert.classList.add('d-none');
    const spinner = document.getElementById('recuperarSpinner');
    const btnRecuperar = document.getElementById('btnRecuperar');
    if (spinner) spinner.classList.add('d-none');
    if (btnRecuperar) btnRecuperar.disabled = false;
  }

  // Utilidades para mostrar/ocultar elementos
  show(selector) { document.querySelectorAll(selector).forEach(el => el.classList.remove('d-none')); }
  hide(selector) { document.querySelectorAll(selector).forEach(el => el.classList.add('d-none')); }
  showElements(selector) { document.querySelectorAll(selector).forEach(el => el.classList.remove('d-none')); }
  hideElements(selector) { document.querySelectorAll(selector).forEach(el => el.classList.add('d-none')); }

  showErrorInElement(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) { element.textContent = message; element.classList.remove('d-none'); }
  }
  hideErrorInElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.add('d-none');
  }
  showSuccessInElement(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) { element.textContent = message; element.classList.remove('d-none'); }
  }

  // Configurar botones de carrito y enlaces protegidos
  setupCartButtons() {
    document.addEventListener('click', (e) => {
      const button = e.target.classList.contains('btn-comprar') ? e.target : e.target.closest('.btn-comprar');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        const productoId = button.getAttribute('data-producto');

        // Invitado: guarda la URL actual para volver después del login
        if (!this.checkAuthForPurchase()) return;

        this.agregarAlCarrito(productoId, button);
      }
    });

    // Interceptor de enlaces protegidos
    this.setupAdminLinkInterceptor();
  }

  // Interceptor para enlaces administrativos (solo rutas protegidas reales)
  setupAdminLinkInterceptor() {
    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      // Solo interceptar si es una ruta protegida real
      if (!this.isProtectedPath(href)) return;

      // Interceptamos siempre para chequear sesión
      e.preventDefault();

      // Si no hay sesión en cliente, guardar destino y pedir login
      if (!this.token || !this.userInfo) {
        try { sessionStorage.setItem('postLoginRedirect', href); } catch {}
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) new bootstrap.Modal(loginModalEl).show();
        else window.location.href = '/restriccion';
        return;
      }

      // Si hay token en cliente, validar sesión de servidor antes de navegar
      try {
        const resp = await fetch('/auth/verify', { method: 'GET', credentials: 'include' });
        if (resp.ok) {
          window.location.href = href;
        } else {
          this.clearAuth();
          try { sessionStorage.setItem('postLoginRedirect', href); } catch {}
          const loginModalEl = document.getElementById('loginModal');
          if (loginModalEl) new bootstrap.Modal(loginModalEl).show();
          else window.location.href = '/restriccion';
        }
      } catch {
        window.location.href = '/restriccion';
      }
    });
  }

  // Verificar autenticación antes de comprar
  checkAuthForPurchase() {
    if (!this.token || !this.userInfo) {
      // Guardar a dónde volver después de login (ej: catálogo actual)
      try {
        const current = window.location.pathname + window.location.search + window.location.hash;
        sessionStorage.setItem('postLoginRedirect', current);
      } catch {}
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        credentials: 'include',
        body: JSON.stringify({ productId: productoId, quantity: 1 })
      });
      const data = await response.json();

      if (response.ok) {
        this.showSuccessMessage('¡Agregado!', 'Producto agregado al carrito exitosamente');
        this.loadCartCount();
        button.innerHTML = '<i class="fas fa-check me-2"></i>¡Agregado!';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('btn-success');
          button.classList.add('btn-primary');
          button.disabled = false;
        }, 100);
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

  // Notificaciones pequeñas
  showSuccessMessage(title, message) { this.createNotification('success', title, message); }
  showErrorMessage(title, message) { this.createNotification('error', title, message); }
  createNotification(type, title, message) {
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
      document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    const bgClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    notification.className = `alert ${bgClass} alert-dismissible fade show`;
    notification.innerHTML = `
      <i class="fas fa-${icon} me-2"></i>
      <strong>${title}</strong><br>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 2000);
  }

  async parseJSONSafe(response) {
    try {
      const text = await response.text();
      if (!text) return {};
      return JSON.parse(text);
    } catch { return {}; }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.headerUnificado = new HeaderUnificado();
});
if (document.readyState !== 'loading' && !window.headerUnificado) {
  window.headerUnificado = new HeaderUnificado();
}
window.HeaderUnificado = HeaderUnificado;