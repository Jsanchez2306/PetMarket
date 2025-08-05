$(document).ready(function () {

  function limpiarValidacionesEmail(emailEl) {
    if (emailEl) emailEl.setCustomValidity('');
  }

  function mostrarErrorRegistro(msg) {
    const errorBox = document.getElementById('registroMensajeError');
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
    setTimeout(() => errorBox.classList.add('d-none'), 3000);
  }

  function mostrarModalExito(idModal, callback) {
    const modal = new bootstrap.Modal(document.getElementById(idModal));
    modal.show();
    if (callback) setTimeout(callback, 1200);
  }

  const registerModalEl = document.getElementById('registerModal');
  if (registerModalEl) {
    registerModalEl.addEventListener('show.bs.modal', () => {
      const form = document.getElementById('formRegistro');
      if (form) form.reset();
      limpiarValidacionesEmail(document.getElementById('registroCorreo'));
    });
  }

  const emailInput = document.getElementById('registroCorreo');
  if (emailInput) {
    emailInput.addEventListener('input', () => limpiarValidacionesEmail(emailInput));
  }

  const formRegistro = document.getElementById('formRegistro');
  if (formRegistro) {
    formRegistro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombre = (document.getElementById('registroNombre').value || '').trim();
      const contrasena = document.getElementById('registroPassword').value || '';
      const confirmar = document.getElementById('registroConfirmarPassword').value || '';
      const emailEl = emailInput;

      limpiarValidacionesEmail(emailEl);

      if (contrasena !== confirmar) {
        mostrarErrorRegistro('Las contraseñas no coinciden');
        return;
      }

      const nuevoCliente = {
        nombre,
        email: (emailEl?.value || '').trim().toLowerCase(),
        contrasena,
        telefono: '0000000000',
        direccion: 'Sin dirección',
        rol: 'cliente'
      };

      try {
        const respuesta = await fetch('/auth/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoCliente)
        });

        if (respuesta.ok) {
          formRegistro.reset();
          bootstrap.Modal.getInstance(document.getElementById('registerModal'))?.hide();
          mostrarModalExito('registroExitosoModal', () => window.location.href = '/clientes');
        } else {
          const error = await respuesta.json().catch(() => null);
          mostrarErrorRegistro(error?.mensaje || (respuesta.status === 409 ? 'Este correo ya existe' : 'Error desconocido'));
        }
      } catch (err) {
        console.error('Fetch error al registrar:', err);
        alert('Error inesperado al registrar el cliente.');
      }
    });
  }

});
