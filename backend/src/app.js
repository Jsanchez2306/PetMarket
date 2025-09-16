require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function configurarMiddlewares() {
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
}
configurarMiddlewares();

function configurarVistas() {
   app.set('view engine', 'ejs');
   app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));
}
configurarVistas();

function configurarStatic() {
   app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));
}

configurarStatic();

app.use(session({ 
    secret: 'tu_secreto', 
    resave: false,    
    saveUninitialized: true,    
    cookie: { secure: false }
}));

function configurarRutas() {
   const indexRoutes = require('./routes/index.routes');
   const clienteRoutes = require('./routes/cliente.routes');
   const perfilRoutes = require('./routes/perfil.routes');
   const authRoutes = require('./routes/auth.routes');
   const facturaRoutes = require('./routes/factura.routes');
   const panelRouter = require('./routes/panel');
   const empleadoRoutes = require('./routes/empleado.routes');
   const productosRoutes = require('./routes/productos.routes');

   app.use('/', indexRoutes);
   app.use('/clientes', clienteRoutes);
   app.use('/perfil', perfilRoutes);
   app.use('/auth', authRoutes);
   app.use('/facturas', facturaRoutes);
   app.use('/panel', panelRouter);
   app.use('/empleados', empleadoRoutes);
   app.use('/productos', productosRoutes);
}
configurarRutas();

const { swaggerUi, specs } = require('./docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;
