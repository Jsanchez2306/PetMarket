const Producto = require('../models/producto.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Tope configurable (por defecto 3’000.000 COP si no hay .env)
const MAX_PRECIO = Number(process.env.MAX_PRECIO_COP) || 3000000;

// ================== Config Multer ==================
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido (solo jpg, png, webp, gif)'), false);
    }
    cb(null, true);
  }
});
exports.uploadImagen = upload.single('imagen');

// ================== Helpers ==================
const debug = (...args) => {
  if (process.env.DEBUG_CLOUDINARY) console.log('[CLOUDINARY]', ...args);
};

function parseNumeroPositivo(value) {
  if (value === undefined || value === null || value === '') return { error: 'Valor requerido' };
  if (typeof value === 'string' && value.trim() === '') return { error: 'Valor requerido' };
  const num = Number(value);
  if (!Number.isFinite(num)) return { error: 'Debe ser numérico' };
  return { value: num };
}

function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const regex = /\/upload\/v\d+\/([^.#?]+)(?:\.[a-z0-9]+)(?:[?#].*)?$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function esNombreSoloNumeros(nombre) {
  return /^[0-9]+$/.test((nombre || '').trim());
}

async function subirCloudinaryDesdeBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'productos',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

const CATEGORIAS_VALIDAS = ['accesorios', 'ropa', 'juguetes', 'alimentos'];

// =================== Renderizar Vista ===================
exports.renderizarGestionProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ fechaRegistro: -1 });
    // Pasamos el tope a la vista
    res.render('gestionProductos', { productos, maxPrecio: MAX_PRECIO });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error al obtener productos');
  }
};

// =================== Obtener Productos API ===================
exports.obtenerProductos = async (_req, res) => {
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
    } else if (esNombreSoloNumeros(nombre)) {
      errores.nombre = 'El nombre no puede ser solo números; agrega una descripción.';
    }

    // Descripción
    if (!descripcion || descripcion.trim().length < 10) {
      errores.descripcion = 'Descripción mínima 10 caracteres';
    }

    // Precio con tope
    const precioParsed = parseNumeroPositivo(precio);
    if (precioParsed.error) {
      errores.precio = `Precio ${precioParsed.error.toLowerCase()}`;
    } else if (precioParsed.value < 0) {
      errores.precio = 'Precio no puede ser negativo';
    } else if (precioParsed.value > MAX_PRECIO) {
      errores.precio = `El precio no puede exceder ${MAX_PRECIO.toLocaleString('es-CO')}`;
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
    } else if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      errores.categoria = 'Categoría inválida';
    }

    // Imagen requerida
    if (!req.file) {
      errores.imagen = 'Debes subir una imagen';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    const subida = await subirCloudinaryDesdeBuffer(req.file.buffer);

    const producto = await Producto.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precioParsed.value),
      stock: Number(stockParsed.value),
      categoria,
      imagen: subida.secure_url,
      public_id: subida.public_id
    });

    res.status(201).json(producto);
  } catch (err) {
    console.error('ERROR CREAR PRODUCTO:', err);
    if (err.message && err.message.includes('Formato no permitido')) {
      return res.status(400).json({ errores: { imagen: err.message } });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ errores: { imagen: 'Imagen supera 5MB' } });
    }
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) {
        errores[campo] = err.errors[campo].message;
      }
      return res.status(400).json({ errores });
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

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Validaciones parciales
    if (updateData.nombre !== undefined) {
      if (updateData.nombre.trim().length < 2) {
        errores.nombre = 'Nombre mínimo 2 caracteres';
      } else if (esNombreSoloNumeros(updateData.nombre)) {
        errores.nombre = 'El nombre no puede ser solo números; agrega una descripción.';
      } else {
        updateData.nombre = updateData.nombre.trim();
      }
    }

    if (updateData.descripcion !== undefined) {
      if (updateData.descripcion.trim().length < 10) {
        errores.descripcion = 'Descripción mínima 10 caracteres';
      } else {
        updateData.descripcion = updateData.descripcion.trim();
      }
    }

    // Precio con tope
    if (updateData.precio !== undefined) {
      const precioParsed = parseNumeroPositivo(updateData.precio);
      if (precioParsed.error) {
        errores.precio = `Precio ${precioParsed.error.toLowerCase()}`;
      } else if (precioParsed.value < 0) {
        errores.precio = 'Precio no puede ser negativo';
      } else if (precioParsed.value > MAX_PRECIO) {
        errores.precio = `El precio no puede exceder ${MAX_PRECIO.toLocaleString('es-CO')}`;
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
      if (!CATEGORIAS_VALIDAS.includes(updateData.categoria)) {
        errores.categoria = 'Categoría inválida';
      }
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Imagen nueva (si se envió)
    let oldPublicId = producto.public_id;
    if (req.file) {
      const nueva = await subirCloudinaryDesdeBuffer(req.file.buffer);
      updateData.imagen = nueva.secure_url;
      updateData.public_id = nueva.public_id;

      // Responder rápido
      const actualizado = await Producto.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      res.json(actualizado);

      // Borrado async de la vieja
      setImmediate(async () => {
        let pidEliminar = oldPublicId || extractPublicIdFromUrl(producto.imagen);
        if (pidEliminar) {
          try {
            await cloudinary.uploader.destroy(pidEliminar);
            debug('Imagen anterior eliminada async:', pidEliminar);
          } catch (e) {
            console.warn('No se pudo eliminar imagen anterior (async):', pidEliminar, e.message);
          }
        }
      });
      return;
    }

    // Sin imagen
    const actualizado = await Producto.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.json(actualizado);
  } catch (err) {
    console.error('ERROR ACTUALIZAR PRODUCTO:', err);
    if (err.message && err.message.includes('Formato no permitido')) {
      return res.status(400).json({ errores: { imagen: err.message } });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ errores: { imagen: 'Imagen supera 5MB' } });
    }
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) {
        errores[campo] = err.errors[campo].message;
      }
      return res.status(400).json({ errores });
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

    let pid = producto.public_id || extractPublicIdFromUrl(producto.imagen);
    if (pid) {
      try {
        await cloudinary.uploader.destroy(pid);
        debug('Imagen eliminada en Cloudinary:', pid);
      } catch (e) {
        console.warn('No se pudo eliminar imagen en Cloudinary:', pid, e.message);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.sendStatus(500);
  }
};

// =================== Aleatorios y Filtros (igual) ===================
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

exports.obtenerProductosConFiltros = async (req, res) => {
  try {
    const { categoria, busqueda, pagina = 1, limite = 9 } = req.query;
    let filtros = {};
    if (categoria && categoria !== 'todas') filtros.categoria = categoria;
    if (busqueda) filtros.nombre = { $regex: busqueda, $options: 'i' };

    const saltar = (parseInt(pagina) - 1) * parseInt(limite);
    const productos = await Producto.find(filtros).sort({ fechaRegistro: -1 }).skip(saltar).limit(parseInt(limite));
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