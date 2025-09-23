
document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del empleado
    cargarInfoEmpleado();
});

async function cargarInfoEmpleado() {
    try {
        const response = await fetch('/auth/verify', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.autenticado && data.usuario) {
                document.getElementById('empleadoEmail').textContent = data.usuario.email;
                document.getElementById('empleadoNombre').textContent = data.usuario.nombre;
            }
        }
    } catch (error) {
        console.error('Error al cargar información del empleado:', error);
    }
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Usar la función global de logout si existe
        if (typeof logout === 'function') {
            logout();
        } else {
            // Implementación alternativa
            fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            }).then(() => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('usuario');
                window.location.href = '/';
            }).catch(error => {
                console.error('Error al cerrar sesión:', error);
                // Redirigir de todas formas
                localStorage.removeItem('token');
                sessionStorage.removeItem('usuario');
                window.location.href = '/';
            });
        }
    }
}
