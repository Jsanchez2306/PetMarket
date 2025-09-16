// Mejorar la funcionalidad de logout para integrar con el sistema de autenticación
document.addEventListener('DOMContentLoaded', function() {
  // Función principal de logout
  function performLogout() {
    // Limpiar token del localStorage
    localStorage.removeItem('token');

    // Si existe el sistema de autenticación, actualizarlo
    if (window.authSystem) {
      window.authSystem.token = null;
      window.authSystem.userInfo = null;
      window.authSystem.updateHeader();
    }

    // Redirigir a la página principal
    window.location.href = '/';
  }

  // Event listener para el botón de logout del dropdown
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      performLogout();
    });
  }

  // Event listener alternativo por si se usa una clase en lugar de ID
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('logout-btn') || e.target.id === 'logoutBtn') {
      e.preventDefault();
      performLogout();
    }
  });
});