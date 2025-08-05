// routes/cliente.routes.js
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');

router.get('/', clienteController.renderizarGestionClientes);
router.get('/api', clienteController.obtenerClientes);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

module.exports = router;
