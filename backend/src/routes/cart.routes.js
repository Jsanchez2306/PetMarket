const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validarAuthCarrito } = require('../middlewares/validateAuth');

console.log('🛒 Cargando definiciones de rutas del carrito...');

// Ruta de prueba simple (sin autenticación)
router.get('/test', (req, res) => {
    console.log('🧪 Ruta de prueba del carrito funcionando');
    res.json({ mensaje: 'Rutas del carrito funcionando correctamente' });
});

// Renderizar vista del carrito (requiere autenticación)
router.get('/', validarAuthCarrito, cartController.renderizarCarrito);

// API Routes
router.get('/api', validarAuthCarrito, cartController.obtenerCarrito);
router.get('/api/count', validarAuthCarrito, cartController.contarItems);

// Ruta de prueba para agregar sin autenticación (TEMPORAL)
router.post('/api/agregar-test', (req, res) => {
    console.log('🧪 Ruta de prueba agregar funcionando');
    console.log('Body recibido:', req.body);
    res.json({ mensaje: 'Ruta agregar funcionando', body: req.body });
});

router.post('/api/agregar', validarAuthCarrito, cartController.agregarAlCarrito);
router.put('/api/actualizar/:productId', validarAuthCarrito, cartController.actualizarCantidad);
router.delete('/api/eliminar/:productId', validarAuthCarrito, cartController.eliminarDelCarrito);
router.delete('/api/limpiar', validarAuthCarrito, cartController.limpiarCarrito);
router.post('/api/pagar', validarAuthCarrito, cartController.procesarPago);

console.log('✅ Rutas del carrito definidas:');
console.log('  GET /carrito/test (PRUEBA)');
console.log('  GET /carrito/');
console.log('  GET /carrito/api');
console.log('  GET /carrito/api/count');
console.log('  POST /carrito/api/agregar');
console.log('  PUT /carrito/api/actualizar/:productId');
console.log('  DELETE /carrito/api/eliminar/:productId');
console.log('  DELETE /carrito/api/limpiar');
console.log('  POST /carrito/api/pagar');

module.exports = router;