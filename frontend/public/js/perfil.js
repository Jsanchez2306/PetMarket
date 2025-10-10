// Manejo de perfiles de usuario
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos para perfil de administrador
    const btnConfiguracion = document.getElementById('btn-configuracion');
    const btnPedidos = document.getElementById('btn-pedidos');
    const seccionConfiguracion = document.getElementById('seccion-configuracion');
    const seccionPedidos = document.getElementById('seccion-pedidos');
    const formPerfilAdmin = document.getElementById('formPerfilAdmin');
    const formCambiarContrasena = document.getElementById('formCambiarContrasena');

    // Elementos para perfil de cliente
    const btnConfiguracionCliente = document.getElementById('btn-configuracion-cliente');
    const btnPedidosCliente = document.getElementById('btn-pedidos-cliente');
    const seccionConfiguracionCliente = document.getElementById('seccion-configuracion-cliente');
    const seccionPedidosCliente = document.getElementById('seccion-pedidos-cliente');
    const formPerfilCliente = document.getElementById('formPerfilCliente');
    const formCambiarContrasenaCliente = document.getElementById('formCambiarContrasenaCliente');

    // === PERFIL ADMINISTRADOR ===
    if (btnConfiguracion && btnPedidos) {
        btnConfiguracion.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccion('configuracion');
        });

        btnPedidos.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccion('pedidos');
        });
    }

    if (formPerfilAdmin) {
        formPerfilAdmin.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarPerfilAdmin(this);
        });
    }

    if (formCambiarContrasena) {
        formCambiarContrasena.addEventListener('submit', function(e) {
            e.preventDefault();
            cambiarContrasenaAdmin(this);
        });
    }

    // === PERFIL CLIENTE ===
    if (btnConfiguracionCliente && btnPedidosCliente) {
        btnConfiguracionCliente.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccionCliente('configuracion');
        });

        btnPedidosCliente.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccionCliente('pedidos');
        });
    }

    if (formPerfilCliente) {
        formPerfilCliente.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarPerfilCliente(this);
        });
    }

    if (formCambiarContrasenaCliente) {
        formCambiarContrasenaCliente.addEventListener('submit', function(e) {
            e.preventDefault();
            cambiarContrasenaCliente(this);
        });
    }

    // === FUNCIONES PARA ADMINISTRADOR ===
    function mostrarSeccion(seccion) {
        if (seccion === 'configuracion') {
            seccionConfiguracion?.classList.remove('d-none');
            seccionPedidos?.classList.add('d-none');
        } else if (seccion === 'pedidos') {
            seccionConfiguracion?.classList.add('d-none');
            seccionPedidos?.classList.remove('d-none');
        }
    }

    async function actualizarPerfilAdmin(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/perfil/admin/actualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                mostrarModal('actualizacionExitosaModal');
            } else {
                mostrarError('Error al actualizar el perfil: ' + result.mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error de conexión al actualizar el perfil');
        }
    }

    async function cambiarContrasenaAdmin(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validar que las contraseñas coincidan
        if (data.nueva !== data.confirmar) {
            mostrarErrorEnFormulario('cambiarPassMensajeError', 'Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch('/perfil/admin/cambiar-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                form.reset();
                cerrarModal('cambiarContrasenaModal');
                mostrarModal('actualizacionExitosaModal');
            } else {
                mostrarErrorEnFormulario('cambiarPassMensajeError', result.mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarErrorEnFormulario('cambiarPassMensajeError', 'Error de conexión');
        }
    }

    // === FUNCIONES PARA CLIENTE ===
    function mostrarSeccionCliente(seccion) {
        if (seccion === 'configuracion') {
            seccionConfiguracionCliente?.classList.remove('d-none');
            seccionPedidosCliente?.classList.add('d-none');
        } else if (seccion === 'pedidos') {
            seccionConfiguracionCliente?.classList.add('d-none');
            seccionPedidosCliente?.classList.remove('d-none');
        }
    }

    async function actualizarPerfilCliente(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/perfil/cliente/actualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                mostrarModal('actualizacionExitosaModalCliente');
            } else {
                mostrarError('Error al actualizar el perfil: ' + result.mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error de conexión al actualizar el perfil');
        }
    }

    async function cambiarContrasenaCliente(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validar que las contraseñas coincidan
        if (data.nueva !== data.confirmar) {
            mostrarErrorEnFormulario('cambiarPassMensajeErrorCliente', 'Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch('/perfil/cliente/cambiar-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                form.reset();
                cerrarModal('cambiarContrasenaModalCliente');
                mostrarModal('actualizacionExitosaModalCliente');
            } else {
                mostrarErrorEnFormulario('cambiarPassMensajeErrorCliente', result.mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarErrorEnFormulario('cambiarPassMensajeErrorCliente', 'Error de conexión');
        }
    }

    // === FUNCIONES AUXILIARES ===
    function mostrarModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    function cerrarModal(modalId) {
        const modalElement = document.getElementById(modalId);
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }

    function mostrarError(mensaje) {
        // Crear una notificación de error temporal
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    function mostrarErrorEnFormulario(elementId, mensaje) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.classList.remove('d-none');
        }
    }
});