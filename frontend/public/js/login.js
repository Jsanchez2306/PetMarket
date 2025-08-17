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

      alert('Login exitoso ✅');
      window.location.href = '/clientes';
    } else {
      document.getElementById('loginMensajeError').textContent = data.mensaje || 'Error';
      document.getElementById('loginMensajeError').classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
  }
});
