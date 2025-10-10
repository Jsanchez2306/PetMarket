const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');

router.get('/admin', perfilController.mostrarPerfil);
router.post('/admin/actualizar', perfilController.actualizarPerfil);
router.post('/admin/cambiar-contrasena', perfilController.cambiarContrasena);

router.get('/cliente', perfilController.mostrarPerfilCliente);
router.post('/cliente/actualizar', perfilController.actualizarPerfilCliente);
router.post('/cliente/cambiar-contrasena', perfilController.cambiarContrasenaCliente);

module.exports = router;