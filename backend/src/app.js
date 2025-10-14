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
require('./models/factura.model'); //  Importa el modelo factura también
require('./models/venta.model'); //  Importa el modelo venta
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

// Exponer configuración básica a las vistas (EJS)
app.locals.RECAPTCHA_ENABLED = ((process.env.RECAPTCHA_ENABLED || 'false').trim().toLowerCase()) === 'true';
app.locals.RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';

// Middleware para prevenir caché en rutas administrativas
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Aplicar no-cache a rutas administrativas
app.use(['/panel', '/clientes', '/empleados', '/facturas', '/productos', '/ventas', '/dashboard'], noCache);

// RUTAS DEL CARRITO - USANDO VERSIÓN DESPROTEGIDA
console.log('🛒 Cargando rutas del carrito (localStorage compatible)...');
try {
    const cartRoutes = require('./routes/cart.routes');
    app.use('/carrito', cartRoutes);
    console.log('✅ Rutas del carrito cargadas (desprotegidas para localStorage)');
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
    const panelRoutes = require('./routes/panel.routes');
    const empleadoRoutes = require('./routes/empleado.routes');
    const facturaRoutes = require('./routes/factura.routes'); // ✅ agregado
    const mercadopagoRoutes = require('./routes/mercadopago.routes'); // ✅ nuevo
    const ventasRoutes = require('./routes/ventas.routes'); // ✅ nuevo para gestión de ventas
    const dashboardRoutes = require('./routes/dashboard.routes'); // ✅ nuevo para dashboard

    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/productos', productoRoutes);
    app.use('/clientes', clienteRoutes);
    app.use('/panel', panelRoutes);
    app.use('/empleados', empleadoRoutes);
    app.use('/facturas', facturaRoutes); // ✅ agregado
    app.use('/mercadopago', mercadopagoRoutes); // ✅ nuevo
    app.use('/ventas', ventasRoutes); // ✅ nuevo para gestión de ventas
    app.use('/dashboard', dashboardRoutes); // ✅ nuevo para dashboard

    // Health check endpoint para Render
    app.get('/health', (req, res) => {
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'PetMarket Backend',
            version: '1.0.0'
        });
    });

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
