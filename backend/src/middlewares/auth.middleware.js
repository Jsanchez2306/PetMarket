const jwt = require('jsonwebtoken');
const Cliente = require('../models/cliente.model');

/**
 * Middleware para verificar autenticación JWT
 */
const requireAuth = async (req, res, next) => {
  try {
    // Obtener token del header de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Header de autorización requerido'
      });
    }

    // Verificar formato del header (debe ser "Bearer TOKEN")
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Validar que el token tenga el formato correcto (JWT tiene 3 partes separadas por puntos)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Token malformado'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
    
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token no contiene información de usuario válida'
      });
    }

    // Buscar el usuario en la base de datos
    const usuario = await Cliente.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol || 'cliente',
      tipoUsuario: usuario.tipoUsuario || 'cliente'
    };

  console.log(`Usuario autenticado: ${usuario.email} (${usuario.rol || 'cliente'})`);
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o malformado'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión nuevamente'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token no es válido aún'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor en autenticación'
    });
  }
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario sea empleado o administrador
 */
const requireAdminOrEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  const isAdmin = req.user.rol === 'admin';
  const isEmployee = req.user.tipoUsuario === 'empleado' || req.user.rol === 'admin';

  if (!isAdmin && !isEmployee) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de empleado o administrador'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario sea cliente
 */
const requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user.rol !== 'cliente' && req.user.tipoUsuario !== 'cliente') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de cliente'
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminOrEmployee,
  requireClient
};