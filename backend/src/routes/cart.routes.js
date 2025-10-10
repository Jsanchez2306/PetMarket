const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validarAuthCarrito } = require('../middlewares/validateAuth');

console.log('🛒 Cargando definiciones de rutas del carrito...');

// CAMBIO: Renderizar vista del carrito SIN autenticación (localStorage)
router.get('/', cartController.renderizarCarrito);

// API Routes - DESPROTEGIDAS para localStorage (excepto checkout)
router.get('/api', cartController.obtenerCarrito);
router.get('/api/count', cartController.contarItems);

router.post('/api/agregar', cartController.agregarAlCarrito);
router.put('/api/actualizar/:productId', cartController.actualizarCantidad);
router.delete('/api/eliminar/:productId', cartController.eliminarDelCarrito);
router.delete('/api/limpiar', cartController.limpiarCarrito);
router.post('/api/pagar', cartController.procesarPago);

// RUTA PROTEGIDA: Solo el checkout requiere autenticación
router.post('/checkout', validarAuthCarrito, cartController.checkoutLocalStorage);

console.log('✅ Rutas del carrito definidas:');
console.log('  GET /carrito/ (� PÚBLICA - localStorage)');
console.log('  GET /carrito/api (� PÚBLICA)');
console.log('  GET /carrito/api/count (� PÚBLICA)');
console.log('  POST /carrito/api/agregar (� PÚBLICA)');
console.log('  PUT /carrito/api/actualizar/:productId (� PÚBLICA)');
console.log('  DELETE /carrito/api/eliminar/:productId (� PÚBLICA)');
console.log('  DELETE /carrito/api/limpiar (� PÚBLICA)');
console.log('  POST /carrito/api/pagar (🔓 PÚBLICA)');
console.log('  POST /carrito/checkout (🔒 PROTEGIDA - requiere autenticación)');

module.exports = router;