const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');

router.get('/', perfilController.mostrarPerfil);
router.post('/actualizar', perfilController.actualizarPerfil);
router.post('/cambiar-contrasena', perfilController.cambiarContrasena);

module.exports = router;