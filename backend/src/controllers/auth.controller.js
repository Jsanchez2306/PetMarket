const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

    if (nombre.trim().length < 2 || nombre.trim().length > 50) {
      return res.status(400).json({ mensaje: 'El nombre debe tener entre 2 y 50 caracteres' });
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
      return res.status(400).json({ mensaje: 'El nombre solo puede contener letras y espacios' });
    }
    if (contrasena.trim().length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (telefono && !/^[0-9]{7,15}$/.test(telefono.trim())) {
      return res.status(400).json({ mensaje: 'El teléfono debe tener entre 7 y 15 dígitos numéricos' });
    }
    if (direccion && (direccion.trim().length < 5 || direccion.trim().length > 100)) {
      return res.status(400).json({ mensaje: 'La dirección debe tener entre 5 y 100 caracteres' });
    }

    const datosCliente = {
      nombre: nombre.trim(),
      email: emailLimpio,
      contrasena: contrasena.trim(),
      rol: 'cliente'
    };
    if (telefono && telefono.trim()) datosCliente.telefono = telefono.trim();
    if (direccion && direccion.trim()) datosCliente.direccion = direccion.trim();

    const nuevoCliente = new Cliente(datosCliente);
    const clienteGuardado = await nuevoCliente.save();
    const clienteSeguro = clienteGuardado.toObject();
    delete clienteSeguro.contrasena;

    const payload = {
      id: clienteGuardado._id,
      email: clienteGuardado.email,
      nombre: clienteGuardado.nombre,
      tipoUsuario: 'cliente',
      rol: 'cliente'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    req.session.user = { ...payload };

    res.status(201).json({ 
      mensaje: 'Registro exitoso', 
      cliente: clienteSeguro,
      token,
      usuario: clienteSeguro,
      tipoUsuario: 'cliente',
      rol: 'cliente'
    });
    console.log('✅ Cliente registrado y autenticado:', clienteSeguro);
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
    let usuario = await Cliente.findOne({ email: emailLimpio });
    let tipoUsuario = 'cliente';

    if (!usuario) {
      usuario = await Empleado.findOne({ email: emailLimpio });
      tipoUsuario = 'empleado';
    }

    if (!usuario || usuario.contrasena !== contrasena.trim()) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    let rolFinal = usuario.rol || tipoUsuario;
    if (tipoUsuario === 'empleado' && !usuario.rol) {
      rolFinal = 'empleado';
    }

    const payload = { 
      id: usuario._id, 
      email: usuario.email, 
      nombre: usuario.nombre, 
      rol: rolFinal,
      tipoUsuario
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    req.session.user = { ...payload };

    const usuarioSeguro = usuario.toObject();
    delete usuarioSeguro.contrasena;

    res.status(200).json({ 
      mensaje: 'Login exitoso', 
      token, 
      usuario: usuarioSeguro,
      tipoUsuario,
      rol: rolFinal
    });
    console.log('Login exitoso:', usuarioSeguro.email, '- Tipo:', tipoUsuario, '- Rol:', rolFinal);
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    const userId = req.user.id;
    let usuario = await Cliente.findById(userId).select('-contrasena');
    let tipoUsuario = 'cliente';

    if (!usuario) {
      const Empleado = require('../models/empleado.model');
      usuario = await Empleado.findById(userId).select('-contrasena');
      tipoUsuario = 'empleado';
    }
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const usuarioData = usuario.toObject();
    usuarioData.tipoUsuario = tipoUsuario;
    res.status(200).json(usuarioData);
    console.log('✅ Perfil obtenido:', usuarioData.email, '- Tipo:', tipoUsuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, direccion, contrasenaActual, contrasenaNueva } = req.body;
    const userId = req.user.id;

    if (!nombre || !contrasenaActual) {
      return res.status(400).json({ mensaje: 'El nombre y la contraseña actual son obligatorios' });
    }

    let usuario = await Cliente.findById(userId);
    let tipoUsuario = 'cliente';

    if (!usuario) {
      const Empleado = require('../models/empleado.model');
      usuario = await Empleado.findById(userId);
      tipoUsuario = 'empleado';
    }
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (usuario.contrasena !== contrasenaActual.trim()) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    if (nombre.trim().length < 2 || nombre.trim().length > 50) {
      return res.status(400).json({ mensaje: 'El nombre debe tener entre 2 y 50 caracteres' });
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
      return res.status(400).json({ mensaje: 'El nombre solo puede contener letras y espacios' });
    }
    if (telefono && !/^[0-9]{7,15}$/.test(telefono.trim())) {
      return res.status(400).json({ mensaje: 'El teléfono debe tener entre 7 y 15 dígitos numéricos' });
    }
    if (direccion && (direccion.trim().length < 5 || direccion.trim().length > 100)) {
      return res.status(400).json({ mensaje: 'La dirección debe tener entre 5 y 100 caracteres' });
    }

    usuario.nombre = nombre.trim();
    if (tipoUsuario === 'cliente') {
      if (telefono !== undefined) usuario.telefono = telefono ? telefono.trim() : undefined;
      if (direccion !== undefined) usuario.direccion = direccion ? direccion.trim() : undefined;
    }

    if (contrasenaNueva && contrasenaNueva.trim()) {
      if (contrasenaNueva.trim().length < 6) {
        return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      usuario.contrasena = contrasenaNueva.trim();
    }

    await usuario.save();

    // CORREGIDO: usar "tipoUsuario" en el token
    const nuevoToken = jwt.sign(
      { 
        id: usuario._id, 
        email: usuario.email, 
        nombre: usuario.nombre, 
        rol: usuario.rol || tipoUsuario,
        tipoUsuario
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const usuarioSeguro = usuario.toObject();
    delete usuarioSeguro.contrasena;

    res.status(200).json({ 
      mensaje: 'Perfil actualizado correctamente', 
      token: nuevoToken, 
      usuario: usuarioSeguro 
    });
    console.log('✅ Perfil actualizado:', usuarioSeguro.email, '- Tipo:', tipoUsuario);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
};

exports.eliminarCuenta = async (req, res) => {
  try {
    const { contrasena } = req.body;
    const clienteId = req.user.id;

    if (!contrasena) {
      return res.status(400).json({ mensaje: 'Contraseña requerida para confirmar eliminación' });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    if (cliente.contrasena !== contrasena.trim()) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    await Cliente.findByIdAndDelete(clienteId);

    res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
    console.log('✅ Cliente eliminado:', cliente.email);
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ mensaje: 'Error al eliminar cuenta', error: error.message });
  }
};

// ===================== Recuperación de contraseña =====================

function generarPasswordTemporal() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
}

const configurarTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'tu-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'tu-app-password'
    }
  });
};

