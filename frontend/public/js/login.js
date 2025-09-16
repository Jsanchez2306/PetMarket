document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginCorreo').value;
  const contrasena = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, contrasena })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);

      // Cerrar modal de login
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (loginModal) {
        loginModal.hide();
      }

      // Actualizar header si existe el sistema de autenticación
      if (window.authSystem) {
        window.authSystem.token = data.token;
        window.authSystem.userInfo = window.authSystem.getUserInfo();
        window.authSystem.updateHeader();
      }

      // Mostrar modal de éxito con mensaje personalizado
      const bienvenidaMensaje = document.getElementById('loginBienvenidaMensaje');
      if (bienvenidaMensaje && window.authSystem && window.authSystem.userInfo) {
        bienvenidaMensaje.textContent = `¡Bienvenido de vuelta, ${window.authSystem.userInfo.nombre || window.authSystem.userInfo.email}!`;
      }
      
      const exitoModal = new bootstrap.Modal(document.getElementById('loginExitosoModal'));
      exitoModal.show();

      // Solo redirigir si no estamos ya en la página de inicio
      if (window.location.pathname !== '/') {
        // Esperar un poco antes de redirigir para que el usuario vea el modal
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } else {
      // Cerrar modal de login y mostrar modal de error
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (loginModal) {
        loginModal.hide();
      }
      
      // Configurar mensaje de error
      const mensajeElemento = document.getElementById('loginErrorMensaje');
      mensajeElemento.textContent = data.mensaje || 'Verifica tu correo electrónico y contraseña, luego intenta nuevamente.';
      
      // Mostrar modal de error
      const errorModal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
      errorModal.show();
      
      // Limpiar formulario para permitir nuevo intento
      document.getElementById('formLogin').reset();
      document.getElementById('loginMensajeError').classList.add('d-none');
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    
    // En caso de error de conexión
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) {
      loginModal.hide();
    }
    
    const mensajeElemento = document.getElementById('loginErrorMensaje');
    mensajeElemento.textContent = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    const errorModal = new bootstrap.Modal(document.getElementById('loginErrorModal'));
    errorModal.show();
    
    // Limpiar formulario
    document.getElementById('formLogin').reset();
    document.getElementById('loginMensajeError').classList.add('d-none');
  }
});

// Event listener para limpiar errores cuando se reabre el modal de login
document.addEventListener('DOMContentLoaded', function() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('show.bs.modal', function() {
      // Limpiar cualquier mensaje de error previo
      const errorAlert = document.getElementById('loginMensajeError');
      if (errorAlert) {
        errorAlert.classList.add('d-none');
      }
    });
  }
});
