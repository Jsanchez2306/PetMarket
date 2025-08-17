require('dotenv').config();  

const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());  
app.use(express.urlencoded({ extended: true })); 

app.use((req, res, next) => {
  console.log('Body recibido:', req.body);
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

const indexRoutes = require('./routes/index.routes');
app.use('/', indexRoutes);
const clienteRoutes = require('./routes/cliente.routes');
app.use('/clientes', clienteRoutes);
const perfilRoutes = require('./routes/perfil.routes');
app.use('/perfil', perfilRoutes);
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);

module.exports = app;
