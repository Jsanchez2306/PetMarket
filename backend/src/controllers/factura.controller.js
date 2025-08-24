const Factura = require('../models/factura.model');

/**
 * Renderiza la gestión de facturas (vista EJS)
 */
exports.renderizarGestionFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find();
    res.render('gestionFacturas', { facturas });
  } catch (err) {
    console.error('Error al obtener facturas para la vista:', err);
    res.status(500).send('Error al obtener facturas');
  }
};

/**
 * Obtener todas las facturas (API)
 */
exports.obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find();
    res.status(200).json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas (API):', error);
    res.status(500).json({ mensaje: 'Error al obtener las facturas', error: error.message });
  }
};

/**
 * Crear una nueva factura
 */
exports.crearFactura = async (req, res) => {
  try {
    const nuevaFactura = new Factura(req.body);
    const facturaGuardada = await nuevaFactura.save();
    res.status(201).json(facturaGuardada);
  } catch (err) {
    console.error('Error al crear factura:', err);
    res.status(400).json({ mensaje: 'Error al crear factura', error: err.message });
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
