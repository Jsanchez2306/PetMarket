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
      document.getElementById('registroMensajeError').textContent = data.mensaje || 'Error en el registro';
      document.getElementById('registroMensajeError').classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error al registrar:', err);
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
      alert('¡Registro exitoso! Has sido conectado automáticamente.');
      
      // Mantener en la página actual (landing page)
    } else {
      // Si el auto-login falla, mostrar el modal de éxito tradicional
      const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
      modal.show();
    }
  } catch (error) {
    console.error('Error en auto-login después del registro:', error);
    // En caso de error, mostrar el modal de éxito tradicional
    const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
    modal.show();
  }
}
