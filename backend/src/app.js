require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

require('./config/connection');

// Importar modelos para registrarlos
require('./models/cart.model');
require('./models/producto.model');
require('./models/cliente.model');
require('./models/factura.model'); 
require('./models/venta.model'); 
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');


// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

// Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));

// Sesiones
const session = require('express-session');
app.use(session({ 
  secret: 'tu_secreto', 
  resave: false,    
  saveUninitialized: true,    
  cookie: { secure: false }
}));

// Para obtener IP real detrás de proxies (Render/NGROK)
app.set('trust proxy', true);

// Exponer configuración básica a las vistas (EJS)
app.locals.RECAPTCHA_ENABLED = ((process.env.RECAPTCHA_ENABLED || 'false').trim().toLowerCase()) === 'true';
app.locals.RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';
app.locals.RECAPTCHA_ENFORCE = ((process.env.RECAPTCHA_ENFORCE || 'false').trim().toLowerCase()) === 'true';

// Middleware para prevenir caché en rutas administrativas
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Aplicar no-cache a rutas administrativas
app.use(['/panel', '/clientes', '/empleados', '/facturas', '/productos', '/ventas', '/dashboard'], noCache);

try {
  const cartRoutes = require('./routes/cart.routes');
  app.use('/carrito', cartRoutes);
} catch (error) {
  console.error('ERROR con rutas del carrito:', error.message);
  console.error('Stack:', error.stack);
}

// Otras rutas básicas
try {
    const indexRoutes = require('./routes/index.routes');
    const authRoutes = require('./routes/auth.routes');
    const productoRoutes = require('./routes/productos.routes');
    const clienteRoutes = require('./routes/cliente.routes');
    const panelRoutes = require('./routes/panel.routes');
    const empleadoRoutes = require('./routes/empleado.routes');
    const facturaRoutes = require('./routes/factura.routes');
    const mercadopagoRoutes = require('./routes/mercadopago.routes');
    const ventasRoutes = require('./routes/ventas.routes');
    const dashboardRoutes = require('./routes/dashboard.routes');

    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/productos', productoRoutes);
    app.use('/clientes', clienteRoutes);
    app.use('/panel', panelRoutes);
    app.use('/empleados', empleadoRoutes);
  app.use('/facturas', facturaRoutes);
  app.use('/mercadopago', mercadopagoRoutes);
  app.use('/ventas', ventasRoutes);
  app.use('/dashboard', dashboardRoutes);

    // Health check endpoint para Render
    app.get('/health', (req, res) => {
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'PetMarket Backend',
            version: '1.0.0'
        });
    });

    
} catch (error) {
  console.error('ERROR con rutas básicas:', error.message);
  console.error('Stack del error:', error.stack);
}


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
