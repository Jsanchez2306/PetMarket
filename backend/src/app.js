/**
 * @file Configuración principal de PetMarket
 * @module app
 */

require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

/* ============================
   Middlewares
   ============================ */

/**
 * Configura los middlewares de la aplicación.
 * - JSON parser
 * - URL-encoded parser
 * @private
 */
function configurarMiddlewares() {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}
configurarMiddlewares();

/* ============================
   Motor de vistas
   ============================ */

/**
 * Configura el motor de vistas EJS y la carpeta de vistas.
 * @private
 */
function configurarVistas() {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));
}
configurarVistas();

/* ============================
   Archivos estáticos
   ============================ */

/**
 * Configura la carpeta de archivos estáticos.
 * @private
 */
function configurarStatic() {
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));
}
configurarStatic();

/* ============================
   Rutas
   ============================ */

/**
 * Configura las rutas de la aplicación.
 * @private
 */
function configurarRutas() {
  const indexRoutes = require('./routes/index.routes');
  const clienteRoutes = require('./routes/cliente.routes');
  const perfilRoutes = require('./routes/perfil.routes');
  const authRoutes = require('./routes/auth.routes');
  const facturaRoutes = require('./routes/factura.routes');

  app.use('/', indexRoutes);
  app.use('/clientes', clienteRoutes);
  app.use('/perfil', perfilRoutes);
  app.use('/auth', authRoutes);
  app.use('/facturas', facturaRoutes);
}
configurarRutas();

/* ============================
   Exportación
   ============================ */

/**
 * La aplicación Express configurada
 * @type {express.Application}
 */
module.exports = app;
