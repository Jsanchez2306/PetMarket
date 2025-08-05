window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('modal') === 'login') {
        const myModal = new bootstrap.Modal(document.getElementById('loginModal'));
        myModal.show();
    }
});