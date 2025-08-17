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
      // Mostrar modal de éxito
      const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
      modal.show();

      // Cerrar el modal de registro
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    } else {
      document.getElementById('registroMensajeError').textContent = data.mensaje || 'Error en el registro';
      document.getElementById('registroMensajeError').classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error al registrar:', err);
  }
});
