
// Cargar información del administrador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    cargarInfoAdmin();
});

async function cargarInfoAdmin() {
    try {
        const response = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.autenticado && data.usuario) {
                // Actualizar el email en el dropdown
                const adminEmailElement = document.getElementById('adminEmail');
                const adminNombreElement = document.getElementById('adminNombre');
                
                if (adminEmailElement) {
                    adminEmailElement.textContent = data.usuario.email || 'admin@petmarket.com';
                }
                
                if (adminNombreElement) {
                    adminNombreElement.textContent = data.usuario.nombre || 'Administrador';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar información del administrador:', error);
    }
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Intentar usar la función global de logout si existe
        if (typeof logout === 'function') {
            logout();
        } else {
            // Implementación del logout
            fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                // Limpiar almacenamiento local
                localStorage.removeItem('token');
                sessionStorage.removeItem('usuario');
                
                // Redirigir al inicio
                window.location.href = '/';
            }).catch(error => {
                console.error('Error al cerrar sesión:', error);
                
                // Aún así limpiar y redirigir
                localStorage.removeItem('token');
                sessionStorage.removeItem('usuario');
                window.location.href = '/';
            });
        }
    }
}
