const express = require('express');
const router = express.Router();
const productosController = require('../controllers/producto.controller');
const { validarAuth, validarEmpleado } = require('../middlewares/validateAuth');

// Vista gestión (empleados y admin)
router.get('/',validarAuth, validarEmpleado, productosController.renderizarGestionProductos);

// Catálogo / API (público)
router.get('/api/aleatorios', productosController.obtenerProductosAleatorios);
router.get('/api/filtros', productosController.obtenerProductosConFiltros);
router.get('/api', productosController.obtenerProductos);

// CRUD (empleados y admin)
router.post('/',validarAuth, validarEmpleado, productosController.uploadImagen, productosController.crearProducto);
router.put('/:id',validarAuth, validarEmpleado, productosController.uploadImagen, productosController.actualizarProducto);
router.delete('/:id',validarAuth, validarEmpleado, productosController.eliminarProducto);

module.exports = router;