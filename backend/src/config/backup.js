// backend/src/config/backup.js
/* eslint-disable no-unused-vars */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ quiet: true });

const ENABLE = process.env.ENABLE_BACKUP === 'true';               // <— apaga/enciende backup
const dumpCmd = process.env.MONGODUMP_PATH || 'mongodump';         // <— binario (ruta o nombre)
const outDir  = path.resolve(process.env.BACKUP_DIR || './backup');

function buildMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const { DB_USER, DB_PASS, DB_HOST, MONGO_DB_NAME } = process.env;
  if (DB_USER && DB_PASS && DB_HOST && MONGO_DB_NAME) {
    const u = encodeURIComponent(DB_USER);
    const p = encodeURIComponent(DB_PASS);
    return `mongodb+srv://${u}:${p}@${DB_HOST}/${MONGO_DB_NAME}?retryWrites=true&w=majority`;
  }
  return null;
}

exports.backupDatabase = (cb = () => {}) => {
  if (!ENABLE) {
    console.log('Backup desactivado (ENABLE_BACKUP != true)');
    return cb(null, 'disabled');
  }

  const mongoUri = buildMongoUri();
  if (!mongoUri) {
    const err = new Error('No hay MONGO_URI ni variables DB_* suficientes');
  console.error(err.message);
    return cb(err);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dbName = process.env.MONGO_DB_NAME || 'db';
  const archive = path.join(outDir, `backup-${dbName}-${ts}.archive.gz`);

  const args = ['--uri', mongoUri, `--archive=${archive}`, '--gzip'];

  execFile(dumpCmd, args, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Error en el respaldo:', err.message);
      if (stderr) console.error(stderr);
      return cb(err);
    }
  console.log('Respaldo OK →', archive);
  if (stdout) console.log(stdout);
    cb(null, archive);
  });
};

// Ejecutar directo: `node src/config/backup.js`
if (require.main === module) {
  exports.backupDatabase();
}
