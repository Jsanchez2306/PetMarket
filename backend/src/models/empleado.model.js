const mongoose = require("../config/connection");

const empleadoSchema = new mongoose.Schema({
  cedula: {
    type: String,
    required: true,
    unique: true
},
  nombre: {
      type: String,
      required: true
  },
  email: {
      type: String,
      required: true,
      unique: true
  },
  contrasena: {
    type: String,
    required: true
},
  telefono: {
      type: String,
      required: true
  },
  direccion: {
      type: String,
      required: true
  }
},{ versionKey: false });

const Empleado = mongoose.model('admin', esquemaEmpleado);

module.exports = Empleado;
