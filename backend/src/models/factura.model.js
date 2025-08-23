const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
    cliente: {
        nombre: String,
        correo: String,
    },
    productos: [
        {
            nombre: String,
            cantidad: Number,
            precio: Number,
        }
    ],
    total: Number,
    fecha: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Factura', facturaSchema);
