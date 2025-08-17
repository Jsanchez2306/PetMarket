const Cliente = require('../models/cliente.model');
const jwt = require('jsonwebtoken');

exports.registro = async (req, res) => {
  try {
    const { nombre, email, contrasena, telefono, direccion } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ mensaje: 'Campos requeridos incompletos' });
    }

    const emailLimpio = String(email).trim().toLowerCase();

    const existe = await Cliente.findOne({ email: emailLimpio });
    if (existe) {
      return res.status(409).json({ mensaje: 'Este correo ya está registrado' });
    }

    const nuevoCliente = new Cliente({
      nombre: nombre.trim(),
      email: emailLimpio,
      contrasena: contrasena.trim(),
      telefono: telefono?.trim() || '0000000000',
      direccion: direccion?.trim() || 'Sin dirección',
      rol: 'cliente'
    });

    const clienteGuardado = await nuevoCliente.save();
    const clienteSeguro = clienteGuardado.toObject();
    delete clienteSeguro.contrasena;

    res.status(201).json({ mensaje: 'Registro exitoso', cliente: clienteSeguro });
    console.log('✅ Cliente registrado:', clienteSeguro);
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    res.status(500).json({ mensaje: 'Error al registrar cliente', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ mensaje: 'Faltan campos' });
    }

    const emailLimpio = email.trim().toLowerCase();
    const cliente = await Cliente.findOne({ email: emailLimpio });

    if (!cliente || cliente.contrasena !== contrasena.trim()) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: cliente._id, email: cliente.email, rol: cliente.rol || 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const clienteSeguro = cliente.toObject();
    delete clienteSeguro.contrasena;

    res.status(200).json({ mensaje: 'Login exitoso', token, cliente: clienteSeguro });
    console.log('Login exitoso:', clienteSeguro.email);
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};
