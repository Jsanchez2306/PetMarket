const mongoose = require("mongoose");

const facturaSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: true
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
    enum: ["efectivo", "tarjeta", "transferencia"],
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

module.exports = mongoose.model("Factura", facturaSchema);
