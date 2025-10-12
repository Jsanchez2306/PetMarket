// Gestión de Productos sin jQuery (excepto DataTables para inicialización), sin cache.
// - Ver/Editar toman los datos desde los atributos data-* de la fila.
// - En crear/editar/eliminar se muestra una modal de confirmación unos segundos y se recarga la página.

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // Tope de precio local (ajústalo si necesitas: 3'000.000 COP)
  const MAX_PRECIO = 3000000;
  const CATEGORIAS_VALIDAS = ['accesorios', 'ropa', 'juguetes', 'alimentos', 'higiene'];

  // ========== DataTable Inicial (solo si está jQuery y plugin) ==========
  let dataTable = null;
  const tablaProductosEl = document.getElementById('tablaProductos');
  if (tablaProductosEl && typeof $ !== 'undefined' && $.fn.DataTable) {
    if ($.fn.DataTable.isDataTable('#tablaProductos')) {
      dataTable = $('#tablaProductos').DataTable();
    } else {
      dataTable = $('#tablaProductos').DataTable({
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
  }

  // ========== HELPERS ==========
  function parentDataRowFrom(el) {
    let tr = el.closest('tr');
    if (!tr) return null;
    // Si es fila "child" (responsive DataTables), la fila padre real es la anterior
    if (tr.classList.contains('child')) {
      tr = tr.previousElementSibling;
    }
    return tr;
  }

  // Asegura que el click proviene de la tabla de Productos (evita choques con otras tablas que usan .btn-*)
  function belongsToProductos(btn) {
    const tr = parentDataRowFrom(btn);
    const table = tr ? tr.closest('table') : null;
    return table && table.id === 'tablaProductos';
  }

  function getRowData(tr) {
    if (!tr) return null;
    return {
      id: tr.dataset.id || '',
      nombre: tr.dataset.nombre || '',
      descripcion: tr.dataset.descripcion || '',
      imagen: tr.dataset.imagen || '',
      precio: tr.dataset.precio !== undefined ? Number(tr.dataset.precio) : '',
      stock: tr.dataset.stock !== undefined ? Number(tr.dataset.stock) : '',
      categoria: tr.dataset.categoria || '',
      fechaRegistro: tr.dataset.fecha || ''
    };
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

  function toastOK(msg, reloadDelayMs = 1200) {
    // Usamos confirmacionProductoModal si existe; si no, fallback a consola y recarga.
    const el = document.getElementById('confirmacionProductoModal');
    if (!el) {
      console.log('✅', msg);
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
      console.log('✅', msg);
      setTimeout(() => window.location.reload(), reloadDelayMs);
    }
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
    let raw;
    try { raw = await res.text(); } catch { return {}; }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  // ========== Errores UI ==========
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

  // ========== Validaciones / Compresión ==========
  function esSoloNumeros(str) { return /^[0-9]+$/.test((str || '').trim()); }
  function validarNombre(nombre) {
    if (!nombre || nombre.trim().length < 2) return 'Nombre mínimo 2 caracteres';
    if (esSoloNumeros(nombre)) return 'El nombre no puede ser solo números; agrega una descripción.';
    return null;
  }
  function validarDescripcion(descripcion) {
    if (!descripcion || descripcion.trim().length < 10) return 'Descripción mínima 10 caracteres';
    return null;
  }
  function validarPrecioLocal(valor, maxPrecio) {
    if (valor === '' || valor === null || valor === undefined) return 'El precio es obligatorio';
    const num = Number(valor);
    if (!Number.isFinite(num)) return 'El precio debe ser numérico';
    if (num < 0) return 'El precio no puede ser negativo';
    if (num > maxPrecio) return `El precio no puede exceder ${maxPrecio.toLocaleString('es-CO')}`;
    return null;
  }
  function validarStockLocal(valor) {
    if (valor === '' || valor === null || valor === undefined) return 'El stock es obligatorio';
    const num = Number(valor);
    if (!Number.isFinite(num)) return 'Stock debe ser numérico';
    if (!Number.isInteger(num)) return 'Stock debe ser un número entero';
    if (num < 0) return 'Stock no puede ser negativo';
    if (num > 1000) return 'Stock no puede superar 1000 unidades';
    return null;
  }
  function validarCategoriaLocal(valor) {
    if (!valor) return 'Categoría obligatoria';
    if (!CATEGORIAS_VALIDAS.includes(valor)) return 'Categoría inválida';
    return null;
  }
  function validarImagenLocal(file, requerida = false) {
    if (!file) return requerida ? 'Debes subir una imagen' : null;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const tipos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tipos.includes(file.type)) return 'Formato no permitido (solo JPG, PNG, WEBP o GIF)';
    if (file.size > maxSize) return 'La imagen supera los 5MB';
    return null;
  }
  async function comprimirImagen(file, maxW = 1200, maxH = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      try {
        if (!file || !file.type.startsWith('image/')) return resolve(file);
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxW / width, maxH / height, 1);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const outputType = 'image/jpeg';
          const finalize = (blob) => {
            if (!blob) return reject(new Error('No se pudo comprimir'));
            if (blob.size && file.size && blob.size > file.size) return resolve(file);
            const newName = file.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '.jpg');
            const nuevo = new File([blob], newName, { type: outputType, lastModified: Date.now() });
            resolve(nuevo);
          };
          if (canvas.toBlob) canvas.toBlob(finalize, outputType, quality);
          else {
            const dataURL = canvas.toDataURL(outputType, quality);
            const bstr = atob(dataURL.split(',')[1]);
            let n = bstr.length; const u8 = new Uint8Array(n);
            while (n--) u8[n] = bstr.charCodeAt(n);
            finalize(new Blob([u8], { type: outputType }));
          }
        };
        img.onerror = (e) => reject(e);
        img.src = URL.createObjectURL(file);
      } catch (_) { resolve(file); }
    });
  }

  // ========== Preview Imagen (Agregar / Editar) ==========
  const inputAddImagen = document.getElementById('add-imagen');
  const previewAdd = document.getElementById('previewAdd');
  if (inputAddImagen && previewAdd) {
    inputAddImagen.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
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
  if (inputEditImagen && previewEdit) {
    inputEditImagen.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) previewEdit.src = URL.createObjectURL(file);
    });
  }

  // ========== Ver Producto (lee desde data-*) ==========
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver');
    if (!btn || !belongsToProductos(btn)) return;

    const tr = parentDataRowFrom(btn);
    const p = getRowData(tr);
    if (!p || !p.id) return;

    const verNombre = document.getElementById('verNombre');
    const verDescripcion = document.getElementById('verDescripcion');
    const verPrecio = document.getElementById('verPrecio');
    const verStock = document.getElementById('verStock');
    const verCategoria = document.getElementById('verCategoria');
    const verImagen = document.getElementById('verImagen');
    const verFecha = document.getElementById('verFecha');

    if (verNombre) verNombre.textContent = p.nombre || '';
    if (verDescripcion) verDescripcion.textContent = p.descripcion || '';
    if (verPrecio) verPrecio.textContent = Number(p.precio).toFixed(2);
    if (verStock) verStock.textContent = p.stock ?? '';
    if (verCategoria) verCategoria.textContent = p.categoria || '';
    if (verImagen) verImagen.src = p.imagen || '';
    if (verFecha) {
      if (p.fechaRegistro) {
        const fechaObj = new Date(p.fechaRegistro);
        verFecha.textContent = 'Registrado: ' + fechaObj.toLocaleString('es-ES');
      } else {
        verFecha.textContent = '';
      }
    }

    showModal('modalVerProducto');
  });

  // ========== Abrir Modal Agregar ==========
  document.querySelectorAll('[data-bs-target="#modalAgregarProducto"]').forEach((el) => {
    el.addEventListener('click', () => {
      const form = document.getElementById('formAgregarProducto');
      if (form) form.reset();
      limpiarErrores('add');
      if (previewAdd) {
        previewAdd.classList.add('d-none');
        previewAdd.src = '';
      }
    });
  });

  // ========== Enviar Agregar (recarga tras éxito) ==========
  const formAgregar = document.getElementById('formAgregarProducto');
  if (formAgregar) {
    formAgregar.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarErrores('add');

      const btn = formAgregar.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Agregar Producto', 'Subiendo...');

      const nombre = (document.getElementById('add-nombre')?.value || '').trim();
      const descripcion = (document.getElementById('add-descripcion')?.value || '').trim();
      const precio = (document.getElementById('add-precio')?.value || '').trim();
      const stock = (document.getElementById('add-stock')?.value || '').trim();
      const categoria = (document.getElementById('add-categoria')?.value || '').trim();
      let imagenFile = document.getElementById('add-imagen')?.files?.[0];

      const errores = {};
      const eNom = validarNombre(nombre); if (eNom) errores.nombre = eNom;
      const eDes = validarDescripcion(descripcion); if (eDes) errores.descripcion = eDes;
      const ePre = validarPrecioLocal(precio, MAX_PRECIO); if (ePre) errores.precio = ePre;
      const eSto = validarStockLocal(stock); if (eSto) errores.stock = eSto;
      const eCat = validarCategoriaLocal(categoria); if (eCat) errores.categoria = eCat;
      const eImg = validarImagenLocal(imagenFile, true); if (eImg) errores.imagen = eImg;

      if (Object.keys(errores).length) {
        Object.entries(errores).forEach(([campo, msg]) => mostrarError('add', campo, msg));
        setLoading(btn, false, 'Agregar Producto');
        return;
      }

      if (imagenFile) {
        try { imagenFile = await comprimirImagen(imagenFile); } catch (_) {}
      }

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
          headers: { 'Authorization': `Bearer ${token || ''}` },
          body: formData
        });
        const result = await parseResponse(res);

        if (!res.ok) {
          if (result.errores) {
            Object.entries(result.errores).forEach(([campo, msg]) =>
              mostrarError('add', String(campo).toLowerCase(), msg)
            );
          } else {
            mostrarError('add', 'nombre', result.mensaje || 'Error al crear producto');
          }
          return;
        }

        hideModal('modalAgregarProducto');
        toastOK('Producto agregado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('add', 'nombre', 'Error de red o servidor.');
      } finally {
        setLoading(btn, false, 'Agregar Producto');
      }
    });
  }

  // ========== Abrir Modal Editar ==========
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-editar');
    if (!btn || !belongsToProductos(btn)) return;

    const tr = parentDataRowFrom(btn);
    const p = getRowData(tr);
    if (!p || !p.id) return;

    limpiarErrores('edit');
    const idEl = document.getElementById('editarId');
    const nombreEl = document.getElementById('edit-nombre');
    const descripcionEl = document.getElementById('edit-descripcion');
    const precioEl = document.getElementById('edit-precio');
    const stockEl = document.getElementById('edit-stock');
    const categoriaEl = document.getElementById('edit-categoria');
    const imagenEl = document.getElementById('edit-imagen');
    const previewEditEl = document.getElementById('previewEdit');

    if (idEl) idEl.value = p.id;
    if (nombreEl) nombreEl.value = p.nombre || '';
    if (descripcionEl) descripcionEl.value = p.descripcion || '';
    if (precioEl) precioEl.value = p.precio !== '' ? p.precio : '';
    if (stockEl) stockEl.value = p.stock !== '' ? p.stock : '';
    if (categoriaEl) categoriaEl.value = p.categoria || '';
    if (imagenEl) imagenEl.value = '';
    if (previewEditEl) previewEditEl.src = p.imagen || '';

    showModal('modalEditarProducto');
  });

  // ========== Enviar Edición (recarga tras éxito) ==========
  const formEditar = document.getElementById('formEditarProducto');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarErrores('edit');

      const btn = formEditar.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Guardar Cambios', 'Guardando...');

      const id = (document.getElementById('editarId')?.value || '').trim();
      const nombre = (document.getElementById('edit-nombre')?.value || '').trim();
      const descripcion = (document.getElementById('edit-descripcion')?.value || '').trim();
      const precio = (document.getElementById('edit-precio')?.value || '').trim();
      const stock = (document.getElementById('edit-stock')?.value || '').trim();
      const categoria = (document.getElementById('edit-categoria')?.value || '').trim();
      let newImage = document.getElementById('edit-imagen')?.files?.[0];

      const errores = {};
      const eNom = validarNombre(nombre); if (eNom) errores.nombre = eNom;
      const eDes = validarDescripcion(descripcion); if (eDes) errores.descripcion = eDes;
      const ePre = validarPrecioLocal(precio, MAX_PRECIO); if (ePre) errores.precio = ePre;
      const eSto = validarStockLocal(stock); if (eSto) errores.stock = eSto;
      const eCat = validarCategoriaLocal(categoria); if (eCat) errores.categoria = eCat;
      if (newImage) {
        const eImg = validarImagenLocal(newImage, false);
        if (eImg) errores.imagen = eImg;
      }

      if (Object.keys(errores).length) {
        Object.entries(errores).forEach(([campo, msg]) => mostrarError('edit', campo, msg));
        setLoading(btn, false, 'Guardar Cambios');
        return;
      }

      if (newImage) {
        try { newImage = await comprimirImagen(newImage); } catch (_) {}
      }

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio', precio);
      formData.append('stock', stock);
      formData.append('categoria', categoria);
      if (newImage) formData.append('imagen', newImage);

      try {
        const res = await fetch(`/productos/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token || ''}` },
          body: formData
        });
        const result = await parseResponse(res);

        if (!res.ok) {
          if (result.errores) {
            Object.entries(result.errores).forEach(([campo, msg]) =>
              mostrarError('edit', String(campo).toLowerCase(), msg)
            );
          } else {
            mostrarError('edit', 'nombre', result.mensaje || 'Error al actualizar producto');
          }
          return;
        }

        hideModal('modalEditarProducto');
        toastOK('Producto actualizado correctamente.');
      } catch (err) {
        console.error(err);
        mostrarError('edit', 'nombre', 'Error de red o servidor.');
      } finally {
        setLoading(btn, false, 'Guardar Cambios');
      }
    });
  }

  // ========== Eliminar (recarga tras éxito) ==========
  let idEliminarProducto = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar');
    if (!btn || !belongsToProductos(btn)) return;

    const tr = parentDataRowFrom(btn);
    const p = getRowData(tr);
    if (!p || !p.id) return;
    idEliminarProducto = p.id;
    showModal('confirmarEliminacionProductoModal');
  });

  const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminarProducto');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', async () => {
      if (!idEliminarProducto) return;
      try {
        const res = await fetch(`/productos/${idEliminarProducto}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token || ''}` }
        });
        if (!res.ok) {
          console.error('Error al eliminar', res.status);
          return;
        }

        hideModal('confirmarEliminacionProductoModal');
        // Puedes usar una modal específica de eliminación si la tienes, pero
        // para unificar UX usamos la misma de confirmación general:
        toastOK('Producto eliminado exitosamente.');
        idEliminarProducto = null;
      } catch (err) {
        console.error(err);
      }
    });
  }
});