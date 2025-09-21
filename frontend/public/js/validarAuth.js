// Sistema de autenticación dinámico
class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userInfo = this.getUserInfo();
        this.init();
    }

    // Decodificar JWT para obtener información del usuario
    getUserInfo() {
        if (!this.token) return null;
        
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error decodificando token:', error);
            localStorage.removeItem('token');
            return null;
        }
    }

    // Verificar si el token ha expirado
    isTokenValid() {
        if (!this.userInfo) return false;
        
        const now = Date.now() / 1000;
        return this.userInfo.exp > now;
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return this.token && this.userInfo && this.isTokenValid();
    }

    // Actualizar el header según el estado de autenticación
    async updateHeader() {
        const authButtons = document.getElementById('authButtons');
        const userDropdown = document.getElementById('userDropdown');

        if (this.isAuthenticated()) {
            // Usuario autenticado - mostrar dropdown
            if (authButtons) {
                authButtons.style.display = 'none';
                authButtons.classList.add('d-none');
            }
            if (userDropdown) {
                userDropdown.style.display = 'block';
                userDropdown.classList.remove('d-none');
                const userEmail = document.getElementById('userEmail');
                if (userEmail) userEmail.textContent = this.userInfo.email || 'Usuario';

                // Cargar contador del carrito
                await this.loadCartCounter();
            }
        } else {
            // Usuario no autenticado - mostrar botones de login/registro
            if (authButtons) {
                authButtons.style.display = 'flex';
                authButtons.classList.remove('d-none');
            }
            if (userDropdown) {
                userDropdown.style.display = 'none';
                userDropdown.classList.add('d-none');
            }

            // Ocultar contador del carrito
            this.hideCartCounter();
        }
    }

    // Cargar contador del carrito
    async loadCartCounter() {
        try {
            const response = await fetch('/carrito/api/obtener', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.updateCartCounter(data.itemCount || 0);
            }
        } catch (error) {
            console.error('Error al cargar contador del carrito:', error);
        }
    }

    // Actualizar contador del carrito
    updateCartCounter(cantidad) {
        const contador = document.getElementById('carritoContador');
        if (contador) {
            contador.textContent = cantidad;
            contador.style.display = cantidad > 0 ? 'inline' : 'none';
        }
    }

    // Ocultar contador del carrito
    hideCartCounter() {
        const contador = document.getElementById('carritoContador');
        if (contador) {
            contador.style.display = 'none';
        }
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.userInfo = null;
        this.updateHeader();
        
        // Redirigir al inicio
        window.location.href = '/';
    }

    // Verificar autenticación antes de comprar
    checkAuthForPurchase() {
        if (!this.isAuthenticated()) {
            $('#loginModal').modal('show');
            return false;
        }
        return true;
    }

    // Inicializar el sistema
    init() {
        // Actualizar header al cargar
        document.addEventListener('DOMContentLoaded', () => {
            this.updateHeader();
        });

        // Abrir modal de login automáticamente si viene del middleware
        $(document).ready(() => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('login') === 'true') {
                $('#loginModal').modal('show');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });

        // Event listener para logout
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn') {
                e.preventDefault();
                this.logout();
            }
        });

        // Interceptar clicks en botones de compra
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-comprar') || 
                e.target.closest('.btn-comprar')) {
                if (!this.checkAuthForPurchase()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });
    }
}

// Instanciar el sistema de autenticación
const authSystem = new AuthSystem();



  window.authSystem = authSystem;