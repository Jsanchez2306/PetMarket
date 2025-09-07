/* eslint-disable no-unused-vars */
const { exec } = require('child_process');
require('dotenv').config();

exports.backupDatabase = async () => {
    const outputPath = './backup';

    // Usa la variable de entorno MONGO_DB_NAME
    const dbName = process.env.MONGO_DB_NAME;

    const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${dbName}?retryWrites=true&w=majority`;
    // const command = `"C:\\Users\\yepes\\OneDrive\\Desktop\\mongodb-database-tools-windows-x86_64-100.13.0\\mongodb-database-tools-windows-x86_64-100.13.0\\bin\\mongodump.exe" --uri "${mongoUri}" --out ${outputPath} --gzip`;
    const command = `"" --uri "${mongoUri}" --out ${outputPath} --gzip`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error en el respaldo: ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`⚠️ Advertencia: ${stderr}`);
        }
        console.log(`✅ Respaldo completado con total éxito\n${stdout}`);
    });
};

//  Ejecutar directamente si este archivo se llama con `node src/config/backup.js`
if (require.main === module) {
    exports.backupDatabase();
}
