const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Rutas para registro y login
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Ruta para recuperación de contraseña
router.post('/recuperar-password', authController.recuperarPassword);


// Rutas protegidas para gestión de perfil
router.put('/actualizar-perfil', validarAuth, authController.actualizarPerfil);
router.delete('/eliminar-cuenta', validarAuth, authController.eliminarCuenta);

module.exports = router;
