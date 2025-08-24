/**
 * @file Modelo de Factura para la base de datos MongoDB usando Mongoose
 * @module models/Factura
 */

const mongoose = require('mongoose');

/**
 * Esquema de un cliente dentro de la factura
 * @typedef {Object} ClienteFactura
 * @property {string} nombre - Nombre del cliente
 * @property {string} correo - Correo electrónico del cliente
 */

/**
 * Esquema de un producto dentro de la factura
 * @typedef {Object} ProductoFactura
 * @property {string} nombre - Nombre del producto
 * @property {number} cantidad - Cantidad del producto
 * @property {number} precio - Precio unitario del producto
 */

/**
 * Esquema de una factura
 * @typedef {Object} Factura
 * @property {ClienteFactura} cliente - Información del cliente
 * @property {ProductoFactura[]} productos - Lista de productos
 * @property {number} total - Total de la factura
 * @property {Date} fecha - Fecha de creación de la factura, por defecto la fecha actual
 */

/**
 * Esquema de Mongoose para Factura
 * @type {mongoose.Schema<Factura>}
 */
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

/**
 * Modelo de Mongoose para Factura
 * @type {mongoose.Model<Factura>}
 */
module.exports = mongoose.model('Factura', facturaSchema);
