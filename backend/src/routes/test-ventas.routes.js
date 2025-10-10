const express = require('express');
const router = express.Router();
const Venta = require('../models/venta.model');
const Cliente = require('../models/cliente.model');
const Producto = require('../models/producto.model');

/**
 * Crear datos de prueba para ventas
 */
router.post('/crear-datos-prueba', async (req, res) => {
  try {
    // Verificar si ya existen ventas
    const ventasExistentes = await Venta.countDocuments();
    if (ventasExistentes > 0) {
      return res.json({
        success: true,
        message: `Ya existen ${ventasExistentes} ventas en el sistema`
      });
    }

    // Obtener algunos clientes y productos para las ventas de prueba
    const clientes = await Cliente.find().limit(3);
    const productos = await Producto.find().limit(5);

    if (clientes.length === 0 || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se necesitan al menos algunos clientes y productos para crear datos de prueba'
      });
    }

    // Crear ventas de prueba
    const ventasPrueba = [
      {
        paymentId: 'test_payment_001',
        cliente: clientes[0]._id,
        productos: [
          {
            producto: productos[0]._id,
            cantidad: 2,
            precio: productos[0].precio
          },
          {
            producto: productos[1]._id,
            cantidad: 1,
            precio: productos[1].precio
          }
        ],
        total: (productos[0].precio * 2) + productos[1].precio,
        estadoEntrega: 'sin entregar',
        fechaVenta: new Date()
      },
      {
        paymentId: 'test_payment_002',
        cliente: clientes[1]._id,
        productos: [
          {
            producto: productos[2]._id,
            cantidad: 1,
            precio: productos[2].precio
          }
        ],
        total: productos[2].precio,
        estadoEntrega: 'en camino',
        fechaVenta: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ayer
      },
      {
        paymentId: 'test_payment_003',
        cliente: clientes[2]._id,
        productos: [
          {
            producto: productos[3]._id,
            cantidad: 3,
            precio: productos[3].precio
          },
          {
            producto: productos[4]._id,
            cantidad: 1,
            precio: productos[4].precio
          }
        ],
        total: (productos[3].precio * 3) + productos[4].precio,
        estadoEntrega: 'sin entregar',
        fechaVenta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Hace 2 días
      },
      {
        paymentId: 'test_payment_004',
        cliente: clientes[0]._id,
        productos: [
          {
            producto: productos[0]._id,
            cantidad: 1,
            precio: productos[0].precio
          }
        ],
        total: productos[0].precio,
        estadoEntrega: 'entregado',
        fechaVenta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Hace una semana
      }
    ];

    const ventasCreadas = await Venta.insertMany(ventasPrueba);

    res.json({
      success: true,
      message: `Se crearon ${ventasCreadas.length} ventas de prueba`,
      ventas: ventasCreadas.length
    });

  } catch (error) {
    console.error('Error creando datos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando datos de prueba',
      error: error.message
    });
  }
});

/**
 * Limpiar datos de prueba
 */
router.delete('/limpiar-datos-prueba', async (req, res) => {
  try {
    const resultado = await Venta.deleteMany({ paymentId: { $regex: '^test_payment_' } });
    
    res.json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} ventas de prueba`
    });

  } catch (error) {
    console.error('Error limpiando datos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando datos de prueba',
      error: error.message
    });
  }
});

module.exports = router;