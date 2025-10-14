console.log('🔥 AUTH ROUTES CARGADAS - ' + new Date().toISOString());
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Rutas para registro y login
router.post('/registro', authController.registro);
// Logger ligero para diagnosticar llegada a la ruta
router.post('/login', (req, res, next) => {
	try {
		console.log('🚨 [AUTH] POST /auth/login');
		if (req && req.body) {
			const email = (req.body.email || '').toString();
			console.log('� email:', email);
		}
	} catch {}
	next();
}, authController.login);

// Ruta para recuperación de contraseña
router.post('/recuperar-password', authController.recuperarPassword);

// Ruta para verificar autenticación
router.get('/verify', authController.verificarSesion);

// Ruta para revalidar sesión del servidor con JWT
router.post('/revalidate-session', validarAuth, authController.revalidarSesion);

// Ruta para cerrar sesión
router.post('/logout', authController.logout);

// Rutas protegidas para gestión de perfil
router.get('/perfil', validarAuth, authController.obtenerPerfil);
router.put('/actualizar-perfil', validarAuth, authController.actualizarPerfil);
router.delete('/eliminar-cuenta', validarAuth, authController.eliminarCuenta);

module.exports = router;
