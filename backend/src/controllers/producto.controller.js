const Producto = require('../models/producto.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

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

const tmark = (label) => {
  if (process.env.DEBUG_TIMING) console.time(label);
};
const tend = (label) => {
  if (process.env.DEBUG_TIMING) console.timeEnd(label);
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
    // Transformación básica para reducir peso
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
    res.render('gestionProductos', { productos });
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
    console.time?.('CREATE_TOTAL');
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    let errores = {};

    if (!nombre || nombre.trim().length < 2) {
      errores.nombre = 'Nombre mínimo 2 caracteres';
    } else if (esNombreSoloNumeros(nombre)) {
      errores.nombre = 'El nombre no puede ser solo números; agrega una descripción.';
    }

    if (!descripcion || descripcion.trim().length < 10) {
      errores.descripcion = 'Descripción mínima 10 caracteres';
    }

    const precioParsed = parseNumeroPositivo(precio);
    if (precioParsed.error) {
      errores.precio = `Precio ${precioParsed.error.toLowerCase()}`;
    } else if (precioParsed.value < 0) {
      errores.precio = 'Precio no puede ser negativo';
    }

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

    if (!categoria) {
      errores.categoria = 'Categoría obligatoria';
    } else if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      errores.categoria = 'Categoría inválida';
    }

    if (!req.file) {
      errores.imagen = 'Debes subir una imagen';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    debug('Subiendo imagen nueva...');
    console.time?.('UPLOAD_CREATE');
    const subida = await subirCloudinaryDesdeBuffer(req.file.buffer);
    console.timeEnd?.('UPLOAD_CREATE');
    debug('Subida OK:', subida.public_id);

    console.time?.('MONGO_CREATE');
    const producto = await Producto.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precioParsed.value),
      stock: Number(stockParsed.value),
      categoria,
      imagen: subida.secure_url,
      public_id: subida.public_id
    });
    console.timeEnd?.('MONGO_CREATE');

    console.timeEnd?.('CREATE_TOTAL');
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
  tmark('TOTAL_UPDATE');
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
      if (!CATEGORIAS_VALIDAS.includes(updateData.categoria)) {
        errores.categoria = 'Categoría inválida';
      }
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    let oldPublicId = producto.public_id;
    let replacingImage = false;

    if (req.file) {
      try {
        replacingImage = true;
        debug('Subiendo nueva imagen...');
        tmark('UPLOAD_NEW');
        const nueva = await subirCloudinaryDesdeBuffer(req.file.buffer);
        tend('UPLOAD_NEW');
        debug('Nueva subida OK:', nueva.public_id);
        updateData.imagen = nueva.secure_url;
        updateData.public_id = nueva.public_id;
      } catch (e) {
        console.error('Error al subir nueva imagen:', e);
        return res.status(500).json({ errores: { imagen: 'Error al subir la nueva imagen' } });
      }
    }

    tmark('MONGO_UPDATE');
    const actualizado = await Producto.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    tend('MONGO_UPDATE');

    // Responder rápido al cliente
    res.json(actualizado);

    // Limpieza asíncrona (no retrasa al usuario)
    if (replacingImage) {
      setImmediate(async () => {
        let pidEliminar = oldPublicId;
        if (!pidEliminar && producto.imagen) {
          pidEliminar = extractPublicIdFromUrl(producto.imagen);
        }
        if (pidEliminar) {
          try {
            tmark('DESTROY_OLD');
            await cloudinary.uploader.destroy(pidEliminar);
            tend('DESTROY_OLD');
            debug('Imagen anterior eliminada async:', pidEliminar);
          } catch (e) {
            console.warn('No se pudo eliminar imagen anterior (async):', pidEliminar, e.message);
          }
        }
      });
    }

    tend('TOTAL_UPDATE');
  } catch (err) {
    tend('TOTAL_UPDATE');
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

    let pid = producto.public_id;
    if (!pid && producto.imagen) {
      pid = extractPublicIdFromUrl(producto.imagen);
    }

    if (pid) {
      // No hace falta esperar; pero aquí sí esperamos para asegurar limpieza
      try {
        tmark('DESTROY_DELETE');
        await cloudinary.uploader.destroy(pid);
        tend('DESTROY_DELETE');
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