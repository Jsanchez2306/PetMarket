const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { validarAuth, validarEmpleado } = require('../middlewares/validateAuth');

// Middleware de autenticación para todas las rutas (empleados y admin)
router.use(validarAuth);
router.use(validarEmpleado);

// Rutas API
router.get('/api/estadisticas', dashboardController.obtenerEstadisticas);
router.get('/api/productos-bajo-stock', dashboardController.obtenerProductosBajoStock);
router.get('/api/actividad-reciente', dashboardController.obtenerActividadReciente);

// Ruta para renderizar vista del dashboard (si es necesario)
router.get('/', (req, res) => {
  res.render('panel', {
    title: 'Dashboard Administrativo - PetMarket',
    usuario: req.user,
    tipoUsuario: req.user.tipoUsuario,
    esEmpleado: req.user.tipoUsuario === 'empleado',
    esCliente: req.user.tipoUsuario === 'cliente',
    esAdmin: req.user.rol === 'admin'
  });
});

module.exports = router;