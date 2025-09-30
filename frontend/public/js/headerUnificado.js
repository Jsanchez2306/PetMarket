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
    
    // Verificar sesión cada 30 segundos para mantenerla activa
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

    // Formulario de recuperación de contraseña
    const recuperarForm = document.getElementById('formRecuperarPassword');
    if (recuperarForm) {
      recuperarForm.addEventListener('submit', (e) => this.handlePasswordRecovery(e));
    }

    // Event listener para limpiar errores cuando se reabre el modal de recuperación
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
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    const deleteForm = document.getElementById('formEliminarCuenta');
    if (deleteForm) {
      deleteForm.addEventListener('submit', (e) => this.handleDeleteAccount(e));
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
      
      // Verificar si el token está expirado
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token expirado');
        this.clearAuth();
        return;
      }

      this.userInfo = payload;
      console.log('✅ Información del usuario cargada:', this.userInfo);
      
      // Verificar sesión del servidor también
      this.verifyServerSession();
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      this.clearAuth();
    }
  }

  // Verificar que la sesión del servidor también esté activa
  async verifyServerSession() {
    try {
      const response = await fetch('/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        console.log('⚠️ Sesión del servidor inactiva, revalidando...');
        // Intentar revalidar la sesión con el token
        await this.revalidateSession();
      }
    } catch (error) {
      console.log('❌ Error verificando sesión del servidor:', error);
    }
  }

  // Revalidar sesión del servidor usando el JWT
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

  // Helper para parsear JSON seguro
  async parseJSONSafe(response) {
    try {
      const text = await response.text();
      if (!text) return {};
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginCorreo').value;
    const contrasena = document.getElementById('loginPassword').value;

    // Ocultar error previo en el modal de login
    const errorAlert = document.getElementById('loginMensajeError');
    if (errorAlert) {
      errorAlert.classList.add('d-none');
      errorAlert.textContent = '';
    }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // mantener cookies de sesión
        body: JSON.stringify({ email, contrasena })
      });

      const data = await this.parseJSONSafe(response);

      if (response.ok) {
        // Guardar token y actualizar header
        this.token = data.token;
        if (data.token) localStorage.setItem('token', data.token);
        this.loadUserInfo();
        this.updateHeader();

        // Cerrar modal de login
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) loginModal.hide();

        // Mensaje de bienvenida y URL de redirección
        const nombreUsuario = (data.usuario && (data.usuario.nombre || data.usuario.email)) || email;
        const tipoTexto = data.tipoUsuario === 'empleado' ? 'empleado' : (data.rol === 'admin' ? 'admin' : 'cliente');

        let redirectUrl = '/';
        if (data.rol === 'admin') {
          redirectUrl = '/panel';
        } else if (data.tipoUsuario === 'empleado') {
          redirectUrl = '/productos';
        } else {
          redirectUrl = '/';
        }

        // Configurar y mostrar modal bonito de login
        const msg = document.getElementById('loginBienvenidaMensaje');
        if (msg) msg.textContent = `¡Bienvenido ${tipoTexto}, ${nombreUsuario}!`;

        const bonitoEl = document.getElementById('loginExitosoModal');
        if (bonitoEl) {
          const bonitoModal = new bootstrap.Modal(bonitoEl);
          bonitoModal.show();

          const btnContinuar = document.getElementById('loginContinuarBtn');
          let timerId = setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1200); // igual que tus CRUD

          if (btnContinuar) {
            btnContinuar.onclick = () => {
              if (timerId) clearTimeout(timerId);
              window.location.href = redirectUrl;
            };
          }

          // Si quieres cancelar la redirección automática al cerrar con la "X", descomenta:
          // bonitoEl.addEventListener('hide.bs.modal', () => { if (timerId) clearTimeout(timerId); });
        } else {
          // Fallback si no existe el modal
          window.location.href = redirectUrl;
        }
      } else {
        // Mostrar error dentro del modal de login
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

    // Validación de contraseñas
    if (registerData.contrasena !== registerData.confirmarContrasena) {
      this.showErrorInElement('registroMensajeError', 'Las contraseñas no coinciden');
      return;
    }

    // Limpiar campos vacíos para campos opcionales
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
        credentials: 'include',
        body: JSON.stringify(registerData)
      });

      const data = await this.parseJSONSafe(response);
      console.log('📨 Respuesta del servidor:', data);

      if (response.ok) {
        // Cerrar modal de registro
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) registerModal.hide();

        // Decidir mensaje y redirección
        let redirectUrl = '/';
        let mensaje = 'Tu cuenta ha sido creada. Ya puedes iniciar sesión.';

        if (data.token) {
          // Auto-login: guardar token y actualizar header
          this.token = data.token;
          localStorage.setItem('token', data.token);
          this.loadUserInfo();
          this.updateHeader();

          const nombreUsuario = (data.usuario && (data.usuario.nombre || data.usuario.email)) || registerData.email;
          const tipoTexto = data.rol === 'admin' ? 'admin' : (data.tipoUsuario === 'empleado' ? 'empleado' : 'cliente');
          mensaje = `¡Bienvenido ${tipoTexto}, ${nombreUsuario}!`;
          if (data.rol === 'admin') redirectUrl = '/panel';
          else if (data.tipoUsuario === 'empleado') redirectUrl = '/productos';
          else redirectUrl = '/';
        } else {
          // Sin auto-login
          redirectUrl = '/';
        }

        // Mostrar modal bonito de registro
        const msgEl = document.getElementById('registroExitosoMensaje');
        if (msgEl) msgEl.textContent = mensaje;

        const regModalEl = document.getElementById('registroExitosoModal');
        if (regModalEl) {
          const modal = new bootstrap.Modal(regModalEl);
          modal.show();

          let timerId = setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1200);

          const btn = document.getElementById('registroContinuarBtn');
          if (btn) {
            btn.onclick = () => {
              if (timerId) clearTimeout(timerId);
              window.location.href = redirectUrl;
            };
          }

          // Si quieres cancelar la auto-redirección al cerrar con la "X", descomenta:
          // regModalEl.addEventListener('hide.bs.modal', () => { if (timerId) clearTimeout(timerId); });
        } else {
          // Fallback si no existe el modal
          window.location.href = redirectUrl;
        }

        // Limpiar formulario y errores
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

  handlePostLoginRedirect(_data) {
    // Ya no se usa: la redirección se maneja con el modal de éxito (1200 ms)
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
    console.log('📝 Actualizando perfil de usuario');
    
    // Limpiar mensajes anteriores
    this.hideErrorInElement('perfilMensajeError');
    this.hideErrorInElement('perfilMensajeExito');
    
    const formData = new FormData(e.target);
    const profileData = Object.fromEntries(formData.entries());
    
    console.log('Datos del perfil a enviar:', profileData);

    // Validaciones básicas
    if (!profileData.nombre || profileData.nombre.trim() === '') {
      this.showErrorInElement('perfilMensajeError', 'El nombre es obligatorio');
      return;
    }

    if (!profileData.contrasenaActual || profileData.contrasenaActual.trim() === '') {
      this.showErrorInElement('perfilMensajeError', 'La contraseña actual es obligatoria para confirmar los cambios');
      return;
    }

    // Validación de contraseñas si se quiere cambiar
    if (profileData.contrasenaNueva && profileData.contrasenaNueva.trim() !== '' || 
        profileData.confirmarContrasena && profileData.confirmarContrasena.trim() !== '') {
      
      if (!profileData.contrasenaNueva || profileData.contrasenaNueva.trim() === '') {
        this.showErrorInElement('perfilMensajeError', 'Para cambiar la contraseña, debe ingresar la nueva contraseña');
        return;
      }
      
      if (!profileData.confirmarContrasena || profileData.confirmarContrasena.trim() === '') {
        this.showErrorInElement('perfilMensajeError', 'Para cambiar la contraseña, debe confirmar la nueva contraseña');
        return;
      }
      
      if (profileData.contrasenaNueva !== profileData.confirmarContrasena) {
        this.showErrorInElement('perfilMensajeError', 'Las contraseñas nuevas no coinciden');
        return;
      }
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
      console.log('Respuesta del servidor:', data);

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
    console.log('🗑️ Iniciando eliminación de cuenta');
    
    const formData = new FormData(e.target);
    const deleteData = Object.fromEntries(formData.entries());

    // Validaciones básicas
    if (!deleteData.contrasena || deleteData.contrasena.trim() === '') {
      this.showErrorInElement('eliminarMensajeError', 'Debes ingresar tu contraseña');
      return;
    }

    if (!deleteData.confirmar || deleteData.confirmar !== 'on') {
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
        // Mostrar mensaje de éxito (puedes migrar a modal si lo deseas)
        alert('Tu cuenta ha sido eliminada exitosamente. Serás redirigido a la página principal.');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('eliminarCuentaModal'));
        if (modal) modal.hide();
        
        // Limpiar autenticación y redirigir
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

  async handlePasswordRecovery(e) {
    e.preventDefault();
    console.log('🔑 Iniciando recuperación de contraseña');

    const email = document.getElementById('recuperarEmail').value.trim();
    const btnRecuperar = document.getElementById('btnRecuperar');
    const spinner = document.getElementById('recuperarSpinner');
    const errorAlert = document.getElementById('recuperarMensajeError');

    if (!email) {
      this.showErrorInElement('recuperarMensajeError', 'Debes ingresar tu correo electrónico');
      return;
    }

    // Mostrar spinner y deshabilitar botón
    if (spinner) spinner.classList.remove('d-none');
    if (btnRecuperar) btnRecuperar.disabled = true;
    if (errorAlert) errorAlert.classList.add('d-none');

    try {
      const response = await fetch('/auth/recuperar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      // Ocultar spinner y habilitar botón
      if (spinner) spinner.classList.add('d-none');
      if (btnRecuperar) btnRecuperar.disabled = false;

      if (response.ok) {
        // Cerrar modal de recuperación
        const recuperarModal = bootstrap.Modal.getInstance(document.getElementById('recuperarPasswordModal'));
        if (recuperarModal) {
          recuperarModal.hide();
        }

        // Configurar mensaje de éxito
        const exitoMensaje = document.getElementById('recuperarExitoMensaje');
        if (exitoMensaje) {
          exitoMensaje.textContent = data.mensaje || 'Hemos enviado una nueva contraseña temporal a tu correo electrónico. Úsala para iniciar sesión y luego cámbiala desde tu perfil.';
        }

        // Mostrar modal de éxito
        const exitoModal = new bootstrap.Modal(document.getElementById('recuperarExitosoModal'));
        exitoModal.show();

        // Limpiar formulario
        const form = document.getElementById('formRecuperarPassword');
        if (form) form.reset();
      } else {
        // Mostrar error en el mismo modal
        this.showErrorInElement('recuperarMensajeError', data.mensaje || 'El correo electrónico no está registrado en nuestro sistema.');
      }
    } catch (error) {
      console.error('❌ Error al recuperar contraseña:', error);
      
      // Ocultar spinner y habilitar botón
      if (spinner) spinner.classList.add('d-none');
      if (btnRecuperar) btnRecuperar.disabled = false;
      
      // Mostrar error de conexión
      this.showErrorInElement('recuperarMensajeError', 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    }
  }

  clearRecoveryErrors() {
    // Limpiar cualquier mensaje de error previo
    const errorAlert = document.getElementById('recuperarMensajeError');
    if (errorAlert) {
      errorAlert.classList.add('d-none');
    }
    
    // Resetear spinner y botón
    const spinner = document.getElementById('recuperarSpinner');
    const btnRecuperar = document.getElementById('btnRecuperar');
    if (spinner) spinner.classList.add('d-none');
    if (btnRecuperar) btnRecuperar.disabled = false;
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

    // Auto-remover después de 2 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 2000);
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

  showSuccessInElement(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove('d-none');
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

    // Interceptar clicks en enlaces administrativos
    this.setupAdminLinkInterceptor();
  }

  // Interceptor para enlaces administrativos
  setupAdminLinkInterceptor() {
    const adminLinks = [
      '/panel', '/clientes', '/empleados', '/productos', '/facturas'
    ];

    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || !adminLinks.some(adminPath => href.includes(adminPath))) return;

      // Si es un enlace administrativo, verificar autenticación primero
      if (this.token && this.userInfo) {
        console.log('🔗 Navegación a ruta administrativa, verificando sesión...');
        e.preventDefault();
        
        try {
          await this.verifyServerSession();
          // Dar un pequeño delay para que la sesión se revalide
          setTimeout(() => {
            window.location.href = href;
          }, 500);
        } catch (error) {
          console.error('❌ Error verificando sesión antes de navegar:', error);
          window.location.href = href; // Intentar navegar de todas formas
        }
      }
    });
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