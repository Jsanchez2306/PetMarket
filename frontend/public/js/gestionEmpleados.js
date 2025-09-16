$(document).ready(function () {
    const token = localStorage.getItem('token');

    // Inicializar DataTable
    if ($('#tablaEmpleados').length && !$.fn.DataTable.isDataTable('#tablaEmpleados')) {
        $('#tablaEmpleados').DataTable({
            responsive: true,
            language: {
                search: "Buscar:",
                lengthMenu: "Mostrar _MENU_ registros",
                info: "Mostrando _START_ a _END_ de _TOTAL_ empleados",
                paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" },
                emptyTable: "No hay empleados registrados",
                zeroRecords: "No se encontraron coincidencias"
            },
            columnDefs: [{ targets: 3, orderable: false }]
        });
    }

    // Funciones de errores
    function mostrarError(input, mensaje, tipo = 'edit') {
        const divError = document.getElementById(`error-${tipo}-${input}`);
        if (divError) {
            divError.textContent = mensaje;
            divError.classList.remove('d-none');
        }
    }

    function limpiarErrores(tipo = 'edit') {
        ['nombre','cedula','email','telefono','direccion','cargo','password'].forEach((input) => {
            const divError = document.getElementById(`error-${tipo}-${input}`);
            if (divError) {
                divError.textContent = '';
                divError.classList.add('d-none');
            }
        });
    }

    // Abrir modal ver detalles
    $(document).on('click', '.btn-ver', function () {
        const fila = $(this).closest('tr');
        $('#verCedula').text(fila.find('td:eq(0)').text().trim());
        $('#verNombre').text(fila.data('nombre'));
        $('#verEmail').text(fila.data('email'));
        $('#verTelefono').text(fila.data('telefono') || '—');
        $('#verDireccion').text(fila.data('direccion') || '—');
        $('#verCargo').text(fila.data('cargo'));
        $('#modalVerEmpleado').modal('show');
    });

    // Abrir modal editar
    $(document).on('click', '.btn-editar', function () {
        const fila = $(this).closest('tr');
        $('#editarId').val(fila.data('id'));
        $('#edit-nombre').val(fila.data('nombre'));
        $('#edit-cedula').val(fila.find('td:eq(0)').text().trim());
        $('#edit-email').val(fila.data('email'));
        $('#edit-telefono').val(fila.data('telefono') || '');
        $('#edit-direccion').val(fila.data('direccion') || '');
        $('#edit-cargo').val(fila.data('cargo'));
        $('#edit-password').val('');
        limpiarErrores('edit');
        $('#modalEditarEmpleado').modal('show');
    });

    // Guardar edición
    $('#formEditarEmpleado').on('submit', async function (e) {
        e.preventDefault();
        limpiarErrores('edit');
        const id = $('#editarId').val();
        const data = {
            nombre: $('#edit-nombre').val().trim(),
            cedula: $('#edit-cedula').val().trim(),
            email: $('#edit-email').val().trim().toLowerCase(),
            telefono: $('#edit-telefono').val().trim(),
            direccion: $('#edit-direccion').val().trim(),
            cargo: $('#edit-cargo').val().trim()
        };
        const contrasena = $('#edit-password').val().trim();
        if (contrasena) data.contrasena = contrasena;

        try {
            const res = await fetch(`/empleados/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                if (result.errores) {
                    for (const key in result.errores) mostrarError(key, result.errores[key], 'edit');
                }
                return;
            }

            $('#modalEditarEmpleado').modal('hide');
            new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
            setTimeout(() => location.reload(), 1200);

        } catch (err) {
            console.error(err);
            mostrarError('password', 'Error en el servidor', 'edit');
        }
    });

    // Abrir modal agregar empleado
    $('[data-bs-target="#modalAgregarEmpleado"]').on('click', function () {
        $('#formAgregarEmpleado')[0].reset();
        limpiarErrores('add');
    });

    // Guardar nuevo empleado
    $('#formAgregarEmpleado').on('submit', async function (e) {
        e.preventDefault();
        limpiarErrores('add');
        const data = {
            nombre: $('#add-nombre').val().trim(),
            email: $('#add-email').val().trim().toLowerCase(),
            cedula: $('#add-cedula').val().trim(),
            telefono: $('#add-telefono').val().trim(),
            direccion: $('#add-direccion').val().trim(),
            cargo: $('#add-cargo').val().trim(),
            contrasena: $('#add-password').val().trim()
        };

        try {
            const res = await fetch('/empleados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                if (result.errores) {
                    for (const key in result.errores) mostrarError(key, result.errores[key], 'add');
                }
                return;
            }

            $('#modalAgregarEmpleado').modal('hide');
            new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
            setTimeout(() => location.reload(), 1200);

        } catch (err) {
            console.error(err);
            mostrarError('password', 'Error en el servidor', 'add');
        }
    });

    // Eliminar empleado
    let idEliminar = null;
    $(document).on('click', '.btn-eliminar', function () {
        idEliminar = $(this).closest('tr').data('id');
        $('#confirmarEliminacionModal').modal('show');
    });

    $('#btnConfirmarEliminar').on('click', async function () {
        if (!idEliminar) return;
        try {
            const res = await fetch(`/empleados/${idEliminar}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                $('#confirmarEliminacionModal').modal('hide');
                new bootstrap.Modal(document.getElementById('eliminacionExitosaModal')).show();
                setTimeout(() => location.reload(), 1200);
            }
        } catch (error) {
            console.error(error);
        }
    });
});
