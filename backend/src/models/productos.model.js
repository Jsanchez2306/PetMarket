const mongoose = require("../config/connection");

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    imagen: {
      type: String,
      required: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    categoria: {
      type: String,
      required: true,
      enum: ["accesorios", "ropa", "juguetes", "alimentos"],
    },
  },
  {
    fechaRegistro: {
      type: Date,
      default: Date.now,
    },
  }
);

const producto = mongoose.model("producto", productoSchema);

module.exports = producto;
