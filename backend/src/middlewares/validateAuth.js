const jwt = require('jsonwebtoken');

function validarAuth(req, res, next) {
  console.log('🔐 === VALIDANDO AUTENTICACIÓN ===');
  console.log('🔐 URL:', req.url);
  console.log('🔐 Method:', req.method);
  console.log('🔐 Session:', req.session);
  console.log('🔐 Headers:', req.headers);
  
  // Primero verificar si hay usuario en la session
  if (req.session && req.session.user) {
    console.log('✅ Usuario autenticado por sesión:', req.session.user);
    req.user = req.session.user;
    return next();
  }

  // Si no hay session, verificar JWT
  const authHeader = req.headers.authorization;
  console.log('🔐 Authorization header:', authHeader);
  
  // Si no hay token, redirigir al index con modal de login
  if (!authHeader) {
    console.log('❌ No hay authorization header');
    
    // Detectar si es una petición AJAX de manera más robusta
    const isAjax = req.xhr || 
                   req.headers.accept?.includes('application/json') || 
                   req.headers['content-type']?.includes('application/json') ||
                   req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    console.log('📱 ¿Es petición AJAX?:', isAjax);
    
    if (isAjax) {
      // Si es una petición AJAX, devolver JSON
      console.log('📱 Petición AJAX detectada, devolviendo 401');
      return res.status(401).json({ mensaje: 'No autenticado' });
    } else {
      // Si es una petición normal, redirigir al index
      console.log('🌐 Petición normal, redirigiendo a home');
      return res.redirect('/?login=true');
    }
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ mensaje: 'Token mal formado' });
    } else {
      return res.redirect('/?login=true');
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ mensaje: 'Token inválido' });
    } else {
      return res.redirect('/?login=true');
    }
  }
}

// Middleware específico para el carrito que soporta sesiones
function validarAuthCarrito(req, res, next) {
  console.log('🔐 Validando autenticación para carrito');
  console.log('Session exists:', !!req.session);
  console.log('Session user:', req.session?.user);
  console.log('Session user ID:', req.session?.user?.id);
  
  // Verificar primero si hay una sesión activa
  if (req.session && req.session.user && req.session.user.id) {
    console.log('✅ Usuario autenticado via sesión');
    req.user = req.session.user;
    return next();
  }

  console.log('❌ Usuario no autenticado');
  // Si es una petición AJAX, devolver JSON
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(401).json({ mensaje: 'Usuario no autenticado' });
  } else {
    // Si es una petición normal, redirigir al index
    return res.redirect('/');
  }
}

// Middleware para validar rol de administrador
function validarAdmin(req, res, next) {
  console.log('🔐 === VALIDANDO ROL ADMINISTRADOR ===');
  console.log('🔐 Usuario:', req.user);
  
  // Verificar si el usuario está autenticado
  if (!req.user) {
    console.log('❌ Usuario no autenticado');
    const isAjax = req.xhr || 
                   req.headers.accept?.includes('application/json') || 
                   req.headers['content-type']?.includes('application/json') ||
                   req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    } else {
      return res.redirect('/?login=true');
    }
  }

  // Verificar si el usuario es administrador
  const esAdmin = req.user.rol === 'admin' || req.user.rol === 'administrador';
  console.log('🔐 ¿Es admin?:', esAdmin);
  console.log('🔐 Rol del usuario:', req.user.rol);
  
  if (!esAdmin) {
    console.log('❌ Acceso denegado - No es administrador');
    const isAjax = req.xhr || 
                   req.headers.accept?.includes('application/json') || 
                   req.headers['content-type']?.includes('application/json') ||
                   req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(403).json({ mensaje: 'Acceso denegado - Permisos insuficientes' });
    } else {
      return res.redirect('/restriccion');
    }
  }

  console.log('✅ Usuario autorizado como administrador');
  next();
}

// Middleware para validar rol de empleado o superior
function validarEmpleado(req, res, next) {
  console.log('🔐 === VALIDANDO ROL EMPLEADO ===');
  console.log('🔐 Usuario:', req.user);
  
  // Verificar si el usuario está autenticado
  if (!req.user) {
    console.log('❌ Usuario no autenticado');
    const isAjax = req.xhr || 
                   req.headers.accept?.includes('application/json') || 
                   req.headers['content-type']?.includes('application/json') ||
                   req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    } else {
      return res.redirect('/?login=true');
    }
  }

  // Verificar si el usuario es empleado o administrador
  const esEmpleadoOAdmin = req.user.rol === 'empleado' || req.user.rol === 'admin' || req.user.rol === 'administrador';
  console.log('🔐 ¿Es empleado o admin?:', esEmpleadoOAdmin);
  console.log('🔐 Rol del usuario:', req.user.rol);
  
  if (!esEmpleadoOAdmin) {
    console.log('❌ Acceso denegado - No es empleado ni administrador');
    const isAjax = req.xhr || 
                   req.headers.accept?.includes('application/json') || 
                   req.headers['content-type']?.includes('application/json') ||
                   req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(403).json({ mensaje: 'Acceso denegado - Permisos insuficientes' });
    } else {
      return res.redirect('/restriccion');
    }
  }

  console.log('✅ Usuario autorizado como empleado o administrador');
  next();
}

module.exports = { validarAuth, validarAuthCarrito, validarAdmin, validarEmpleado };


