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
    
    this.setupEventListeners();
    this.loadUserInfo();
    this.updateHeader();
    this.setupCartButtons();
    this.setupStickyHeader(); // configurar header fijo
    
    // IMPORTANTE: Cargar contador del carrito siempre
    this.loadCartCountFromLocalStorage();
    
    // Verificar sesión cada 30 segundos para mantenerla activa si el usuario está logueado
    setInterval(() => {
      if (this.token && this.userInfo) {
        this.verifyServerSession();
        // NUEVO: Actualizar contador de ventas si es empleado/admin
        if (this.userInfo.rol === 'admin' || this.userInfo.tipoUsuario === 'empleado') {
          this.loadSalesCount();
        }
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

    // NUEVO: Guardar página actual cuando se abre el modal de login
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('show.bs.modal', () => {
        // Solo guardar si no hay una acción post-login específica
        const postLoginAction = sessionStorage.getItem('postLoginAction');
        if (!postLoginAction) {
          const currentPage = window.location.pathname + window.location.search;
          
          sessionStorage.setItem('postLoginRedirect', currentPage);
        }

        // Render explícito de reCAPTCHA si el API está listo
        try {
          const container = document.getElementById('loginRecaptcha');
          if (container && window.isRecaptchaReady && window.isRecaptchaReady()) {
            if (typeof container.dataset.rendered === 'undefined') {
              const widgetId = grecaptcha.render(container, { 
                sitekey: window.LOGIN_RECAPTCHA_SITE_KEY,
                theme: 'light',
                size: 'normal',
                callback: () => {
                  // Limpia mensajes de error cuando el usuario completa el captcha
                  const errorAlert = document.getElementById('loginMensajeError');
                  if (errorAlert) errorAlert.classList.add('d-none');
                },
                'expired-callback': () => {
                  const errorAlert = document.getElementById('loginMensajeError');
                  if (errorAlert) {
                    errorAlert.textContent = 'El reCAPTCHA expiró. Vuelve a marcar la casilla.';
                    errorAlert.classList.remove('d-none');
                  }
                }
              });
              container.dataset.rendered = 'true';
              container.dataset.widgetId = String(widgetId);
              
            }
          }
        } catch (e) {
          console.warn('⚠️ No se pudo renderizar reCAPTCHA en modal:', e.message);
        }
      });

      // Limpiar redirección si se cierra el modal sin login
      loginModal.addEventListener('hidden.bs.modal', () => {
        // Solo limpiar si no se hizo login exitoso (no hay postLoginAction)
        const postLoginAction = sessionStorage.getItem('postLoginAction');
        if (!postLoginAction && !this.userInfo) {
          
          sessionStorage.removeItem('postLoginRedirect');
        }

        // Resetear reCAPTCHA del modal si existe
        try {
          const container = document.getElementById('loginRecaptcha');
          if (container && container.dataset.widgetId && window.grecaptcha) {
            grecaptcha.reset(Number(container.dataset.widgetId));
          }
        } catch {}
      });
    }

    // Renderizar reCAPTCHA en el modal de registro
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
      registerModal.addEventListener('show.bs.modal', () => {
        try {
          const container = document.getElementById('registerRecaptcha');
          if (container && window.isRecaptchaReady && window.isRecaptchaReady()) {
            if (typeof container.dataset.rendered === 'undefined') {
              const widgetId = grecaptcha.render(container, {
                sitekey: window.LOGIN_RECAPTCHA_SITE_KEY,
                theme: 'light',
                size: 'normal',
                callback: () => {
                  const errorAlert = document.getElementById('registroMensajeError');
                  if (errorAlert) errorAlert.classList.add('d-none');
                },
                'expired-callback': () => {
                  const errorAlert = document.getElementById('registroMensajeError');
                  if (errorAlert) {
                    errorAlert.textContent = 'El reCAPTCHA expiró. Vuelve a marcar la casilla.';
                    errorAlert.classList.remove('d-none');
                  }
                }
              });
              container.dataset.rendered = 'true';
              container.dataset.widgetId = String(widgetId);
              
            }
          }
        } catch (e) {
          console.warn('⚠️ No se pudo renderizar reCAPTCHA en registro:', e.message);
        }
      });
      registerModal.addEventListener('hidden.bs.modal', () => {
        try {
          const container = document.getElementById('registerRecaptcha');
          if (container && container.dataset.widgetId && window.grecaptcha) {
            grecaptcha.reset(Number(container.dataset.widgetId));
          }
        } catch {}
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

  // Sanea cadenas para evitar caracteres de control o no imprimibles
  sanitize(str) {
    try {
      if (!str) return '';
      return String(str)
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .normalize('NFC')
        .trim();
    } catch { return String(str || '').trim(); }
  }

  loadUserInfo() {
    if (!this.token) {
      
      return;
    }
    
    // Verificar que el token tenga el formato correcto
    if (typeof this.token !== 'string' || this.token === 'null' || this.token === 'undefined') {
      
      this.clearAuth();
      return;
    }
    
    const tokenParts = this.token.split('.');
    if (tokenParts.length !== 3) {
      
      this.clearAuth();
      return;
    }
    
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        
        this.clearAuth();
        return;
      }
      
      this.userInfo = payload;
      
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
        
        await this.revalidateSession();
      }
    } catch (error) {
      
    }
  }

  async revalidateSession() {
    if (!this.token || !this.userInfo) return;
    
    // Verificar que el token sea válido antes de enviarlo
    if (typeof this.token !== 'string' || this.token.split('.').length !== 3) {
      
      this.clearAuth();
      this.updateHeader();
      return;
    }
    
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
        
      } else {
        
        // Si es error 401, limpiar autenticación
        if (response.status === 401) {
          
          this.clearAuth();
          this.updateHeader();
        }
      }
    } catch (error) {
      
    }
  }

  updateHeader() {
    // Verificar carrito ANTES de actualizar header
    const carritoAntes = localStorage.getItem('petmarket_cart');
    
    
    if (!this.userInfo) this.showPublicHeader();
    else this.showAuthenticatedHeader();
    
    // Verificar carrito DESPUÉS de actualizar header
    const carritoDespues = localStorage.getItem('petmarket_cart');
    
    
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
    
    // CAMBIO IMPORTANTE: Mostrar carrito para usuarios no autenticados
    this.show('#carritoBtn');
    this.loadCartCountFromLocalStorage();
    
    // NUEVO: Ocultar botón de ventas para usuarios no autenticados
    this.hide('#ventasBtn');
    
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
    // Sanear nombre para evitar caracteres de control u otros símbolos extraños
    const safeName = this.sanitize(nombre) || this.sanitize(email);
    if (userDisplayName) userDisplayName.textContent = safeName;
    if (dropdownUserName) dropdownUserName.textContent = safeName;

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
    const carritoBtn = document.getElementById('carritoBtn');
    
    // Ocultar carrito para administradores y empleados
    if (rol === 'admin' || tipoUsuario === 'empleado') {
      if (carritoBtn) carritoBtn.classList.add('d-none');
    } else {
      // Mostrar carrito para clientes y usuarios no autenticados
      if (carritoBtn) carritoBtn.classList.remove('d-none');
      this.loadCartCountFromLocalStorage();
    }
    
    // NUEVO: Manejar botón de ventas para empleados y admins
    this.updateSalesButton(rol, tipoUsuario);
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

  // NUEVO: Cargar contador desde localStorage
  loadCartCountFromLocalStorage() {
    try {
      const cart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
      const itemCount = cart.reduce((total, item) => total + (item.cantidad || 1), 0);
      const counter = document.getElementById('carritoContador');
      
      if (counter) {
        if (itemCount > 0) {
          counter.textContent = itemCount;
          counter.classList.remove('d-none');
        } else {
          counter.classList.add('d-none');
        }
      }
      
      
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error);
    }
  }

  // Mantener función original para compatibilidad (si se necesita)
  async loadCartCount() {
    // Por ahora usar localStorage, pero mantener estructura para futuro
    this.loadCartCountFromLocalStorage();
  }

  // NUEVO: Actualizar botón de ventas
  updateSalesButton(rol, tipoUsuario) {
    const salesBtn = document.getElementById('ventasBtn');
    if (!salesBtn) return;

    // Mostrar solo para empleados y admins
    if (rol === 'admin' || tipoUsuario === 'empleado') {
      salesBtn.classList.remove('d-none');
      this.loadSalesCount();
    } else {
      salesBtn.classList.add('d-none');
    }
  }

  // NUEVO: Cargar contador de ventas sin entregar
  async loadSalesCount() {
    if (!this.token) {
      
      return;
    }

    try {
      
      
      const response = await fetch('/ventas/api/ventas/sin-entregar/count', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const counter = document.getElementById('ventasContador');
        
        if (counter) {
          if (data.count > 0) {
            counter.textContent = data.count;
            counter.classList.remove('d-none');
          } else {
            counter.classList.add('d-none');
          }
        }
        
        
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.warn('No se pudo cargar el contador de ventas:', response.status, errorData.message);
        
        // Si es error 401, el token podría estar expirado
        if (response.status === 401) {
          
          this.clearAuth();
          this.updateHeader();
        }
      }
    } catch (error) {
      console.error('Error cargando contador de ventas:', error);
    }
  }

  // === NUEVO: detector de rutas realmente protegidas en cliente ===
  isProtectedPath(href) {
    try {
      const url = new URL(href, window.location.origin);
      const p = url.pathname;

      // Protegidas por rol
      if (/^\/(panel|clientes|empleados|facturas|ventas)(\/|$)/.test(p)) return true;

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

    // Obtener token de reCAPTCHA si existe el widget
    let recaptchaToken = null;
    try {
      const container = document.getElementById('loginRecaptcha');
      if (window.grecaptcha && container) {
        const widgetId = container.dataset.widgetId ? Number(container.dataset.widgetId) : undefined;
        recaptchaToken = typeof widgetId === 'number' ? grecaptcha.getResponse(widgetId) : grecaptcha.getResponse();
        if (!recaptchaToken) {
          // En localhost permitimos continuar aunque no haya token (backend no lo exige)
          const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
          if (!isLocal) {
            // Mostrar mensaje amigable si no ha pasado el captcha fuera de local
            if (errorAlert) {
              errorAlert.textContent = 'Por favor confirma que no eres un robot.';
              errorAlert.classList.remove('d-none');
            }
            return;
          }
        }
      }
    } catch {}

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, contrasena, recaptchaToken })
      });
      const data = await this.parseJSONSafe(response);
      if (response.ok) {
        
        
        if (data.token && typeof data.token === 'string' && data.token.trim()) {
          this.token = data.token.trim();
          localStorage.setItem('token', this.token);
          
        } else {
          console.error('❌ Token inválido recibido del servidor:', data.token);
          this.showErrorMessage('Error', 'Token de autenticación inválido');
          return;
        }
        
        // Verificar carrito ANTES de cargar info
        const carritoAntes = localStorage.getItem('petmarket_cart');
        
        
        this.loadUserInfo();
        this.updateHeader();
        
        // Verificar carrito DESPUÉS de cargar info
        const carritoDespues = localStorage.getItem('petmarket_cart');
        
        
        // NUEVO: Disparar evento de login exitoso
        document.dispatchEvent(new CustomEvent('loginSuccess', {
          detail: { userInfo: this.userInfo, token: this.token }
        }));
        
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();

        // VERIFICAR SI ES UN CHECKOUT - NO HACER REDIRECT
        const postLoginAction = sessionStorage.getItem('postLoginAction');
        if (postLoginAction === 'checkout') {
            // No hacer redirect, el carrito-localStorage.js manejará el pago
          
            return;
        }

        // NUEVO: Por defecto, mantener al usuario en la página actual
        let redirectUrl = window.location.pathname + window.location.search;
        
        try {
          // 1) Si hay un destino específico guardado, úsalo
          const saved = sessionStorage.getItem('postLoginRedirect');
          if (saved) {
            redirectUrl = saved;
            sessionStorage.removeItem('postLoginRedirect');
          } else {
            // 2) Solo cambiar de página si es un rol específico que necesita redirección
            if (data.rol === 'admin' && !window.location.pathname.includes('/panel')) {
              redirectUrl = '/panel';
            } else if (data.tipoUsuario === 'empleado' && window.location.pathname === '/') {
              redirectUrl = '/productos';
            }
            // Para clientes: mantener en la página actual
          }
        } catch {}

  const nombreUsuario = this.sanitize((data.usuario && (data.usuario.nombre || data.usuario.email)) || email);
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
    // Resetear captcha (si corresponde) para permitir reintentar
    try { 
      const container = document.getElementById('loginRecaptcha');
      if (window.grecaptcha && container) {
        const widgetId = container.dataset.widgetId ? Number(container.dataset.widgetId) : undefined;
        if (typeof widgetId === 'number') grecaptcha.reset(widgetId); else grecaptcha.reset();
      }
    } catch {}
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


    // Obtener token de reCAPTCHA si existe el widget
    let recaptchaToken = null;
    try {
      const container = document.getElementById('registerRecaptcha');
      if (window.grecaptcha && container) {
        const widgetId = container.dataset.widgetId ? Number(container.dataset.widgetId) : undefined;
        recaptchaToken = typeof widgetId === 'number' ? grecaptcha.getResponse(widgetId) : grecaptcha.getResponse();
        if (!recaptchaToken) {
          this.showErrorInElement('registroMensajeError', 'Por favor confirma que no eres un robot.');
          return;
        }
      }
    } catch {}

    try {
      const response = await fetch('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...registerData, recaptchaToken })
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
          const nombreUsuario = this.sanitize((data.usuario && (data.usuario.nombre || data.usuario.email)) || registerData.email);
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
    // Resetear captcha (si corresponde) para permitir reintentar
    try {
      const container = document.getElementById('registerRecaptcha');
      if (window.grecaptcha && container) {
        const widgetId = container.dataset.widgetId ? Number(container.dataset.widgetId) : undefined;
        if (typeof widgetId === 'number') grecaptcha.reset(widgetId); else grecaptcha.reset();
      }
    } catch {}
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
    
    
    // Limpiar propiedades de la clase
    this.token = null;
    this.userInfo = null;
    
    // PRESERVAR el carrito antes de limpiar
    const carritoBackup = localStorage.getItem('petmarket_cart');
    
    
    // Limpiar solo elementos de autenticación, NO todo el localStorage
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('cartItems'); // carrito viejo
      localStorage.removeItem('userData');
      localStorage.removeItem('sessionData');
      localStorage.removeItem('authData');
      
      // RESTAURAR el carrito si existía
      if (carritoBackup) {
        localStorage.setItem('petmarket_cart', carritoBackup);
        
      }
      
      
    } catch (e) {
      console.warn('⚠️ Error limpiando localStorage:', e);
      // Fallback: restaurar carrito de todas formas
      if (carritoBackup) {
        try {
          localStorage.setItem('petmarket_cart', carritoBackup);
        
        } catch (e2) {
          console.error('❌ Error restaurando carrito:', e2);
        }
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

        // CAMBIO: Ya no verificar autenticación - permitir agregar sin login
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
    
    
    
    // Si acabamos de hacer logout, ser más estricto
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
      
      window.location.replace('/restriccion');
      return;
    }
    
    // Si no hay token, verificar si acabamos de cargar la página
    if (!this.token || !this.userInfo) {
      // Dar un poco de tiempo para que cargue la autenticación
      setTimeout(() => {
        if (!this.token || !this.userInfo) {
          
          window.location.replace('/restriccion');
        }
      }, 500); // Dar 500ms para cargar
      return;
    }
    
    // Si hay información de usuario, verificar permisos localmente primero
    if (this.userInfo && this.hasPermissionForRoute(window.location.href, this.userInfo)) {
      
      return; // Todo bien, no hacer más verificaciones agresivas
    }
    
    // Si no hay permisos locales, redirigir
    
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
        
        // No redirigir inmediatamente, solo limpiar auth
        this.clearAuth();
        this.updateHeader();
      }
    } catch (error) {
      
    }
  }

  // Verificar permisos por ruta
  hasPermissionForRoute(href, user) {
    if (!user) return false;
    
    try {
      const url = new URL(href, window.location.origin);
      const path = url.pathname;
      
      
      
      // Rutas que requieren permisos de admin
      if (/^\/(panel|clientes|empleados|facturas|productos)\/?$/.test(path)) {
        const isAdmin = user.rol === 'admin' || user.rol === 'administrador';
        
        return isAdmin;
      }
      
      // Ventas: admins y empleados
      if (/^\/ventas\/?$/.test(path)) {
        const isAdminOrEmployee = user.rol === 'admin' || user.tipoUsuario === 'empleado';
        
        return isAdminOrEmployee;
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

  // OBSOLETO: Ya no verificar autenticación para agregar al carrito
  // Solo se requiere autenticación para el checkout, no para agregar productos
  checkAuthForPurchase() {
    // CAMBIO: Siempre permitir agregar al carrito (localStorage)
    return true;
  }

  // NUEVO: Agregar producto al carrito localStorage
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
      // Obtener información del producto del backend
      const response = await fetch(`/productos/api/${productoId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || 'No se pudo obtener información del producto');
      }
      
      const producto = await response.json();
      
      // Verificar stock disponible
      if (producto.stock <= 0) {
        throw new Error('Producto sin stock disponible');
      }

      // Obtener carrito actual del localStorage
      const cart = JSON.parse(localStorage.getItem('petmarket_cart') || '[]');
      
      // Verificar si el producto ya existe en el carrito
      const existingItemIndex = cart.findIndex(item => item.productId === productoId);
      
      if (existingItemIndex >= 0) {
        // Si ya existe, incrementar cantidad (verificando stock)
        const currentQuantity = cart[existingItemIndex].cantidad;
        if (currentQuantity >= producto.stock) {
          throw new Error(`Stock máximo disponible: ${producto.stock}`);
        }
        cart[existingItemIndex].cantidad += 1;
      } else {
        // Si no existe, agregar nuevo item
        cart.push({
          productId: productoId,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          categoria: producto.categoria || 'Sin categoría', // ✅ AGREGADO
          cantidad: 1,
          stock: producto.stock,
          addedAt: new Date().toISOString()
        });
      }

      // Guardar carrito actualizado
      localStorage.setItem('petmarket_cart', JSON.stringify(cart));
      
      // Disparar animación de vuelo al carrito
      this.animarProductoAlCarrito(button, productoId);
      
      // Actualizar contador
      this.loadCartCountFromLocalStorage();
      
      // Feedback visual
      button.innerHTML = '<i class="fas fa-check me-2"></i>¡Agregado!';
      button.classList.remove('btn-primary');
      button.classList.add('btn-success');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-success');
        button.classList.add('btn-primary');
        button.disabled = false;
      }, 2000);

      
      
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

  // Función para limpiar todas las cookies de forma exhaustiva
  clearAllCookies() {
    try {
      
      
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
      
      
    } catch (e) {
      console.warn('⚠️ Error limpiando cookies:', e);
    }
  }

  // Función para limpiar IndexedDB
  clearIndexedDB() {
    if (!window.indexedDB) return;
    
    try {
      
      
      // Obtener todas las bases de datos y eliminarlas
      if (indexedDB.databases) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => {};
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
    
    
  }

  //  NUEVA FUNCIÓN: Animación de producto volando al carrito
  animarProductoAlCarrito(button, productoId) {
    try {
      // Encontrar la tarjeta del producto
      const productCard = button.closest('.card, .product-card');
      if (!productCard) {
        
        return;
      }

      // Encontrar el icono del carrito en el header
      const carritoIcon = document.querySelector('.fa-shopping-cart, [href*="carrito"]');
      if (!carritoIcon) {
        
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

      

    } catch (error) {
      console.error('Error en animación de producto al carrito:', error);
    }
  }

  // Función para forzar recarga completa sin caché
  forceCompleteReload(url = '/') {
    try {
      
      
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