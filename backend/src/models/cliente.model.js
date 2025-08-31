const mongoose = require("../config/connection");

function crearEsquemaCliente() {
  return new mongoose.Schema(
    {
      nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
        minlength: [2, "El nombre debe tener al menos 2 caracteres"],
        maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
        match: [/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/, "El nombre solo puede contener letras y espacios"],
      },
      email: {
        type: String,
        required: [true, "El correo electrónico es obligatorio"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El formato del correo electrónico no es válido"],
      },
      contrasena: {
        type: String,
        required: [true, "La contraseña es obligatoria"],
        trim: true,
        minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
        match: [
          /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
          "La contraseña debe contener al menos una letra y un número",
        ],
      },
      telefono: {
        type: String,
        trim: true,
        match: [/^[0-9]{7,15}$/, "El teléfono debe tener entre 7 y 15 dígitos numéricos"],
      },
      direccion: {
        type: String,
        trim: true,
        minlength: [5, "La dirección debe tener al menos 5 caracteres"],
        maxlength: [100, "La dirección no puede exceder los 100 caracteres"],
      },
      rol: {
        type: String,
        enum: {
          values: ["cliente", "admin"],
          message: 'El rol debe ser "cliente" o "admin"',
        },
        default: "cliente",
      },
    },
    { versionKey: false }
  );
}

function crearModeloCliente() {
  const esquema = crearEsquemaCliente();
  return mongoose.model("cliente", esquema);
}

const Cliente = crearModeloCliente();
module.exports = Cliente;
