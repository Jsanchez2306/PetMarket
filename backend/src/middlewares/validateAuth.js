const jwt = require('jsonwebtoken');

function validarAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Si no hay token, redirigir al index con modal de login
  if (!authHeader) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // Si es una petición AJAX, devolver JSON
      return res.status(401).json({ mensaje: 'No token provided' });
    } else {
      // Si es una petición normal, redirigir al index
      return res.redirect('/?login=true');
    }
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
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

module.exports = { validarAuth };


