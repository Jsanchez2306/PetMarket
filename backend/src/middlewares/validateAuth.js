const jwt = require('jsonwebtoken');

function isAjaxJson(req) {
  return (
    req.xhr ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    (req.headers.accept && req.headers.accept.includes('application/json')) ||
    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'))
  );
}

function validarAuth(req, res, next) {
  console.log('🔐 === VALIDANDO AUTENTICACIÓN ===');
  console.log('🔐 URL:', req.url, 'Method:', req.method);
  console.log('🔐 Session user:', req.session?.user);

  // 1) Sesión de servidor
  if (req.session && req.session.user) {
    console.log('✅ Usuario autenticado por sesión');
    req.user = req.session.user;
    return next();
  }

  // 2) JWT (Authorization: Bearer ...)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'No autenticado' });
    return res.redirect('/restriccion');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'Token mal formado' });
    return res.redirect('/restriccion');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decodificado:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'Token inválido' });
    return res.redirect('/restriccion');
  }
}

// Middleware específico para carrito (acepta sesión o JWT)
function validarAuthCarrito(req, res, next) {
  console.log('🔐 Validando autenticación para carrito');
  if (req.session?.user?.id) {
    req.user = req.session.user;
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.log('❌ Token JWT inválido:', error.message);
    }
  }
  if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'Usuario no autenticado' });
  return res.redirect('/restriccion');
}

// Solo admins
function validarAdmin(req, res, next) {
  console.log('🔐 === VALIDANDO ROL ADMINISTRADOR ===');
  if (!req.user) {
    if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'No autenticado' });
    return res.redirect('/restriccion');
  }
  const esAdmin = req.user.rol === 'admin' || req.user.rol === 'administrador';
  if (!esAdmin) {
    if (isAjaxJson(req)) return res.status(403).json({ mensaje: 'Acceso denegado - Permisos insuficientes' });
    return res.redirect('/restriccion');
  }
  next();
}

// Empleado o superior
function validarEmpleado(req, res, next) {
  console.log('🔐 === VALIDANDO ROL EMPLEADO ===');
  if (!req.user) {
    if (isAjaxJson(req)) return res.status(401).json({ mensaje: 'No autenticado' });
    return res.redirect('/restriccion');
  }
  const esEmpleadoOAdmin = ['empleado', 'admin', 'administrador'].includes(req.user.rol);
  if (!esEmpleadoOAdmin) {
    if (isAjaxJson(req)) return res.status(403).json({ mensaje: 'Acceso denegado - Permisos insuficientes' });
    return res.redirect('/restriccion');
  }
  next();
}

module.exports = { validarAuth, validarAuthCarrito, validarAdmin, validarEmpleado };