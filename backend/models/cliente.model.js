const mongoose = require("../config/conect");

const esquemaCliente = mongoose.Schema({

    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    contrasena: {
        type: String,
        required: true,
        minLength: 6
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

const cliente = mongoose.model('cliente', esquemaCliente);

module.exports = cliente;