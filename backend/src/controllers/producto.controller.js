const Producto = require('../models/producto.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Multer en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadImagen = upload.single('imagen');

// Helper subir a Cloudinary
const subirCloudinaryDesdeBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'productos' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Normaliza y valida números
function parseNumeroPositivo(value) {
  if (value === undefined || value === null || value === '') return { error: 'Valor requerido' };
  if (typeof value === 'string' && value.trim() === '') return { error: 'Valor requerido' };
  const num = Number(value);
  if (!Number.isFinite(num)) return { error: 'Debe ser numérico' };
  return { value: num };
}

// =================== Renderizar Vista ===================
exports.renderizarGestionProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.render('gestionProductos', { productos });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error al obtener productos');
  }
};

// =================== Obtener Productos API ===================
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.status(200).json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: err.message });
  }
};

// =================== Crear Producto ===================
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    let errores = {};

    // Nombre
    if (!nombre || nombre.trim().length < 2) {
      errores.nombre = 'Nombre mínimo 2 caracteres';
    } else if (/^[0-9]+$/.test(nombre.trim())) {
      errores.nombre = 'El nombre no puede ser solo números; agrega una descripción.';
      // Alternativa: errores.nombre = 'Debe contener letras, no puede ser solo números.';
    }

    // Descripción
    if (!descripcion || descripcion.trim().length < 10) {
      errores.descripcion = 'Descripción mínima 10 caracteres';
    }

    // Precio
    const precioParsed = parseNumeroPositivo(precio);
    if (precioParsed.error) {
      errores.precio = `Precio ${precioParsed.error.toLowerCase()}`;
    } else if (precioParsed.value < 0) {
      errores.precio = 'Precio no puede ser negativo';
    }

    // Stock
    const stockParsed = parseNumeroPositivo(stock);
    if (stockParsed.error) {
      errores.stock = `Stock ${stockParsed.error.toLowerCase()}`;
    } else if (!Number.isInteger(stockParsed.value)) {
      errores.stock = 'Stock debe ser un número entero';
    } else if (stockParsed.value < 0) {
      errores.stock = 'Stock no puede ser negativo';
    } else if (stockParsed.value > 1000) {
      errores.stock = 'Stock no puede superar 1000 unidades';
    }

    // Categoría
    if (!categoria) {
      errores.categoria = 'Categoría obligatoria';
    } else if (!['accesorios', 'ropa', 'juguetes', 'alimentos'].includes(categoria)) {
      errores.categoria = 'Categoría inválida';
    }

    // Imagen
    if (!req.file) {
      errores.imagen = 'Debes subir una imagen';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Subir imagen
    const resultado = await subirCloudinaryDesdeBuffer(req.file.buffer);

    const producto = await Producto.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precioParsed.value),
      stock: Number(stockParsed.value),
      categoria,
      imagen: resultado.secure_url,
      public_id: resultado.public_id
    });

    res.status(201).json(producto);
  } catch (err) {
    console.error('ERROR CREAR PRODUCTO:', err);
    // Intentar mapear errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) {
        errores[campo] = err.errors[campo].message;
      }
      return res.status(400).json({ errores });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ errores: { [err.path]: 'Formato inválido' } });
    }
    res.status(500).json({ mensaje: 'Error al crear producto', error: err.message });
  }
};

