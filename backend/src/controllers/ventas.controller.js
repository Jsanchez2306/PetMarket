const Venta = require('../models/venta.model');
const Cliente = require('../models/cliente.model');
const Producto = require('../models/producto.model');

/**
 * Obtener todas las ventas con filtros opcionales
 */
const obtenerVentas = async (req, res) => {
  try {
    const { estado, fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (estado && estado !== 'todos') {
      filtros.estadoEntrega = estado;
    }
    
    if (fechaInicio || fechaFin) {
      filtros.fechaCompra = {};
      if (fechaInicio) {
        filtros.fechaCompra.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
        filtros.fechaCompra.$lte = fechaFinDate;
      }
    }
    
    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener ventas con paginación y población
    const ventas = await Venta.find(filtros)
      .populate('cliente', 'nombre email telefono direccion')
      .populate('productos.producto', 'nombre precio imagen')
      .sort({ fechaCompra: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total para paginación
    const total = await Venta.countDocuments(filtros);
    
    res.json({
      success: true,
      ventas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

/**
 * Obtener contador de ventas sin entregar
 */
const obtenerContadorSinEntregar = async (req, res) => {
  try {
    const count = await Venta.countDocuments({ estadoEntrega: 'sin entregar' });
    
    res.json({
      success: true,
      count
    });
    
  } catch (error) {
    console.error('Error obteniendo contador de ventas sin entregar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

/**
 * Actualizar estado de entrega de una venta
 */
const actualizarEstadoEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoEntrega } = req.body;
    
    // Validar estado
    const estadosValidos = ['sin entregar', 'en camino', 'entregado'];
    if (!estadosValidos.includes(estadoEntrega)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de entrega no válido'
      });
    }
    
    const venta = await Venta.findByIdAndUpdate(
      id, 
      { 
        estadoEntrega,
        fechaActualizacion: new Date()
      }, 
      { new: true }
    ).populate('cliente', 'nombre email telefono direccion')
     .populate('productos.producto', 'nombre precio imagen');
    
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      venta
    });
    
  } catch (error) {
    console.error('Error actualizando estado de entrega:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

/**
 * Obtener estadísticas de ventas
 */
const obtenerEstadisticasVentas = async (req, res) => {
  try {
    const totalVentas = await Venta.countDocuments();
    const ventasSinEntregar = await Venta.countDocuments({ estadoEntrega: 'sin entregar' });
    const ventasEnCamino = await Venta.countDocuments({ estadoEntrega: 'en camino' });
    const ventasEntregadas = await Venta.countDocuments({ estadoEntrega: 'entregado' });
    
    // Calcular ingresos totales
    const ventasConIngresos = await Venta.aggregate([
      {
        $group: {
          _id: null,
          totalIngresos: { $sum: '$total' }
        }
      }
    ]);
    
    const totalIngresos = ventasConIngresos.length > 0 ? ventasConIngresos[0].totalIngresos : 0;
    
    res.json({
      success: true,
      estadisticas: {
        totalVentas,
        ventasSinEntregar,
        ventasEnCamino,
        ventasEntregadas,
        totalIngresos
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

module.exports = {
  obtenerVentas,
  obtenerContadorSinEntregar,
  actualizarEstadoEntrega,
  obtenerEstadisticasVentas
};