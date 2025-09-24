const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');
const { validarAuth, validarAdmin } = require('../middlewares/validateAuth');

/**
 * @swagger
 * tags:
 *   name: Empleados
 *   description: Gestión de empleados en el sistema
 */

// Vista principal de gestión de empleados
router.get('/',validarAuth, validarAdmin, empleadoController.renderizarGestionEmpleados);

// API: Obtener todos los empleados
router.get('/api',validarAuth, validarAdmin, empleadoController.obtenerEmpleados);

// API: Crear nuevo empleado
router.post('/',validarAuth, validarAdmin, empleadoController.crearEmpleado);

// API: Actualizar empleado por ID
router.put('/:id',validarAuth, validarAdmin, empleadoController.actualizarEmpleado);

// API: Eliminar empleado por ID
router.delete('/:id',validarAuth, validarAdmin, empleadoController.eliminarEmpleado);

module.exports = router;
