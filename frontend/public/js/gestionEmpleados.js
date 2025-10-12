// Gestión de Empleados (versión estable):
// - Sin recarga total.
// - Cache consistente (fuente única de verdad).
// - "Ver detalles" SIEMPRE usa cache (no reconstruye datos viejos del DOM).
// - Edición actualiza cache y la fila (atributos + celdas) después del draw.
// - Paginación / búsqueda / responsive soportados.

$(document).ready(function () {
  const token = localStorage.getItem('token');

  /* ====== Config de validaciones (sincroniza con backend) ====== */
  const NOMBRE_MIN = 2;
  const NOMBRE_MAX = 50;
  const CEDULA_MIN = 6;
  const CEDULA_MAX = 15;
  const CARGO_MIN = 3;
  const PASS_MIN = 6;

  /* ====== Cache ====== */
  const empleadoCache = {};
  window.__empleadoCache = empleadoCache; // para depuración

  /* ====== Inicializar DataTable ====== */
  const table = $('#tablaEmpleados').DataTable({
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

  /* ====== Cache inicial ====== */
  buildCacheFromDOM();
  table.on('draw', () => buildCacheFromDOM(false)); // añadir nuevas filas al cache en redraw

  /* ===================== HELPERS ===================== */
  function buildActionButtonsHTML(id) {
    return `
      <button class="btn btn-info btn-sm btn-ver" data-id="${id}" title="Ver"><i class="fas fa-eye"></i></button>
      <button class="btn btn-warning btn-sm btn-editar" data-id="${id}" title="Editar"><i class="fas fa-edit"></i></button>
      <button class="btn btn-danger btn-sm btn-eliminar" data-id="${id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
    `;
  }

  function parentDataRowFrom(btn) {
    let tr = $(btn).closest('tr');
    if (tr.hasClass('child')) tr = tr.prev();
    return tr;
  }

  function buildCacheFromDOM(overwrite = false) {
    $('#tablaEmpleados tbody tr').each(function () {
      const $tr = $(this);
      const id = $tr.data('id');
      if (!id) return;
      if (!empleadoCache[id] || overwrite) {
        empleadoCache[id] = {
          _id: id,
          cedula: $tr.find('td:eq(0)').text().trim(),
          nombre: $tr.data('nombre'),
          email: $tr.data('email'),
          telefono: $tr.data('telefono') || '',
          direccion: $tr.data('direccion') || '',
          cargo: $tr.data('cargo') || ''
        };
      }
      // Asegurar botones con data-id
      const accionesTd = $tr.find('td').eq(3);
      if (accionesTd.find('.btn-ver').length === 0) {
        accionesTd.html(buildActionButtonsHTML(id));
      } else {
        accionesTd.find('button').attr('data-id', id);
      }
    });
  }

  function updateCacheAndRow(empleado) {
    const merged = {
      _id: empleado._id,
      cedula: empleado.cedula || empleado.cedula === 0 ? empleado.cedula : (empleado.cedula ?? empleado.cedula),
      nombre: empleado.nombre,
      email: empleado.email,
      telefono: empleado.telefono || '',
      direccion: empleado.direccion || '',
      cargo: empleado.cargo || ''
    };
    empleadoCache[merged._id] = merged;

    const $row = $(`#tablaEmpleados tbody tr[data-id="${merged._id}"]`);
    if ($row.length) {
      const dtRow = table.row($row);
      dtRow
        .data([
          merged.cedula,
          merged.nombre,
          merged.cargo,
          buildActionButtonsHTML(merged._id)
        ])
        .invalidate()
        .draw(false);

      // Actualizar atributos en el nodo final
      const node = $(dtRow.node());
      node
        .attr('data-id', merged._id)
        .attr('data-nombre', merged.nombre)
        .attr('data-email', merged.email)
        .attr('data-telefono', merged.telefono)
        .attr('data-direccion', merged.direccion)
        .attr('data-cargo', merged.cargo);
    }
  }

  function addRowToTable(empleado) {
    const c = {
      _id: empleado._id,
      cedula: empleado.cedula,
      nombre: empleado.nombre,
      email: empleado.email,
      telefono: empleado.telefono || '',
      direccion: empleado.direccion || '',
      cargo: empleado.cargo || ''
    };
    empleadoCache[c._id] = c;
    const node = table.row.add([
      c.cedula,
      c.nombre,
      c.cargo,
      buildActionButtonsHTML(c._id)
    ]).draw(false).node();
    $(node)
      .attr('data-id', c._id)
      .attr('data-nombre', c.nombre)
      .attr('data-email', c.email)
      .attr('data-telefono', c.telefono)
      .attr('data-direccion', c.direccion)
      .attr('data-cargo', c.cargo);
  }

  function setLoading(btn, loading, textoNormal, textoCargando) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = textoNormal;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${textoCargando}`;
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

  /* ===================== VALIDACIONES ===================== */
  function isEmpty(v) { return v === undefined || v === null || String(v).trim() === ''; }

  function validarNombre(nombre) {
    if (isEmpty(nombre)) return 'El nombre es obligatorio';
    const v = String(nombre).trim();
    if (v.length < NOMBRE_MIN) return `El nombre debe tener al menos ${NOMBRE_MIN} caracteres`;
    if (v.length > NOMBRE_MAX) return `El nombre no puede exceder los ${NOMBRE_MAX} caracteres`;
    if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(v)) return 'El nombre solo puede contener letras y espacios';
    return null;
  }
  function validarCedula(cedula) {
    if (isEmpty(cedula)) return 'La cédula es obligatoria';
    const v = String(cedula).trim();
    if (!/^[0-9]{6,15}$/.test(v)) return `La cédula debe tener entre ${CEDULA_MIN} y ${CEDULA_MAX} dígitos numéricos`;
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
    if (v.length < CARGO_MIN) return `El cargo debe tener al menos ${CARGO_MIN} caracteres`;
    return null;
  }
  function validarPassword(contrasena, requerida = true) {
    if (!requerida && isEmpty(contrasena)) return null;
    if (isEmpty(contrasena)) return 'La contraseña es obligatoria';
    const v = String(contrasena);
    if (v.length < PASS_MIN) return `La contraseña debe tener al menos ${PASS_MIN} caracteres y contener letras y números`;
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(v)) return 'La contraseña debe contener al menos una letra y un número';
    return null;
  }

  /* ===================== VER DETALLES ===================== */
  $(document).on('click', '.btn-ver', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    if (!id || !empleadoCache[id]) {
      console.warn('Empleado no en cache al Ver:', id);
      return;
    }
    const e = empleadoCache[id];
    $('#verCedula').text(e.cedula);
    $('#verNombre').text(e.nombre);
    $('#verEmail').text(e.email);
    $('#verTelefono').text(e.telefono || '—');
    $('#verDireccion').text(e.direccion || '—');
    $('#verCargo').text(e.cargo || '—');
    $('#modalVerEmpleado').modal('show');
  });

  /* ===================== ABRIR EDITAR ===================== */
  $(document).on('click', '.btn-editar', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    const e = empleadoCache[id];
    if (!id || !e) return;
    $('#editarId').val(id);
    $('#edit-nombre').val(e.nombre);
    $('#edit-cedula').val(e.cedula);
    $('#edit-email').val(e.email);
    $('#edit-telefono').val(e.telefono);
    $('#edit-direccion').val(e.direccion);
    $('#edit-cargo').val(e.cargo);
    $('#edit-password').val('');
    limpiarErrores('edit');
    $('#modalEditarEmpleado').modal('show');
  });

  /* ===================== SUBMIT EDITAR ===================== */
  $('#formEditarEmpleado').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('edit');
    if (!token) return alert('Sesión expirada');

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

    if (Object.keys(errores).length) {
      Object.entries(errores).forEach(([k,v]) => mostrarError(k,v,'edit'));
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
          Object.entries(result.errores).forEach(([k,v]) => mostrarError(k,v,'edit'));
        } else {
          mostrarError('password', result.mensaje || 'Error al actualizar', 'edit');
        }
        setLoading(btn, false, 'Guardar cambios');
        return;
      }

      const backendEmpleado = result.empleado || result;
      const empleadoFinal = {
        _id: backendEmpleado._id || id,
        cedula: backendEmpleado.cedula ?? data.cedula,
        nombre: backendEmpleado.nombre ?? data.nombre,
        email: backendEmpleado.email ?? data.email,
        telefono: backendEmpleado.telefono !== undefined ? backendEmpleado.telefono : data.telefono,
        direccion: backendEmpleado.direccion !== undefined ? backendEmpleado.direccion : data.direccion,
        cargo: backendEmpleado.cargo ?? data.cargo
      };

      updateCacheAndRow(empleadoFinal);

      $('#modalEditarEmpleado').modal('hide');
      toastOK('Empleado actualizado correctamente.');
    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'edit');
    } finally {
      setLoading(btn, false, 'Guardar cambios');
    }
  });

  /* ===================== ABRIR CREAR ===================== */
  $('[data-bs-target="#modalAgregarEmpleado"]').on('click', function () {
    $('#formAgregarEmpleado')[0].reset();
    limpiarErrores('add');
  });

  /* ===================== SUBMIT CREAR ===================== */
  $('#formAgregarEmpleado').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('add');
    if (!token) return alert('Sesión expirada');

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Agregar Empleado', 'Guardando...');

    const data = {
      nombre: $('#add-nombre').val().trim(),
      cedula: $('#add-cedula').val().trim(),
      email: $('#add-email').val().trim().toLowerCase(),
      telefono: $('#add-telefono').val().trim(),
      direccion: $('#add-direccion').val().trim(),
      cargo: $('#add-cargo').val().trim(),
      contrasena: $('#add-password').val().trim()
    };

    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eCed = validarCedula(data.cedula); if (eCed) errores.cedula = eCed;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const eCar = validarCargo(data.cargo); if (eCar) errores.cargo = eCar;
    const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

    if (Object.keys(errores).length) {
      Object.entries(errores).forEach(([k,v]) => mostrarError(k,v,'add'));
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
          Object.entries(result.errores).forEach(([k,v]) => mostrarError(k,v,'add'));
        } else {
          mostrarError('password', result.mensaje || 'Error al crear empleado', 'add');
        }
        setLoading(btn, false, 'Agregar Empleado');
        return;
      }

      const backendEmpleado = result.empleado || result;
      const empleadoFinal = {
        _id: backendEmpleado._id,
        cedula: backendEmpleado.cedula ?? data.cedula,
        nombre: backendEmpleado.nombre ?? data.nombre,
        email: backendEmpleado.email ?? data.email,
        telefono: backendEmpleado.telefono !== undefined ? backendEmpleado.telefono : data.telefono,
        direccion: backendEmpleado.direccion !== undefined ? backendEmpleado.direccion : data.direccion,
        cargo: backendEmpleado.cargo ?? data.cargo
      };

      addRowToTable(empleadoFinal);
      $('#modalAgregarEmpleado').modal('hide');
      toastOK('Empleado creado correctamente.');
    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'add');
    } finally {
      setLoading(btn, false, 'Agregar Empleado');
    }
  });

  /* ===================== ELIMINAR ===================== */
  let idEliminar = null;
  $(document).on('click', '.btn-eliminar', function () {
    idEliminar = $(this).data('id') || parentDataRowFrom(this).data('id');
  if (!idEliminar) {
      console.warn('No se encontró id para eliminar');
      return;
    }
    $('#confirmarEliminacionModal').modal('show');
  });

  $('#btnConfirmarEliminar').on('click', async function () {
    if (!idEliminar) return;
    if (!token) return alert('Sesión expirada');
    try {
      const res = await fetch(`/empleados/${idEliminar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Error al eliminar', res.status);
        return;
      }
      delete empleadoCache[idEliminar];
      const $row = $(`#tablaEmpleados tbody tr[data-id="${idEliminar}"]`);
      if ($row.length) {
        table.row($row).remove().draw(false);
      }
      $('#confirmarEliminacionModal').modal('hide');
      toastOK('Empleado eliminado exitosamente.');
      idEliminar = null;
    } catch (err) {
      console.error('Fallo eliminando empleado', err);
    }
  });

  /* ===================== NOTIFICACIONES (simple) ===================== */
  function toastOK(msg) {
    const el = document.getElementById('confirmacionModal');
    if (!el) return;
    const p = el.querySelector('.modal-body p');
    if (p) p.textContent = msg;
    const modal = new bootstrap.Modal(el);
    modal.show();
    setTimeout(() => modal.hide(), 1200);
  }
});