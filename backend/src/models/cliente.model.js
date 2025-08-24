/**
 * @file Modelo de Cliente para la base de datos MongoDB usando Mongoose
 * 
 * Define el esquema y modelo de Cliente para PetMarket.
 * Incluye validaciones de campos, tipos y valores por defecto.
 * 
 * @module models/Cliente
 */

const mongoose = require("../config/connection");

/* ============================
   Esquema
   ============================ */

/**
 * Define las propiedades y validaciones del cliente.
 * @typedef {Object} Cliente
 * @property {string} nombre - Nombre del cliente. Obligatorio, 2-50 caracteres, solo letras y espacios.
 * @property {string} email - Correo electrónico único y válido. Obligatorio.
 * @property {string} contrasena - Contraseña mínima 6 caracteres, al menos una letra y un número. Obligatoria.
 * @property {string} [telefono] - Teléfono opcional, 7-15 dígitos.
 * @property {string} [direccion] - Dirección opcional, 5-100 caracteres.
 * @property {string} rol - Rol: "cliente" o "admin". Por defecto: "cliente".
 */

/**
 * Crea el esquema de Mongoose para Cliente
 * @private
 */
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

/* ============================
   Modelo
   ============================ */

/**
 * Crea el modelo de Mongoose para Cliente
 * @type {mongoose.Model<Cliente>}
 * @private
 */
function crearModeloCliente() {
  const esquema = crearEsquemaCliente();
  return mongoose.model("cliente", esquema);
}

// Exporta el modelo
const Cliente = crearModeloCliente();
module.exports = Cliente;
