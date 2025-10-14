// Index.js - Funcionalidad para la página de inicio
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar funcionalidades de la página de inicio
    initializeHomePage();
    
    // Verificar estado del usuario y bloquear botones si es admin
    checkAdminStatusAndUpdateButtons();
    
    // Escuchar cambios en el estado del usuario
    document.addEventListener('userStateChanged', checkAdminStatusAndUpdateButtons);
});

function initializeHomePage() {
    console.log('🏠 Inicializando página de inicio');
    
    // Detener video del carrusel cuando no está activo
    const carousel = document.getElementById('miCarrusel');
    if (carousel) {
        carousel.addEventListener('slide.bs.carousel', function(event) {
            const videoFrame = document.getElementById('videoCarrusel');
            if (videoFrame && event.to !== 1) {
                // Parar el video cuando se sale del slide del video
                videoFrame.src = videoFrame.src;
            }
        });
    }
}

function checkAdminStatusAndUpdateButtons() {
    try {
        const isAdmin = verificarSiEsAdmin();
        
        if (isAdmin) {
            // Solo bloquear para administradores
            bloquearBotonesCompraAdmin();
        } else {
            // Restaurar botones para todos los demás (incluyendo usuarios no autenticados)
            restaurarBotonesCompra();
        }
    } catch (error) {
        console.error('Error verificando estado de admin:', error);
        // En caso de error, restaurar botones (por seguridad)
        restaurarBotonesCompra();
    }
}

function verificarSiEsAdmin() {
    try {
        // Verificar si existe headerUnificado y tiene información del usuario
        if (window.headerUnificado && window.headerUnificado.userInfo) {
            const userInfo = window.headerUnificado.userInfo;
            return userInfo.rol === 'admin' || userInfo.rol === 'empleado';
        }
        
        // Verificación alternativa usando localStorage
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.rol === 'admin' || payload.rol === 'empleado';
        }
        
        // CAMBIO IMPORTANTE: Si no hay token, NO es admin (usuario no autenticado puede comprar)
        return false;
    } catch (error) {
        console.error('Error verificando rol de admin:', error);
        // En caso de error, asumir que NO es admin (permitir compra)
        return false;
    }
}

function bloquearBotonesCompraAdmin() {
    const botonesCompra = document.querySelectorAll('.btn-comprar');
    
    botonesCompra.forEach(boton => {
        // Cambiar el estilo y contenido del botón
        boton.className = 'btn btn-secondary btn-comprar';
        boton.disabled = true;
        
        // Cambiar el ícono y texto
        const icono = boton.querySelector('i');
        if (icono) {
            icono.className = 'fas fa-lock me-2';
        }
        
        // Cambiar el texto
        const textoBoton = boton.childNodes[boton.childNodes.length - 1];
        if (textoBoton && textoBoton.nodeType === Node.TEXT_NODE) {
            textoBoton.textContent = ' Admin - No disponible';
        } else {
            // Si no encuentra el nodo de texto, reemplazar todo el contenido
            boton.innerHTML = '<i class="fas fa-lock me-2"></i>Admin - No disponible';
        }
        
        // Agregar tooltip explicativo
        boton.setAttribute('title', 'Los administradores no pueden comprar productos');
        boton.setAttribute('data-bs-toggle', 'tooltip');
    });
    
    // Inicializar tooltips de Bootstrap
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    console.log('🔒 Botones de compra bloqueados para administrador');
}

function restaurarBotonesCompra() {
    const botonesCompra = document.querySelectorAll('.btn-comprar');
    
    botonesCompra.forEach(boton => {
        // Restaurar estilo original
        boton.className = 'btn btn-primary btn-comprar';
        boton.disabled = false;
        
        // Restaurar ícono y texto original
        const icono = boton.querySelector('i');
        if (icono) {
            icono.className = 'fas fa-shopping-cart me-2';
        }
        
        // Restaurar texto original
        const textoBoton = boton.childNodes[boton.childNodes.length - 1];
        if (textoBoton && textoBoton.nodeType === Node.TEXT_NODE) {
            textoBoton.textContent = ' Agregar al carrito';
        } else {
            boton.innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Agregar al carrito';
        }
        
        // Remover tooltip
        boton.removeAttribute('title');
        boton.removeAttribute('data-bs-toggle');
    });
    
    console.log('✅ Botones de compra restaurados');
}

// Función para actualizar botones cuando cambia el estado del usuario
function onUserStateChange() {
    checkAdminStatusAndUpdateButtons();
}

// Exponer función global para que headerUnificado pueda llamarla
window.updateIndexButtons = checkAdminStatusAndUpdateButtons;