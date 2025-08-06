document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  const errorBox = document.getElementById('loginMensajeError');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  function mostrarError(msg) {
    if (!errorBox) return alert(msg);
    errorBox.textContent = msg;
    errorBox.classList.remove('d-none');
    setTimeout(() => errorBox.classList.add('d-none'), 4000);
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (document.getElementById('loginCorreo').value || '').trim().toLowerCase();
    const contrasena = (document.getElementById('loginPassword').value || '').trim();

    if (!email || !contrasena) {
      return mostrarError('Completa todos los campos');
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ingresando...';
    }

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contrasena })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.rol) {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) {
          const bsModal = bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
          bsModal.hide();
        }

        const rol = String(data.rol).toLowerCase();
        if (rol === 'admin' || rol === 'administrador') {
          window.location.href = '/perfil/admin';
        } else {
          window.location.href = '/perfil/cliente';
        }
      } else {
        mostrarError(data.mensaje || 'Correo o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Error login:', err);
      mostrarError('Error de conexión, intenta de nuevo');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar';
      }
    }
  });

  // Clear error when user types
  const inputs = form.querySelectorAll('input');
  inputs.forEach(i => i.addEventListener('input', () => errorBox?.classList.add('d-none')));
});