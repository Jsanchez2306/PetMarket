const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Rutas para registro y login
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Ruta para recuperación de contraseña
router.post('/recuperar-password', authController.recuperarPassword);

// Ruta para verificar autenticación
router.get('/verify', (req, res) => {
  // Verificar si hay sesión activa
  if (req.session && req.session.user) {
    return res.status(200).json({ autenticado: true, usuario: req.session.user });
  }

  // Verificar JWT si no hay sesión
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ autenticado: true, usuario: decoded });
      } catch (error) {
        // Token inválido, continuar con no autenticado
      }
    }
  }

  res.status(401).json({ autenticado: false });
});

// Rutas protegidas para gestión de perfil
router.put('/actualizar-perfil', validarAuth, authController.actualizarPerfil);
router.delete('/eliminar-cuenta', validarAuth, authController.eliminarCuenta);

module.exports = router;
