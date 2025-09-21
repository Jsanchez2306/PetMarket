require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

console.log('📦 === APP SIMPLE INICIANDO ===');

// Conexión a MongoDB
console.log('🔌 Conectando a MongoDB...');
require('./config/connection');

// Importar modelos para registrarlos
console.log('📋 Registrando modelos...');
require('./models/cart.model');
require('./models/producto.model');
require('./models/cliente.model');
console.log('✅ Modelos registrados');

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('📦 Middlewares configurados');

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

console.log('📦 Archivos estáticos configurados');

// Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));

console.log('📦 Vistas configuradas');

// Sesiones
const session = require('express-session');
app.use(session({ 
    secret: 'tu_secreto', 
    resave: false,    
    saveUninitialized: true,    
    cookie: { secure: false }
}));

console.log('📦 Sesiones configuradas');

// RUTAS DEL CARRITO - COMPLETAS
console.log('🛒 Cargando rutas completas del carrito...');
try {
    const cartRoutes = require('./routes/cart-simple.routes');
    app.use('/carrito', cartRoutes);
    console.log('✅ Rutas completas del carrito cargadas y registradas');
} catch (error) {
    console.error('❌ ERROR con rutas del carrito:', error.message);
    console.error('❌ Stack:', error.stack);
}

// Otras rutas básicas
console.log('📦 Cargando otras rutas...');
try {
    const indexRoutes = require('./routes/index.routes');
    const authRoutes = require('./routes/auth.routes');
    const productoRoutes = require('./routes/productos.routes');
    const clienteRoutes = require('./routes/cliente.routes');
    const perfilRoutes = require('./routes/perfil.routes');
    const panelRoutes = require('./routes/panel');
    const empleadoRoutes = require('./routes/empleado.routes');

    
    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/productos', productoRoutes);
    app.use('/clientes', clienteRoutes);
    app.use('/perfil', perfilRoutes);
    app.use('/panel', panelRoutes);
    app.use('/empleados', empleadoRoutes);
    
    
    console.log('✅ Rutas básicas cargadas');
} catch (error) {
    console.error('❌ ERROR con rutas básicas:', error.messge);
    console.error('Stack del error:', error.stack);
}

console.log('📦 === APP SIMPLE CONFIGURADA ===');

module.exports = app; 