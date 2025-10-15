const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');
const Producto = require('../models/producto.model');
const Venta = require('../models/venta.model');
const Factura = require('../models/factura.model');


/**
 * Obtener estadísticas generales del sistema.
 * @params req, res - solicitud y respuesta HTTP
 * @return Estadísticas de ventas, productos, clientes, empleados
 * @author codenova
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy);
    finHoy.setDate(finHoy.getDate() + 1);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    // Paralelizar todas las consultas para mejor rendimiento
    const [
      // Clientes
      totalClientes,
      clientesDelMes,
      
      // Empleados
      totalEmpleados,
      
      // Productos
      totalProductos,
      productosDisponibles,
      productosBajoStock,
      
      // Ventas de hoy
      ventasHoy,
      ventasDelMes,
      ventasMesAnterior,
      
      // Estados de pedidos
      pedidosSinEntregar,
      pedidosEnCamino,
      pedidosEntregados,
      
      // Ingresos
      ingresosHoy,
      ingresosDelMes
    ] = await Promise.all([
      // Clientes
      Cliente.countDocuments(),
      Cliente.countDocuments({ 
        createdAt: { $gte: inicioMes } 
      }),
      
      // Empleados
      Empleado.countDocuments(),
      
      // Productos
      Producto.countDocuments(),
      Producto.countDocuments({ stock: { $gt: 0 } }),
      Producto.countDocuments({ stock: { $lt: 10, $gt: 0 } }),
      
      // Ventas cantidad
      Venta.countDocuments({ 
        fechaCompra: { $gte: inicioHoy, $lt: finHoy } 
      }),
      Venta.countDocuments({ 
        fechaCompra: { $gte: inicioMes } 
      }),
      Venta.countDocuments({ 
        fechaCompra: { $gte: mesAnterior, $lt: inicioMes } 
      }),
      
      // Estados de pedidos
      Venta.countDocuments({ estadoEntrega: 'sin entregar' }),
      Venta.countDocuments({ estadoEntrega: 'en camino' }),
      Venta.countDocuments({ estadoEntrega: 'entregado' }),
      
      // Ingresos
      Venta.aggregate([
        { 
          $match: { 
            fechaCompra: { $gte: inicioHoy, $lt: finHoy },
            estadoPago: 'approved'
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$total' } 
          } 
        }
      ]),
      Venta.aggregate([
        { 
          $match: { 
            fechaCompra: { $gte: inicioMes },
            estadoPago: 'approved'
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$total' } 
          } 
        }
      ])
    ]);

    // Calcular productos sin stock
    const productosSinStock = await Producto.countDocuments({ stock: 0 });

    // Calcular comparación con mes anterior
    const ventasMesAnteriorCount = ventasMesAnterior || 0;
    const diferenciaVentas = ventasDelMes - ventasMesAnteriorCount;
    const porcentajeCambio = ventasMesAnteriorCount > 0 
      ? ((diferenciaVentas / ventasMesAnteriorCount) * 100).toFixed(1)
      : 100;

    // Obtener productos con bajo stock (detalles)
    const productosConBajoStock = await Producto.find({ 
      stock: { $lt: 10, $gt: 0 } 
    }).select('nombre stock').limit(5);

    const estadisticas = {
      // Métricas principales
      clientes: {
        total: totalClientes,
        nuevosDelMes: clientesDelMes
      },
      empleados: {
        total: totalEmpleados
      },
      productos: {
        total: totalProductos,
        disponibles: productosDisponibles,
        sinStock: productosSinStock,
        bajoStock: productosBajoStock
      },
      ventas: {
        hoy: ventasHoy,
        mes: ventasDelMes,
        mesAnterior: ventasMesAnteriorCount,
        cambioMensual: {
          diferencia: diferenciaVentas,
          porcentaje: porcentajeCambio
        }
      },
      
      // Estado de pedidos
      pedidos: {
        sinEntregar: pedidosSinEntregar,
        enCamino: pedidosEnCamino,
        entregados: pedidosEntregados,
        total: pedidosSinEntregar + pedidosEnCamino + pedidosEntregados
      },
      
      // Ingresos
      ingresos: {
        hoy: ingresosHoy[0]?.total || 0,
        mes: ingresosDelMes[0]?.total || 0
      },
      
      // Detalles adicionales
      alertas: {
        productosConBajoStock: productosConBajoStock,
        totalAlertas: productosBajoStock + productosSinStock
      }
    };

    res.json({
      success: true,
      estadisticas,
      fechaActualizacion: new Date()
    });

  } catch (error) {
  console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


/**
 * Obtener productos con bajo stock.
 * @params req, res - límite en req.query
 * @return Lista de productos con bajo stock
 * @author codenova
 */
const obtenerProductosBajoStock = async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    
    const productos = await Producto.find({ 
      $or: [
        { stock: 0 },
        { stock: { $lt: 10, $gt: 0 } }
      ]
    })
    .select('nombre stock precio imagen')
    .sort({ stock: 1 })
    .limit(parseInt(limite));

    res.json({
      success: true,
      productos
    });

  } catch (error) {
  console.error('Error obteniendo productos con bajo stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


/**
 * Obtener actividad reciente (ventas y clientes).
 * @params req, res - solicitud y respuesta HTTP
 * @return Listado de ventas y clientes recientes
 * @author codenova
 */
const obtenerActividadReciente = async (req, res) => {
  try {
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [ventasRecientes, clientesRecientes] = await Promise.all([
      Venta.find({ 
        fechaCompra: { $gte: hace7Dias } 
      })
      .populate('cliente', 'nombre email')
      .select('paymentId total estadoEntrega fechaCompra clienteNombre clienteEmail')
      .sort({ fechaCompra: -1 })
      .limit(5),
      
      Cliente.find({ 
        createdAt: { $gte: hace7Dias } 
      })
      .select('nombre email createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
    ]);

    res.json({
      success: true,
      actividad: {
        ventasRecientes,
        clientesRecientes
      }
    });

  } catch (error) {
  console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  obtenerEstadisticas,
  obtenerProductosBajoStock,
  obtenerActividadReciente
};