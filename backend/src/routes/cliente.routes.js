const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { validarAuth } = require('../middlewares/validateAuth');

router.get('/', clienteController.renderizarGestionClientes);
router.get('/api', validarAuth, clienteController.obtenerClientes);
router.put('/:id', validarAuth, clienteController.actualizarCliente);
router.delete('/:id', validarAuth, clienteController.eliminarCliente);

module.exports = router;