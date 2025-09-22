/**
 * Script de backfill para asignar public_id a productos que aún no lo tienen.
 * Ejecutar UNA sola vez (o cuando agregues productos antiguos sin public_id).
 *
 * Requisitos:
 * - Variables de entorno de conexión a Mongo ya funcionando
 * - Modelo Producto con campo public_id (no requerido)
 */

require('dotenv').config();

// Ajusta esta ruta según tu proyecto.
// Si tu conexión está en config/connection.js exportando mongoose (mongoose = require('mongoose'))
const mongoose = require('../src/config/connection');
const Producto = require('../src/models/producto.model');

/**
 * Extrae el public_id desde la URL segura de Cloudinary.
 * Ejemplo URL:
 * https://res.cloudinary.com/tucloud/image/upload/v1727020150/productos/abcd1234xyz.jpg
 * Resultado: productos/abcd1234xyz
 */
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const regex = /\/upload\/v\d+\/([^.#?]+)(?:\.[a-z0-9]+)(?:[?#].*)?$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

(async () => {
  try {
    console.log('Iniciando backfill de public_id...');

    // Trae productos sin public_id (null, undefined o cadena vacía)
    const productos = await Producto.find({
      $or: [
        { public_id: { $exists: false } },
        { public_id: null },
        { public_id: '' }
      ]
    });

    console.log('Productos candidatos:', productos.length);
    let asignados = 0;

    for (const p of productos) {
      if (!p.imagen) {
        console.log(`Producto ${p._id} no tiene imagen → se ignora.`);
        continue;
      }

      const posible = extractPublicIdFromUrl(p.imagen);

      if (posible) {
        p.public_id = posible;
        await p.save();
        asignados++;
        console.log(`Asignado public_id a ${p._id}: ${posible}`);
      } else {
        console.warn(`No se pudo extraer public_id de la URL del producto ${p._id}: ${p.imagen}`);
      }
    }

    console.log('Backfill finalizado.');
    console.log('Total asignados:', asignados);
    console.log('Total sin poder extraer public_id:', productos.length - asignados);

    // Cierra conexión ordenadamente (si tu config/connection no la maneja solo)
    if (mongoose.connection && mongoose.connection.close) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (e) {
    console.error('Error en backfill:', e);
    process.exit(1);
  }
})();