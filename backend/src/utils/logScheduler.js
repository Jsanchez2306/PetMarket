const cron = require('node-cron');
const { cleanupDailyLogs } = require('../middlewares/logs');

/**
 * Configurar tareas programadas para el mantenimiento de logs
 */
function setupLogScheduler() {
    // Ejecutar limpieza diaria a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('🧹 Iniciando limpieza automática de logs...');
        try {
            await cleanupDailyLogs();
            console.log(' Limpieza automática de logs completada');
        } catch (error) {
            console.error('❌ Error en limpieza automática de logs:', error);
        }
    }, {
        timezone: "America/Bogota" // Ajustar según tu zona horaria
    });

    // Ejecutar limpieza cada 6 horas como respaldo
    cron.schedule('0 */6 * * *', async () => {
        console.log('🔄 Verificación de logs cada 6 horas...');
        try {
            await cleanupDailyLogs();
        } catch (error) {
            console.error('Error en verificación de logs:', error);
        }
    });

    console.log('📅 Scheduler de logs configurado:');
    console.log('   - Limpieza diaria: 2:00 AM');
    console.log('   - Verificación: cada 6 horas');
}

/**
 * Función para ejecutar limpieza manual
 */
async function manualCleanup() {
    console.log('🧹 Ejecutando limpieza manual de logs...');
    try {
        await cleanupDailyLogs();
        console.log('✅ Limpieza manual completada');
        return { success: true, message: 'Limpieza completada exitosamente' };
    } catch (error) {
        console.error('❌ Error en limpieza manual:', error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    setupLogScheduler,
    manualCleanup
};