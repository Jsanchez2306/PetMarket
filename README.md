# PetMarket

## Desarrollo rápido

- Backend: carpeta `backend/`
- Frontend: carpeta `frontend/`

### Variables de entorno

Copia `.env.example` a `.env` y completa los valores necesarios.

Claves importantes:
- `PORT`: puerto del servidor (por defecto 3191)
- `JWT_SECRET`: secreto para firmar JWT
- `RECAPTCHA_ENABLED` / `RECAPTCHA_ENFORCE`: habilita/obliga reCAPTCHA (en desarrollo suele ser `ENFORCE=false` para localhost)
- `LOG_DEBUG` o `DEBUG`: activa logs de depuración. Por ejemplo `DEBUG=auth,recaptcha` o `LOG_DEBUG=true` para todos.
- `ENABLE_BACKUP`: activar backups con `mongodump` (por defecto `false` en dev)

### Logging

Se usa un logger simple por namespaces:
- `auth`: autenticación y login
- `recaptcha`: verificación de Google reCAPTCHA

Activa debug con:
- `LOG_DEBUG=true` (todos los namespaces), o
- `DEBUG=auth,recaptcha`

### ReCAPTCHA

Usamos `utils/recaptcha.js` para centralizar la verificación. En localhost o si `RECAPTCHA_ENFORCE=false`, no se fuerza la validación.

### Limpieza del código

- `auth.controller.js` usa helpers (`utils/logger.js`, `utils/recaptcha.js`) para evitar lógica repetitiva.
- Los logs ruidosos están detrás de `LOG_DEBUG`/`DEBUG`.
- `routes/auth.routes.js` contiene un logger ligero solo para diagnóstico. Puedes desactivarlo quitando ese middleware.

### Backups

Si quieres activar backups automáticos:
- Instala `mongodump` y pon `ENABLE_BACKUP=true` en el `.env`.
- En desarrollo lo dejamos desactivado por defecto para evitar errores en consola.

