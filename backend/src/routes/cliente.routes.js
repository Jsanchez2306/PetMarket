const express = require('express');
const router = express.Router();
const Cliente = require('../models/cliente.model');

router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.render('gestionClientes', { clientes });
  } catch (err) {
    res.status(500).send('Error al obtener clientes');
  }
});

router.post('/registro', async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);
    const clienteGuardado = await nuevoCliente.save();
    res.status(201).json(clienteGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear el cliente', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Cliente.findByIdAndUpdate(id, req.body, { new: true });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al actualizar', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.sendStatus(500);
  }
});

module.exports = router;

