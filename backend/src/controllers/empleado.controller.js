const Empleado = require('../models/empleado.model');

// ================== Helpers de validación ==================
function isEmpty(v) {
  return v === undefined || v === null || String(v).trim() === '';
}
function normStr(v) {
  return typeof v === 'string' ? v.trim() : v;
}
function validarNombre(nombre) {
  if (isEmpty(nombre)) return 'El nombre es obligatorio';
  const v = normStr(nombre);
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > 50) return 'El nombre no puede exceder los 50 caracteres';
  if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(v)) return 'El nombre solo puede contener letras y espacios';
  return null;
}
function validarCedula(cedula) {
  if (isEmpty(cedula)) return 'La cédula es obligatoria';
  const v = normStr(cedula);
  if (!/^[0-9]{6,15}$/.test(v)) return 'La cédula debe tener entre 6 y 15 dígitos numéricos';
  return null;
}
function validarEmail(email) {
  if (isEmpty(email)) return 'El correo electrónico es obligatorio';
  const v = normStr(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo electrónico no es válido';
  return null;
}
function validarTelefono(telefono) {
  if (isEmpty(telefono)) return 'El teléfono es obligatorio';
  const v = normStr(telefono);
  if (!/^[0-9]{7,15}$/.test(v)) return 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
  return null;
}
function validarDireccion(direccion) {
  if (isEmpty(direccion)) return 'La dirección es obligatoria';
  const v = normStr(direccion);
  if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres';
  if (v.length > 100) return 'La dirección no puede exceder los 100 caracteres';
  return null;
}
function validarCargo(cargo) {
  if (isEmpty(cargo)) return 'El cargo es obligatorio';
  const v = normStr(cargo);
  if (v.length < 3) return 'El cargo debe tener al menos 3 caracteres';
  return null;
}
function validarPassword(contrasena, requerida = true) {
  if (!requerida && isEmpty(contrasena)) return null; // opcional en editar
  if (isEmpty(contrasena)) return 'La contraseña es obligatoria';
  const v = String(contrasena);
  if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres y contener letras y números';
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(v)) return 'La contraseña debe contener al menos una letra y un número';
  return null;
}

// ================== Renderizar vista ==================
exports.renderizarGestionEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.find();
    res.render('gestionEmpleados', { empleados });
  } catch (err) {
    console.error('Error al obtener empleados para la vista:', err);
    res.status(500).send('Error al obtener empleados');
  }
};

// ================== API: Obtener empleados ==================
exports.obtenerEmpleados = async (_req, res) => {
  try {
    const empleados = await Empleado.find();
    res.status(200).json(empleados);
  } catch (err) {
    console.error('Error al obtener empleados (API):', err);
    res.status(500).json({ mensaje: 'Error al obtener empleados', error: err.message });
  }
};

// ================== Crear empleado ==================
exports.crearEmpleado = async (req, res) => {
  try {
    const data = { ...req.body };

    // Normalización
    data.nombre = normStr(data.nombre);
    data.cedula = normStr(data.cedula);
    data.email = normStr(data.email)?.toLowerCase();
    data.telefono = normStr(data.telefono);
    data.direccion = normStr(data.direccion);
    data.cargo = normStr(data.cargo);

    let errores = {};

    // Validaciones de contenido
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eCed = validarCedula(data.cedula); if (eCed) errores.cedula = eCed;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const eCar = validarCargo(data.cargo); if (eCar) errores.cargo = eCar;
    const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

    // Unicidad (solo si formato es válido)
    if (!errores.cedula && data.cedula) {
      const existeCedula = await Empleado.findOne({ cedula: data.cedula });
      if (existeCedula) errores.cedula = 'Esta cédula ya existe';
    }
    if (!errores.email && data.email) {
      const existeEmail = await Empleado.findOne({ email: data.email });
      if (existeEmail) errores.email = 'Este correo ya existe';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    const nuevoEmpleado = await Empleado.create(data);
    res.status(201).json(nuevoEmpleado);

  } catch (err) {
    console.error('Error al crear empleado:', err);

    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) errores[campo] = err.errors[campo].message;
      return res.status(400).json({ errores });
    }
    if (err.code === 11000 && err.keyPattern) {
      const errores = {};
      if (err.keyPattern.cedula) errores.cedula = 'Esta cédula ya existe';
      if (err.keyPattern.email) errores.email = 'Este correo ya existe';
      return res.status(400).json({ errores });
    }

    res.status(500).json({ mensaje: 'Error al crear empleado', error: err.message });
  }
};

// ================== Actualizar empleado ==================
exports.actualizarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Normalización
    updateData.nombre = normStr(updateData.nombre);
    updateData.cedula = normStr(updateData.cedula);
    updateData.email = normStr(updateData.email)?.toLowerCase();
    updateData.telefono = normStr(updateData.telefono);
    updateData.direccion = normStr(updateData.direccion);
    updateData.cargo = normStr(updateData.cargo);

    let errores = {};

    // Validaciones de contenido (el form manda todos)
    const eNom = validarNombre(updateData.nombre); if (eNom) errores.nombre = eNom;
    const eCed = validarCedula(updateData.cedula); if (eCed) errores.cedula = eCed;
    const eEml = validarEmail(updateData.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(updateData.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(updateData.direccion); if (eDir) errores.direccion = eDir;
    const eCar = validarCargo(updateData.cargo); if (eCar) errores.cargo = eCar;

    // Password opcional
    if (updateData.contrasena !== undefined && updateData.contrasena !== '') {
      const ePwd = validarPassword(updateData.contrasena, false);
      if (ePwd) errores.password = ePwd;
    } else {
      delete updateData.contrasena;
    }

    // Unicidad (excluye el mismo id)
    if (!errores.email && updateData.email) {
      const otro = await Empleado.findOne({ email: updateData.email, _id: { $ne: id } });
      if (otro) errores.email = 'Este correo ya existe';
    }
    if (!errores.cedula && updateData.cedula) {
      const otra = await Empleado.findOne({ cedula: updateData.cedula, _id: { $ne: id } });
      if (otra) errores.cedula = 'Esta cédula ya existe';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    const actualizado = await Empleado.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });

    res.json(actualizado);

  } catch (err) {
    console.error('Error al actualizar empleado:', err);

    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) errores[campo] = err.errors[campo].message;
      return res.status(400).json({ errores });
    }
    if (err.code === 11000 && err.keyPattern) {
      const errores = {};
      if (err.keyPattern.cedula) errores.cedula = 'Esta cédula ya existe';
      if (err.keyPattern.email) errores.email = 'Este correo ya existe';
      return res.status(400).json({ errores });
    }

    res.status(500).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};

// ================== Eliminar empleado ==================
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