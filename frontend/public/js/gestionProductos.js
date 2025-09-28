$(document).ready(function () {
  const token = localStorage.getItem('token');

  // Tope de precio local (ajústalo si necesitas: 3'000.000 COP)
  const MAX_PRECIO = 3000000;
  const CATEGORIAS_VALIDAS = ['accesorios', 'ropa', 'juguetes', 'alimentos'];

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

  /* ========== Validadores Locales (no retornan temprano, recolectan todo) ========== */
  function esSoloNumeros(str) {
    return /^[0-9]+$/.test((str || '').trim());
  }

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
    if (!file) {
      return requerida ? 'Debes subir una imagen' : null;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    const tipos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tipos.includes(file.type)) return 'Formato no permitido (solo JPG, PNG, WEBP o GIF)';
    if (file.size > maxSize) return 'La imagen supera los 5MB';
    return null;
  }

  /* ========== Compresión Cliente (opcional) ========== */
  async function comprimirImagen(file, maxW = 1200, maxH = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('No se pudo comprimir'));
            const nuevo = new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(nuevo);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /* ========== Parseo Seguro de Respuesta ========== */
  async function parseResponse(res) {
    let raw;
    try { raw = await res.text(); } catch { return {}; }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  /* ========== Estado Botones (loader) ========== */
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
    if (previewAdd) {
      previewAdd.classList.add('d-none');
      previewAdd.src = '';
    }
  });

  /* ========== Enviar Agregar (con validación agregada y reload) ========== */
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

    // Validaciones locales (recolectar todas)
    const errores = {};
    const eNom = validarNombre(nombre); if (eNom) errores.nombre = eNom;
    const eDes = validarDescripcion(descripcion); if (eDes) errores.descripcion = eDes;
    const ePre = validarPrecioLocal(precio, MAX_PRECIO); if (ePre) errores.precio = ePre;
    const eSto = validarStockLocal(stock); if (eSto) errores.stock = eSto;
    const eCat = validarCategoriaLocal(categoria); if (eCat) errores.categoria = eCat;
    const eImg = validarImagenLocal(imagenFile, true); if (eImg) errores.imagen = eImg;

    if (Object.keys(errores).length > 0) {
      Object.entries(errores).forEach(([campo, msg]) => mostrarError('add', campo, msg));
      setLoading(btn, false, 'Agregar Producto');
      return;
    }

    // Compresión (solo si pasó validación)
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

      $('#modalAgregarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto agregado correctamente.');
      new bootstrap.Modal(document.getElementById('confirmacionProductoModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('add', 'nombre', 'Error de red o servidor.');
    } finally {
      setLoading(btn, false, 'Agregar Producto');
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
    $('#edit-imagen').val('');
    $('#previewEdit').attr('src', fila.data('imagen'));
    $('#modalEditarProducto').modal('show');
  });

  /* ========== Enviar Edición (con validación agregada y reload) ========== */
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

    // Validaciones locales (recolectar todas)
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

    if (Object.keys(errores).length > 0) {
      Object.entries(errores).forEach(([campo, msg]) => mostrarError('edit', campo, msg));
      setLoading(btn, false, 'Guardar Cambios');
      return;
    }

    // Compresión (solo si pasó validación)
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

      $('#modalEditarProducto').modal('hide');
      $('#mensajeExitoProducto').text('Producto actualizado correctamente.');
      new bootstrap.Modal(document.getElementById('confirmacionProductoModal')).show();
      setTimeout(() => location.reload(), 1200);

    } catch (err) {
      console.error(err);
      mostrarError('edit', 'nombre', 'Error de red o servidor.');
    } finally {
      setLoading(btn, false, 'Guardar Cambios');
    }
  });

  /* ========== Eliminar Producto (con reload) ========== */
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
        headers: { 'Authorization': `Bearer ${token || ''}` }
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