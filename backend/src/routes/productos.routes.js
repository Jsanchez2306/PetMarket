const express = require('express');
const router = express.Router();
const productosController = require('../controllers/producto.controller');

// Vista gestión (admin)
router.get('/', productosController.renderizarGestionProductos);

// Catálogo / API
router.get('/api/aleatorios', productosController.obtenerProductosAleatorios);
router.get('/api/filtros', productosController.obtenerProductosConFiltros);
router.get('/api', productosController.obtenerProductos);

// CRUD
router.post('/', productosController.uploadImagen, productosController.crearProducto);
router.put('/:id', productosController.uploadImagen, productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;