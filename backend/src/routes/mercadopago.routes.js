const express = require('express');
const router = express.Router();
const mercadopagoController = require('../controllers/mercadopago.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Ruta para crear preferencia de pago desde localStorage
router.post('/create-preference', validarAuth, mercadopagoController.crearPreferenciaLocalStorage);

// Ruta para crear preferencia de pago (carrito BD - legacy)
router.post('/create-preference-db', validarAuth, mercadopagoController.crearPreferencia);

// Rutas para callbacks de Mercado Pago (sin auth porque vienen de Mercado Pago)
router.get('/success', mercadopagoController.success);
router.get('/failure', mercadopagoController.failure);
router.get('/pending', mercadopagoController.pending);

// Webhook para notificaciones de Mercado Pago (sin validación de auth)
router.post('/webhook', mercadopagoController.webhook);

// Ruta de prueba simple
router.get('/test-token', mercadopagoController.testToken);

// Ruta para probar descuento de stock manualmente
router.post('/test-stock', mercadopagoController.testDescuentoStock);

module.exports = router;