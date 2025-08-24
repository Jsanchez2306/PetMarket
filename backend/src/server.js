/**
 * @file Archivo principal del servidor PetMarket
 * @module server
 */

const app = require('./app');
require('dotenv').config({ quiet: true });

/* ============================
   Función de arranque del servidor
   ============================ */

/**
 * Inicia el servidor Express en el puerto definido en `.env`.
 * Muestra en consola las URLs principales.
 * @private
 */
function iniciarServidor() {
  app.listen(process.env.PORT, () => {
    console.log(
      `Servidor corriendo en 
      http://localhost:${process.env.PORT}
      http://localhost:${process.env.PORT}/perfil/admin
      http://localhost:${process.env.PORT}/perfil/cliente
      http://localhost:${process.env.PORT}/clientes
      http://localhost:${process.env.PORT}/restriccion
      http://localhost:${process.env.PORT}/api-docs`
      
    );
  });
}

// Ejecuta la función
iniciarServidor();
