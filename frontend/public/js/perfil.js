document.getElementById("btn-configuracion").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("seccion-configuracion").classList.remove("d-none");
    document.getElementById("seccion-pedidos").classList.add("d-none");
});

document.getElementById("btn-pedidos").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("seccion-configuracion").classList.add("d-none");
    document.getElementById("seccion-pedidos").classList.remove("d-none");
});

document.addEventListener('DOMContentLoaded', () => {

    const formAdmin = document.getElementById('formPerfilAdmin');

    if (formAdmin) {
        formAdmin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                nombre: formAdmin.nombre.value.trim(),
                correo: formAdmin.correo.value.trim().toLowerCase(),
                telefono: formAdmin.telefono.value.trim(),
                direccion: formAdmin.direccion.value.trim()
            };

            try {
                const res = await fetch('/perfilAdmin/actualizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    new bootstrap.Modal(document.getElementById('actualizacionExitosaModal')).show();
                    setTimeout(() => location.reload(), 1200);
                } else {
                    alert(data.mensaje || 'No se pudo actualizar el perfil. Intenta nuevamente.');
                }
            } catch (err) {
                alert('Hubo un problema de conexión. Revisa tu internet.');
                console.error(err);
            }
        });
    }

    const formPass = document.getElementById('formCambiarContrasena');
    const errorBox = document.getElementById('cambiarPassMensajeError');

    const mostrarError = (msg) => {
        if (!errorBox) return alert(msg);
        errorBox.textContent = msg;
        errorBox.classList.remove('d-none');
        setTimeout(() => errorBox.classList.add('d-none'), 3000);
    };

    const mostrarModalExito = (idModal, callback) => {
        new bootstrap.Modal(document.getElementById(idModal)).show();
        if (callback) setTimeout(callback, 1200);
    };

    if (formPass) {
        formPass.addEventListener('submit', async (e) => {
            e.preventDefault();

            const actual = formPass.contrasenaAntigua.value.trim();
            const nueva = formPass.contrasenaNueva.value.trim();
            const confirmar = formPass.contrasenaConfirmar.value.trim();

            if (!actual || !nueva || !confirmar) return mostrarError('Completa todos los campos.');
            if (nueva !== confirmar) return mostrarError('Las contraseñas no coinciden.');

            try {
                const res = await fetch('/perfilAdmin/cambiar-contrasena', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actual, nueva, confirmar })
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('cambiarContrasenaModal'))?.hide();
                    mostrarModalExito('actualizacionExitosaModal', () => location.reload());
                } else {
                    mostrarError(data.mensaje || 'No se pudo cambiar la contraseña.');
                }
            } catch (err) {
                mostrarError('Hubo un problema de conexión. Intenta más tarde.');
                console.error(err);
            }
        });
    }
});
