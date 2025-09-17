const express = require('express');
const router = express.Router();
const productosController = require('../controllers/producto.controller');

// Renderizar vista
router.get('/', productosController.renderizarGestionProductos);

// API CRUD con Multer para subir imagen
router.post('/', productosController.uploadImagen, productosController.crearProducto);
router.get('/api', productosController.obtenerProductos);
router.get('/api/aleatorios', productosController.obtenerProductosAleatorios);
router.get('/api/filtros', productosController.obtenerProductosConFiltros);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;