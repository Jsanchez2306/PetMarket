const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart-simple.controller');
const { validarAuth } = require('../middlewares/validateAuth');

console.log('🛒 Cargando rutas del carrito...');

// Middleware de autenticación para todas las rutas del carrito
router.use(validarAuth);

// Renderizar la vista del carrito
router.get('/', cartController.renderizarCarrito);

// Obtener el carrito del usuario (API)
router.get('/api/obtener', cartController.obtenerCarrito);

// Agregar producto al carrito
router.post('/api/agregar', cartController.agregarAlCarrito);

// Actualizar cantidad de un producto
router.put('/api/actualizar/:productId', cartController.actualizarCantidad);

// Eliminar producto del carrito
router.delete('/api/eliminar/:productId', cartController.eliminarDelCarrito);

// Limpiar todo el carrito
router.delete('/api/limpiar', cartController.limpiarCarrito);

// Procesar pago
router.post('/api/pagar', cartController.procesarPago);

console.log('✅ Rutas del carrito definidas');

module.exports = router;