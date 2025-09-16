# Configuración de Recuperación de Contraseña - PetMarket

## Funcionalidad Implementada

Se ha implementado un sistema completo de recuperación de contraseñas que permite a los usuarios recuperar el acceso a sus cuentas mediante correo electrónico.

## Características

✅ **Modal de Recuperación**: Interfaz usuario-amigable para solicitar recuperación
✅ **Validación de Email**: Verifica que el correo exista en la base de datos
✅ **Contraseña Temporal**: Genera automáticamente una contraseña temporal de 8 caracteres
✅ **Envío por Email**: Envía la nueva contraseña por correo electrónico usando Nodemailer
✅ **Email HTML**: Plantilla profesional con diseño responsivo
✅ **Manejo de Errores**: Modales específicos para diferentes tipos de errores
✅ **Actualización Automática**: La contraseña se actualiza inmediatamente en la base de datos

## Archivos Modificados/Creados

### Frontend
- `frontend/views/partials/header.ejs` - Agregados 3 nuevos modales
- `frontend/public/js/recuperarPassword.js` - Lógica del frontend (NUEVO)
- `frontend/views/index.ejs` - Agregado script de recuperación

### Backend
- `backend/src/controllers/auth.controller.js` - Método `recuperarPassword`
- `backend/src/routes/auth.routes.js` - Ruta POST `/auth/recuperar-password`
- `backend/.env` - Variables de configuración de email

## Configuración de Email (IMPORTANTE)

Para que la funcionalidad de envío de correos funcione correctamente, debes configurar las siguientes variables en el archivo `.env`:

```bash
# --- Email Configuration ---
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
FRONTEND_URL=http://localhost:3191
```

### Cómo obtener una contraseña de aplicación de Gmail:

1. **Ir a tu cuenta de Google**: https://myaccount.google.com/
2. **Seguridad**: En el panel izquierdo, hacer clic en "Seguridad"
3. **Verificación en 2 pasos**: Debe estar activada (requerida)
4. **Contraseñas de aplicaciones**: 
   - Buscar "Contraseñas de aplicaciones" 
   - Seleccionar "Correo" y "Windows Computer"
   - Google generará una contraseña de 16 caracteres
   - Usar esta contraseña en `EMAIL_PASS`

### Alternativas a Gmail:

Si prefieres usar otro proveedor, modifica la configuración en `auth.controller.js`:

```javascript
// Para Outlook/Hotmail
service: 'hotmail',

// Para Yahoo
service: 'yahoo',

// Para un servidor SMTP personalizado
host: 'smtp.tuservidor.com',
port: 587,
secure: false,
```

## Flujo de Usuario

1. **Usuario hace clic** en "¿Olvidaste tu contraseña?" en el modal de login
2. **Se abre modal** de recuperación pidiendo el email
3. **Usuario ingresa email** registrado y envía
4. **Sistema valida** que el email exista en la base de datos
5. **Si existe**: 
   - Genera contraseña temporal de 8 caracteres
   - Actualiza la contraseña en MongoDB
   - Envía email con la nueva contraseña
   - Muestra modal de éxito
6. **Si no existe**: Muestra modal de error con opción de reintentar

## Seguridad

- ✅ **Contraseñas temporales**: Se generan aleatoriamente (8 caracteres alfanuméricos)
- ✅ **Actualización inmediata**: La contraseña se cambia al momento en la BD
- ✅ **Validación de email**: Solo emails registrados pueden recuperar contraseña
- ✅ **Encriptación**: El transporte de email usa TLS/SSL
- ⚠️ **Recomendación**: Los usuarios deben cambiar la contraseña temporal desde su perfil

## Testing

Para probar la funcionalidad:

1. **Configurar email** en `.env` con credenciales reales
2. **Registrar un usuario** con un email real al que tengas acceso
3. **Hacer logout** 
4. **Intentar login** y hacer clic en "¿Olvidaste tu contraseña?"
5. **Ingresar el email** registrado
6. **Revisar tu correo** para la nueva contraseña
7. **Iniciar sesión** con la contraseña temporal recibida

## Posibles Mejoras Futuras

- 🔄 **Expiración de contraseñas temporales**: Agregar tiempo límite
- 🔗 **Enlaces de restablecimiento**: En lugar de enviar contraseña por email
- 📱 **SMS**: Opción alternativa de recuperación por SMS
- 🔒 **Verificación adicional**: Preguntas de seguridad
- 📧 **Plantillas múltiples**: Diferentes diseños de email
- 🌐 **Multi-idioma**: Emails en diferentes idiomas

## Troubleshooting

### Error: "EAUTH - Authentication failed"
- Verificar que `EMAIL_USER` y `EMAIL_PASS` sean correctos
- Asegurar que la verificación en 2 pasos esté activada en Gmail
- Usar contraseña de aplicación, no la contraseña normal de Gmail

### Error: "ECONNREFUSED"
- Verificar conexión a internet
- Puede ser problema temporal del servidor de Gmail
- Intentar con otro proveedor de email

### Email no llega
- Revisar carpeta de SPAM/Correo no deseado
- Verificar que la dirección `EMAIL_USER` esté bien configurada
- Probar con un email diferente

## Estructura del Email Enviado

El email incluye:
- 🎨 **Header**: Logo y nombre de PetMarket
- 👋 **Saludo personalizado**: Con el nombre del usuario
- 🔑 **Contraseña temporal**: Claramente destacada
- ⚠️ **Instrucciones de seguridad**: Recomendaciones importantes
- 🔗 **Botón de acción**: Link directo para iniciar sesión
- 📧 **Footer profesional**: Información de la empresa

¡La funcionalidad está lista para usar! Solo necesitas configurar las credenciales de email en el archivo `.env`.