exports.recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Correo electrónico requerido' });

    const emailLimpio = email.trim().toLowerCase();
    const cliente = await Cliente.findOne({ email: emailLimpio });
    if (!cliente) return res.status(404).json({ mensaje: 'El correo electrónico no está registrado en nuestro sistema' });

    const nuevaPassword = generarPasswordTemporal();
    cliente.contrasena = nuevaPassword;
    await cliente.save();

    const transporter = configurarTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER || 'tu-email@gmail.com',
      to: emailLimpio,
      subject: 'PetMarket - Nueva Contraseña Temporal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4CAF50;">🐾 PetMarket</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Hola ${cliente.nombre},</h3>
            <p style="color: #666; line-height: 1.6;">Hemos recibido una solicitud para recuperar tu contraseña. A continuación encontrarás tu nueva contraseña temporal:</p>
          </div>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">Nueva contraseña temporal:</p>
            <h3 style="background-color: #fff; padding: 10px; border-radius: 4px; letter-spacing: 2px; color: #333; margin: 10px 0; font-family: monospace;">
              ${nuevaPassword}
            </h3>
          </div>
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #f57c00; margin-top: 0;">⚠️ Importante:</h4>
            <ul style="color: #666; line-height: 1.6;">
              <li>Esta es una contraseña temporal por seguridad</li>
              <li>Te recomendamos cambiarla lo antes posible</li>
              <li>Ve a tu perfil y actualiza tu contraseña por una personalizada</li>
              <li>Si no solicitaste este cambio, contacta con nosotros</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3191'}" style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p>Este correo se envió automáticamente, por favor no respondas a este mensaje.</p>
            <p>© 2025 PetMarket - Cuidamos de tus mascotas</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ mensaje: `Hemos enviado una nueva contraseña temporal a ${emailLimpio}. Revisa tu correo electrónico.` });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    if (error.code === 'EAUTH' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ mensaje: 'Error en el servicio de correo. Por favor, intenta más tarde o contacta al administrador.' });
    }
    res.status(500).json({ mensaje: 'Error al procesar la solicitud de recuperación de contraseña' });
  }
};

exports.verificarSesion = async (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.status(200).json({ autenticado: true, usuario: req.session.user });
    } else {
      res.status(401).json({ autenticado: false, mensaje: 'No hay sesión activa' });
    }
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ autenticado: false, mensaje: 'Error al verificar sesión' });
  }
};

exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
        return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ mensaje: 'Sesión cerrada exitosamente', success: true });
      console.log('✅ Sesión cerrada exitosamente');
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ mensaje: 'Error al cerrar sesión' });
  }
};

exports.revalidarSesion = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ mensaje: 'Token inválido' });
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      nombre: req.user.nombre,
      rol: req.user.rol,
      tipoUsuario: req.user.tipoUsuario
    };
    res.status(200).json({ mensaje: 'Sesión revalidada exitosamente', usuario: req.session.user });
  } catch (error) {
    console.error('❌ Error revalidando sesión:', error);
    res.status(500).json({ mensaje: 'Error al revalidar sesión' });
  }
};