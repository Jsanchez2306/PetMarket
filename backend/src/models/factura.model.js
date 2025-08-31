const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
    cliente: {
        nombre: {
            type: String,
            required: [true, "El nombre del cliente es obligatorio"],
            trim: true,
            minlength: [2, "El nombre del cliente debe tener al menos 2 caracteres"],
            maxlength: [50, "El nombre del cliente no puede exceder los 50 caracteres"],
            match: [/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/, "El nombre del cliente solo puede contener letras y espacios"]
        },
        correo: {
            type: String,
            required: [true, "El correo del cliente es obligatorio"],
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El correo del cliente no es válido"]
        }
    },
    productos: [
        {
            nombre: {
                type: String,
                required: [true, "El nombre del producto es obligatorio"],
                trim: true,
                minlength: [2, "El nombre del producto debe tener al menos 2 caracteres"],
                maxlength: [100, "El nombre del producto no puede exceder los 100 caracteres"]
            },
            cantidad: {
                type: Number,
                required: [true, "La cantidad del producto es obligatoria"],
                min: [1, "La cantidad del producto debe ser al menos 1"]
            },
            precio: {
                type: Number,
                required: [true, "El precio del producto es obligatorio"],
                min: [0, "El precio del producto no puede ser negativo"]
            }
        }
    ],
    total: {
        type: Number,
        required: [true, "El total de la factura es obligatorio"],
        min: [0, "El total no puede ser negativo"]
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

module.exports = mongoose.model('Factura', facturaSchema);
