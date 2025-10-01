const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validarAuthCarrito } = require('../middlewares/validateAuth');

console.log('🛒 Cargando definiciones de rutas del carrito...');

// Renderizar vista del carrito (requiere autenticación)
router.get('/', validarAuthCarrito, cartController.renderizarCarrito);

// API Routes
router.get('/api', validarAuthCarrito, cartController.obtenerCarrito);
router.get('/api/count', validarAuthCarrito, cartController.contarItems);

router.post('/api/agregar', validarAuthCarrito, cartController.agregarAlCarrito);
router.put('/api/actualizar/:productId', validarAuthCarrito, cartController.actualizarCantidad);
router.delete('/api/eliminar/:productId', validarAuthCarrito, cartController.eliminarDelCarrito);
router.delete('/api/limpiar', validarAuthCarrito, cartController.limpiarCarrito);
router.post('/api/pagar', validarAuthCarrito, cartController.procesarPago);

console.log('✅ Rutas del carrito definidas:');
console.log('  GET /carrito/ (🔒 PROTEGIDA)');
console.log('  GET /carrito/api (🔒 PROTEGIDA)');
console.log('  GET /carrito/api/count (🔒 PROTEGIDA)');
console.log('  POST /carrito/api/agregar (🔒 PROTEGIDA)');
console.log('  PUT /carrito/api/actualizar/:productId (🔒 PROTEGIDA)');
console.log('  DELETE /carrito/api/eliminar/:productId (🔒 PROTEGIDA)');
console.log('  DELETE /carrito/api/limpiar (🔒 PROTEGIDA)');
console.log('  POST /carrito/api/pagar (🔒 PROTEGIDA)');

module.exports = router;