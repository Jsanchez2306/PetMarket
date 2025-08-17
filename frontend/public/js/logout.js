document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');

  window.location.href = '/';
});