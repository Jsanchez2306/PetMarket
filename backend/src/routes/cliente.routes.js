const express = require('express');
const router = express.Router('../');
const clienteController = require('../controllers/cliente.controller');
const { validarAuth } = require('../middlewares/validateAuth');

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes en el sistema
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Renderiza la vista de gestión de clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Página HTML de gestión de clientes
 */
router.get('/', clienteController.renderizarGestionClientes);

/**
 * @swagger
 * /clientes/api:
 *   get:
 *     summary: Obtiene todos los clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cliente'
 */
router.get('/api', validarAuth, clienteController.obtenerClientes);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del cliente
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Datos del cliente a actualizar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 */
router.put('/:id', clienteController.actualizarCliente);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del cliente
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 */
router.delete('/:id', validarAuth, clienteController.eliminarCliente);

/**
 * @swagger
 * /clientes/api/buscar:
 *   get:
 *     summary: Busca un cliente por email
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         description: Email del cliente a buscar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/api/buscar', clienteController.buscarClientePorEmail);

module.exports = router;
