const app = require('./app');
require('dotenv').config({ quiet: true });
const backup = require('./config/backup');
const cron = require('node-cron');

function iniciarServidor() {
  app.listen(process.env.PORT, () => {
    console.log(
      `Servidor corriendo en 
      http://localhost:${process.env.PORT}
      http://localhost:${process.env.PORT}/perfil/admin
      http://localhost:${process.env.PORT}/perfil/cliente
      http://localhost:${process.env.PORT}/clientes
      http://localhost:${process.env.PORT}/restriccion
      http://localhost:${process.env.PORT}/api-docs`
    );
  });
}

// ✅ solo corre el backup si lo activas por variable de entorno
if (process.env.ENABLE_BACKUP === 'true') {
  cron.schedule('* * * * *', () => {
    backup.backupDatabase();
    console.log('Backup automático ejecutado');
  });
} else {
  console.log(' Backups desactivados (ENABLE_BACKUP != true)');
}

iniciarServidor();
