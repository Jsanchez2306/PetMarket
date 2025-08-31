const fs = require('fs');
const path = require('path');

// Carpeta donde se guardarán los logs
const logDir = path.join(__dirname, '..', 'logs');

// Crear la carpeta logs si no existe
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

exports.generateLog = (filename, logData) => {
    // Genera la ruta completa dentro de logs/
    const filePath = path.join(logDir, `${filename}.log`);

    // Añade la fecha y hora al log
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${logData}\n`;

    fs.appendFile(filePath, logEntry, (err) => {
        if (err) throw err;
        console.log(`Log guardado en ${filePath}`);
    });
};
