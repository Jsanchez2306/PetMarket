const app = require('./app');  // USANDO VERSIÓN SIMPLE
require('dotenv').config({ quiet: true });
const backup = require('./config/backup');
const cron = require('node-cron');

const HOST = process.env.HOST || "0.0.0.0";

function iniciarServidor() {
  app.listen(process.env.PORT, () => {});
}

if (process.env.ENABLE_BACKUP === 'true') {
  cron.schedule('* * * * *', () => {
    try {
      backup.backupDatabase();
    } catch (e) {
      console.warn('Backup omitido:', e.message);
    }
  });
}

iniciarServidor();
