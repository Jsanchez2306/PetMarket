$(document).ready(function () {
    const token = localStorage.getItem('token'); // Obtenemos token

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
            columnDefs: [{ targets: 3, orderable: false }] // columna de acciones
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
        $('#edit-password').val(''); // limpiar password
        $('#modalEditarEmpleado').modal('show');
    });

    // Guardar edición
    $('#formEditarEmpleado').on('submit', async function (e) {
        e.preventDefault();
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
        if (contrasena) data.contrasena = contrasena; // solo enviar si hay cambio

        try {
            const res = await fetch(`/empleados/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                $('#modalEditarEmpleado').modal('hide');
                new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
                setTimeout(() => location.reload(), 1200);
            } else {
                const err = await res.json();
                alert(err.mensaje || 'Error al actualizar empleado');
            }
        } catch (error) {
            console.error(error);
            alert('Error en el servidor');
        }
    });

    // Abrir modal agregar empleado
    $('[data-bs-target="#modalAgregarEmpleado"]').on('click', function () {
        $('#formAgregarEmpleado')[0].reset();
    });

    // Guardar nuevo empleado
    $('#formAgregarEmpleado').on('submit', async function (e) {
        e.preventDefault();
        const data = {
            nombre: $('#agregar-nombre').val().trim(),
            email: $('#agregar-email').val().trim().toLowerCase(),
            cedula: $('#agregar-cedula').val().trim(),
            telefono: $('#agregar-telefono').val().trim(),
            direccion: $('#agregar-direccion').val().trim(),
            cargo: $('#agregar-cargo').val().trim(),
            contrasena: $('#agregar-password').val().trim()
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
            if (res.ok) {
                $('#modalAgregarEmpleado').modal('hide');
                new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
                setTimeout(() => location.reload(), 1200);
            } else {
                const err = await res.json();
                alert(err.mensaje || 'Error al agregar empleado');
            }
        } catch (error) {
            console.error(error);
            alert('Error en el servidor');
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
            } else {
                const err = await res.json();
                alert(err.mensaje || 'No se pudo eliminar');
            }
        } catch (error) {
            console.error(error);
            alert('Error en el servidor');
        }
    });
});
