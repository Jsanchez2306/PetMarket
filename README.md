# PetMarket

Una plataforma de comercio electrónico moderna y completa especializada en productos para mascotas, desarrollada con Node.js y tecnologías web modernas.

## Descripción del Proyecto

PetMarket es una aplicación web full-stack que ofrece una experiencia de compra integral para productos de mascotas. La plataforma incluye un catálogo de productos, sistema de carrito de compras, procesamiento de pagos con MercadoPago, gestión de inventario y un panel administrativo completo.

## Arquitectura del Sistema

El proyecto está estructurado en dos aplicaciones principales:

- **Backend**: API RESTful desarrollada en Node.js con Express
- **Frontend**: Aplicación web con servidor de plantillas EJS

## Características Principales

### Funcionalidades del Cliente
- Catálogo de productos con búsqueda y filtros
- Sistema de carrito de compras con persistencia local
- Procesamiento de pagos integrado con MercadoPago
- Generación automática de facturas con códigos QR
- Sistema de autenticación de usuarios
- Gestión de perfiles de cliente

### Funcionalidades Administrativas
- Panel de administración completo
- Gestión de productos (CRUD completo)
- Administración de clientes y empleados
- Generación de reportes de ventas
- Dashboard with analytics básicos
- Sistema de backup automatizado

### Características Técnicas
- Arquitectura MVC (Modelo-Vista-Controlador)
- Base de datos MongoDB con Mongoose ODM
- Autenticación JWT y sesiones
- Integración con Cloudinary para gestión de imágenes
- Sistema de logging personalizado
- Validación reCAPTCHA para seguridad
- Respaldos automáticos programados

## Stack Tecnológico

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js v5
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT + bcryptjs
- **Pagos**: MercadoPago SDK
- **Almacenamiento**: Cloudinary (imágenes)
- **Email**: Resend
- **Validación**: express-validator
- **Logging**: Morgan + Winston personalizado

### Frontend
- **Motor de Plantillas**: EJS
- **Estilos**: CSS personalizado + Bootstrap 5
- **JavaScript**: Vanilla JS con módulos ES6
- **Iconos**: Font Awesome
- **UI Components**: Bootstrap + componentes personalizados

### DevOps y Herramientas
- **Deployment**: Render (configuración incluida)
- **Desarrollo**: Nodemon para hot-reload
- **Testing**: Nightwatch para E2E
- **Load Testing**: Autocannon
- **Túneles**: ngrok para desarrollo local

## Estructura del Proyecto

```
PetMarket/
├── backend/                    # Servidor API
│   ├── src/
│   │   ├── app.js             # Configuración principal
│   │   ├── server.js          # Punto de entrada
│   │   ├── config/            # Configuraciones
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middlewares/       # Middlewares personalizados
│   │   ├── models/            # Modelos de datos (Mongoose)
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Servicios externos
│   │   └── utils/             # Utilidades
│   └── package.json
├── frontend/                   # Aplicación web
│   ├── public/                # Archivos estáticos
│   │   ├── css/              # Hojas de estilo
│   │   ├── js/               # Scripts del cliente
│   │   └── Imagenes/         # Recursos gráficos
│   ├── views/                # Plantillas EJS
│   │   ├── partials/         # Componentes reutilizables
│   │   └── *.ejs            # Páginas principales
│   └── package.json
└── render.yaml                # Configuración de deployment
```

## Instalación y Configuración

### Prerrequisitos
- Node.js v18 o superior
- MongoDB (local o MongoDB Atlas)
- Cuenta de Cloudinary (para imágenes)
- Cuenta de MercadoPago (para pagos)

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Jsanchez2306/PetMarket.git
   cd PetMarket
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configurar variables de entorno**
   
   Crear archivo `.env` en la carpeta `backend/`:
   ```env
   # Base de datos
   MONGODB_URI=mongodb://localhost:27017/petmarket
   
   # JWT
   JWT_SECRET=tu_jwt_secret_aqui
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   
   # MercadoPago
   MERCADOPAGO_ACCESS_TOKEN=tu_access_token
   
   # Email
   RESEND_API_KEY=tu_resend_api_key
   
   # reCAPTCHA (opcional)
   RECAPTCHA_SITE_KEY=tu_site_key
   RECAPTCHA_SECRET_KEY=tu_secret_key
   RECAPTCHA_ENABLED=false
   
   # Entorno
   NODE_ENV=development
   PORT=3000
   ```

### Ejecución

#### Desarrollo Local
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (No es necesario)
cd frontend
npm run dev
```

#### Producción
```bash
cd backend
npm start
```

## Deployment

### Render
El proyecto incluye configuración para deployment automático en Render:

### Variables de Entorno en Producción
Configurar las siguientes variables en tu plataforma de deployment:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `NODE_ENV=production`

## Scripts Disponibles

### Backend
- `npm start` - Ejecutar en producción
- `npm run dev` - Desarrollo con nodemon
- `npm run backup` - Ejecutar backup de base de datos
- `npm run tunnel` - Crear túnel ngrok
- `npm run dev:tunnel` - Desarrollo con túnel
- `npm test` - Ejecutar tests

### Frontend
- `npm run dev` - Desarrollo con nodemon

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto específico
- `POST /api/productos` - Crear producto (admin)
- `PUT /api/productos/:id` - Actualizar producto (admin)
- `DELETE /api/productos/:id` - Eliminar producto (admin)

### Carrito
- `GET /api/cart` - Obtener carrito
- `POST /api/cart/add` - Agregar al carrito
- `PUT /api/cart/update` - Actualizar cantidad
- `DELETE /api/cart/remove` - Remover del carrito

### Pagos
- `POST /api/mercadopago/create-preference` - Crear preferencia de pago
- `POST /api/mercadopago/webhook` - Webhook de notificaciones

## Seguridad

- Autenticación JWT con tokens seguros
- Validación de entrada en todos los endpoints
- Middleware de autorización por roles
- Protección contra CSRF
- Validación reCAPTCHA opcional
- Sanitización de datos de entrada

## Mantenimiento

### Backups
El sistema incluye backup automático programado:
```bash
npm run backup
```

## Licencia

Este proyecto está licenciado bajo la Licencia ISC.

## Versión

**Versión actual**: 1.0.0

## Changelog

### v1.0.0
- Lanzamiento inicial
- Sistema completo de e-commerce
- Integración con MercadoPago
- Panel administrativo
- Sistema de backup automatizado

---

**Desarrollado por**: CodeNova Team  
**Repositorio**: [https://github.com/Jsanchez2306/PetMarket](https://github.com/Jsanchez2306/PetMarket)