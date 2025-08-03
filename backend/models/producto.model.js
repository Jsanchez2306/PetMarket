const mongoose = require('../config/conect.js'); // Asegúrate de que la ruta sea correcta

const productoSchema = new mongoose.Schema({
  imagen: {
    type: String,
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    enum: ['accesorios', 'ropa', 'juguetes', 'alimentos'] // Puedes ajustar esto según tus categorías
  }
}, {
  fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

const producto = mongoose.model('producto', productoSchema);

module.exports = producto;
