const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');
const { validarAuth, validarEmpleado } = require('../middlewares/validateAuth');

// Middleware de autenticación para todas las rutas
router.use(validarAuth);

// Middleware para verificar que sea admin o empleado
router.use(validarEmpleado);

// Rutas API
router.get('/api/ventas', ventasController.obtenerVentas);
router.get('/api/ventas/sin-entregar/count', ventasController.obtenerContadorSinEntregar);
router.get('/api/ventas/estadisticas', ventasController.obtenerEstadisticasVentas);
router.patch('/api/ventas/:id/estado', ventasController.actualizarEstadoEntrega);

// Ruta para la vista de ventas
router.get('/', (req, res) => {
  res.render('ventas', {
    title: 'Gestión de Ventas - PetMarket',
    currentPath: '/ventas'
  });
});

module.exports = router;