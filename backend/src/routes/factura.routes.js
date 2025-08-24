const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');
const { validarAuth } = require('../middlewares/validateAuth');

router.get('/', facturaController.renderizarGestionFacturas);
router.get('/api', validarAuth, facturaController.obtenerFacturas);
router.post('/api', validarAuth, facturaController.crearFactura);
router.put('/:id', validarAuth, facturaController.actualizarFactura);
router.delete('/:id', validarAuth, facturaController.eliminarFactura);
module.exports = router;
