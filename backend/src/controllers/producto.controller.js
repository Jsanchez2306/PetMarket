const Producto = require('../models/producto.model');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

// Multer en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadImagen = upload.single('imagen');

// Función para subir a Cloudinary desde buffer
const subirCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'productos' }, (err, result) => {
      if (result) resolve(result);
      else reject(err);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Renderizar vista
exports.renderizarGestionProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.render('gestionProductos', { productos });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error al obtener productos');
  }
};

// Obtener productos API
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.status(200).json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: err.message });
  }
};

// Crear nuevo producto
exports.crearProducto = async (req, res) => {
  try {
    console.log('--- NUEVO PRODUCTO ---');
    console.log('BODY recibido:', req.body);
    console.log('FILE recibido:', req.file);

    const { nombre, descripcion, precio, stock, categoria } = req.body;
    let errores = {};

    if (!nombre || nombre.trim().length < 2) errores.nombre = 'Nombre mínimo 2 caracteres';
    if (!descripcion || descripcion.trim().length < 10) errores.descripcion = 'Descripción mínima 10 caracteres';
    if (!precio || precio < 0) errores.precio = 'Precio obligatorio y no negativo';
    if (!stock || stock < 0) errores.stock = 'Stock obligatorio y no negativo';
    if (!categoria) errores.categoria = 'Categoría obligatoria';
    if (!req.file) errores.imagen = 'Debes subir una imagen';

    if (Object.keys(errores).length > 0) {
      console.log('Errores de validación:', errores);
      return res.status(400).json({ errores });
    }

    // Subir imagen
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'productos' },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    console.log('Resultado Cloudinary:', resultado);

    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen: resultado.secure_url,
      public_id: resultado.public_id
    });

    console.log('Producto creado:', producto);
    res.status(201).json(producto);

  } catch (err) {
    console.error('ERROR CREAR PRODUCTO:', err);
    res.status(500).json({ mensaje: 'Error al crear producto', error: err.message });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('--- ACTUALIZAR PRODUCTO ---');
    console.log('ID:', id);
    console.log('BODY recibido:', req.body);
    console.log('FILE recibido:', req.file);

    const updateData = { ...req.body };
    let errores = {};

    if (updateData.nombre && updateData.nombre.trim().length < 2)
      errores.nombre = 'Nombre mínimo 2 caracteres';
    if (updateData.descripcion && updateData.descripcion.trim().length < 10)
      errores.descripcion = 'Descripción mínima 10 caracteres';
    if (updateData.precio != null && updateData.precio < 0)
      errores.precio = 'Precio no puede ser negativo';
    if (updateData.stock != null && updateData.stock < 0)
      errores.stock = 'Stock no puede ser negativo';

    const categoriasValidas = ["accesorios", "ropa", "juguetes", "alimentos"];
    if (updateData.categoria && !categoriasValidas.includes(updateData.categoria))
      errores.categoria = 'Categoría inválida';

    if (Object.keys(errores).length > 0) {
      console.log('Errores de validación:', errores);
      return res.status(400).json({ errores });
    }

    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    if (req.file) {
      console.log('Subiendo nueva imagen...');
      if (producto.public_id) {
        console.log('Borrando imagen anterior de Cloudinary:', producto.public_id);
        await cloudinary.uploader.destroy(producto.public_id);
      }
      const resultado = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'productos' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      console.log('Resultado Cloudinary:', resultado);
      updateData.imagen = resultado.secure_url;
      updateData.public_id = resultado.public_id;
    }

    const actualizado = await Producto.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    console.log('Producto actualizado:', actualizado);
    res.json(actualizado);

  } catch (err) {
    console.error('ERROR ACTUALIZAR PRODUCTO:', err);
    res.status(500).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};


// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndDelete(id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    if (producto.public_id) await cloudinary.uploader.destroy(producto.public_id);

    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.sendStatus(500);
  }
};
