const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');

// Crear una nueva factura
router.post('/', facturaController.crearFactura);

// Obtener todas las facturas
router.get('/', facturaController.listarFacturas);

// Buscar facturas por correo del cliente
router.get('/buscar/correo/:correo', facturaController.buscarPorCorreo);

// Obtener una factura por ID
router.get('/:id', facturaController.obtenerFacturaPorId);

// Actualizar una factura por ID
router.put('/:id', facturaController.actualizarFactura);

// Eliminar una factura por ID
router.delete('/:id', facturaController.eliminarFactura);

module.exports = router;
