const getFirstEl = (...ids) => ids.map(id => document.getElementById(id)).find(Boolean);

const safeGet = (id) => document.getElementById(id);

const showErrorIn = (containerEl, msg) => {
  if (!containerEl) return alert(msg);
  containerEl.textContent = msg;
  containerEl.classList.remove('d-none');
  setTimeout(() => containerEl.classList.add('d-none'), 3000);
};

const setupToggleSections = () => {
  const btnConfig = getFirstEl('btn-configuracion', 'btn-configuracion-cliente');
  const btnPedidos = getFirstEl('btn-pedidos', 'btn-pedidos-cliente');

  const seccionConfig = getFirstEl('seccion-configuracion', 'seccion-configuracion-cliente');
  const seccionPedidos = getFirstEl('seccion-pedidos', 'seccion-pedidos-cliente', 'seccion-pedidos');

  if (!btnConfig || !btnPedidos || !seccionConfig || !seccionPedidos) return;

  btnConfig.addEventListener('click', (e) => {
    e.preventDefault();
    seccionConfig.classList.remove('d-none');
    seccionPedidos.classList.add('d-none');
  });

  btnPedidos.addEventListener('click', (e) => {
    e.preventDefault();
    seccionConfig.classList.add('d-none');
    seccionPedidos.classList.remove('d-none');
  });
};

const handleProfileForm = (formId, apiUrl, successModalId) => {
  const form = safeGet(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
      nombre: (form.nombre?.value || '').trim(),
      correo: (form.correo?.value || '').trim().toLowerCase(),
      telefono: (form.telefono?.value || '').trim(),
      direccion: (form.direccion?.value || '').trim()
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const modalEl = safeGet(successModalId);
        if (modalEl) {
          new bootstrap.Modal(modalEl).show();
          setTimeout(() => location.reload(), 1200);
        } else {
          alert('Perfil actualizado correctamente');
          location.reload();
        }
      } else {
        alert(data.mensaje || 'No se pudo actualizar el perfil. Intenta nuevamente.');
      }
    } catch (err) {
      alert('Hubo un problema de conexión. Revisa tu internet.');
      console.error(err);
    }
  });
};

const handleChangePassword = (formId, apiUrl, modalIdToHide, errorBoxId, successModalId) => {
  const form = safeGet(formId);
  if (!form) return;

  const errorBox = safeGet(errorBoxId);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const actual = (form.actual?.value || '').trim();
    const nueva = (form.nueva?.value || '').trim();
    const confirmar = (form.confirmar?.value || '').trim();

    if (!actual || !nueva || !confirmar) return showErrorIn(errorBox, 'Completa todos los campos.');
    if (nueva !== confirmar) return showErrorIn(errorBox, 'Las contraseñas no coinciden.');
    if (nueva.length < 6) return showErrorIn(errorBox, 'La contraseña debe tener al menos 6 caracteres.');

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual, nueva, confirmar })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const modalToHide = safeGet(modalIdToHide);
        if (modalToHide) {
          const inst = bootstrap.Modal.getInstance(modalToHide);
          if (inst) inst.hide();
        }
        const successModalEl = safeGet(successModalId);
        if (successModalEl) {
          new bootstrap.Modal(successModalEl).show();
          setTimeout(() => location.reload(), 1200);
        } else {
          location.reload();
        }
      } else {
        showErrorIn(errorBox, data.mensaje || 'No se pudo cambiar la contraseña.');
      }
    } catch (err) {
      showErrorIn(errorBox, 'Hubo un problema de conexión. Intenta más tarde.');
      console.error(err);
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  setupToggleSections();
  handleProfileForm('formPerfilAdmin', '/perfil/admin/actualizar', 'actualizacionExitosaModal');
  handleProfileForm('formPerfilCliente', '/perfil/cliente/actualizar', 'actualizacionExitosaModalCliente');
  handleChangePassword(
    'formCambiarContrasena',
    '/perfil/admin/cambiar-contrasena',
    'cambiarContrasenaModal',
    'cambiarPassMensajeError',
    'actualizacionExitosaModal'
  );
  handleChangePassword(
    'formCambiarContrasenaCliente',
    '/perfil/cliente/cambiar-contrasena',
    'cambiarContrasenaModalCliente',
    'cambiarPassMensajeErrorCliente',
    'actualizacionExitosaModalCliente'
  );
});