// =================== Actualizar Producto ===================
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    let errores = {};

    // Validaciones parciales
    if (updateData.nombre !== undefined) {
      if (updateData.nombre.trim().length < 2) {
        errores.nombre = 'Nombre mínimo 2 caracteres';
      } else if (/^[0-9]+$/.test(updateData.nombre.trim())) {
        errores.nombre = 'El nombre no puede ser solo números; agrega una descripción.';
      }
    }

    if (updateData.descripcion !== undefined) {
      if (updateData.descripcion.trim().length < 10) {
        errores.descripcion = 'Descripción mínima 10 caracteres';
      }
    }

    if (updateData.precio !== undefined) {
      const precioParsed = parseNumeroPositivo(updateData.precio);
      if (precioParsed.error) {
        errores.precio = `Precio ${precioParsed.error.toLowerCase()}`;
      } else if (precioParsed.value < 0) {
        errores.precio = 'Precio no puede ser negativo';
      } else {
        updateData.precio = precioParsed.value;
      }
    }

    if (updateData.stock !== undefined) {
      const stockParsed = parseNumeroPositivo(updateData.stock);
      if (stockParsed.error) {
        errores.stock = `Stock ${stockParsed.error.toLowerCase()}`;
      } else if (!Number.isInteger(stockParsed.value)) {
        errores.stock = 'Stock debe ser un número entero';
      } else if (stockParsed.value < 0) {
        errores.stock = 'Stock no puede ser negativo';
      } else if (stockParsed.value > 1000) {
        errores.stock = 'Stock no puede superar 1000 unidades';
      } else {
        updateData.stock = stockParsed.value;
      }
    }

    if (updateData.categoria !== undefined) {
      if (!['accesorios', 'ropa', 'juguetes', 'alimentos'].includes(updateData.categoria)) {
        errores.categoria = 'Categoría inválida';
      }
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Imagen nueva
    if (req.file) {
      if (producto.public_id) {
        await cloudinary.uploader.destroy(producto.public_id);
      }
      const resultado = await subirCloudinaryDesdeBuffer(req.file.buffer);
      updateData.imagen = resultado.secure_url;
      updateData.public_id = resultado.public_id;
    }

    if (updateData.nombre) updateData.nombre = updateData.nombre.trim();
    if (updateData.descripcion) updateData.descripcion = updateData.descripcion.trim();

    const actualizado = await Producto.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(actualizado);
  } catch (err) {
    console.error('ERROR ACTUALIZAR PRODUCTO:', err);
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) {
        errores[campo] = err.errors[campo].message;
      }
      return res.status(400).json({ errores });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ errores: { [err.path]: 'Formato inválido' } });
    }
    res.status(500).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};

// =================== Eliminar Producto ===================
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndDelete(id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    if (producto.public_id) {
      await cloudinary.uploader.destroy(producto.public_id);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.sendStatus(500);
  }
};

// =================== Productos Aleatorios ===================
exports.obtenerProductosAleatorios = async (req, res) => {
  try {
    const { cantidad = 3 } = req.query;
    const productos = await Producto.aggregate([{ $sample: { size: parseInt(cantidad) } }]);
    res.status(200).json(productos);
  } catch (err) {
    console.error('Error al obtener productos aleatorios:', err);
    res.status(500).json({ mensaje: 'Error al obtener productos aleatorios', error: err.message });
  }
};

// =================== Productos con Filtros ===================
exports.obtenerProductosConFiltros = async (req, res) => {
  try {
    const { categoria, busqueda, pagina = 1, limite = 9 } = req.query;
    let filtros = {};

    if (categoria && categoria !== 'todas') {
      filtros.categoria = categoria;
    }
    if (busqueda) {
      filtros.nombre = { $regex: busqueda, $options: 'i' };
    }

    const saltar = (parseInt(pagina) - 1) * parseInt(limite);
    const productos = await Producto.find(filtros)
      .sort({ fechaRegistro: -1 })
      .skip(saltar)
      .limit(parseInt(limite));

    const totalProductos = await Producto.countDocuments(filtros);
    const totalPaginas = Math.ceil(totalProductos / parseInt(limite));
    const paginaActual = parseInt(pagina);

    res.status(200).json({
      productos,
      paginacion: {
        paginaActual,
        totalPaginas,
        totalProductos,
        limite: parseInt(limite),
        tienePaginaAnterior: paginaActual > 1,
        tienePaginaSiguiente: paginaActual < totalPaginas,
        paginaAnterior: paginaActual > 1 ? paginaActual - 1 : null,
        paginaSiguiente: paginaActual < totalPaginas ? paginaActual + 1 : null
      }
    });
  } catch (err) {
    console.error('Error al obtener productos con filtros:', err);
    res.status(500).json({ mensaje: 'Error al obtener productos con filtros', error: err.message });
  }
};