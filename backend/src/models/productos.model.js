/**
 * @file Modelo de Producto para la base de datos MongoDB usando Mongoose
 * @module models/Producto
 */

const mongoose = require("../config/connection");

/**
 * Esquema de un producto
 * @typedef {Object} Producto
 * @property {string} nombre - Nombre del producto (2-100 caracteres)
 * @property {string} descripcion - Descripción del producto (10-1000 caracteres)
 * @property {string} imagen - URL de la imagen del producto
 * @property {number} precio - Precio del producto, no negativo
 * @property {number} stock - Stock disponible, no negativo
 * @property {string} categoria - Categoría del producto ("accesorios", "ropa", "juguetes", "alimentos")
 * @property {Date} fechaRegistro - Fecha de registro del producto, por defecto la fecha actual
 */

/**
 * Esquema de Mongoose para Producto
 * @type {mongoose.Schema<Producto>}
 */
const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
    },
    descripcion: {
      type: String,
      required: [true, "La descripción del producto es obligatoria"],
      trim: true,
      minlength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxlength: [1000, "La descripción no puede exceder los 1000 caracteres"],
    },
    imagen: {
      type: String,
      required: [true, "La URL de la imagen es obligatoria"],
      trim: true,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/, "La imagen debe ser una URL válida de imagen"],
    },
    precio: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
    },
    categoria: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      enum: {
        values: ["accesorios", "ropa", "juguetes", "alimentos"],
        message: 'La categoría debe ser una de: "accesorios", "ropa", "juguetes" o "alimentos"',
      },
    },
    fechaRegistro: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

/**
 * Modelo de Mongoose para Producto
 * @type {mongoose.Model<Producto>}
 */
const Producto = mongoose.model("producto", productoSchema);

module.exports = Producto;
