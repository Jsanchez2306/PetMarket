//Tabla de clientes con DataTables y Bootstrap
$(document).ready(function () {
  let adentro = false;

  const tabla = $('#tablaClientes').DataTable({
    responsive: true,
    language: {
      search: "Buscar:",
      lengthMenu: "Mostrar _MENU_ registros",
      info: "Mostrando _START_ a _END_ de _TOTAL_ clientes",
      paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
      },
      emptyTable: "No hay clientes registrados",
      zeroRecords: "No se encontraron coincidencias"
    },
    columnDefs: [
      { targets: 3, orderable: false }
    ],
    drawCallback: function (settings) {
      const pageInfo = this.api().page.info();

      if (adentro && pageInfo.page !== this._lastPage) {
        $('html, body').animate({
          scrollTop: $('#tablaClientes').offset().top - 100
        }, 300);
      }

      this._lastPage = pageInfo.page;
      adentro = true;
    }
  });
});

  $(document).ready(function () {
    $(document).on('click', '.toggle-password', function () {
      const icon = $(this);
      const span = icon.siblings('.password-hidden');

      const hiddenText = '••••••••';
      const realPassword = span.data('password');

      if (span.text() === hiddenText) {
        span.text(realPassword);
        icon.removeClass('fa-eye').addClass('fa-eye-slash');
      } else {
        span.text(hiddenText);
        icon.removeClass('fa-eye-slash').addClass('fa-eye');
      }
    });
  });

// Registro de cliente
const formRegistro = document.getElementById('formRegistro');

if (formRegistro) {
  formRegistro.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nombre = document.getElementById('registroNombre').value;
    const email = document.getElementById('registroCorreo').value;
    const contrasena = document.getElementById('registroPassword').value;
    const confirmar = document.getElementById('registroConfirmarPassword').value;

    if (contrasena !== confirmar) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const telefono = "0000000000";
    const direccion = "Sin dirección";

    const nuevoCliente = {
      nombre,
      email,
      contrasena,
      telefono,
      direccion
    };

    try {
      const respuesta = await fetch('/clientes/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoCliente)
      });

      if (respuesta.ok) {
        const data = await respuesta.json();
        alert('Cliente registrado con éxito');
        formRegistro.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        modal.hide();
      } else {
        const error = await respuesta.json();
        alert('Error: ' + error.mensaje);
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('Error inesperado al registrar el cliente.');
    }
  });
}


// Edición de cliente
$(document).ready(function () {
  let clienteActualId;

  $('.btn-warning').on('click', function () {
    const fila = $(this).closest('tr');
    const nombre = fila.find('td:eq(0)').text().trim();
    const correo = fila.find('td:eq(1)').text().trim();
    const contrasena = fila.find('td:eq(2)').text().trim();

    clienteActualId = fila.data('id');

    $('#editarId').val(clienteActualId);
    $('#editarNombre').val(nombre);
    $('#editarCorreo').val(correo);
    $('#editarContrasena').val(contrasena);

    $('#editarModal').modal('show');
  });

  $('#formEditarCliente').submit(async function (e) {
    e.preventDefault();

    const id = $('#editarId').val();
    const data = {
      nombre: $('#editarNombre').val(),
      email: $('#editarCorreo').val(),
      contrasena: $('#editarContrasena').val(),
    };

    try {
      const res = await fetch(`/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        $('#editarModal').modal('hide');
        $('#confirmacionModal').modal('show');
        setTimeout(() => location.reload(), 2000);
      } else {
        alert('Error al actualizar');
      }
    } catch (error) {
      console.error('Error al editar:', error);
    }
  });
});

// Eliminar cliente
$(document).ready(function () {
  let clienteAEliminar = null;

  $(document).on('click', '.btn-eliminar', function () {
clienteAEliminar = $(this).closest('tr').data('id');
    const modal = new bootstrap.Modal(document.getElementById('confirmarEliminacionModal'));
    modal.show();
  });

  $('#btnConfirmarEliminar').on('click', function () {
    if (clienteAEliminar) {
      fetch(`/clientes/${clienteAEliminar}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (response.ok) {
            const modalConfirmar = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminacionModal'));
            modalConfirmar.hide();

            const modalExito = new bootstrap.Modal(document.getElementById('eliminacionExitosaModal'));
            modalExito.show();

            setTimeout(() => {
              location.reload();
            }, 1500);
          } else {
            alert('Error al eliminar cliente');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error al procesar la solicitud');
        });
    }
  });
});