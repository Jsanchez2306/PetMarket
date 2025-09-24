const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');
const { validarAuth, validarEmpleado } = require('../middlewares/validateAuth');

// Rutas para vistas (EJS) - Solo empleados y admin
router.get('/', validarAuth, validarEmpleado, facturaController.renderizarGestionFacturas);
router.get('/crear', validarAuth, validarEmpleado, facturaController.renderizarCrearFactura);

// Rutas para API - Solo empleados y admin
router.get('/api', validarAuth, validarEmpleado, facturaController.obtenerFacturas);
router.get('/api/:id', validarAuth, validarEmpleado, facturaController.obtenerFacturaPorId);
router.post('/api', validarAuth, validarEmpleado, facturaController.crearFactura);
router.put('/api/:id', validarAuth, validarEmpleado, facturaController.actualizarFactura);
router.delete('/api/:id', validarAuth, validarEmpleado, facturaController.eliminarFactura);

// Rutas para funciones adicionales - Solo empleados y admin
router.post('/api/:id/enviar-correo', validarAuth, validarEmpleado, facturaController.enviarFacturaPorCorreo);
router.get('/api/:id/pdf', validarAuth, validarEmpleado, facturaController.generarFacturaPDF);

module.exports = router;
