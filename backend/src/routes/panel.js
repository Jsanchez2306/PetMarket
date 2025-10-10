const express = require('express');
const router = express.Router();

const panelController = require('../controllers/panel.controller');
const { validarAuth, validarEmpleado } = require('../middlewares/validateAuth');

// Permitir acceso a empleados y administradores
router.get('/', validarAuth, validarEmpleado, panelController.mostrarPanel);

module.exports = router;
