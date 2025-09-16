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

      alert('Login exitoso');
      
      // Solo redirigir si no estamos ya en la página de inicio
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } else {
      document.getElementById('loginMensajeError').textContent = data.mensaje || 'Error';
      document.getElementById('loginMensajeError').classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
  }
});
