const mongoose = require("mongoose");

const facturaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  items: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
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
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true
  },
  iva: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ["Efectivo", "Tarjeta", "Transferencia"],
    default: "Efectivo"
  },
  estado: {
    type: String,
    enum: ["Pendiente", "Pagada", "Anulada"],
    default: "Pendiente"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Factura", facturaSchema);
