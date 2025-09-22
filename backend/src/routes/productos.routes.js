const express = require('express');
const router = express.Router();
const productosController = require('../controllers/producto.controller');

// Renderizar vista
router.get('/', productosController.renderizarGestionProductos);

//Catalogo
router.get('/api/aleatorios', productosController.obtenerProductosAleatorios);
 router.get('/api/filtros', productosController.obtenerProductosConFiltros);

 //Crud
router.post('/', productosController.uploadImagen, productosController.crearProducto);
router.get('/api', productosController.obtenerProductos);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;