const Empleado = require('../models/empleado.model');

// Renderizar la vista con todos los empleados
exports.renderizarGestionEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.find();
    res.render('gestionEmpleados', { empleados });
  } catch (err) {
    console.error('Error al obtener empleados para la vista:', err);
    res.status(500).send('Error al obtener empleados');
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
        let errores = {};

        // Validaciones únicas
        if (await Empleado.findOne({ cedula: data.cedula })) {
            errores.cedula = 'Esta cédula ya existe';
        }
        if (await Empleado.findOne({ email: data.email })) {
            errores.email = 'Este correo ya existe';
        }

        // Validación password
        if (!data.contrasena || data.contrasena.length < 6 || /^\d+$/.test(data.contrasena) || /^[A-Za-z]+$/.test(data.contrasena)) {
            errores.password = 'La contraseña debe tener al menos 6 caracteres y contener letras y números';
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores }); // Enviar todos los errores juntos
        }

        const nuevoEmpleado = await Empleado.create(data);
        res.status(201).json(nuevoEmpleado);

    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al crear empleado', error: err.message });
    }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        let errores = {};

        // Validación email único
        if (updateData.email) {
            updateData.email = String(updateData.email).trim().toLowerCase();
            const otro = await Empleado.findOne({ email: updateData.email, _id: { $ne: id } });
            if (otro) errores.email = 'Este email ya existe';
        }

        // Validación cédula única
        if (updateData.cedula) {
            const otra = await Empleado.findOne({ cedula: updateData.cedula, _id: { $ne: id } });
            if (otra) errores.cedula = 'Esta cédula ya existe';
        }

        // Validación password si se actualiza
        if (updateData.contrasena) {
            if (updateData.contrasena.length < 6 || /^\d+$/.test(updateData.contrasena) || /^[A-Za-z]+$/.test(updateData.contrasena)) {
                errores.password = 'La contraseña debe tener al menos 6 caracteres y contener letras y números';
            }
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        const actualizado = await Empleado.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!actualizado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

        res.json(actualizado);

    } catch (err) {
        console.error('Error al actualizar empleado:', err);
        res.status(500).json({ mensaje: 'Error al actualizar', error: err.message });
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
