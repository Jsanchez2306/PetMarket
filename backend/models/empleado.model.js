const mongoose = require('../config/conect.js');

const empleadoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    apellido: {
        type: String,
        required: true
    },
    cedula: {
        type: String,
        required: true,
        unique: true
    },
    correo: {
        type: String,
        required: true,
        unique: true
    },
    telefono: {
        type: String,
        required: true
    },
    direccion: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
},
   {
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

const empleado = mongoose.model('empleado', empleadoSchema);

module.exports = empleado;
