const mongoose = require("../config/connection");

function soloNumeros(str) {
  return /^[0-9]+$/.test(str.trim());
}

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
      validate: {
        validator: function (v) {
          if (!v) return false;
          if (soloNumeros(v)) return false;
          return true;
        },
        message: "El nombre no puede ser solo números; agrega una descripción."
      }
    },
    descripcion: {
      type: String,
      required: [true, "La descripción del producto es obligatoria"],
      trim: true,
      minlength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxlength: [1000, "La descripción no puede exceder los 1000 caracteres"]
    },
    imagen: {
      type: String,
      required: [true, "La URL de la imagen es obligatoria"],
      trim: true,
      match: [
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i,
        "La imagen debe ser una URL válida de imagen"
      ],
    },
    public_id: {
      type: String,
      trim: true,
      // No lo hago required para no romper productos viejos; se puede backfillear.
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
      max: [1000, "El stock no puede superar 1000 unidades"]
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
    }
  },
  {
    versionKey: false,
  }
);

const Producto = mongoose.model("Producto", productoSchema);
module.exports = Producto;