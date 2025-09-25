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
router.get('/verify', authController.verificarSesion);

// Ruta para cerrar sesión
router.post('/logout', authController.logout);

// Rutas protegidas para gestión de perfil
router.get('/perfil', validarAuth, authController.obtenerPerfil);
router.put('/actualizar-perfil', validarAuth, authController.actualizarPerfil);
router.delete('/eliminar-cuenta', validarAuth, authController.eliminarCuenta);

module.exports = router;
