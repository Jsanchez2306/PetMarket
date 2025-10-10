const mongoose = require("mongoose");

const ventaSchema = new mongoose.Schema({
  // Información del pago
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Información del cliente
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: false // Puede ser null si no está registrado
  },
  clienteEmail: {
    type: String,
    required: true
  },
  clienteNombre: {
    type: String,
    required: true
  },
  clienteTelefono: {
    type: String,
    default: ""
  },
  clienteDireccion: {
    type: String,
    default: ""
  },
  
  // Productos comprados
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: false // Puede ser null si el producto ya no existe
      },
      nombre: {
        type: String,
        required: true
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1
      },
      precio: {
        type: Number,
        required: true,
        min: 0
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      imagen: {
        type: String,
        default: ""
      }
    }
  ],
  
  // Información financiera
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Información del pago
  metodoPago: {
    type: String,
    enum: ["mercadopago", "efectivo", "tarjeta", "transferencia"],
    default: "mercadopago"
  },
  estadoPago: {
    type: String,
    enum: ["pendiente", "approved", "rejected", "cancelled"],
    default: "approved"
  },
  
  // Estado de entrega
  estadoEntrega: {
    type: String,
    enum: ["sin entregar", "en camino", "entregado"],
    default: "sin entregar"
  },
  
  // Información adicional
  reference: {
    type: String,
    default: ""
  },
  observaciones: {
    type: String,
    default: ""
  },
  
  // Fechas
  fechaCompra: {
    type: Date,
    default: Date.now
  },
  fechaEnvio: {
    type: Date,
    default: null
  },
  fechaEntrega: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Middleware para actualizar fechas según el estado
ventaSchema.pre('save', function(next) {
  // Si el estado cambia a "en camino" y no tiene fecha de envío, agregarla
  if (this.estadoEntrega === 'en camino' && !this.fechaEnvio) {
    this.fechaEnvio = new Date();
  }
  
  // Si el estado cambia a "entregado" y no tiene fecha de entrega, agregarla
  if (this.estadoEntrega === 'entregado' && !this.fechaEntrega) {
    this.fechaEntrega = new Date();
  }
  
  next();
});

// Índices para mejorar rendimiento
ventaSchema.index({ paymentId: 1 });
ventaSchema.index({ clienteEmail: 1 });
ventaSchema.index({ estadoEntrega: 1 });
ventaSchema.index({ fechaCompra: -1 });

module.exports = mongoose.model("Venta", ventaSchema);