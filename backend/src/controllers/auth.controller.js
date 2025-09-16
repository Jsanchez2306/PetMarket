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
      { id: cliente._id, email: cliente.email, nombre: cliente.nombre, rol: cliente.rol || 'cliente' },
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

exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, email, passwordActual, passwordNueva } = req.body;
    const clienteId = req.user.id;

    if (!nombre || !email || !passwordActual) {
      return res.status(400).json({ mensaje: 'Campos requeridos incompletos' });
    }

    // Buscar el cliente
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Verificar contraseña actual
    if (cliente.contrasena !== passwordActual.trim()) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    // Verificar si el nuevo email ya existe (solo si es diferente al actual)
    const emailLimpio = email.trim().toLowerCase();
    if (emailLimpio !== cliente.email) {
      const emailExiste = await Cliente.findOne({ email: emailLimpio });
      if (emailExiste) {
        return res.status(409).json({ mensaje: 'Este correo ya está en uso' });
      }
    }

    // Actualizar datos
    cliente.nombre = nombre.trim();
    cliente.email = emailLimpio;
    
    // Actualizar contraseña si se proporciona una nueva
    if (passwordNueva && passwordNueva.trim()) {
      if (passwordNueva.trim().length < 6) {
        return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      cliente.contrasena = passwordNueva.trim();
    }

    await cliente.save();

    // Generar nuevo token con la información actualizada
    const nuevoToken = jwt.sign(
      { id: cliente._id, email: cliente.email, nombre: cliente.nombre, rol: cliente.rol || 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const clienteSeguro = cliente.toObject();
    delete clienteSeguro.contrasena;

    res.status(200).json({ 
      mensaje: 'Perfil actualizado correctamente', 
      token: nuevoToken, 
      cliente: clienteSeguro 
    });
    console.log('✅ Perfil actualizado:', clienteSeguro.email);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
};

exports.eliminarCuenta = async (req, res) => {
  try {
    const { password } = req.body;
    const clienteId = req.user.id;

    if (!password) {
      return res.status(400).json({ mensaje: 'Contraseña requerida para confirmar eliminación' });
    }

    // Buscar el cliente
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Verificar contraseña
    if (cliente.contrasena !== password.trim()) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Eliminar el cliente
    await Cliente.findByIdAndDelete(clienteId);

    res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
    console.log('✅ Cliente eliminado:', cliente.email);
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ mensaje: 'Error al eliminar cuenta', error: error.message });
  }
};
