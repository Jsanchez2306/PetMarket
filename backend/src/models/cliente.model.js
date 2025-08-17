const mongoose = require("../config/connection");

const esquemaCliente = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
      lowercase: true,
      trim: true,
    },
    contrasena: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    rol: {
      type: String,
      enum: ["cliente", "admin"],
      required: true,
      default: "cliente",
    },
  },
  { versionKey: false }
);

const Cliente = mongoose.model("cliente", esquemaCliente);

module.exports = Cliente;
