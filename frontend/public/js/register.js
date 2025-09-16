document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('registroNombre').value;
  const email = document.getElementById('registroCorreo').value;
  const contrasena = document.getElementById('registroPassword').value;
  const confirmar = document.getElementById('registroConfirmarPassword').value;

  if (contrasena !== confirmar) {
    document.getElementById('registroMensajeError').textContent = 'Las contraseñas no coinciden.';
    document.getElementById('registroMensajeError').classList.remove('d-none');
    return;
  }

  try {
    const res = await fetch('/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, contrasena })
    });

    const data = await res.json();

    if (res.ok) {
      // Cerrar el modal de registro
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();

      // Realizar auto-login después del registro exitoso
      await autoLoginAfterRegister(email, contrasena);
    } else {
      // Cerrar modal de registro y mostrar modal de error
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
      
      // Configurar mensaje de error
      const mensajeElemento = document.getElementById('registroErrorMensaje');
      mensajeElemento.textContent = data.mensaje || 'Hubo un problema al crear tu cuenta. Por favor, verifica tus datos e intenta nuevamente.';
      
      // Mostrar modal de error
      const errorModal = new bootstrap.Modal(document.getElementById('registroErrorModal'));
      errorModal.show();
      
      // Limpiar formulario para permitir nuevo intento
      document.getElementById('formRegistro').reset();
      document.getElementById('registroMensajeError').classList.add('d-none');
    }
  } catch (err) {
    console.error('Error al registrar:', err);
    
    // En caso de error de conexión o servidor
    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    
    const mensajeElemento = document.getElementById('registroErrorMensaje');
    mensajeElemento.textContent = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    const errorModal = new bootstrap.Modal(document.getElementById('registroErrorModal'));
    errorModal.show();
    
    // Limpiar formulario para permitir nuevo intento
    document.getElementById('formRegistro').reset();
    document.getElementById('registroMensajeError').classList.add('d-none');
  }
});

// Event listener para manejar el botón "Intentar nuevamente" del modal de error
document.addEventListener('DOMContentLoaded', function() {
  // Cuando se cierre el modal de error y se abra el de registro
  const registroErrorModal = document.getElementById('registroErrorModal');
  if (registroErrorModal) {
    registroErrorModal.addEventListener('hidden.bs.modal', function() {
      // Limpiar cualquier mensaje de error previo
      const errorAlert = document.getElementById('registroMensajeError');
      if (errorAlert) {
        errorAlert.classList.add('d-none');
      }
    });
  }
});

// Función para hacer auto-login después del registro exitoso
async function autoLoginAfterRegister(email, contrasena) {
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
      // Guardar token
      localStorage.setItem('token', data.token);

      // Actualizar header si existe el sistema de autenticación
      if (window.authSystem) {
        window.authSystem.token = data.token;
        window.authSystem.userInfo = window.authSystem.getUserInfo();
        window.authSystem.updateHeader();
      }

      // Mostrar mensaje de éxito personalizado
      const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
      modal.show();

      // Mantener en la página actual (landing page)
    } else {
      // Si el auto-login falla, mostrar modal informativo
      const modal = new bootstrap.Modal(document.getElementById('autoLoginFailModal'));
      modal.show();
    }
  } catch (error) {
    console.error('Error en auto-login después del registro:', error);
    // En caso de error, mostrar modal informativo
    const modal = new bootstrap.Modal(document.getElementById('autoLoginFailModal'));
    modal.show();
  }
}
