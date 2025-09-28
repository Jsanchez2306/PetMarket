# Sistema de Header Unificado 🎯

## 📋 Descripción
El sistema de header unificado reemplaza los múltiples headers separados (header.ejs, headerAdmin.ejs, headerCliente.ejs, headerEmpleado.ejs) con una solución dinámica que se adapta automáticamente según el rol del usuario autenticado.

## 🚀 Archivos Creados
- `views/partials/headerUnificado.ejs` - Template del header único
- `public/js/headerUnificado.js` - Lógica JavaScript para manejo dinámico

## 🔧 Características Principales

### ✅ Roles Soportados
- **Público**: Usuarios no autenticados
- **Cliente**: Usuarios registrados como clientes
- **Empleado**: Personal de la empresa
- **Admin**: Administradores del sistema

### ✅ Funcionalidades Dinámicas
1. **Navegación Adaptativa**: Muestra opciones según el rol
2. **Autenticación Integrada**: Login y registro en modales
3. **Gestión de Perfil**: Actualización de datos del usuario
4. **Carrito de Compras**: Solo visible para clientes
5. **Panel de Control**: Acceso a funciones administrativas
6. **Indicadores Visuales**: Badges y iconos según el rol

## 🏗️ Estructura del Header

### Área de Navegación
```
📍 Navegación Pública (todos ven):
- Inicio
- Catálogo
- Nosotros

📍 Navegación de Cliente:
- Carrito (con contador)
- Mis Pedidos

📍 Navegación de Empleado:
- Gestión Productos
- Gestión Clientes

📍 Navegación de Admin:
- Panel de Control
- Todas las opciones anteriores
```

### Área de Usuario
```
👤 Usuario No Autenticado:
- Botón Login
- Botón Registro

👤 Usuario Autenticado:
- Nombre del usuario
- Badge de rol (Cliente/Empleado/Admin)
- Dropdown con opciones:
  - Ver Perfil
  - Configuración (admin/empleado)
  - Panel (admin)
  - Cerrar Sesión
```

## 🔌 Integración en Vistas

### Paso 1: Incluir el Header
Reemplaza la inclusión del header actual con:
```ejs
<%- include('partials/headerUnificado') %>
```

### Paso 2: Incluir el JavaScript
Agrega antes del `</body>`:
```html
<script src="/js/headerUnificado.js"></script>
```

## 📱 Clases CSS de Visibilidad

### Para Navegación
- `.public-nav`: Visible para todos
- `.client-nav`: Visible para clientes y admin
- `.employee-nav`: Visible para empleados y admin
- `.admin-nav`: Visible solo para admin

### Para Elementos del Dropdown
- `.client-only`: Solo clientes
- `.employee-only`: Solo empleados y admin
- `.admin-only`: Solo admin

## 🎮 API del JavaScript

### Inicialización Automática
```javascript
// Se inicializa automáticamente al cargar la página
const header = window.headerUnificado;
```

### Métodos Principales
```javascript
// Actualizar header manualmente
header.updateHeader();

// Obtener información del usuario
const userInfo = header.userInfo;

// Cerrar sesión
header.logout();
```

## 🔐 Gestión de Autenticación

### Token JWT
- Se almacena en `localStorage`
- Se decodifica para obtener información del usuario
- Se incluye automáticamente en peticiones API

### Información del Usuario
```javascript
{
  rol: 'admin|cliente', 
  tipoUsuario: 'empleado|cliente',
  nombre: 'Nombre Usuario',
  email: 'email@ejemplo.com',
  id: 'userId'
}
```

## 🎨 Personalización Visual

### Iconos por Rol
- **Cliente**: `fas fa-user` (azul)
- **Empleado**: `fas fa-user-tie` (amarillo)
- **Admin**: `fas fa-user-shield` (rojo)

### Badges
- **Cliente**: Badge azul "Cliente"
- **Empleado**: Badge amarillo "Empleado"  
- **Admin**: Badge rojo "Admin"

## 🔄 Migración desde Headers Separados

### Antes:
```ejs
<!-- En cada vista diferente -->
<%- include('partials/header') %>
<%- include('partials/headerAdmin') %>
<%- include('partials/headerCliente') %>
<%- include('partials/headerEmpleado') %>
```

### Después:
```ejs
<!-- En todas las vistas -->
<%- include('partials/headerUnificado') %>
<script src="/js/headerUnificado.js"></script>
```

## 🐛 Depuración

### Logs en Consola
El sistema incluye logs detallados:
```javascript
🎯 Inicializando Header Unificado
✅ Información del usuario cargada: {...}
👤 Mostrando header para: empleado - empleado
🌐 Mostrando header público
🚪 Cerrando sesión
```

### Estados del Header
1. **Público**: Sin autenticación
2. **Cargando**: Validando token
3. **Autenticado**: Usuario logueado
4. **Error**: Token inválido

## 🔧 Configuración Avanzada

### Personalizar Redirecciones
```javascript
handlePostLoginRedirect(data) {
  if (data.tipoUsuario === 'empleado') {
    window.location.href = '/productos';
  } else if (data.rol === 'admin') {
    window.location.href = '/panel';
  }
  // Clientes permanecen en la página actual
}
```

### Añadir Nuevos Roles
1. Actualizar el template EJS con nuevas clases CSS
2. Modificar `updateNavigation()` en el JavaScript
3. Añadir lógica específica en `updateUserDropdown()`

## 📋 Checklist de Implementación

- [ ] Crear `headerUnificado.ejs` ✅
- [ ] Crear `headerUnificado.js` ✅
- [ ] Actualizar vistas para usar el nuevo header
- [ ] Probar autenticación con diferentes roles
- [ ] Verificar navegación adaptativa
- [ ] Probar modales de login/registro
- [ ] Validar funcionalidad del carrito
- [ ] Probar actualización de perfil

## 🚀 Beneficios del Sistema Unificado

1. **Mantenibilidad**: Un solo archivo para toda la lógica del header
2. **Consistencia**: Comportamiento uniforme en todas las páginas
3. **Performance**: Menos archivos que cargar
4. **Flexibilidad**: Fácil agregar nuevos roles o funcionalidades
5. **Debugging**: Logs centralizados y estado único

## 🎯 Próximos Pasos
1. Migrar todas las vistas al nuevo sistema
2. Eliminar headers antiguos una vez probado
3. Añadir tests automatizados
4. Documentar APIs específicas si es necesario