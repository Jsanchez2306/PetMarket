/* eslint-disable no-unused-vars */
const { exec } = require('child_process');
require('dotenv').config(); process.loadEnvFile('./.env')

exports.backupDatabase = async () => {
    const dbName = 'PetMarket';
    const outputPath = './backup';

    const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
    const command = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe" --uri "${mongoUri}" --out ${outputPath} --gzip`;


    await exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error en el respaldo: ${error.message}`);
            return;
        }
        console.log(`Respaldo completado con éxito ${stdout}`);
    });
};