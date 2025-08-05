const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de vistas y archivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));


// Rutas
const indexRoutes = require('./routes/index.routes');
app.use('/', indexRoutes);
const clienteRoutes = require('./routes/cliente.routes');
app.use('/clientes', clienteRoutes);
const perfilRoutes = require('./routes/perfil.routes');
app.use('/perfilAdmin', perfilRoutes);
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);
module.exports = app;
