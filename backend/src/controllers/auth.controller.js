const Cliente = require('../models/cliente.model');

// REGISTER
exports.registro = async (req, res) => {
  try {
    const rawEmail = req.body.email || '';
    const email = String(rawEmail).trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ campo: 'email', mensaje: 'Email es requerido' });
    }

    const existe = await Cliente.findOne({ email });
    if (existe) {
      return res.status(409).json({ campo: 'email', mensaje: 'Este correo ya existe' });
    }

    req.body.email = email;
    req.body.telefono = req.body.telefono ?? '0000000000';
    req.body.direccion = req.body.direccion ?? 'Sin dirección';

    const nuevoCliente = new Cliente(req.body);
    const clienteGuardado = await nuevoCliente.save();

    res.status(201).json(clienteGuardado);

  } catch (error) {
    console.error('Error al registrar cliente:', error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({ campo: 'email', mensaje: 'Este correo ya existe' });
    }

    res.status(500).json({ mensaje: 'Error al registrar cliente', error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email: rawEmail, contrasena } = req.body;
    const email = String(rawEmail || '').trim().toLowerCase();

    if (!email || !contrasena) {
      return res.status(400).json({ mensaje: 'Faltan campos' });
    }

    const cliente = await Cliente.findOne({ email });
    if (!cliente) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    if (String(cliente.contrasena) !== String(contrasena)) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const rol = (cliente.rol || 'cliente').toString().trim();

    const safe = cliente.toObject();
    if (safe.contrasena) delete safe.contrasena;

    return res.status(200).json({ mensaje: 'Login exitoso', rol, cliente: safe });
  } catch (err) {
    console.error('Error en auth.login:', err);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
