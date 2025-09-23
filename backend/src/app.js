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
require('./models/factura.model'); // 🔗 Importa el modelo factura también
console.log('✅ Modelos registrados');
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');


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

// RUTAS DEL CARRITO
console.log('🛒 Cargando rutas completas del carrito...');
try {
    const cartRoutes = require('./routes/cart-simple.routes');
    app.use('/carrito', cartRoutes);
    console.log('✅ Rutas del carrito cargadas');
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
    const facturaRoutes = require('./routes/factura.routes'); // ✅ agregado

    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/productos', productoRoutes);
    app.use('/clientes', clienteRoutes);
    app.use('/perfil', perfilRoutes);
    app.use('/panel', panelRoutes);
    app.use('/empleados', empleadoRoutes);
    app.use('/facturas', facturaRoutes); // ✅ agregado

    console.log('✅ Rutas básicas cargadas');
} catch (error) {
    console.error('❌ ERROR con rutas básicas:', error.message);
    console.error('Stack del error:', error.stack);
}

console.log('📦 === APP SIMPLE CONFIGURADA ===');

// Middleware de manejo de errores de subida (Multer / formato)
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ errores: { imagen: 'Imagen supera 5MB' } });
    }
    return res.status(400).json({ errores: { imagen: 'Error al procesar la imagen' } });
  }
  if (err && err.message && err.message.includes('Formato no permitido')) {
    return res.status(400).json({ errores: { imagen: err.message } });
  }
  next(err);
});

module.exports = app;
