const Cliente = require('../models/cliente.model');

/* ================== Helpers ================== */
function isEmpty(v) { return v === undefined || v === null || String(v).trim() === ''; }
function normStr(v) { return typeof v === 'string' ? v.trim() : v; }

function validarNombre(nombre) {
  if (isEmpty(nombre)) return 'El nombre es obligatorio';
  const v = normStr(nombre);
  if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (v.length > 50) return 'El nombre no puede exceder los 50 caracteres';
  if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/.test(v)) return 'El nombre solo puede contener letras y espacios';
  return null;
}
function validarEmail(email) {
  if (isEmpty(email)) return 'El correo electrónico es obligatorio';
  const v = normStr(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'El formato del correo electrónico no es válido';
  return null;
}
function validarTelefono(telefono) {
  if (isEmpty(telefono)) return null; // opcional
  const v = normStr(telefono);
  if (!/^[0-9]{7,15}$/.test(v)) return 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
  return null;
}
function validarDireccion(direccion) {
  if (isEmpty(direccion)) return null; // opcional
  const v = normStr(direccion);
  if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres';
  if (v.length > 100) return 'La dirección no puede exceder los 100 caracteres';
  return null;
}
function validarPassword(contrasena, requerida = true) {
  if (!requerida && isEmpty(contrasena)) return null;
  if (isEmpty(contrasena)) return 'La contraseña es obligatoria';
  const v = String(contrasena);
  if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
  return null;
}

/* ================== Vista ================== */
/**
 * Renderizar la vista de gestión de clientes.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página con la lista de clientes
 * @author codenova
 */
exports.renderizarGestionClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.render('gestionClientes', { clientes });
  } catch (err) {
    console.error('Error al obtener clientes para la vista:', err);
    res.status(500).send('Error al obtener clientes');
  }
};

/* ================== API Lista ================== */
/**
 * Obtener todos los clientes.
 * @params _req, res - solicitud y respuesta HTTP
 * @return Lista de clientes en formato JSON
 * @author codenova
 */
exports.obtenerClientes = async (_req, res) => {
  try {
    const clientes = await Cliente.find();
    res.status(200).json(clientes);
  } catch (err) {
    console.error('Error al obtener clientes (API):', err);
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: err.message });
  }
};

/* ================== Buscar por Email ================== */
/**
 * Buscar cliente por email.
 * @params req, res - email en query params
 * @return Cliente encontrado o mensaje de error
 * @author codenova
 */
exports.buscarClientePorEmail = async (req, res) => {
  try {
    const email = normStr(req.query.email)?.toLowerCase();
    if (!email) return res.status(400).json({ mensaje: 'Email requerido' });

    const cliente = await Cliente.findOne({ email });
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    const seguro = cliente.toObject();
    delete seguro.contrasena;
    res.json(seguro);
  } catch (err) {
  console.error('Error al buscar cliente:', err);
    res.status(500).json({ mensaje: 'Error al buscar cliente', error: err.message });
  }
};

/* ================== Crear Cliente ================== */
/**
 * Crear un nuevo cliente.
 * @params req, res - datos del cliente en req.body
 * @return Cliente creado o errores de validación
 * @author codenova
 */
exports.crearCliente = async (req, res) => {
  try {
    const data = { ...req.body };

    // Normalizar
    data.nombre = normStr(data.nombre);
    data.email = normStr(data.email)?.toLowerCase();
    data.telefono = normStr(data.telefono);
    data.direccion = normStr(data.direccion);
    data.contrasena = data.contrasena ? String(data.contrasena).trim() : '';

    // Eliminar opcionales vacíos ANTES de validar contra Mongoose (evita minlength con "")
    if (isEmpty(data.telefono)) delete data.telefono;
    if (isEmpty(data.direccion)) delete data.direccion;

    const errores = {};
    const eNom = validarNombre(data.nombre); if (eNom) errores.nombre = eNom;
    const eEml = validarEmail(data.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(data.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(data.direccion); if (eDir) errores.direccion = eDir;
    const ePwd = validarPassword(data.contrasena, true); if (ePwd) errores.password = ePwd;

    if (!errores.email && data.email) {
      const existeEmail = await Cliente.findOne({ email: data.email });
      if (existeEmail) errores.email = 'Este correo ya existe';
    }

    if (Object.keys(errores).length) {
      return res.status(400).json({ errores });
    }

    data.rol = 'cliente';

    const nuevo = await Cliente.create(data);
    const seguro = nuevo.toObject();
    delete seguro.contrasena;
    res.status(201).json(seguro);
  } catch (err) {
    console.error('Error al crear cliente:', err);
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) errores[campo] = err.errors[campo].message;
      return res.status(400).json({ errores });
    }
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ errores: { email: 'Este correo ya existe' } });
    }
    res.status(500).json({ mensaje: 'Error al crear cliente', error: err.message });
  }
};

