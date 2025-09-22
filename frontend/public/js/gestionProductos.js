$(document).ready(function () {
  const token = localStorage.getItem('token');

  /* ========== DataTable Inicial ========== */
  if ($('#tablaProductos').length && !$.fn.DataTable.isDataTable('#tablaProductos')) {
    $('#tablaProductos').DataTable({
      responsive: true,
      language: {
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ registros",
        info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
        paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" },
        emptyTable: "No hay productos registrados",
        zeroRecords: "No se encontraron coincidencias"
      },
      columnDefs: [{ targets: 3, orderable: false }]
    });
  }

  /* ========== Helpers Errores ========== */
  const campos = ['nombre', 'descripcion', 'precio', 'stock', 'categoria', 'imagen'];
  function mostrarError(tipo, campo, mensaje) {
    const divError = document.getElementById(`error-${tipo}-${campo}`);
    if (divError) {
      divError.textContent = mensaje;
      divError.classList.remove('d-none');
    }
  }
  function limpiarErrores(tipo) {
    campos.forEach(c => {
      const el = document.getElementById(`error-${tipo}-${c}`);
      if (el) {
        el.textContent = '';
        el.classList.add('d-none');
      }
    });
  }

  /* ========== Preview Imagen (Agregar / Editar) ========== */
  const inputAddImagen = document.getElementById('add-imagen');
  const previewAdd = document.getElementById('previewAdd');
  if (inputAddImagen) {
    inputAddImagen.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        previewAdd.src = URL.createObjectURL(file);
        previewAdd.classList.remove('d-none');
      } else {
        previewAdd.classList.add('d-none');
        previewAdd.src = '';
      }
    });
  }
  const inputEditImagen = document.getElementById('edit-imagen');
  const previewEdit = document.getElementById('previewEdit');
  if (inputEditImagen) {
    inputEditImagen.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        previewEdit.src = URL.createObjectURL(file);
      }
    });
  }

  /* ========== Abrir Modal Ver ========== */
  $(document).on('click', '.btn-ver', function () {
    const fila = $(this).closest('tr');
    $('#verNombre').text(fila.data('nombre'));
    $('#verDescripcion').text(fila.data('descripcion'));
    $('#verPrecio').text(parseFloat(fila.data('precio')).toFixed(2));
    $('#verStock').text(fila.data('stock'));
    $('#verCategoria').text(fila.data('categoria'));
    $('#verImagen').attr('src', fila.data('imagen'));
    const fechaRaw = fila.data('fecha');
    if (fechaRaw) {
      const fechaObj = new Date(fechaRaw);
      $('#verFecha').text('Registrado: ' + fechaObj.toLocaleString('es-ES'));
    } else {
      $('#verFecha').text('');
    }
    $('#modalVerProducto').modal('show');
  });

  /* ========== Abrir Modal Agregar ========== */
  $('[data-bs-target="#modalAgregarProducto"]').on('click', function () {
    $('#formAgregarProducto')[0].reset();
    limpiarErrores('add');
    previewAdd.classList.add('d-none');
    previewAdd.src = '';
  });

  /* ========== Enviar Agregar ========== */
  $('#formAgregarProducto').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('add');

    const nombre = $('#add-nombre').val().trim();
    const descripcion = $('#add-descripcion').val().trim();
    const precio = $('#add-precio').val().trim();
    const stock = $('#add-stock').val().trim();
    const categoria = $('#add-categoria').val();
    const imagenFile = $('#add-imagen')[0].files[0];

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('stock', stock);
    formData.append('categoria', categoria);
    if (imagenFile) formData.append('imagen', imagenFile);

    try {
      const res = await fetch('/productos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
          // No agregues Content-Type manualmente (multipart boundary lo maneja el browser)
        },
        body: formData
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (result.errores) {
          Object.entries(result.errores).forEach(([campo, msg]) => {
            mostrarError('add', campo.toLowerCase(), msg);
          });
        } else {
          mostrarError('add', 'nombre', 'Error desconocido al crear.');
        }
        return;
      }

      $('#modalAgregarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto agregado correctamente.');
      new bootstrap.Modal(document.getElementById('confirmacionProductoModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('add', 'nombre', 'Error de red o servidor.');
    }
  });

  /* ========== Abrir Modal Editar ========== */
  $(document).on('click', '.btn-editar', function () {
    const fila = $(this).closest('tr');
    limpiarErrores('edit');
    $('#editarId').val(fila.data('id'));
    $('#edit-nombre').val(fila.data('nombre'));
    $('#edit-descripcion').val(fila.data('descripcion'));
    $('#edit-precio').val(fila.data('precio'));
    $('#edit-stock').val(fila.data('stock'));
    $('#edit-categoria').val(fila.data('categoria'));
    previewEdit.src = fila.data('imagen');
    $('#edit-imagen').val('');
    $('#modalEditarProducto').modal('show');
  });

  /* ========== Enviar Edición ========== */
  $('#formEditarProducto').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('edit');

    const id = $('#editarId').val();
    const formData = new FormData();

    formData.append('nombre', $('#edit-nombre').val().trim());
    formData.append('descripcion', $('#edit-descripcion').val().trim());
    formData.append('precio', $('#edit-precio').val().trim());
    formData.append('stock', $('#edit-stock').val().trim());
    formData.append('categoria', $('#edit-categoria').val());

    const newImage = $('#edit-imagen')[0].files[0];
    if (newImage) formData.append('imagen', newImage);

    try {
      const res = await fetch(`/productos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (result.errores) {
          Object.entries(result.errores).forEach(([campo, msg]) => {
            mostrarError('edit', campo.toLowerCase(), msg);
          });
        } else {
          mostrarError('edit', 'nombre', 'Error desconocido al actualizar.');
        }
        return;
      }

      $('#modalEditarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto actualizado correctamente.');
      new bootstrap.Modal(document.getElementById('confirmacionProductoModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('edit', 'nombre', 'Error de red o servidor.');
    }
  });

  /* ========== Eliminar Producto ========== */
  let idEliminarProducto = null;
  $(document).on('click', '.btn-eliminar', function () {
    idEliminarProducto = $(this).closest('tr').data('id');
    $('#confirmarEliminacionProductoModal').modal('show');
  });

  $('#btnConfirmarEliminarProducto').on('click', async function () {
    if (!idEliminarProducto) return;
    try {
      const res = await fetch(`/productos/${idEliminarProducto}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      if (res.ok) {
        $('#confirmarEliminacionProductoModal').modal('hide');
        new bootstrap.Modal(document.getElementById('eliminacionProductoExitosaModal')).show();
        setTimeout(() => location.reload(), 1200);
      }
    } catch (err) {
      console.error(err);
    }
  });

});