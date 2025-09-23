const express = require('express');
const router = express.Router();
const productosController = require('../controllers/producto.controller');
const { validarAuth } = require('../middlewares/validateAuth');

// Vista gestión (admin)
router.get('/',validarAuth, productosController.renderizarGestionProductos);

// Catálogo / API
router.get('/api/aleatorios', productosController.obtenerProductosAleatorios);
router.get('/api/filtros', productosController.obtenerProductosConFiltros);
router.get('/api', productosController.obtenerProductos);

// CRUD
router.post('/',validarAuth, productosController.uploadImagen, productosController.crearProducto);
router.put('/:id',validarAuth, productosController.uploadImagen, productosController.actualizarProducto);
router.delete('/:id',validarAuth, productosController.eliminarProducto);

module.exports = router;