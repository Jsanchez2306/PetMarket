const mongoose = require("mongoose");

const facturaSchema = new mongoose.Schema({
  numero: {
    type: Number,
    unique: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: false // Puede ser null para clientes manuales o no especificados
  },
  nombreCliente: {
    type: String,
    required: true
  },
  emailCliente: {
    type: String,
    required: true
  },
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Empleado",
    required: false // Para facturas automáticas del carrito
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true
      },
      nombre: {
        type: String,
        required: true
      },
      precio: {
        type: Number,
        required: true,
        min: 0
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  iva: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  metodoPago: {
    type: String,
    enum: ["efectivo", "tarjeta", "transferencia", "mercadopago"],
    default: "efectivo"
  },
  estado: {
    type: String,
    enum: ["pendiente", "pagada", "anulada"],
    default: "pendiente"
  },
  observaciones: {
    type: String,
    default: ""
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para auto-generar número de factura
facturaSchema.pre('save', async function(next) {
  if (this.isNew && !this.numero) {
    try {
      const lastFactura = await this.constructor.findOne({}, {}, { sort: { 'numero': -1 } });
      this.numero = lastFactura ? lastFactura.numero + 1 : 1001; // Empezar desde 1001
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Factura", facturaSchema);
