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

  // Nuevas funcionalidades para el dropdown del header
  initHeaderProfileFunctions();
});

// Funciones para el dropdown del header
function initHeaderProfileFunctions() {
  // Cargar datos del usuario al abrir el modal
  const perfilModal = document.getElementById('perfilModal');
  if (perfilModal) {
    perfilModal.addEventListener('show.bs.modal', () => {
      cargarDatosUsuarioHeader();
    });
  }

  // Manejar formulario de actualizar perfil del header
  const formActualizarPerfil = document.getElementById('formActualizarPerfil');
  if (formActualizarPerfil) {
    formActualizarPerfil.addEventListener('submit', (e) => {
      actualizarPerfilHeader(e);
    });
  }

  // Manejar formulario de eliminar cuenta
  const formEliminarCuenta = document.getElementById('formEliminarCuenta');
  if (formEliminarCuenta) {
    formEliminarCuenta.addEventListener('submit', (e) => {
      eliminarCuentaHeader(e);
    });
  }
}

async function cargarDatosUsuarioHeader() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const perfilNombre = document.getElementById('perfilNombre');
    const perfilCorreo = document.getElementById('perfilCorreo');
    
    if (perfilNombre) perfilNombre.value = payload.nombre || '';
    if (perfilCorreo) perfilCorreo.value = payload.email || '';
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
  }
}

async function actualizarPerfilHeader(e) {
  e.preventDefault();

  const nombre = document.getElementById('perfilNombre').value;
  const email = document.getElementById('perfilCorreo').value;
  const passwordActual = document.getElementById('perfilPasswordActual').value;
  const passwordNueva = document.getElementById('perfilPasswordNueva').value;

  const errorElement = document.getElementById('perfilMensajeError');
  errorElement.classList.add('d-none');

  try {
    const token = localStorage.getItem('token');
    const body = {
      nombre,
      email,
      passwordActual
    };

    if (passwordNueva) {
      body.passwordNueva = passwordNueva;
    }

    const res = await fetch('/auth/actualizar-perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      // Actualizar token si se proporciona uno nuevo
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      alert('✅ Perfil actualizado correctamente');
      bootstrap.Modal.getInstance(document.getElementById('perfilModal')).hide();
      
      // Actualizar header con nuevo email
      if (window.authSystem) {
        window.authSystem.userInfo = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
        window.authSystem.updateHeader();
      }
    } else {
      errorElement.textContent = data.mensaje || 'Error al actualizar perfil';
      errorElement.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    errorElement.textContent = 'Error de conexión';
    errorElement.classList.remove('d-none');
  }
}

async function eliminarCuentaHeader(e) {
  e.preventDefault();

  const password = document.getElementById('eliminarPassword').value;
  const confirmacion = document.getElementById('confirmarEliminacion').checked;

  if (!confirmacion) {
    alert('Debes confirmar que entiendes las consecuencias');
    return;
  }

  const errorElement = document.getElementById('eliminarMensajeError');
  errorElement.classList.add('d-none');

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/auth/eliminar-cuenta', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (res.ok) {
      // Mostrar mensaje de éxito personalizado
      alert('✅ Usuario eliminado correctamente. Tu cuenta ha sido eliminada permanentemente.');
      
      // Limpiar token del localStorage
      localStorage.removeItem('token');
      
      // Redirigir al inicio
      window.location.href = '/';
    } else {
      errorElement.textContent = data.mensaje || 'Error al eliminar cuenta';
      errorElement.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    errorElement.textContent = 'Error de conexión';
    errorElement.classList.remove('d-none');
  }
}
