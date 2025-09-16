const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleado.controller');
const { validarAuth } = require('../middlewares/validateAuth');

/**
 * @swagger
 * tags:
 *   name: Empleados
 *   description: Gestión de empleados en el sistema
 */

// Vista principal de gestión de empleados
router.get('/', empleadoController.renderizarGestionEmpleados);

// API: Obtener todos los empleados
router.get('/api', empleadoController.obtenerEmpleados);

// API: Crear nuevo empleado
router.post('/', empleadoController.crearEmpleado);

// API: Actualizar empleado por ID
router.put('/:id',  empleadoController.actualizarEmpleado);

// API: Eliminar empleado por ID
router.delete('/:id', empleadoController.eliminarEmpleado);

module.exports = router;
