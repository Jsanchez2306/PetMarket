const { createLogger } = require('../utils/logger');
const log = createLogger('auth');

log.debug('controller loaded at', new Date().toISOString());

const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const bcrypt = require('bcryptjs');
const { verifyRecaptcha } = require('../utils/recaptcha');


/**
 * Registrar cliente.
 * @params req, res - los datos ingresados en el formulario (req.body)
 * @return la confirmación de registro en la base de datos y token de sesión
 * @author codenova
 */
exports.registro = async (req, res) => {
  try {
    const { nombre, email, contrasena, telefono, direccion, recaptchaToken } = req.body;

    // Verificación de Google reCAPTCHA (si está habilitado y enforzada)
    const rc = await verifyRecaptcha({ token: recaptchaToken, req, context: 'registro' });
    if (!rc.ok) return res.status(400).json({ mensaje: rc.message, detalle: rc.detalle });

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
    
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    res.status(500).json({ mensaje: 'Error al registrar cliente', error: error.message });
  }
};

/**
 * Iniciar sesión de usuario (cliente o empleado).
 * @params req, res - credenciales de acceso (email, contrasena, recaptchaToken)
 * @return token de sesión y datos del usuario
 * @author codenova
 */
exports.login = async (req, res) => {
  log.debug('login start');
  try {
    const { email, contrasena, recaptchaToken } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ mensaje: 'Faltan campos' });
    }

    // reCAPTCHA
    const rc = await verifyRecaptcha({ token: recaptchaToken, req, context: 'login' });
    if (!rc.ok) return res.status(400).json({ mensaje: rc.message, detalle: rc.detalle });

  const emailLimpio = email.trim().toLowerCase();
  log.debug('lookup', emailLimpio);
    
    // Preferir Empleado primero por si existe el mismo correo en ambas colecciones
    let usuario = await Empleado.findOne({ email: emailLimpio });
    let tipoUsuario = 'empleado';

    if (!usuario) {
      usuario = await Cliente.findOne({ email: emailLimpio });
      tipoUsuario = 'cliente';
    }

    log.debug('found', !!usuario, 'tipo:', tipoUsuario, 'rol:', usuario?.rol);

    // Verificación híbrida: soporta hash bcrypt o texto plano
  const provided = contrasena.trim();
  log.debug('pwd in:', provided?.substring(0, 6) + '***');
    
    let passwordOK = false;
    try {
        if (!usuario) { 
        passwordOK = false;
      } else if (usuario.contrasena && usuario.contrasena.startsWith('$2')) {
        passwordOK = await bcrypt.compare(provided, usuario.contrasena);
        log.debug('bcrypt compare:', passwordOK);
      } else {
        passwordOK = (usuario.contrasena === provided);
        log.debug('plain compare:', passwordOK);
      }
    } catch (e) { 
      passwordOK = false; 
      log.error('pwd verify error:', e.message);
    }

    if (!passwordOK) {
      log.debug('login failed: wrong creds');
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
    
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

/**
 * Obtener perfil del usuario autenticado.
 * @params req, res - información de sesión
 * @return datos del usuario sin contraseña
 * @author codenova
 */
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
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Actualizar perfil del usuario autenticado.
 * @params req, res - datos a actualizar en req.body
 * @return Perfil actualizado y nuevo token
 * @author codenova
 */
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

    // Verificación híbrida de contraseña actual
    let passOK = false;
    try {
      if (usuario.contrasena && usuario.contrasena.startsWith('$2')) {
        passOK = await bcrypt.compare(contrasenaActual.trim(), usuario.contrasena);
      } else {
        passOK = (usuario.contrasena === contrasenaActual.trim());
      }
    } catch (e) { passOK = false; }

    if (!passOK) {
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
    
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
};

/**
 * Eliminar la cuenta del usuario autenticado.
 * @params req, res - contraseña de confirmación en req.body
 * @return Estado de eliminación o mensaje de error
 * @author codenova
 */
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

// Configurar cliente de Resend
const configurarResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(' RESEND_API_KEY no está configurado');
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Recuperar la contraseña de un cliente.
 * @params req, res - email en req.body
 * @return Estado del envío y nueva contraseña temporal
 * @author codenova
 */
exports.recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ mensaje: 'Correo electrónico requerido' });

    const emailLimpio = email.trim().toLowerCase();
    const cliente = await Cliente.findOne({ email: emailLimpio });
    if (!cliente) return res.status(404).json({ mensaje: 'El correo electrónico no está registrado como cliente, si eres un empleado, por favor contacta al administrador.' });

    const nuevaPassword = generarPasswordTemporal();
    cliente.contrasena = nuevaPassword;
    await cliente.save();

    // Configurar Resend
    const resend = configurarResend();
    
    if (!resend) {
      console.error(' Servicio de email no disponible - API Key no configurado');
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ 
          mensaje: 'Servicio de correo temporalmente no disponible. La contraseña se ha actualizado, contacta al administrador.' 
        });
      }
      return res.status(500).json({ mensaje: 'Servicio de email no configurado en desarrollo' });
    }

    const emailOptions = {
      from: process.env.EMAIL_FROM || 'PetMarket <onboarding@resend.dev>',
      to: emailLimpio,
      subject: 'PetMarket - Nueva Contraseña Temporal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Recuperación de Contraseña - PetMarket</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4CAF50;">
            <h1 style="color: #4CAF50; margin: 0;">🐾 PetMarket</h1>
            <p style="color: #666; margin: 5px 0;">Recuperación de Contraseña</p>
          </div>

          <!-- Contenido principal -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin-top: 0;"> Nueva Contraseña Temporal</h2>
            <p style="margin: 0; color: #666;">Hola <strong>${cliente.nombre}</strong>,</p>
            <p style="color: #666;">Hemos recibido una solicitud para recuperar tu contraseña. A continuación encontrarás tu nueva contraseña temporal:</p>
          </div>

          <!-- Contraseña temporal -->
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-size: 14px; font-weight: bold;">Nueva contraseña temporal:</p>
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px dashed #1976d2;">
              <h2 style="color: #333; font-family: 'Courier New', monospace; letter-spacing: 3px; margin: 0; font-size: 24px;">
                ${nuevaPassword}
              </h2>
            </div>
          </div>
          
          <!-- Instrucciones importantes -->
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #f57c00; margin-top: 0;"> Importante:</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
              <li>Esta es una contraseña temporal por seguridad</li>
              <li><strong>Te recomendamos cambiarla inmediatamente</strong> después de iniciar sesión</li>
              <li>Ve a tu perfil y actualiza tu contraseña por una personalizada</li>
              <li>Si no solicitaste este cambio, contacta con nosotros inmediatamente</li>
            </ul>
          </div>

          <!-- Botón de acción -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'https://petmarket-vij4.onrender.com'}" 
               style="background-color: #4CAF50; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
               Iniciar Sesión Ahora
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 5px 0;">Este correo se envió automáticamente, por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0;">Si tienes problemas, contacta nuestro soporte.</p>
            <p style="margin: 15px 0 5px 0; font-weight: bold;">© 2025 PetMarket - Cuidamos de tus mascotas 🐾</p>
          </div>

        </body>
        </html>
      `,
      text: `Hola ${cliente.nombre}, tu nueva contraseña temporal es: ${nuevaPassword}. Te recomendamos cambiarla después de iniciar sesión.`
    };

    // Enviar email con retry
    
    
    let lastError = null;
    for (let intento = 1; intento <= 3; intento++) {
      try {
  const { data, error } = await resend.emails.send(emailOptions);

        if (error) {
          lastError = error;
          console.error(` Error en intento ${intento}:`, error);
          
          if (intento < 3) {
            const tiempoEspera = Math.pow(2, intento) * 1000;
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
          }
          continue;
        }

        
        return res.status(200).json({ 
          mensaje: `Hemos enviado una nueva contraseña temporal a ${emailLimpio}. Revisa tu correo electrónico.` 
        });
        
      } catch (error) {
        lastError = error;
        console.error(` Excepción en intento ${intento}:`, error.message);
        
        if (intento < 3) {
          const tiempoEspera = Math.pow(2, intento) * 1000;
          await new Promise(resolve => setTimeout(resolve, tiempoEspera));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('Falló después de 3 intentos');

  } catch (error) {
  console.error('Error al recuperar contraseña:', error);
    
    // En producción, la contraseña ya se cambió, así que informar eso
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ 
        mensaje: 'La contraseña se ha actualizado, pero hubo un error enviando el email. Contacta al administrador si no recibiste el correo.' 
      });
    }
    
    res.status(500).json({ mensaje: 'Error al procesar la solicitud de recuperación de contraseña' });
  }
};

/**
 * Verificar si hay sesión activa.
 * @params req, res - solicitud y respuesta HTTP
 * @return Estado de autenticación y datos de usuario
 * @author codenova
 */
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

/**
 * Cerrar la sesión del usuario.
 * @params req, res - solicitud y respuesta HTTP
 * @return Estado de cierre de sesión
 * @author codenova
 */
exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
        return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ mensaje: 'Sesión cerrada exitosamente', success: true });
      
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ mensaje: 'Error al cerrar sesión' });
  }
};

/**
 * Revalidar la sesión del usuario con token.
 * @params req, res - usuario en req.user
 * @return Sesión revalidada y datos de usuario
 * @author codenova
 */
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
    console.error(' Error revalidando sesión:', error);
    res.status(500).json({ mensaje: 'Error al revalidar sesión' });
  }
};