/* ================== Actualizar Cliente ================== */
/**
 * Actualizar un cliente existente.
 * @params req, res - id del cliente en req.params y datos a actualizar
 * @return Cliente actualizado o mensaje de error
 * @author codenova
 */
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    // Normalizar entradas
    const nombre = normStr(body.nombre);
    const email = normStr(body.email)?.toLowerCase();
    const telefonoRaw = normStr(body.telefono);
    const direccionRaw = normStr(body.direccion);
    const contrasenaRaw = body.contrasena ? String(body.contrasena).trim() : '';

    // Flags para campos limpiados (usuario borró contenido)
    const telefonoVacio = isEmpty(telefonoRaw);
    const direccionVacia = isEmpty(direccionRaw);
    const contrasenaVacia = isEmpty(contrasenaRaw);

    const datosVal = {
      nombre,
      email,
      telefono: telefonoVacio ? undefined : telefonoRaw,
      direccion: direccionVacia ? undefined : direccionRaw,
      contrasena: contrasenaVacia ? undefined : contrasenaRaw
    };

    const errores = {};
    const eNom = validarNombre(datosVal.nombre); if (eNom) errores.nombre = eNom;
    const eEml = validarEmail(datosVal.email); if (eEml) errores.email = eEml;
    const eTel = validarTelefono(datosVal.telefono); if (eTel) errores.telefono = eTel;
    const eDir = validarDireccion(datosVal.direccion); if (eDir) errores.direccion = eDir;
    if (datosVal.contrasena !== undefined) {
      const ePwd = validarPassword(datosVal.contrasena, false); if (ePwd) errores.password = ePwd;
    }

    if (!errores.email && datosVal.email) {
      const otro = await Cliente.findOne({ email: datosVal.email, _id: { $ne: id } });
      if (otro) errores.email = 'Este correo ya existe';
    }

    if (Object.keys(errores).length) {
      return res.status(400).json({ errores });
    }

    // Construir update con $set / $unset para eliminar realmente campos vaciados
    const updateDoc = { $set: {} };
    updateDoc.$set.nombre = datosVal.nombre;
    updateDoc.$set.email = datosVal.email;

    if (!telefonoVacio && datosVal.telefono !== undefined) updateDoc.$set.telefono = datosVal.telefono;
    if (!direccionVacia && datosVal.direccion !== undefined) updateDoc.$set.direccion = datosVal.direccion;
    if (datosVal.contrasena !== undefined && !contrasenaVacia) updateDoc.$set.contrasena = datosVal.contrasena;

    if (telefonoVacio) {
      updateDoc.$unset = { ...(updateDoc.$unset || {}), telefono: "" };
    }
    if (direccionVacia) {
      updateDoc.$unset = { ...(updateDoc.$unset || {}), direccion: "" };
    }
    if (contrasenaVacia) {
      // No hacemos unset de contraseña (no se borra), simplemente no se cambia
      delete updateDoc.$set.contrasena;
    }

    // Limpiar $set si quedó solo con campos obligatorios (normal)
    if (Object.keys(updateDoc.$set).length === 0) delete updateDoc.$set;

    const actualizado = await Cliente.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true, runValidators: true }
    );
    if (!actualizado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    const seguro = actualizado.toObject();
    delete seguro.contrasena;
    res.json(seguro);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    if (err.name === 'ValidationError') {
      const errores = {};
      for (const campo in err.errors) errores[campo] = err.errors[campo].message;
      return res.status(400).json({ errores });
    }
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ errores: { email: 'Este correo ya existe' } });
    }
    res.status(500).json({ mensaje: 'Error al actualizar', error: err.message });
  }
};

/* ================== Eliminar Cliente ================== */
/**
 * Eliminar un cliente.
 * @params req, res - id del cliente en req.params
 * @return Estado de eliminación o mensaje de error
 * @author codenova
 */
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Cliente.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    res.sendStatus(500);
  }
};