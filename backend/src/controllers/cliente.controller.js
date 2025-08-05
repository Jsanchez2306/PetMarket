const Cliente = require('../models/cliente.model');

exports.renderizarGestionClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.render('gestionClientes', { clientes });
  } catch (err) {
    console.error('Error al obtener clientes para la vista:', err);
    res.status(500).send('Error al obtener clientes');
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes (API):', error);
    res.status(500).json({ mensaje: 'Error al obtener los clientes', error: error.message });
  }
};

exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.email) {
      updateData.email = String(updateData.email).trim().toLowerCase();

      const otro = await Cliente.findOne({ email: updateData.email, _id: { $ne: id } });
      if (otro) {
        return res.status(409).json({ campo: 'email', mensaje: 'Este correo ya existe' });
      }
    }

    const actualizado = await Cliente.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json(actualizado);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);

    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(409).json({ campo: 'email', mensaje: 'Este correo ya existe' });
    }

    res.status(400).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};

exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Cliente.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.sendStatus(500);
  }
};
