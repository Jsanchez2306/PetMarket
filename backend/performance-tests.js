#!/usr/bin/env node

const autocannon = require('autocannon');
const fs = require('fs');

const BASE_URL = 'http://localhost:3191/';

// Función para ejecutar una prueba y guardar resultados
async function runTest(testName, config, description) {
    console.log(`\n🧪 === ${testName} ===`);
    console.log(`📝 ${description}`);
    console.log(`⚙️  Configuración: ${config.connections} conexiones, ${config.duration}s`);
    console.log(`🌐 URL: ${config.url}`);
    console.log(`⏰ Inicio: ${new Date().toLocaleTimeString()}`);
    
    const startTime = Date.now();
    
    try {
        const result = await autocannon(config);
        const endTime = Date.now();
        const testDuration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Calcular métricas
        const reqsPerSec = result.requests.average.toFixed(2);
        const latency = result.latency.average.toFixed(2);
        const p95Latency = result.latency.p95.toFixed(2);
        const p99Latency = result.latency.p99.toFixed(2);
        const throughput = (result.throughput.average / 1024 / 1024).toFixed(2);
        const errorRate = (result.errors / result.requests.total * 100).toFixed(2);
        
        console.log(`\n📊 === RESULTADOS ${testName} ===`);
        console.log(`✅ Requests/segundo: ${reqsPerSec}`);
        console.log(`⏱️  Latencia promedio: ${latency}ms`);
        console.log(`📈 Latencia P95: ${p95Latency}ms`);
        console.log(`📈 Latencia P99: ${p99Latency}ms`);
        console.log(`📦 Total requests: ${result.requests.total}`);
        console.log(`✅ Requests exitosos: ${result['2xx'] || 0}`);
        console.log(`❌ Errores: ${result.errors} (${errorRate}%)`);
        console.log(`⏰ Timeouts: ${result.timeouts}`);
        console.log(`🚀 Throughput: ${throughput} MB/s`);
        console.log(`⏰ Duración real: ${testDuration}s`);
        
        // Evaluación del rendimiento
        console.log(`\n🎯 === EVALUACIÓN ===`);
        if (result.errors === 0 && parseFloat(reqsPerSec) >= 50 && parseFloat(latency) <= 200) {
            console.log(`🟢 ESTADO: EXCELENTE`);
        } else if (result.errors <= result.requests.total * 0.01 && parseFloat(reqsPerSec) >= 20) {
            console.log(`🟡 ESTADO: BUENO`);
        } else if (result.errors <= result.requests.total * 0.05) {
            console.log(`🟠 ESTADO: ACEPTABLE`);
        } else {
            console.log(`🔴 ESTADO: PROBLEMÁTICO`);
        }
        
        // Guardar resultados en archivo
        const resultData = {
            testName,
            timestamp: new Date().toISOString(),
            config,
            results: {
                reqsPerSec: parseFloat(reqsPerSec),
                latency: parseFloat(latency),
                p95Latency: parseFloat(p95Latency),
                p99Latency: parseFloat(p99Latency),
                totalRequests: result.requests.total,
                successRequests: result['2xx'] || 0,
                errors: result.errors,
                errorRate: parseFloat(errorRate),
                timeouts: result.timeouts,
                throughputMB: parseFloat(throughput),
                testDurationSeconds: parseFloat(testDuration)
            }
        };
        
        // Guardar en archivo JSON
        const fileName = `test-results/${testName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }
        fs.writeFileSync(fileName, JSON.stringify(resultData, null, 2));
        console.log(`💾 Resultados guardados en: ${fileName}`);
        
        return result;
        
    } catch (error) {
        console.error(`❌ ERROR en ${testName}:`, error.message);
        return null;
    }
}

// ======================== PRUEBAS DE CARGA ========================

async function loadTestLigero() {
    return await runTest('LOAD TEST LIGERO', {
        url: BASE_URL,
        connections: 10,
        duration: 300, // 5 minutos
        method: 'GET'
    }, 'Carga ligera sostenida durante 5 minutos');
}

async function loadTestMedio() {
    return await runTest('LOAD TEST MEDIO', {
        url: BASE_URL,
        connections: 25,
        duration: 600, // 10 minutos
        method: 'GET'
    }, 'Carga media sostenida durante 10 minutos');
}

async function loadTestAlto() {
    return await runTest('LOAD TEST ALTO', {
        url: BASE_URL,
        connections: 50,
        duration: 300, // 5 minutos
        method: 'GET'
    }, 'Carga alta sostenida durante 5 minutos');
}

// ======================== PRUEBAS DE STRESS ========================

async function stressTestEscalado() {
    console.log('\n🔥 === STRESS TEST ESCALADO ===');
    console.log('Ejecutando stress test con carga creciente...\n');
    
    const levels = [20, 50, 100, 150, 200];
    const results = [];
    
    for (const connections of levels) {
        const result = await runTest(`STRESS LEVEL ${connections}`, {
            url: BASE_URL,
            connections: connections,
            duration: 60,
            method: 'GET'
        }, `Stress test con ${connections} conexiones concurrentes`);
        
        results.push({
            connections,
            success: result !== null,
            reqsPerSec: result ? result.requests.average : 0,
            errors: result ? result.errors : 'ERROR'
        });
        
        // Pausa entre niveles
        console.log('⏳ Pausa de 30 segundos antes del siguiente nivel...');
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    console.log('\n📊 === RESUMEN STRESS TEST ===');
    results.forEach(r => {
        console.log(`${r.connections} conexiones: ${r.reqsPerSec.toFixed(2)} req/s, Errores: ${r.errors}`);
    });
    
    return results;
}

// ======================== PRUEBAS DE SPIKE ========================

async function spikeTestCorto() {
    return await runTest('SPIKE TEST CORTO', {
        url: BASE_URL,
        connections: 100,
        duration: 10,
        method: 'GET'
    }, 'Pico de carga intenso durante 10 segundos');
}

async function spikeTestIntenso() {
    return await runTest('SPIKE TEST INTENSO', {
        url: BASE_URL,
        connections: 200,
        duration: 5,
        method: 'GET'
    }, 'Pico de carga muy intenso durante 5 segundos');
}

async function spikeTestExtremo() {
    return await runTest('SPIKE TEST EXTREMO', {
        url: BASE_URL,
        connections: 300,
        duration: 3,
        method: 'GET'
    }, 'Pico de carga extremo durante 3 segundos');
}

// ======================== PRUEBAS SOAK/ENDURANCE ========================

async function soakTestCorto() {
    return await runTest('SOAK TEST CORTO', {
        url: BASE_URL,
        connections: 15,
        duration: 1800, // 30 minutos
        method: 'GET'
    }, 'Prueba de resistencia durante 30 minutos');
}

async function enduranceTest() {
    return await runTest('ENDURANCE TEST', {
        url: BASE_URL,
        connections: 10,
        duration: 3600, // 1 hora
        method: 'GET'
    }, 'Prueba de resistencia durante 1 hora');
}

// ======================== PRUEBAS BASELINE ========================

async function baselineTest() {
    return await runTest('BASELINE TEST', {
        url: BASE_URL,
        connections: 20,
        duration: 120,
        method: 'GET'
    }, 'Prueba baseline para comparaciones futuras');
}

// ======================== FUNCIONES DE EJECUCIÓN ========================

async function runLoadTests() {
    console.log('📊 === EJECUTANDO PRUEBAS DE CARGA ===');
    await loadTestLigero();
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 min pausa
    await loadTestMedio();
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 min pausa
    await loadTestAlto();
}

async function runStressTests() {
    console.log('🔥 === EJECUTANDO PRUEBAS DE STRESS ===');
    await stressTestEscalado();
}

async function runSpikeTests() {
    console.log('⚡ === EJECUTANDO PRUEBAS DE SPIKE ===');
    await spikeTestCorto();
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30s pausa
    await spikeTestIntenso();
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30s pausa
    await spikeTestExtremo();
}

async function runSoakTests() {
    console.log('🕰️ === EJECUTANDO PRUEBAS SOAK/ENDURANCE ===');
    console.log('⚠️  ADVERTENCIA: Estas pruebas son MUY largas!');
    await soakTestCorto();
    console.log('🤔 ¿Continuar con endurance test de 1 hora? (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s para cancelar
    await enduranceTest();
}

async function runBaselineTest() {
    console.log('📈 === EJECUTANDO PRUEBA BASELINE ===');
    await baselineTest();
}

async function runAllTests() {
    console.log('🚀 === EJECUTANDO BATERÍA COMPLETA DE PRUEBAS ===');
    console.log('⚠️  ADVERTENCIA: Esta batería puede tomar HORAS!');
    console.log('📅 Inicio:', new Date().toLocaleString());
    
    await runBaselineTest();
    await new Promise(resolve => setTimeout(resolve, 120000)); // 2 min pausa
    
    await runLoadTests();
    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min pausa
    
    await runSpikeTests();
    await new Promise(resolve => setTimeout(resolve, 180000)); // 3 min pausa
    
    await runStressTests();
    
    console.log('✅ Batería básica completada. Saltando soak tests por tiempo.');
    console.log('💡 Para ejecutar soak tests: node performance-tests.js soak');
}

// ======================== MAIN ========================

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    console.log('🎯 === AUTOCANNON PERFORMANCE TESTS SUITE ===');
    console.log('🌐 Target URL:', BASE_URL);
    console.log('📅 Fecha:', new Date().toLocaleString());
    console.log('');
    
    try {
        switch (command) {
            case 'load':
                await runLoadTests();
                break;
            case 'stress':
                await runStressTests();
                break;
            case 'spike':
                await runSpikeTests();
                break;
            case 'soak':
                await runSoakTests();
                break;
            case 'baseline':
                await runBaselineTest();
                break;
            case 'all':
            default:
                await runAllTests();
                break;
        }
    } catch (error) {
        console.error('💥 ERROR CRÍTICO:', error);
    }
    
    console.log('\n✅ === SUITE DE PRUEBAS COMPLETADA ===');
    console.log('📁 Revisa la carpeta test-results/ para ver los resultados detallados');
}

if (require.main === module) {
    console.log('📋 Comandos disponibles:');
    console.log('  • node performance-tests.js load     -> Pruebas de carga');
    console.log('  • node performance-tests.js stress   -> Pruebas de stress');
    console.log('  • node performance-tests.js spike    -> Pruebas de spike');
    console.log('  • node performance-tests.js soak     -> Pruebas soak/endurance');
    console.log('  • node performance-tests.js baseline -> Prueba baseline');
    console.log('  • node performance-tests.js all      -> Todas las pruebas');
    console.log('');
    
    main().catch(console.error);
}

module.exports = {
    runLoadTests,
    runStressTests,
    runSpikeTests,
    runSoakTests,
    runBaselineTest,
    runAllTests,
    loadTestLigero,
    loadTestMedio,
    loadTestAlto,
    stressTestEscalado,
    spikeTestCorto,
    spikeTestIntenso,
    spikeTestExtremo,
    soakTestCorto,
    enduranceTest,
    baselineTest
};