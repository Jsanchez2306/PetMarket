const Empleado = require('../models/empleado.model');

// Renderizar la vista con todos los empleados
exports.renderizarGestionEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.find(); // traemos todos los empleados
    res.render('gestionEmpleados', { empleados }); // pasamos al EJS
  } catch (err) {
    console.error('Error al obtener empleados para la vista:', err);
    res.status(500).send('Error al obtener empleados'); // mensaje simple para no romper la vista
  }
};

// Obtener empleados vía API
exports.obtenerEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.find();
    res.status(200).json(empleados);
  } catch (err) {
    console.error('Error al obtener empleados (API):', err);
    res.status(500).json({ mensaje: 'Error al obtener empleados', error: err.message });
  }
};

// Crear nuevo empleado
exports.crearEmpleado = async (req, res) => {
  try {
    const data = req.body;
    
    // Verificar si el email ya existe
    const existe = await Empleado.findOne({ email: data.email });
    if (existe) {
      return res.status(409).json({ campo: 'email', mensaje: 'Este email ya existe' });
    }

    const nuevoEmpleado = await Empleado.create(data);
    res.status(201).json(nuevoEmpleado);
  } catch (err) {
    console.error('Error al crear empleado:', err);
    res.status(400).json({ mensaje: 'Error al crear empleado', error: err.message });
  }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Normalizar email
    if (updateData.email) {
      updateData.email = String(updateData.email).trim().toLowerCase();
      const otro = await Empleado.findOne({ email: updateData.email, _id: { $ne: id } });
      if (otro) return res.status(409).json({ campo: 'email', mensaje: 'Este email ya existe' });
    }

    const actualizado = await Empleado.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

    res.json(actualizado);
  } catch (err) {
    console.error('Error al actualizar empleado:', err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ campo: 'email', mensaje: 'Este email ya existe' });
    }
    res.status(400).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};

// Eliminar empleado
exports.eliminarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Empleado.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar empleado:', err);
    res.sendStatus(500);
  }
};
