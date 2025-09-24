const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Rutas para vistas (EJS)
router.get('/', facturaController.renderizarGestionFacturas);
router.get('/crear', validarAuth, facturaController.renderizarCrearFactura);

// Rutas para API
router.get('/api', validarAuth, facturaController.obtenerFacturas);
router.get('/api/:id', validarAuth, facturaController.obtenerFacturaPorId);
router.post('/api', validarAuth, facturaController.crearFactura);
router.put('/api/:id', validarAuth, facturaController.actualizarFactura);
router.delete('/api/:id', validarAuth, facturaController.eliminarFactura);

// Rutas para funciones adicionales
router.post('/api/:id/enviar-correo', validarAuth, facturaController.enviarFacturaPorCorreo);
router.get('/api/:id/pdf', validarAuth, facturaController.generarFacturaPDF);

module.exports = router;
