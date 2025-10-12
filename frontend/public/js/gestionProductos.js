// Gestión de Productos (solo UX sin recargar, manteniendo tus validaciones y compresión)

$(document).ready(function () {
  const token = localStorage.getItem('token');

  // Tope de precio local (ajústalo si necesitas: 3'000.000 COP)
  const MAX_PRECIO = 3000000;
  const CATEGORIAS_VALIDAS = ['accesorios', 'ropa', 'juguetes', 'alimentos', 'higiene'];

  /* ========== DataTable Inicial ========== */
  let table = null;
  if ($('#tablaProductos').length) {
    if ($.fn.DataTable.isDataTable('#tablaProductos')) {
      table = $('#tablaProductos').DataTable();
    } else {
      table = $('#tablaProductos').DataTable({
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

  /* ========== Cache en memoria (fuente única de verdad) ========== */
  const productoCache = {};
  window.__productoCache = productoCache; // debug

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
    $('#tablaProductos tbody tr').each(function () {
      const $tr = $(this);
      const id = $tr.data('id');
      if (!id) return;
      if (!productoCache[id] || overwrite) {
        productoCache[id] = {
          _id: id,
          nombre: $tr.data('nombre'),
          descripcion: $tr.data('descripcion'),
          imagen: $tr.data('imagen'),
          precio: Number($tr.data('precio')),
          stock: Number($tr.data('stock')),
          categoria: $tr.data('categoria'),
          fechaRegistro: $tr.data('fecha') || ''
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
  buildCacheFromDOM();
  if (table) table.on('draw', () => buildCacheFromDOM(false));

  // Localizar fila por data-id (robusto con responsive/paginación)
  function getDTIndexById(id) {
    if (!table) return null;
    const idx = table.rows((i, data, node) => $(node).attr('data-id') === id).indexes();
    return idx.length ? idx[0] : null;
  }
  // Actualiza la fila en DataTable y los atributos del <tr>
  function updateRowUI(prod) {
    const id = prod._id;
    const rowIdx = getDTIndexById(id);
    if (rowIdx !== null) {
      const r = table.row(rowIdx);
      r.data([
        prod.nombre,
        Number(prod.stock),
        `$ ${Number(prod.precio).toFixed(2)}`,
        buildActionButtonsHTML(id)
      ]).invalidate().draw(false);

      const node = $(r.node());
      node
        .attr('data-id', id)
        .attr('data-nombre', prod.nombre)
        .attr('data-descripcion', prod.descripcion)
        .attr('data-imagen', prod.imagen || '')
        .attr('data-precio', Number(prod.precio))
        .attr('data-stock', Number(prod.stock))
        .attr('data-categoria', prod.categoria)
        .attr('data-fecha', prod.fechaRegistro || '');
    } else {
      // Fallback DOM
      const $tr = $(`#tablaProductos tbody tr[data-id="${id}"]`);
      if ($tr.length) {
        $tr.find('td:eq(0)').text(prod.nombre);
        $tr.find('td:eq(1)').text(Number(prod.stock));
        $tr.find('td:eq(2)').html(`$ ${Number(prod.precio).toFixed(2)}`);
        $tr
          .attr('data-nombre', prod.nombre)
          .attr('data-descripcion', prod.descripcion)
          .attr('data-imagen', prod.imagen || '')
          .attr('data-precio', Number(prod.precio))
          .attr('data-stock', Number(prod.stock))
          .attr('data-categoria', prod.categoria)
          .attr('data-fecha', prod.fechaRegistro || '');
      }
    }
  }
  function updateCacheAndRow(prod) {
    const p = {
      _id: prod._id,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      imagen: prod.imagen,
      precio: Number(prod.precio),
      stock: Number(prod.stock),
      categoria: prod.categoria,
      fechaRegistro: prod.fechaRegistro || productoCache[prod._id]?.fechaRegistro || ''
    };
    productoCache[p._id] = p;
    updateRowUI(p);
  }
  function addRowToTable(prod) {
    const p = {
      _id: prod._id,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      imagen: prod.imagen,
      precio: Number(prod.precio),
      stock: Number(prod.stock),
      categoria: prod.categoria,
      fechaRegistro: prod.fechaRegistro || ''
    };
    productoCache[p._id] = p;

    const node = table.row.add([
      p.nombre,
      Number(p.stock),
      `$ ${Number(p.precio).toFixed(2)}`,
      buildActionButtonsHTML(p._id)
    ]).draw(false).node();

    $(node)
      .attr('data-id', p._id)
      .attr('data-nombre', p.nombre)
      .attr('data-descripcion', p.descripcion)
      .attr('data-imagen', p.imagen || '')
      .attr('data-precio', Number(p.precio))
      .attr('data-stock', Number(p.stock))
      .attr('data-categoria', p.categoria)
      .attr('data-fecha', p.fechaRegistro || '');
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

  /* ========== Validadores/Compresión (TUS funciones, sin cambios) ========== */
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
      } catch (err) { resolve(file); }
    });
  }

  /* ========== Parseo Seguro de Respuesta / Loader ========== */
  async function parseResponse(res) {
    let raw;
    try { raw = await res.text(); } catch { return {}; }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
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
      if (file) previewEdit.src = URL.createObjectURL(file);
    });
  }

  /* ========== Abrir Modal Ver (usa cache) ========== */
  $(document).on('click', '.btn-ver', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    const p = productoCache[id];
    if (!id || !p) { console.warn('Producto no en cache al Ver:', id); return; }
    $('#verNombre').text(p.nombre);
    $('#verDescripcion').text(p.descripcion);
    $('#verPrecio').text(Number(p.precio).toFixed(2));
    $('#verStock').text(p.stock);
    $('#verCategoria').text(p.categoria);
    $('#verImagen').attr('src', p.imagen || '');
    if (p.fechaRegistro) {
      const fechaObj = new Date(p.fechaRegistro);
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
    if (previewAdd) {
      previewAdd.classList.add('d-none');
      previewAdd.src = '';
    }
  });

  /* ========== Enviar Agregar (SIN recargar) ========== */
  $('#formAgregarProducto').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('add');

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Agregar Producto', 'Subiendo...');

    const nombre = $('#add-nombre').val().trim();
    const descripcion = $('#add-descripcion').val().trim();
    const precio = $('#add-precio').val().trim();
    const stock = $('#add-stock').val().trim();
    const categoria = $('#add-categoria').val();
    let imagenFile = $('#add-imagen')[0].files[0];

    // Validaciones locales (TUS reglas)
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

    // Compresión (TUS reglas)
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
          Object.entries(result.errores).forEach(([campo, msg]) => mostrarError('add', campo.toLowerCase(), msg));
        } else {
          mostrarError('add', 'nombre', result.mensaje || 'Error al crear producto');
        }
        setLoading(btn, false, 'Agregar Producto');
        return;
      }

      const nuevo = result.producto || result;
      addRowToTable(nuevo);

      $('#modalAgregarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto agregado correctamente.');
      const m = new bootstrap.Modal(document.getElementById('confirmacionProductoModal'));
      m.show();
      setTimeout(() => m.hide(), 1200);
    } catch (err) {
      console.error(err);
      mostrarError('add', 'nombre', 'Error de red o servidor.');
    } finally {
      setLoading(btn, false, 'Agregar Producto');
    }
  });

  /* ========== Abrir Modal Editar (usa cache) ========== */
  $(document).on('click', '.btn-editar', function () {
    const id = $(this).data('id') || parentDataRowFrom(this).data('id');
    const p = productoCache[id];
    if (!id || !p) return;
    limpiarErrores('edit');
    $('#editarId').val(p._id);
    $('#edit-nombre').val(p.nombre);
    $('#edit-descripcion').val(p.descripcion);
    $('#edit-precio').val(p.precio);
    $('#edit-stock').val(p.stock);
    $('#edit-categoria').val(p.categoria);
    $('#edit-imagen').val('');
    $('#previewEdit').attr('src', p.imagen || '');
    $('#modalEditarProducto').modal('show');
  });

  /* ========== Enviar Edición (SIN recargar) ========== */
  $('#formEditarProducto').on('submit', async function (e) {
    e.preventDefault();
    limpiarErrores('edit');

    const btn = this.querySelector('button[type="submit"]');
    setLoading(btn, true, 'Guardar Cambios', 'Guardando...');

    const id = $('#editarId').val();
    const nombre = $('#edit-nombre').val().trim();
    const descripcion = $('#edit-descripcion').val().trim();
    const precio = $('#edit-precio').val().trim();
    const stock = $('#edit-stock').val().trim();
    const categoria = $('#edit-categoria').val();
    let newImage = $('#edit-imagen')[0].files[0];

    // Validaciones locales (TUS reglas)
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

    // Compresión (TUS reglas)
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
          Object.entries(result.errores).forEach(([campo, msg]) => mostrarError('edit', campo.toLowerCase(), msg));
        } else {
          mostrarError('edit', 'nombre', result.mensaje || 'Error al actualizar producto');
        }
        setLoading(btn, false, 'Guardar Cambios');
        return;
      }

      const backend = result.producto || result;
      const actualizado = {
        _id: backend._id || id,
        nombre: backend.nombre ?? nombre,
        descripcion: backend.descripcion ?? descripcion,
        imagen: backend.imagen !== undefined ? backend.imagen : productoCache[id]?.imagen || '',
        precio: backend.precio !== undefined ? backend.precio : Number(precio),
        stock: backend.stock !== undefined ? backend.stock : Number(stock),
        categoria: backend.categoria ?? categoria,
        fechaRegistro: backend.fechaRegistro || productoCache[id]?.fechaRegistro || ''
      };

      updateCacheAndRow(actualizado);

      $('#modalEditarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto actualizado correctamente.');
      const m = new bootstrap.Modal(document.getElementById('confirmacionProductoModal'));
      m.show();
      setTimeout(() => m.hide(), 1200);
    } catch (err) {
      console.error(err);
      mostrarError('edit', 'nombre', 'Error de red o servidor.');
    } finally {
      setLoading(btn, false, 'Guardar Cambios');
    }
  });

  /* ========== Eliminar Producto (SIN recargar) ========== */
  let idEliminarProducto = null;
  $(document).on('click', '.btn-eliminar', function () {
    idEliminarProducto = $(this).data('id') || parentDataRowFrom(this).data('id');
    $('#confirmarEliminacionProductoModal').modal('show');
  });

  $('#btnConfirmarEliminarProducto').on('click', async function () {
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

      delete productoCache[idEliminarProducto];
      const idx = getDTIndexById(idEliminarProducto);
      if (idx !== null) table.row(idx).remove().draw(false);

      $('#confirmarEliminacionProductoModal').modal('hide');
      const m = new bootstrap.Modal(document.getElementById('eliminacionProductoExitosaModal'));
      m.show();
      setTimeout(() => m.hide(), 1200);
      idEliminarProducto = null;
    } catch (err) {
      console.error(err);
    }
  });

});