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
    this.setupStickyHeader(); // Nuevo: configurar header fijo
    
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
    
    // Solo verificar ruta protegida si NO hay usuario autenticado
    if (!this.userInfo) {
      this.checkProtectedRoute();
    }
  }

  showPublicHeader() {
    this.show('#authButtons');
    this.hide('#userArea');
    this.showElements('.public-nav');
    this.hideElements('.client-nav:not(.public-nav), .employee-nav, .admin-nav');
    this.hide('#roleBadge');
    
    // Notificar cambio de estado de usuario a otras páginas
    this.notifyUserStateChange();
  }

  showAuthenticatedHeader() {
    const { rol, tipoUsuario, nombre, email } = this.userInfo;
    this.hide('#authButtons');
    this.show('#userArea');
    this.updateUserInfo(nombre, email, rol, tipoUsuario);
    this.updateNavigation(rol, tipoUsuario);
    this.updateCartButton(rol, tipoUsuario);
    this.updateUserDropdown(rol, tipoUsuario);
    
    // Notificar cambio de estado de usuario a otras páginas
    this.notifyUserStateChange();
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('eliminarCuentaModal'));
        if (modal) modal.hide();
        this.clearAuth();
        showModal.success('Cuenta eliminada', 'Tu cuenta ha sido eliminada exitosamente. Serás redirigido a la página principal.', () => {
          window.location.href = '/';
        });
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
    
    // Limpiar completamente la autenticación
    this.clearAuth();
    this.updateHeader();
    
    // Limpiar caché del navegador
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Limpiar historial del navegador para evitar el botón "atrás"
    this.clearBrowserHistory();
    
    // Marcar que se hizo logout
    try {
      sessionStorage.setItem('justLoggedOut', 'true');
    } catch (e) {
      console.warn('No se pudo marcar logout en sessionStorage:', e);
    }
    
    // Forzar recarga completa sin caché
    this.forceCompleteReload('/');
  }

  clearAuth() {
    console.log('🧹 Limpiando toda la autenticación...');
    
    // Limpiar propiedades de la clase
    this.token = null;
    this.userInfo = null;
    
    // Limpiar TODO el localStorage
    try {
      localStorage.clear();
      console.log('✅ localStorage limpiado');
    } catch (e) {
      console.warn('⚠️ Error limpiando localStorage:', e);
      // Intentar limpiar elementos específicos conocidos
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('userData');
      } catch (e2) {
        console.warn('⚠️ Error limpiando elementos específicos de localStorage:', e2);
      }
    }
    
    // Limpiar TODO el sessionStorage
    try {
      const justLoggedOut = sessionStorage.getItem('justLoggedOut');
      sessionStorage.clear();
      // Restaurar el flag de logout si existía
      if (justLoggedOut) {
        sessionStorage.setItem('justLoggedOut', 'true');
      }
      console.log('✅ sessionStorage limpiado');
    } catch (e) {
      console.warn('⚠️ Error limpiando sessionStorage:', e);
    }
    
    // Limpiar TODAS las cookies de forma exhaustiva
    this.clearAllCookies();
    
    // Limpiar IndexedDB si existe
    this.clearIndexedDB();
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

  // Verificar si estamos en una ruta protegida sin autenticación válida
  async checkProtectedRoute() {
    const currentPath = window.location.pathname;
    
    // Solo verificar si estamos en una ruta protegida
    if (!this.isProtectedPath(window.location.href)) {
      return; // No es ruta protegida, no hacer nada
    }
    
    console.log('🔒 Verificando acceso a ruta protegida:', currentPath);
    
    // Si acabamos de hacer logout, ser más estricto
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
      console.log('🚪 Usuario acabó de hacer logout, redirigiendo...');
      window.location.replace('/restriccion');
      return;
    }
    
    // Si no hay token, verificar si acabamos de cargar la página
    if (!this.token || !this.userInfo) {
      // Dar un poco de tiempo para que cargue la autenticación
      setTimeout(() => {
        if (!this.token || !this.userInfo) {
          console.log('❌ Sin autenticación después del delay, redirigiendo...');
          window.location.replace('/restriccion');
        }
      }, 500); // Dar 500ms para cargar
      return;
    }
    
    // Si hay información de usuario, verificar permisos localmente primero
    if (this.userInfo && this.hasPermissionForRoute(window.location.href, this.userInfo)) {
      console.log('✅ Permisos locales válidos para usuario:', this.userInfo.email, 'Rol:', this.userInfo.rol);
      return; // Todo bien, no hacer más verificaciones agresivas
    }
    
    // Si no hay permisos locales, redirigir
    console.log('❌ Sin permisos locales, redirigiendo...');
    window.location.replace('/restriccion');
  }
  
  // Verificación silenciosa del servidor (no redirige inmediatamente)
  async verifyServerSessionQuietly() {
    try {
      const response = await fetch('/auth/verify', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.log('⚠️ Sesión del servidor inválida');
        // No redirigir inmediatamente, solo limpiar auth
        this.clearAuth();
        this.updateHeader();
      }
    } catch (error) {
      console.log('⚠️ Error verificando sesión del servidor:', error);
    }
  }

  // Verificar permisos por ruta
  hasPermissionForRoute(href, user) {
    if (!user) return false;
    
    try {
      const url = new URL(href, window.location.origin);
      const path = url.pathname;
      
      console.log('🔍 Verificando permisos para:', path, 'Usuario:', user);
      
      // Solo admins pueden acceder a gestión
      if (/^\/(panel|clientes|empleados|facturas|productos)\/?$/.test(path)) {
        const isAdmin = user.rol === 'admin' || user.rol === 'administrador';
        console.log('🔐 Ruta administrativa. Es admin?', isAdmin, 'Rol:', user.rol);
        return isAdmin;
      }
      
      // Otras rutas son públicas o tienen sus propias validaciones
      return true;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
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
    // Verificar si el usuario es administrador
    if (this.userInfo && this.userInfo.rol === 'admin') {
      this.showErrorMessage('Acceso restringido', 'Los administradores no pueden comprar productos');
      return;
    }

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
        //  NUEVA ANIMACIÓN: Disparar animación de vuelo al carrito
        this.animarProductoAlCarrito(button, productoId);
        this.loadCartCount();
        
        button.innerHTML = '<i class="fas fa-check me-2"></i>¡Agregado!';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('btn-success');
          button.classList.add('btn-primary');
          button.disabled = false;
        }, 2000); // Aumentamos el tiempo para que se vea la animación completa
      } else {
        throw new Error(data.mensaje || 'Error al agregar producto');
      }
    } catch (error) {
      console.error(' Error al agregar al carrito:', error);
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

  // Función para limpiar todas las cookies de forma exhaustiva
  clearAllCookies() {
    try {
      console.log('🍪 Limpiando todas las cookies...');
      
      // Obtener todas las cookies
      const cookies = document.cookie.split(";");
      
      // Limpiar cada cookie con diferentes combinaciones de path y domain
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name) {
          // Limpiar con diferentes paths y domains
          const pathsAndDomains = [
            { path: '/' },
            { path: '/', domain: window.location.hostname },
            { path: '/', domain: '.' + window.location.hostname },
            { path: '/auth' },
            { path: '/auth/', domain: window.location.hostname },
            { path: '', domain: window.location.hostname },
            {}
          ];
          
          pathsAndDomains.forEach(options => {
            let cookieString = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            if (options.path !== undefined) cookieString += `path=${options.path};`;
            if (options.domain) cookieString += `domain=${options.domain};`;
            cookieString += 'secure;samesite=strict;';
            
            document.cookie = cookieString;
          });
        }
      });
      
      // Limpiar cookies específicas conocidas del sistema
      const specificCookies = ['token', 'sessionId', 'auth', 'user', 'session', 'connect.sid'];
      specificCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname};`;
      });
      
      console.log('✅ Cookies limpiadas');
    } catch (e) {
      console.warn('⚠️ Error limpiando cookies:', e);
    }
  }

  // Función para limpiar IndexedDB
  clearIndexedDB() {
    if (!window.indexedDB) return;
    
    try {
      console.log('🗄️ Limpiando IndexedDB...');
      
      // Obtener todas las bases de datos y eliminarlas
      if (indexedDB.databases) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => console.log(`✅ Base de datos ${db.name} eliminada`);
              deleteReq.onerror = () => console.warn(`⚠️ Error eliminando base de datos ${db.name}`);
            }
          });
        }).catch(e => console.warn('⚠️ Error obteniendo bases de datos:', e));
      }
    } catch (e) {
      console.warn('⚠️ Error limpiando IndexedDB:', e);
    }
  }

  // Función para limpiar el historial del navegador
  clearBrowserHistory() {
    try {
      console.log('📜 Limpiando historial del navegador...');
      
      // Reemplazar toda la historia con una entrada vacía
      if (window.history && window.history.replaceState) {
        // Limpiar el estado actual
        window.history.replaceState(null, '', '/');
        
        // Intentar limpiar el historial anterior (limitado por seguridad del navegador)
        if (window.history.pushState) {
          window.history.pushState(null, '', '/');
          window.history.replaceState(null, '', '/');
        }
      }
      
      // Prevenir el botón atrás
      window.addEventListener('popstate', this.preventBackButton.bind(this));
      
      console.log('✅ Historial limpiado');
    } catch (e) {
      console.warn('⚠️ Error limpiando historial:', e);
    }
  }

  // Función para prevenir el botón atrás después del logout
  preventBackButton(event) {
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      event.preventDefault();
      event.stopPropagation();
      window.history.pushState(null, '', '/');
      console.log('🚫 Botón atrás bloqueado después del logout');
      return false;
    }
  }

  // Configurar header fijo - SIEMPRE VISIBLE
  setupStickyHeader() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    // Agregar clase CSS para hacerlo fijo
    navbar.classList.add('navbar-sticky');
    
    // GARANTIZAR que nunca se esconda
    navbar.style.transform = 'translateY(0) !important';
    navbar.style.position = 'fixed';
    navbar.style.top = '0';
    
    // Solo efecto visual al hacer scroll - el header NUNCA se esconde
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // FORZAR que siempre esté visible
      navbar.style.transform = 'translateY(0)';
      navbar.classList.remove('navbar-hidden'); // Por si acaso
      
      if (scrollTop > 50) {
        // Solo agregar efecto visual (fondo más sólido, sombra)
        navbar.classList.add('navbar-scrolled');
      } else {
        // Quitar efecto visual cuando está arriba
        navbar.classList.remove('navbar-scrolled');
      }
    });
    
    console.log('✅ Header fijo configurado - GARANTIZADO SIEMPRE VISIBLE');
  }

  //  NUEVA FUNCIÓN: Animación de producto volando al carrito
  animarProductoAlCarrito(button, productoId) {
    try {
      // Encontrar la tarjeta del producto
      const productCard = button.closest('.card, .product-card');
      if (!productCard) {
        console.log('No se encontró la tarjeta del producto');
        return;
      }

      // Encontrar el icono del carrito en el header
      const carritoIcon = document.querySelector('.fa-shopping-cart, [href*="carrito"]');
      if (!carritoIcon) {
        console.log('No se encontró el icono del carrito');
        return;
      }

      // Crear una versión miniatura del producto para la animación
      const productImage = productCard.querySelector('img');
      const productTitle = productCard.querySelector('.card-title, h5');
      
      // Crear elemento de animación más ligero
      const flyingElement = document.createElement('div');
      flyingElement.style.position = 'fixed';
      flyingElement.style.zIndex = '9999';
      flyingElement.style.pointerEvents = 'none';
      flyingElement.style.borderRadius = '10px';
      flyingElement.style.overflow = 'hidden';
      flyingElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      flyingElement.style.background = 'white';
      flyingElement.style.border = '2px solid #007bff';
      
      // Crear contenido del elemento volador
      if (productImage && productTitle) {
        flyingElement.innerHTML = `
          <div style="width: 80px; height: 80px; display: flex; flex-direction: column; align-items: center; padding: 5px;">
            <img src="${productImage.src}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
            <div style="font-size: 8px; text-align: center; margin-top: 2px; font-weight: bold; color: #333;">
              ${productTitle.textContent.substring(0, 20)}...
            </div>
          </div>
        `;
      } else {
        flyingElement.innerHTML = `
          <div style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-box text-white"></i>
          </div>
        `;
      }

      // Posicionar el elemento al inicio
      const cardRect = productCard.getBoundingClientRect();
      const carritoRect = carritoIcon.getBoundingClientRect();
      
      flyingElement.style.left = (cardRect.left + cardRect.width / 2 - 40) + 'px';
      flyingElement.style.top = (cardRect.top + cardRect.height / 2 - 40) + 'px';
      flyingElement.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      // Agregar al DOM
      document.body.appendChild(flyingElement);

      // Iniciar la animación después de un pequeño delay
      setTimeout(() => {
        // Calcular la posición final (carrito)
        const finalX = carritoRect.left + carritoRect.width / 2 - 40;
        const finalY = carritoRect.top + carritoRect.height / 2 - 40;

        // Aplicar transformaciones de animación
        flyingElement.style.left = finalX + 'px';
        flyingElement.style.top = finalY + 'px';
        flyingElement.style.transform = 'scale(0.3) rotate(360deg)';
        flyingElement.style.opacity = '0.7';

        // Agregar efecto de brillo al carrito
        carritoIcon.style.animation = 'carritoGlow 1.2s ease-in-out';

        // Crear efecto de "bounce" en el carrito
        setTimeout(() => {
          carritoIcon.style.animation = 'pulseCart 0.3s ease-in-out';
        }, 800);

      }, 150);

      // Limpiar después de la animación
      setTimeout(() => {
        if (flyingElement.parentNode) {
          flyingElement.parentNode.removeChild(flyingElement);
        }
        // Quitar animación del carrito
        carritoIcon.style.animation = '';
      }, 1200);

      console.log('✨ Animación mejorada de producto al carrito iniciada');

    } catch (error) {
      console.error('Error en animación de producto al carrito:', error);
    }
  }

  // Función para forzar recarga completa sin caché
  forceCompleteReload(url = '/') {
    try {
      console.log('🔄 Forzando recarga completa...');
      
      // Limpiar todos los elementos del DOM que puedan contener datos
      const elementsToClean = ['input', 'textarea', 'select'];
      elementsToClean.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
          el.value = '';
          el.checked = false;
          el.selected = false;
        });
      });
      
      // Reemplazar la ubicación actual para evitar historial
      window.location.replace(url + '?t=' + Date.now());
      
    } catch (e) {
      console.warn('⚠️ Error en recarga completa, usando método alternativo:', e);
      // Método alternativo
      window.location.href = url + '?t=' + Date.now();
    }
  }

  // Función para notificar cambios de estado del usuario a otras páginas
  notifyUserStateChange() {
    try {
      // Disparar evento personalizado para que otras páginas puedan reaccionar
      const event = new CustomEvent('userStateChanged', {
        detail: {
          userInfo: this.userInfo,
          isAuthenticated: !!this.userInfo,
          isAdmin: this.userInfo ? this.userInfo.rol === 'admin' : false
        }
      });
      document.dispatchEvent(event);
      
      // También llamar funciones específicas si existen
      if (typeof window.updateIndexButtons === 'function') {
        window.updateIndexButtons();
      }
      
      if (typeof window.updateCatalogoButtons === 'function') {
        window.updateCatalogoButtons();
      }
      
      console.log('📡 Estado de usuario notificado a otras páginas');
    } catch (error) {
      console.error('Error notificando cambio de estado:', error);
    }
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