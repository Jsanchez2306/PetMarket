const app = require('./app');  // USANDO VERSIÓN SIMPLE
require('dotenv').config({ quiet: true });
const backup = require('./config/backup');
const cron = require('node-cron');

console.log('🚀 === INICIANDO SERVIDOR ===');
const HOST = process.env.HOST || "0.0.0.0";

function iniciarServidor() {
  console.log('🌐 Iniciando servidor en puerto', process.env.PORT);
  app.listen(process.env.PORT, () => {
    console.log('✅ === SERVIDOR INICIADO EXITOSAMENTE ===');
    console.log(
      `Servidor corriendo en 
      http://localhost:${process.env.PORT}
      http://localhost:${process.env.PORT}/perfil/admin
      http://localhost:${process.env.PORT}/perfil/cliente
      http://localhost:${process.env.PORT}/clientes
      http://localhost:${process.env.PORT}/restriccion
      http://localhost:${process.env.PORT}/api-docs
      http://localhost:${process.env.PORT}/carrito/test
      http://localhost:${process.env.PORT}/facturas        <-- 📄 vista gestión
      http://localhost:${process.env.PORT}/facturas/api    <-- 📡 API facturas`
    );
  });
}



if (process.env.ENABLE_BACKUP === 'true') {
  cron.schedule('* * * * *', () => {
    try {
      backup.backupDatabase();
      console.log('Backup automático ejecutado');
    } catch (e) {
      console.warn('Backup omitido:', e.message);
    }
  });
} else {
  console.log(' Backups desactivados (ENABLE_BACKUP != true)');
}


console.log(' Llamando iniciarServidor...');
iniciarServidor();
console.log(' iniciarServidor llamado');
