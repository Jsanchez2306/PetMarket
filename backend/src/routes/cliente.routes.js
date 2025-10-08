const express = require('express');
const router = express.Router('../');
const clienteController = require('../controllers/cliente.controller');
const { validarAuth, validarAdmin } = require('../middlewares/validateAuth');

router.get('/', validarAuth, validarAdmin, clienteController.renderizarGestionClientes);
router.get('/api', validarAuth, validarAdmin, clienteController.obtenerClientes);
router.post('/', validarAuth, validarAdmin, clienteController.crearCliente);
router.put('/:id', validarAuth, validarAdmin, clienteController.actualizarCliente);
router.delete('/:id', validarAuth, validarAdmin, clienteController.eliminarCliente);
router.get('/api/buscar', clienteController.buscarClientePorEmail);

module.exports = router;

