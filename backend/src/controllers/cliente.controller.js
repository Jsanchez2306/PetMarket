const Cliente = require('../models/cliente.model');
const Log = require('../middlewares/logs');

exports.renderizarGestionClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    Log.generateLog("Vista clientes", `Se renderizó la vista de gestión de clientes, total: ${clientes.length}`);
    res.render('gestionClientes', { clientes });
  } catch (err) {
    console.error('Error al obtener clientes para la vista:', err);
    Log.generateLog("Error renderizar vista", `Error al renderizar gestión de clientes: ${err.message}`);
    res.status(500).send('Error al obtener clientes');
  }
};

exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    Log.generateLog("API clientes", `Se obtuvieron ${clientes.length} clientes`);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes (API):', error);
    Log.generateLog("Error API clientes", `Error al obtener clientes: ${error.message}`);
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
        Log.generateLog("Conflicto email", `Intento de actualizar cliente ${id} con email existente: ${updateData.email}`);
        return res.status(409).json({ campo: 'email', mensaje: 'Este correo ya existe' });
      }
    }

    const actualizado = await Cliente.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!actualizado) {
      Log.generateLog("Cliente no encontrado", `Intento de actualizar cliente ${id} pero no existe`);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    Log.generateLog("Cliente actualizado", `Cliente actualizado: ${id}`);
    res.json(actualizado);

  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    Log.generateLog("Error actualizar cliente", `Error al actualizar cliente ${req.params.id}: ${err.message}`);

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
    if (!eliminado) {
      Log.generateLog("Cliente no encontrado", `Intento de eliminar cliente ${id} pero no existe`);
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    Log.generateLog("Cliente eliminado", `Cliente eliminado: ${id}`);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    Log.generateLog("Error eliminar cliente", `Error al eliminar cliente ${req.params.id}: ${error.message}`);
    res.sendStatus(500);
  }
};
