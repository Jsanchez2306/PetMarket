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

  // Helpers UI
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
  function setLoading(btn, loading, textoNormal, textoCargando) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = textoNormal;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${textoCargando}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || textoNormal;
    }
  }
  async function parseResponse(res) {
    let raw = '';
    try { raw = await res.text(); } catch { return {}; }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  // Validadores locales
  function isEmpty(v) { return v === undefined || v === null || String(v).trim() === ''; }
  function validarNombre(nombre) {
    if (isEmpty(nombre)) return 'El nombre es obligatorio';
    const v = String(nombre).trim();
    if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (v.length > 50) return 'El nombre no puede exceder los 50 caracteres';
    if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(v)) return 'El nombre solo puede contener letras y espacios';
    return null;
  }
  function validarCedula(cedula) {
    if (isEmpty(cedula)) return 'La cédula es obligatoria';
    const v = String(cedula).trim();
    if (!/^[0-9]{6,15}$/.test(v)) return 'La cédula debe tener entre 6 y 15 dígitos numéricos';
    return null;
  }
  function validarEmail(email) {
    if (isEmpty(email)) return 'El correo electrónico es obligatorio';
    const v = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo electrónico no es válido';
    return null;
  }
  function validarTelefono(telefono) {
    if (isEmpty(telefono)) return 'El teléfono es obligatorio';
    const v = String(telefono).trim();
    if (!/^[0-9]{7,15}$/.test(v)) return 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
    return null;
  }
  function validarDireccion(direccion) {
    if (isEmpty(direccion)) return 'La dirección es obligatoria';
    const v = String(direccion).trim();
    if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres';
    if (v.length > 100) return 'La dirección no puede exceder los 100 caracteres';
    return null;
  }
  function validarCargo(cargo) {
    if (isEmpty(cargo)) return 'El cargo es obligatorio';
    const v = String(cargo).trim();
    if (v.length < 3) return 'El cargo debe tener al menos 3 caracteres';
    return null;
  }
  function validarPassword(contrasena, requerida = true) {
    if (!requerida && isEmpty(contrasena)) return null;
    if (isEmpty(contrasena)) return 'La contraseña es obligatoria';
    const v = String(contrasena);
    if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres y contener letras y números';
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(v)) return 'La contraseña debe contener al menos una letra y un número';
    return null;
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

  // Guardar edición (valida y muestra TODOS los errores)
  $('#formEditarEmpleado').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('edit');

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Guardar cambios', 'Guardando...');

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

    // Validaciones locales (recolectar todas)
    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eCed = validarCedula(data.cedula); if (eCed) errores.cedula = eCed;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const eCar = validarCargo(data.cargo); if (eCar) errores.cargo = eCar;
    if (contrasena) {
      const ePwd = validarPassword(contrasena, false); if (ePwd) errores.password = ePwd;
    }

    if (Object.keys(errores).length > 0) {
      Object.entries(errores).forEach(([key, msg]) => mostrarError(key, msg, 'edit'));
      setLoading(btn, false, 'Guardar cambios');
      return;
    }

    try {
      const res = await fetch(`/empleados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const result = await parseResponse(res);

      if (!res.ok) {
        if (result.errores) {
          for (const key in result.errores) mostrarError(key, result.errores[key], 'edit');
        } else {
          mostrarError('password', result.mensaje || 'Error al actualizar', 'edit');
        }
        setLoading(btn, false, 'Guardar cambios');
        return;
      }

      $('#modalEditarEmpleado').modal('hide');
      new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'edit');
    } finally {
      setLoading(btn, false, 'Guardar cambios');
    }
  });

  // Abrir modal agregar empleado
  $('[data-bs-target="#modalAgregarEmpleado"]').on('click', function () {
    $('#formAgregarEmpleado')[0].reset();
    limpiarErrores('add');
  });

  // Guardar nuevo empleado (valida y muestra TODOS los errores)
  $('#formAgregarEmpleado').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('add');

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Agregar Empleado', 'Guardando...');

    const data = {
      nombre: $('#add-nombre').val().trim(),
      email: $('#add-email').val().trim().toLowerCase(),
      cedula: $('#add-cedula').val().trim(),
      telefono: $('#add-telefono').val().trim(),
      direccion: $('#add-direccion').val().trim(),
      cargo: $('#add-cargo').val().trim(),
      contrasena: $('#add-password').val().trim()
    };

    // Validaciones locales (recolectar todas)
    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eCed = validarCedula(data.cedula); if (eCed) errores.cedula = eCed;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const eCar = validarCargo(data.cargo); if (eCar) errores.cargo = eCar;
    const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

    if (Object.keys(errores).length > 0) {
      Object.entries(errores).forEach(([key, msg]) => mostrarError(key, msg, 'add'));
      setLoading(btn, false, 'Agregar Empleado');
      return;
    }

    try {
      const res = await fetch('/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const result = await parseResponse(res);

      if (!res.ok) {
        if (result.errores) {
          for (const key in result.errores) mostrarError(key, result.errores[key], 'add');
        } else {
          mostrarError('password', result.mensaje || 'Error al crear empleado', 'add');
        }
        setLoading(btn, false, 'Agregar Empleado');
        return;
      }

      $('#modalAgregarEmpleado').modal('hide');
      new bootstrap.Modal(document.getElementById('confirmacionModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'add');
    } finally {
      setLoading(btn, false, 'Agregar Empleado');
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