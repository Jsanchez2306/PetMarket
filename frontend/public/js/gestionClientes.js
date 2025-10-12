document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // ====== Config de validaciones (sincroniza con backend) ======
  const NOMBRE_MIN = 3;     // Ajusta a 2 si el backend usa 2
  const NOMBRE_MAX = 50;

  // ====== Inicializar DataTable (si está disponible via jQuery) ======
  let dataTable = null;
  const tableElement = document.getElementById('tablaClientes');
  if (tableElement && typeof $ !== 'undefined' && $.fn.DataTable) {
    dataTable = $(tableElement).DataTable({
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
  }

  // ===================== HELPERS =====================
  function parentDataRowFrom(el) {
    let tr = el.closest('tr');
    if (!tr) return null;
    if (tr.classList.contains('child')) {
      // fila padre real (responsive DataTables)
      tr = tr.previousElementSibling;
    }
    return tr;
  }

  function getRowData(tr) {
    if (!tr) return null;
    return {
      id: tr.dataset.id || '',
      nombre: tr.dataset.nombre || '',
      email: tr.dataset.email || '',
      telefono: tr.dataset.telefono || '',
      direccion: tr.dataset.direccion || ''
    };
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
    ['nombre', 'email', 'telefono', 'direccion', 'password'].forEach(c => {
      const d = document.getElementById(`error-${tipo}-${c}`);
      if (d) {
        d.textContent = '';
        d.classList.add('d-none');
      }
    });
  }

  function showModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
    } else {
      el.style.display = 'block';
      el.classList.add('show');
    }
  }

  function hideModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = bootstrap.Modal.getInstance(el);
      if (modal) modal.hide();
    } else {
      el.style.display = 'none';
      el.classList.remove('show');
    }
  }

  function showErrorModal(titulo, mensaje) {
    // Puedes reemplazar este alert por un modal de error si lo tienes
    alert(`${titulo}: ${mensaje}`);
  }

  function toastOK(msg, reloadDelayMs = 1200) {
    const el = document.getElementById('confirmacionModal');
    if (!el) {
      // Fallback consola si no existe modal
      console.log('', msg);
      setTimeout(() => window.location.reload(), reloadDelayMs);
      return;
    }
    const p = el.querySelector('.modal-body p');
    if (p) p.textContent = msg;

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
      setTimeout(() => {
        modal.hide();
        window.location.reload();
      }, reloadDelayMs);
    } else {
      console.log('', msg);
      setTimeout(() => window.location.reload(), reloadDelayMs);
    }
  }

  // ===================== VALIDACIONES =====================
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

  // ===================== VER DETALLES =====================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const data = getRowData(tr);
    if (!data || !data.id) {
      console.warn('No se pudo obtener datos de la fila para Ver');
      return;
    }

    const nombre = document.getElementById('verNombre');
    const email = document.getElementById('verEmail');
    const telefono = document.getElementById('verTelefono');
    const direccion = document.getElementById('verDireccion');

    if (nombre) nombre.textContent = data.nombre || '';
    if (email) email.textContent = data.email || '';
    if (telefono) telefono.textContent = data.telefono || '—';
    if (direccion) direccion.textContent = data.direccion || '—';

    showModal('modalVerCliente');
  });

  // ===================== ABRIR EDITAR =====================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const data = getRowData(tr);
    if (!data || !data.id) return;

    const idEl = document.getElementById('editarId');
    const nombreEl = document.getElementById('edit-nombre');
    const emailEl = document.getElementById('edit-email');
    const telEl = document.getElementById('edit-telefono');
    const dirEl = document.getElementById('edit-direccion');
    const pwdEl = document.getElementById('edit-password');

    if (idEl) idEl.value = data.id;
    if (nombreEl) nombreEl.value = data.nombre || '';
    if (emailEl) emailEl.value = data.email || '';
    if (telEl) telEl.value = data.telefono || '';
    if (dirEl) dirEl.value = data.direccion || '';
    if (pwdEl) pwdEl.value = '';

    limpiarErrores('edit');
    showModal('modalEditarCliente');
  });

  // ===================== SUBMIT EDITAR =====================
  const formEditar = document.getElementById('formEditarCliente');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarErrores('edit');

      if (!token) {
        showErrorModal('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }

      const btn = formEditar.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Guardar cambios', 'Guardando...');

      const id = (document.getElementById('editarId')?.value || '').trim();
      const data = {
        nombre: (document.getElementById('edit-nombre')?.value || '').trim(),
        email: (document.getElementById('edit-email')?.value || '').trim().toLowerCase(),
        telefono: (document.getElementById('edit-telefono')?.value || '').trim(),
        direccion: (document.getElementById('edit-direccion')?.value || '').trim()
      };
      const contrasena = (document.getElementById('edit-password')?.value || '').trim();
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
        Object.entries(errores).forEach(([k, v]) => mostrarError(k, v, 'edit'));
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
            Object.entries(result.errores).forEach(([k, v]) => mostrarError(k, v, 'edit'));
          } else {
            mostrarError('password', result.mensaje || 'Error al actualizar', 'edit');
          }
          return;
        }

        hideModal('modalEditarCliente');
        toastOK('Cliente actualizado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('password', 'Error en el servidor', 'edit');
      } finally {
        setLoading(btn, false, 'Guardar cambios');
      }
    });
  }

  // ===================== ABRIR CREAR =====================
  const agregarTriggers = document.querySelectorAll('[data-bs-target="#modalAgregarCliente"]');
  agregarTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const form = document.getElementById('formAgregarCliente');
      if (form) form.reset();
      limpiarErrores('add');
    });
  });

  // ===================== SUBMIT CREAR =====================
  const formAgregar = document.getElementById('formAgregarCliente');
  if (formAgregar) {
    formAgregar.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarErrores('add');

      if (!token) {
        showErrorModal('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }

      const btn = formAgregar.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Agregar Cliente', 'Guardando...');

      const data = {
        nombre: (document.getElementById('add-nombre')?.value || '').trim(),
        email: (document.getElementById('add-email')?.value || '').trim().toLowerCase(),
        telefono: (document.getElementById('add-telefono')?.value || '').trim(),
        direccion: (document.getElementById('add-direccion')?.value || '').trim(),
        contrasena: (document.getElementById('add-password')?.value || '').trim()
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
        Object.entries(errores).forEach(([k, v]) => mostrarError(k, v, 'add'));
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
            Object.entries(result.errores).forEach(([k, v]) => mostrarError(k, v, 'add'));
          } else {
            mostrarError('password', result.mensaje || 'Error al crear cliente', 'add');
          }
          return;
        }

        hideModal('modalAgregarCliente');
        toastOK('Cliente creado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('password', 'Error en el servidor', 'add');
      } finally {
        setLoading(btn, false, 'Agregar Cliente');
      }
    });
  }

  // ===================== ELIMINAR =====================
  let idEliminar = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const data = getRowData(tr);
    if (!data || !data.id) {
      console.warn('No se encontró id para eliminar');
      return;
    }
    idEliminar = data.id;
    showModal('confirmarEliminacionModal');
  });

  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
      if (!idEliminar) return;
      if (!token) {
        showErrorModal('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
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
        hideModal('confirmarEliminacionModal');
        toastOK('Cliente eliminado exitosamente.');
        idEliminar = null;
      } catch (err) {
        console.error('Fallo eliminando cliente', err);
      }
    });
  }
});