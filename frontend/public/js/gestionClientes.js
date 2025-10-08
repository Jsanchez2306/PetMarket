// Gestión de Clientes (versión estable):
// - Sin recarga total.
// - Cache consistente (fuente única de verdad).
// - "Ver detalles" SIEMPRE usa cache (no reconstruye datos viejos del DOM).
// - Edición actualiza cache y la fila (atributos + celdas) después del draw.
// - Paginación / búsqueda / responsive soportados.
// - Teléfono y Dirección opcionales (vacías no se guardan; en edición cadena vacía elimina valor si backend aplica $unset).

$(document).ready(function () {
  const token = localStorage.getItem('token');

  /* ====== Config de validaciones (sincroniza con backend) ====== */
  const NOMBRE_MIN = 3;     // Ajusta a 2 si el backend usa 2
  const NOMBRE_MAX = 50;

  /* ====== Cache ====== */
  const clienteCache = {};
  window.__clienteCache = clienteCache; // para depuración en consola

  /* ====== Inicializar DataTable ====== */
  const table = $('#tablaClientes').DataTable({
    responsive: true,
    language: {
      search: "Buscar:",
      lengthMenu: "Mostrar _MENU_ registros",
      info: "Mostrando _START_ a _END_ de _TOTAL_ clientes",
      paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" },
      emptyTable: "No hay clientes registrados",
      zeroRecords: "No se encontraron coincidencias"
    },
    columnDefs: [{ targets: 3, orderable: false }]
  });

  /* ====== Cache inicial ====== */
  buildCacheFromDOM(); // primera página

  // En cada redibujado (cambio de página, búsqueda, responsive) solo añadimos filas nuevas al cache
  table.on('draw', () => {
    buildCacheFromDOM(false);
  });

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
    if (tr.hasClass('child')) tr = tr.prev(); // fila padre real (responsive)
    return tr;
  }

  function buildCacheFromDOM(overwrite = false) {
    $('#tablaClientes tbody tr').each(function () {
      const $tr = $(this);
      const id = $tr.data('id');
      if (!id) return;
      if (!clienteCache[id] || overwrite) {
        clienteCache[id] = {
          _id: id,
          nombre: $tr.data('nombre'),
          email: $tr.data('email'),
          telefono: $tr.data('telefono') || '',
          direccion: $tr.data('direccion') || ''
        };
      }
      // Asegurar que la celda de acciones siempre tenga botones con data-id
      const accionesTd = $tr.find('td').eq(3);
      if (accionesTd.find('.btn-ver').length === 0) {
        accionesTd.html(buildActionButtonsHTML(id));
      } else {
        accionesTd.find('button').attr('data-id', id);
      }
    });
  }

  function updateCacheAndRow(cliente) {
    // cliente: objeto devuelto por el backend (o reconstruido)
    const merged = {
      _id: cliente._id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    };
    clienteCache[merged._id] = merged;

    const $row = $(`#tablaClientes tbody tr[data-id="${merged._id}"]`);
    if ($row.length) {
      const dtRow = table.row($row);
      dtRow
        .data([
          merged.nombre,
          merged.email,
          merged.telefono || '—',
          buildActionButtonsHTML(merged._id)
        ])
        .invalidate()
        .draw(false);

      // Tras draw, recuperar nodo final y actualizar atributos
      const node = $(dtRow.node());
      node
        .attr('data-id', merged._id)
        .attr('data-nombre', merged.nombre)
        .attr('data-email', merged.email)
        .attr('data-telefono', merged.telefono)
        .attr('data-direccion', merged.direccion);
    }
  }

  function addRowToTable(cliente) {
    const c = {
      _id: cliente._id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    };
    clienteCache[c._id] = c;
    const node = table.row.add([
      c.nombre,
      c.email,
      c.telefono || '—',
      buildActionButtonsHTML(c._id)
    ]).draw(false).node();
    $(node)
      .attr('data-id', c._id)
      .attr('data-nombre', c.nombre)
      .attr('data-email', c.email)
      .attr('data-telefono', c.telefono)
      .attr('data-direccion', c.direccion);
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

  function mostrarError(campo, mensaje, tipo = 'edit') {
    const div = document.getElementById(`error-${tipo}-${campo}`);
    if (div) {
      div.textContent = mensaje;
      div.classList.remove('d-none');
    }
  }

  function limpiarErrores(tipo = 'edit') {
    ['nombre','email','telefono','direccion','password'].forEach(c => {
      const d = document.getElementById(`error-${tipo}-${c}`);
      if (d) {
        d.textContent = '';
        d.classList.add('d-none');
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

  function validarEmail(email) {
    if (isEmpty(email)) return 'El correo electrónico es obligatorio';
    const v = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo electrónico no es válido';
    return null;
  }

  function validarTelefono(telefono) {
    if (isEmpty(telefono)) return null; // opcional
    const v = String(telefono).trim();
    if (!/^[0-9]{7,15}$/.test(v)) return 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
    return null;
  }

  function validarDireccion(direccion) {
    if (isEmpty(direccion)) return null; // opcional
    const v = String(direccion).trim();
    if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres';
    if (v.length > 100) return 'La dirección no puede exceder los 100 caracteres';
    return null;
  }

  function validarPassword(contrasena, requerida = true) {
    if (!requerida && isEmpty(contrasena)) return null;
    if (isEmpty(contrasena)) return 'La contraseña es obligatoria';
    if (String(contrasena).length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  }

  /* ===================== VER DETALLES ===================== */
  // SOLO usa cache. Si no está en cache (caso raro), muestra aviso.
  $(document).on('click', '.btn-ver', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    if (!id || !clienteCache[id]) {
      console.warn('Cliente no en cache al Ver:', id);
      return;
    }
    const c = clienteCache[id];
    $('#verNombre').text(c.nombre);
    $('#verEmail').text(c.email);
    $('#verTelefono').text(c.telefono || '—');
    $('#verDireccion').text(c.direccion || '—');
    $('#modalVerCliente').modal('show');
  });

  /* ===================== ABRIR EDITAR ===================== */
  $(document).on('click', '.btn-editar', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    const c = clienteCache[id];
    if (!id || !c) return;
    $('#editarId').val(id);
    $('#edit-nombre').val(c.nombre);
    $('#edit-email').val(c.email);
    $('#edit-telefono').val(c.telefono);
    $('#edit-direccion').val(c.direccion);
    $('#edit-password').val('');
    limpiarErrores('edit');
    $('#modalEditarCliente').modal('show');
  });

  /* ===================== SUBMIT EDITAR ===================== */
  $('#formEditarCliente').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('edit');
    if (!token) {
      showModal.error('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Guardar cambios', 'Guardando...');

    const id = $('#editarId').val();
    const data = {
      nombre: $('#edit-nombre').val().trim(),
      email: $('#edit-email').val().trim().toLowerCase(),
      telefono: $('#edit-telefono').val().trim(),
      direccion: $('#edit-direccion').val().trim()
    };
    const contrasena = $('#edit-password').val().trim();
    if (contrasena) data.contrasena = contrasena;

    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    if (contrasena) {
      const ePwd = validarPassword(contrasena, false); if (ePwd) errores.password = ePwd;
    }

    if (Object.keys(errores).length) {
      Object.entries(errores).forEach(([k,v]) => mostrarError(k,v,'edit'));
      setLoading(btn, false, 'Guardar cambios');
      return;
    }

    try {
      const res = await fetch(`/clientes/${id}`, {
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

      const backendCliente = result.cliente || result;

      // Mezcla defensiva por si backend no retorna todos los campos opcionales
      const clienteFinal = {
        _id: backendCliente._id || id,
        nombre: backendCliente.nombre ?? data.nombre,
        email: backendCliente.email ?? data.email,
        telefono: backendCliente.telefono !== undefined ? backendCliente.telefono : data.telefono,
        direccion: backendCliente.direccion !== undefined ? backendCliente.direccion : data.direccion
      };

      updateCacheAndRow(clienteFinal);

      $('#modalEditarCliente').modal('hide');
      toastOK('Cliente actualizado correctamente.');
    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'edit');
    } finally {
      setLoading(btn, false, 'Guardar cambios');
    }
  });

  /* ===================== ABRIR CREAR ===================== */
  $('[data-bs-target="#modalAgregarCliente"]').on('click', function () {
    $('#formAgregarCliente')[0].reset();
    limpiarErrores('add');
  });

  /* ===================== SUBMIT CREAR ===================== */
  $('#formAgregarCliente').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('add');
    if (!token) {
      showModal.error('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Agregar Cliente', 'Guardando...');

    const data = {
      nombre: $('#add-nombre').val().trim(),
      email: $('#add-email').val().trim().toLowerCase(),
      telefono: $('#add-telefono').val().trim(),
      direccion: $('#add-direccion').val().trim(),
      contrasena: $('#add-password').val().trim()
    };
    if (!data.telefono) delete data.telefono;
    if (!data.direccion) delete data.direccion;

    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

    if (Object.keys(errores).length) {
      Object.entries(errores).forEach(([k,v]) => mostrarError(k,v,'add'));
      setLoading(btn, false, 'Agregar Cliente');
      return;
    }

    try {
      const res = await fetch('/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const result = await parseResponse(res);

      if (!res.ok) {
        if (result.errores) {
          Object.entries(result.errores).forEach(([k,v]) => mostrarError(k,v,'add'));
        } else {
          mostrarError('password', result.mensaje || 'Error al crear cliente', 'add');
        }
        setLoading(btn, false, 'Agregar Cliente');
        return;
      }

      const backendCliente = result.cliente || result;
      const clienteFinal = {
        _id: backendCliente._id,
        nombre: backendCliente.nombre ?? data.nombre,
        email: backendCliente.email ?? data.email,
        telefono: backendCliente.telefono !== undefined ? backendCliente.telefono : data.telefono,
        direccion: backendCliente.direccion !== undefined ? backendCliente.direccion : data.direccion
      };

      addRowToTable(clienteFinal);

      $('#modalAgregarCliente').modal('hide');
      toastOK('Cliente creado correctamente.');
    } catch (err) {
      console.error(err);
      mostrarError('password', 'Error en el servidor', 'add');
    } finally {
      setLoading(btn, false, 'Agregar Cliente');
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
    if (!token) {
      showModal.error('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      return;
    }
    try {
      const res = await fetch(`/clientes/${idEliminar}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Error al eliminar', res.status);
        return;
      }
      delete clienteCache[idEliminar];
      const $row = $(`#tablaClientes tbody tr[data-id="${idEliminar}"]`);
      if ($row.length) {
        table.row($row).remove().draw(false);
      }
      $('#confirmarEliminacionModal').modal('hide');
      toastOK('Cliente eliminado exitosamente.');
      idEliminar = null;
    } catch (err) {
      console.error('Fallo eliminando cliente', err);
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