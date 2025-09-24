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
      
      // Guardar información del usuario incluyendo tipo y rol
      const userInfo = {
        usuario: data.usuario,
        tipoUsuario: data.tipoUsuario,
        rol: data.rol
      };
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

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
      if (bienvenidaMensaje) {
        const nombreUsuario = data.usuario.nombre || data.usuario.email;
        const tipoTexto = data.tipoUsuario === 'empleado' ? 'empleado' : 'cliente';
        bienvenidaMensaje.textContent = `¡Bienvenido ${tipoTexto}, ${nombreUsuario}!`;
      }
      
      const exitoModal = new bootstrap.Modal(document.getElementById('loginExitosoModal'));
      exitoModal.show();

      // Redirigir según el tipo de usuario
      setTimeout(() => {
        if (data.tipoUsuario === 'empleado') {
          // Redirigir a panel de empleado o página principal con header de empleado
          window.location.href = '/productos';
        } else if (data.rol === 'admin') {
          // Redirigir a panel de admin
          window.location.href = '/panel';
        } else {
          // Cliente normal - ir a página principal
          // window.location.href = '/';
        }
      }, 1500);
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
