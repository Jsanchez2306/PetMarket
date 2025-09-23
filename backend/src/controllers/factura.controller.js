const Factura = require('../models/factura.model');
const Cliente = require('../models/cliente.model');
const Producto = require('../models/producto.model');

/**
 * Renderiza la página de crear factura (vista EJS)
 */
exports.renderizarCrearFactura = async (req, res) => {
  try {
    // Obtener información del usuario de la sesión
    const usuario = req.session?.user || null;
    const tipoUsuario = usuario?.tipoUsuario || null;
    const esEmpleado = tipoUsuario === 'empleado';
    const esCliente = tipoUsuario === 'cliente';
    const esAdmin = usuario?.rol === 'admin';

    res.render('crearFactura', {
      usuario,
      tipoUsuario,
      esEmpleado,
      esCliente,
      esAdmin
    });
  } catch (error) {
    console.error('Error al renderizar crear factura:', error);
    res.status(500).send('Error al cargar la página de crear factura');
  }
};

/**
 * Renderiza la gestión de facturas (vista EJS)
 */
exports.renderizarGestionFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find();
    
    // Obtener información del usuario de la sesión
    const usuario = req.session?.user || null;
    const tipoUsuario = usuario?.tipoUsuario || null;
    const esEmpleado = tipoUsuario === 'empleado';
    const esCliente = tipoUsuario === 'cliente';
    const esAdmin = usuario?.rol === 'admin';

    res.render('gestionFacturas', { 
      facturas,
      usuario,
      tipoUsuario,
      esEmpleado,
      esCliente,
      esAdmin
    });
  } catch (err) {
    console.error('Error al obtener facturas para la vista:', err);
    res.status(500).send('Error al obtener facturas');
  }
};

/**
 * Crear una nueva factura manual (empleados)
 */
exports.crearFactura = async (req, res) => {
  try {
    const { cliente, productos, metodoPago, observaciones } = req.body;
    const empleadoId = req.user.id; // Obtenido del middleware de autenticación

    if (!cliente || !productos || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Cliente y productos son requeridos' });
    }

    // Verificar que el cliente existe
    const clienteExiste = await Cliente.findById(cliente.id || cliente._id);
    if (!clienteExiste) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Verificar productos y calcular totales
    let subtotal = 0;
    const productosFactura = [];

    for (const item of productos) {
      const producto = await Producto.findById(item.id);
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}` 
        });
      }

      const subtotalProducto = producto.precio * item.cantidad;
      subtotal += subtotalProducto;

      productosFactura.push({
        producto: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        subtotal: subtotalProducto
      });

      // Actualizar stock del producto
      producto.stock -= item.cantidad;
      await producto.save();
    }

    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // Crear la factura
    const nuevaFactura = new Factura({
      cliente: clienteExiste._id,
      nombreCliente: clienteExiste.nombre,
      emailCliente: clienteExiste.email,
      productos: productosFactura,
      subtotal: subtotal,
      iva: iva,
      total: total,
      metodoPago: metodoPago || 'efectivo',
      observaciones: observaciones || '',
      empleado: empleadoId,
      fecha: new Date(),
      estado: 'pagada'
    });

    const facturaGuardada = await nuevaFactura.save();

    res.status(201).json({ 
      mensaje: 'Factura creada exitosamente', 
      factura: facturaGuardada 
    });

    console.log('✅ Factura creada:', facturaGuardada._id, '- Total:', total);
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ mensaje: 'Error al crear factura', error: error.message });
  }
};

/**
 * Obtener todas las facturas (API)
 */
exports.obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate('cliente', 'nombre email')
      .populate('empleado', 'nombre email')
      .sort({ fecha: -1 });

    res.status(200).json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas (API):', error);
    res.status(500).json({ mensaje: 'Error al obtener las facturas', error: error.message });
  }
};

/**
 * Obtener una factura por ID
 */
exports.obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const factura = await Factura.findById(id)
      .populate('cliente', 'nombre email telefono direccion')
      .populate('empleado', 'nombre email');

    if (!factura) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    res.status(200).json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ mensaje: 'Error al obtener factura', error: error.message });
  }
};

/**
 * Actualizar una factura por ID
 */
exports.actualizarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Factura.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.json(actualizado);
  } catch (err) {
    console.error('Error al actualizar factura:', err);
    res.status(400).json({ mensaje: 'Error al actualizar factura', error: err.message });
  }
};

/**
 * Eliminar una factura por ID
 */
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Factura.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.sendStatus(500);
  }
};
