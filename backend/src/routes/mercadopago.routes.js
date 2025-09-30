const express = require('express');
const router = express.Router();
const mercadopagoController = require('../controllers/mercadopago.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Ruta para crear preferencia de pago
router.post('/create-preference', validarAuth, mercadopagoController.crearPreferencia);

// Rutas para callbacks de Mercado Pago (sin auth porque vienen de Mercado Pago)
router.get('/success', mercadopagoController.success);
router.get('/failure', mercadopagoController.failure);
router.get('/pending', mercadopagoController.pending);

// Webhook para notificaciones de Mercado Pago (sin validación de auth)
router.post('/webhook', mercadopagoController.webhook);

// Ruta de prueba simple
router.get('/test-token', mercadopagoController.testToken);

module.exports = router;