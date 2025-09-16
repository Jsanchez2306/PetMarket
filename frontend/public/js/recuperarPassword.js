document.getElementById('formRecuperarPassword').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('recuperarEmail').value.trim();
  const btnRecuperar = document.getElementById('btnRecuperar');
  const spinner = document.getElementById('recuperarSpinner');
  const errorAlert = document.getElementById('recuperarMensajeError');

  // Mostrar spinner y deshabilitar botón
  spinner.classList.remove('d-none');
  btnRecuperar.disabled = true;
  errorAlert.classList.add('d-none');

  try {
    const res = await fetch('/auth/recuperar-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    // Ocultar spinner y habilitar botón
    spinner.classList.add('d-none');
    btnRecuperar.disabled = false;

    if (res.ok) {
      // Cerrar modal de recuperación
      const recuperarModal = bootstrap.Modal.getInstance(document.getElementById('recuperarPasswordModal'));
      if (recuperarModal) {
        recuperarModal.hide();
      }

      // Configurar mensaje de éxito
      const exitoMensaje = document.getElementById('recuperarExitoMensaje');
      exitoMensaje.textContent = data.mensaje || 'Hemos enviado una nueva contraseña temporal a tu correo electrónico. Úsala para iniciar sesión y luego cámbiala desde tu perfil.';

      // Mostrar modal de éxito
      const exitoModal = new bootstrap.Modal(document.getElementById('recuperarExitosoModal'));
      exitoModal.show();

      // Limpiar formulario
      document.getElementById('formRecuperarPassword').reset();
    } else {
      // Mostrar error en el mismo modal
      errorAlert.textContent = data.mensaje || 'El correo electrónico no está registrado en nuestro sistema.';
      errorAlert.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error al recuperar contraseña:', err);
    
    // Ocultar spinner y habilitar botón
    spinner.classList.add('d-none');
    btnRecuperar.disabled = false;
    
    // Mostrar error de conexión
    errorAlert.textContent = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    errorAlert.classList.remove('d-none');
  }
});

// Event listener para limpiar errores cuando se reabre el modal de recuperación
document.addEventListener('DOMContentLoaded', function() {
  const recuperarModal = document.getElementById('recuperarPasswordModal');
  if (recuperarModal) {
    recuperarModal.addEventListener('show.bs.modal', function() {
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
    });
  }
});