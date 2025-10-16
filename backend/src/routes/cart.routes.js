const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validarAuthCarrito } = require('../middlewares/validateAuth');


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

 

module.exports = router;