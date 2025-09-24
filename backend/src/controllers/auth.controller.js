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

    // Generar token JWT para auto-login
    const payload = {
      id: clienteGuardado._id,
      email: clienteGuardado.email,
      nombre: clienteGuardado.nombre,
      tipoUsuario: 'cliente',
      rol: 'cliente'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Guardar en sesión
    req.session.user = {
      id: clienteGuardado._id,
      email: clienteGuardado.email,
      nombre: clienteGuardado.nombre,
      tipoUsuario: 'cliente',
      rol: 'cliente'
    };

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
    
    // Buscar primero en clientes
    let usuario = await Cliente.findOne({ email: emailLimpio });
    let tipoUsuario = 'cliente';
    
    // Si no se encuentra en clientes, buscar en empleados
    if (!usuario) {
      usuario = await Empleado.findOne({ email: emailLimpio });
      tipoUsuario = 'empleado';
    }

    if (!usuario || usuario.contrasena !== contrasena.trim()) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    // Determinar el rol final
    let rolFinal = usuario.rol || tipoUsuario;
    
    // Si es empleado pero no tiene rol específico, asignar 'empleado'
    if (tipoUsuario === 'empleado' && !usuario.rol) {
      rolFinal = 'empleado';
    }

    const token = jwt.sign(
      { 
        id: usuario._id, 
        email: usuario.email, 
        nombre: usuario.nombre, 
        rol: rolFinal,
        tipoUsuario: tipoUsuario 
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Crear sesión
    req.session.user = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: rolFinal,
      tipoUsuario: tipoUsuario
    };

    const usuarioSeguro = usuario.toObject();
    delete usuarioSeguro.contrasena;

    res.status(200).json({ 
      mensaje: 'Login exitoso', 
      token, 
      usuario: usuarioSeguro,
      tipoUsuario: tipoUsuario,
      rol: rolFinal
    });
    
    console.log('Login exitoso:', usuarioSeguro.email, '- Tipo:', tipoUsuario, '- Rol:', rolFinal);
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

// Función para generar contraseña temporal
function generarPasswordTemporal() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Configurar transporter de nodemailer
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
    console.log('🔍 Iniciando recuperación de contraseña...');
    const { email } = req.body;

    if (!email) {
      console.log('❌ Error: Email no proporcionado');
      return res.status(400).json({ mensaje: 'Correo electrónico requerido' });
    }

    const emailLimpio = email.trim().toLowerCase();
    console.log('📧 Buscando email:', emailLimpio);

    // Buscar el cliente por email
    const cliente = await Cliente.findOne({ email: emailLimpio });
    if (!cliente) {
      console.log('❌ Email no encontrado en BD:', emailLimpio);
      return res.status(404).json({ mensaje: 'El correo electrónico no está registrado en nuestro sistema' });
    }

    console.log('✅ Cliente encontrado:', cliente.nombre, '-', cliente.email);

    // Generar nueva contraseña temporal
    const nuevaPassword = generarPasswordTemporal();
    console.log('🔑 Nueva contraseña generada:', nuevaPassword);

    // Actualizar la contraseña en la base de datos
    cliente.contrasena = nuevaPassword;
    await cliente.save();
    console.log('💾 Contraseña actualizada en BD');

    // Configurar el transporter de email
    console.log('📤 Configurando transporter de email...');
    const transporter = configurarTransporter();

    // Configurar el contenido del email
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
            <p style="color: #666; line-height: 1.6;">
              Hemos recibido una solicitud para recuperar tu contraseña. 
              A continuación encontrarás tu nueva contraseña temporal:
            </p>
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
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3191'}" 
               style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
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

    console.log('📧 Enviando email a:', emailLimpio);
    // Enviar el email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente');

    res.status(200).json({ 
      mensaje: `Hemos enviado una nueva contraseña temporal a ${emailLimpio}. Revisa tu correo electrónico.` 
    });
    console.log('✅ Respuesta enviada al cliente');

  } catch (error) {
    console.error('💥 Error completo al recuperar contraseña:', error);
    console.error('💥 Error mensaje:', error.message);
    console.error('💥 Error código:', error.code);
    console.error('💥 Error stack:', error.stack);
    
    // Si es un error de email, dar una respuesta más específica
    if (error.code === 'EAUTH' || error.code === 'ECONNREFUSED') {
      console.log('📧 Error específico de email detectado');
      return res.status(500).json({ 
        mensaje: 'Error en el servicio de correo. Por favor, intenta más tarde o contacta al administrador.' 
      });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al procesar la solicitud de recuperación de contraseña' 
    });
  }
};

/**
 * Verificar la sesión actual del usuario
 */
exports.verificarSesion = async (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.status(200).json({
        autenticado: true,
        usuario: req.session.user
      });
    } else {
      res.status(401).json({
        autenticado: false,
        mensaje: 'No hay sesión activa'
      });
    }
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({
      autenticado: false,
      mensaje: 'Error al verificar sesión'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Destruir la sesión
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
        return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
      }
      
      // Limpiar la cookie de sesión
      res.clearCookie('connect.sid');
      
      res.status(200).json({ 
        mensaje: 'Sesión cerrada exitosamente',
        success: true 
      });
      
      console.log('✅ Sesión cerrada exitosamente');
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ mensaje: 'Error al cerrar sesión' });
  }
};
