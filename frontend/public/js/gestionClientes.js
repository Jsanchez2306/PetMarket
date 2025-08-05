$(document).ready(function () {

  // ----------------------------
  // DataTable (clientes)
  // ----------------------------
  if (document.querySelector('#tablaClientes') && !$.fn.DataTable.isDataTable('#tablaClientes')) {
    try {
      $('#tablaClientes').DataTable({
        responsive: true,
        language: {
          search: "Buscar:",
          lengthMenu: "Mostrar _MENU_ registros",
          info: "Mostrando _START_ a _END_ de _TOTAL_ clientes",
          paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" },
          emptyTable: "No hay clientes registrados",
          zeroRecords: "No se encontraron coincidencias"
        },
        columnDefs: [{ targets: 3, orderable: false }],
        drawCallback: function () {}
      });
      console.log('DataTable inicializado OK');
    } catch (err) {
      console.warn('No se pudo inicializar DataTable:', err.message);
    }
  }

  // ----------------------------
  // Editar cliente (abrir modal)
  // ----------------------------
  $(document).on('click', '.btn-warning', function () {
    const fila = $(this).closest('tr');

    $('#editarId').val(fila.data('id'));
    $('#editarNombre').val(fila.find('td:eq(0)').text().trim());
    $('#editarCorreo').val(fila.find('td:eq(1)').text().trim());
    $('#editarTelefono').val(fila.find('td:eq(2)').text().trim());

    const direccion = fila.data('direccion') || '';
    $('#editarDireccion').val(direccion);

    $('#editarModal').modal('show');
  });

  // ----------------------------
  // Guardar edición cliente
  // ----------------------------
  $('#formEditarCliente').on('submit', async function (e) {
    e.preventDefault();

    const id = $('#editarId').val();
    const data = {
      nombre: ($('#editarNombre').val() || '').trim(),
      email: ($('#editarCorreo').val() || '').trim().toLowerCase(),
      telefono: ($('#editarTelefono').val() || '').trim(),
      direccion: ($('#editarDireccion').val() || '').trim()
    };

    try {
      const res = await fetch(`/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        $('#editarModal').modal('hide');
        const confirmModalId = 'confirmacionModal';
        if (document.getElementById(confirmModalId)) {
          const modal = new bootstrap.Modal(document.getElementById(confirmModalId));
          modal.show();
          setTimeout(() => location.reload(), 1200);
        } else {
          location.reload();
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.mensaje || (res.status === 409 ? 'Este correo ya existe' : 'Error al actualizar'));
      }
    } catch (error) {
      console.error('Error al editar:', error);
      alert('Error al editar el cliente.');
    }
  });

  // ----------------------------
  // Eliminar cliente
  // ----------------------------
  $(document).on('click', '.btn-eliminar', function () {
    $('#btnConfirmarEliminar').data('id', $(this).closest('tr').data('id'));
    new bootstrap.Modal(document.getElementById('confirmarEliminacionModal')).show();
  });

  $('#btnConfirmarEliminar').on('click', function () {
    const id = $(this).data('id');
    if (!id) return;

    fetch(`/clientes/${id}`, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          bootstrap.Modal.getInstance(document.getElementById('confirmarEliminacionModal'))?.hide();
          const modal = new bootstrap.Modal(document.getElementById('eliminacionExitosaModal'));
          modal.show();
          setTimeout(() => location.reload(), 1200);
        } else {
          alert('Error al eliminar cliente');
        }
      })
      .catch(error => {
        console.error('Error eliminar:', error);
        alert('Error al procesar la solicitud');
      });
  });

}); 

