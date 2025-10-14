document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // ====== Config de validaciones (sincroniza con backend) ======
  const NOMBRE_MIN = 2;
  const NOMBRE_MAX = 50;
  const CEDULA_MIN = 6;
  const CEDULA_MAX = 15;
  const CARGO_MIN = 3;
  const PASS_MIN = 6;

  // ====== Inicializar DataTable (si está disponible via jQuery) ======
  let dataTable = null;
  const tableElement = document.getElementById('tablaEmpleados');
  if (tableElement && typeof $ !== 'undefined' && $.fn.DataTable) {
    dataTable = $(tableElement).DataTable({
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

  // ===================== HELPERS =====================
  function parentDataRowFrom(el) {
    let tr = el.closest('tr');
    if (!tr) return null;
    if (tr.classList.contains('child')) {
      tr = tr.previousElementSibling; // fila padre real (responsive DataTables)
    }
    return tr;
  }

  function getRowData(tr) {
    if (!tr) return null;
    const firstCell = tr.querySelector('td');
    const cedula = firstCell ? firstCell.textContent.trim() : '';
    return {
      id: tr.dataset.id || '',
      cedula,
      nombre: tr.dataset.nombre || '',
      email: tr.dataset.email || '',
      telefono: tr.dataset.telefono || '',
      direccion: tr.dataset.direccion || '',
      cargo: tr.dataset.cargo || ''
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
    // Usar ModalManager global si está disponible, sino fallback a alert
    try {
      if (window.showModal && typeof window.showModal.error === 'function') {
        window.showModal.error(titulo, mensaje);
        return;
      }
    } catch (e) {
      // ignore y fallback
    }
    alert(`${titulo}: ${mensaje}`);
  }

  function toastOK(msg, reloadDelayMs = 1200) {
    // Preferir el ModalManager global si existe
    try {
      if (window.showModal && typeof window.showModal.success === 'function' && window.modalManager) {
        window.showModal.success(msg);
        setTimeout(() => {
          try { window.modalManager.closeModal(); } catch (e) {}
          window.location.reload();
        }, reloadDelayMs);
        return;
      }
    } catch (e) {
      // ignore y fallback
    }

    const el = document.getElementById('confirmacionEmpleadoModal');
    if (!el) {
      setTimeout(() => window.location.reload(), reloadDelayMs);
      return;
    }
    const p = el.querySelector('#mensajeExitoEmpleado');
    if (p) p.textContent = msg;

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
      setTimeout(() => {
        modal.hide();
        window.location.reload();
      }, reloadDelayMs);
    } else {
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

  function validarCedula(cedula) {
    if (isEmpty(cedula)) return 'La cédula es obligatoria';
    const v = String(cedula).trim();
    if (!/^[0-9]{6,15}$/.test(v)) return `La cédula debe tener entre ${CEDULA_MIN} y ${CEDULA_MAX} dígitos numéricos`;
    return null;
  }

  function validarEmail(email, esParaAgregar = false) {
    if (isEmpty(email)) return 'El correo electrónico es obligatorio';
    const v = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo electrónico no es válido';
    
    // Validación específica para agregar empleados: debe ser del dominio petmarket.com
    if (esParaAgregar && !v.endsWith('@petmarket.com')) {
      return 'El correo debe ser de PetMarket (debe terminar con @petmarket.com)';
    }
    
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

  // ===================== VER DETALLES =====================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const emp = getRowData(tr);
    if (!emp || !emp.id) {
      console.warn('No se pudo obtener datos de la fila para Ver');
      return;
    }

    const verCedula = document.getElementById('verCedula');
    const verNombre = document.getElementById('verNombre');
    const verEmail = document.getElementById('verEmail');
    const verTelefono = document.getElementById('verTelefono');
    const verDireccion = document.getElementById('verDireccion');
    const verCargo = document.getElementById('verCargo');

    if (verCedula) verCedula.textContent = emp.cedula || '';
    if (verNombre) verNombre.textContent = emp.nombre || '';
    if (verEmail) verEmail.textContent = emp.email || '';
    if (verTelefono) verTelefono.textContent = emp.telefono || '—';
    if (verDireccion) verDireccion.textContent = emp.direccion || '—';
    if (verCargo) verCargo.textContent = emp.cargo || '—';

    showModal('modalVerEmpleado');
  });

  // ===================== ABRIR EDITAR =====================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-editar');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const emp = getRowData(tr);
    if (!emp || !emp.id) return;

    const idEl = document.getElementById('editarId');
    const nombreEl = document.getElementById('edit-nombre');
    const cedulaEl = document.getElementById('edit-cedula');
    const emailEl = document.getElementById('edit-email');
    const telEl = document.getElementById('edit-telefono');
    const dirEl = document.getElementById('edit-direccion');
    const cargoEl = document.getElementById('edit-cargo');
    const pwdEl = document.getElementById('edit-password');

    if (idEl) idEl.value = emp.id;
    if (nombreEl) nombreEl.value = emp.nombre || '';
    if (cedulaEl) cedulaEl.value = emp.cedula || '';
    if (emailEl) emailEl.value = emp.email || '';
    if (telEl) telEl.value = emp.telefono || '';
    if (dirEl) dirEl.value = emp.direccion || '';
    if (cargoEl) cargoEl.value = emp.cargo || '';
    if (pwdEl) pwdEl.value = '';

    limpiarErrores('edit');
    showModal('modalEditarEmpleado');
  });

  // ===================== SUBMIT EDITAR =====================
  const formEditar = document.getElementById('formEditarEmpleado');
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
        cedula: (document.getElementById('edit-cedula')?.value || '').trim(),
        email: (document.getElementById('edit-email')?.value || '').trim().toLowerCase(),
        telefono: (document.getElementById('edit-telefono')?.value || '').trim(),
        direccion: (document.getElementById('edit-direccion')?.value || '').trim(),
        cargo: (document.getElementById('edit-cargo')?.value || '').trim()
      };
      const contrasena = (document.getElementById('edit-password')?.value || '').trim();
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
        Object.entries(errores).forEach(([k, v]) => mostrarError(k, v, 'edit'));
        setLoading(btn, false, 'Guardar cambios');
        return;
      }

      try {
        // Habilitar temporalmente los campos disabled para enviarlos
        const cedulaField = document.getElementById('edit-cedula');
        const emailField = document.getElementById('edit-email');
        if (cedulaField) cedulaField.disabled = false;
        if (emailField) emailField.disabled = false;
        
        const res = await fetch(`/empleados/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data)
        });
        
        // Volver a deshabilitar los campos
        if (cedulaField) cedulaField.disabled = true;
        if (emailField) emailField.disabled = true;
        const result = await parseResponse(res);

        if (!res.ok) {
          if (result.errores) {
            Object.entries(result.errores).forEach(([k, v]) => mostrarError(k, v, 'edit'));
          } else {
            mostrarError('password', result.mensaje || 'Error al actualizar', 'edit');
          }
          return;
        }

        hideModal('modalEditarEmpleado');
        toastOK('Empleado actualizado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('password', 'Error en el servidor', 'edit');
      } finally {
        setLoading(btn, false, 'Guardar cambios');
      }
    });
  }

  // ===================== ABRIR CREAR =====================
  const agregarTriggers = document.querySelectorAll('[data-bs-target="#modalAgregarEmpleado"]');
  agregarTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const form = document.getElementById('formAgregarEmpleado');
      if (form) form.reset();
      limpiarErrores('add');
    });
  });

  // ===================== SUBMIT CREAR =====================
  const formAgregar = document.getElementById('formAgregarEmpleado');
  if (formAgregar) {
    formAgregar.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarErrores('add');
      if (!token) {
        showErrorModal('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }

      const btn = formAgregar.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Agregar Empleado', 'Guardando...');

      const data = {
        nombre: (document.getElementById('add-nombre')?.value || '').trim(),
        cedula: (document.getElementById('add-cedula')?.value || '').trim(),
        email: (document.getElementById('add-email')?.value || '').trim().toLowerCase(),
        telefono: (document.getElementById('add-telefono')?.value || '').trim(),
        direccion: (document.getElementById('add-direccion')?.value || '').trim(),
        cargo: (document.getElementById('add-cargo')?.value || '').trim(),
        contrasena: (document.getElementById('add-password')?.value || '').trim()
      };

      const errores = {};
      const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
      const eCed = validarCedula(data.cedula); if (eCed) errores.cedula = eCed;
      const eEml = validarEmail(data.email, true); if (eEml) errores.email = eEml; // true = validación para agregar empleados
      const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
      const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
      const eCar = validarCargo(data.cargo); if (eCar) errores.cargo = eCar;
      const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

      if (Object.keys(errores).length) {
        Object.entries(errores).forEach(([k, v]) => mostrarError(k, v, 'add'));
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
            Object.entries(result.errores).forEach(([k, v]) => mostrarError(k, v, 'add'));
          } else {
            mostrarError('password', result.mensaje || 'Error al crear empleado', 'add');
          }
          return;
        }

        hideModal('modalAgregarEmpleado');
        toastOK('Empleado creado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('password', 'Error en el servidor', 'add');
      } finally {
        setLoading(btn, false, 'Agregar Empleado');
      }
    });
  }

  // ===================== ELIMINAR =====================
  let idEliminar = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    const tr = parentDataRowFrom(btn);
    const emp = getRowData(tr);
    if (!emp || !emp.id) {
      console.warn('No se encontró id para eliminar');
      return;
    }
    idEliminar = emp.id;
    showModal('confirmarEliminacionEmpleadoModal');
  });

  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminarEmpleado');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
      if (!idEliminar) return;
      if (!token) {
        showErrorModal('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }
      try {
        const res = await fetch(`/empleados/${idEliminar}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          console.error('Error al eliminar', res.status);
          return;
        }
        hideModal('confirmarEliminacionEmpleadoModal');
        toastOK('Empleado eliminado exitosamente.');
        idEliminar = null;
      } catch (err) {
        console.error('Fallo eliminando empleado', err);
      }
    });
  }
});