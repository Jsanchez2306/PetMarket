const autocannon = require('autocannon');

// Configuración base para las pruebas
const baseConfig = {
    url: 'http://localhost:3191',
    connections: 5,
    duration: 10
};

// Función para ejecutar tests con configuración específica
async function runTest(testName, config, description) {
    console.log(`\n=== ${testName} ===`);
    console.log(`Descripcion: ${description}`);
    console.log(`Configuracion: ${config.connections} conexiones, ${config.duration}s`);
    console.log(`Endpoint: ${config.url}`);
    
    try {
        const result = await autocannon(config);
        
        console.log(`\n=== RESULTADOS - ${testName} ===`);
        
        const reqsPerSec = result.requests.average.toFixed(2);
        const latency = result.latency.average.toFixed(2);
        const throughput = (result.throughput.average / 1024 / 1024).toFixed(2);
        
        console.log(`Requests/segundo promedio: ${reqsPerSec}`);
        console.log(`Latencia promedio: ${latency}ms`);
        console.log(`Total de requests: ${result.requests.total}`);
        console.log(`Requests exitosos: ${result['2xx']}`);
        console.log(`Errores: ${result.errors}`);
        console.log(`Throughput: ${throughput} MB/s`);
        
        // Evaluacion de rendimiento
        console.log(`\n--- EVALUACION DE RENDIMIENTO ---`);
        
        // Requests por segundo
        if (reqsPerSec >= 100) {
            console.log(`Requests/s: EXCELENTE (${reqsPerSec}) - Esperado: >100 req/s`);
        } else if (reqsPerSec >= 50) {
            console.log(`Requests/s: BUENO (${reqsPerSec}) - Esperado: >100 req/s`);
        } else if (reqsPerSec >= 20) {
            console.log(`Requests/s: ACEPTABLE (${reqsPerSec}) - Esperado: >100 req/s`);
        } else {
            console.log(`Requests/s: PROBLEMATICO (${reqsPerSec}) - Esperado: >100 req/s, Critico: <20 req/s`);
        }
        
        // Latencia
        if (latency <= 50) {
            console.log(`Latencia: EXCELENTE (${latency}ms) - Esperado: <100ms`);
        } else if (latency <= 100) {
            console.log(`Latencia: BUENO (${latency}ms) - Esperado: <100ms`);
        } else if (latency <= 300) {
            console.log(`Latencia: ACEPTABLE (${latency}ms) - Esperado: <100ms`);
        } else {
            console.log(`Latencia: PROBLEMATICO (${latency}ms) - Esperado: <100ms, Critico: >300ms`);
        }
        
        // Tasa de errores
        const errorRate = (result.errors / result.requests.total * 100).toFixed(2);
        if (result.errors === 0) {
            console.log(`Tasa de errores: EXCELENTE (0%) - Esperado: <1%`);
        } else if (errorRate <= 1) {
            console.log(`Tasa de errores: ACEPTABLE (${errorRate}%) - Esperado: <1%`);
        } else if (errorRate <= 5) {
            console.log(`Tasa de errores: PROBLEMATICO (${errorRate}%) - Esperado: <1%, Critico: >5%`);
        } else {
            console.log(`Tasa de errores: CRITICO (${errorRate}%) - Esperado: <1%, Critico: >5%`);
        }
        
        // Throughput
        if (throughput >= 1) {
            console.log(`Throughput: EXCELENTE (${throughput} MB/s) - Esperado: >0.5 MB/s`);
        } else if (throughput >= 0.5) {
            console.log(`Throughput: BUENO (${throughput} MB/s) - Esperado: >0.5 MB/s`);
        } else {
            console.log(`Throughput: BAJO (${throughput} MB/s) - Esperado: >0.5 MB/s, Critico: <0.1 MB/s`);
        }
        
        return result;
    } catch (error) {
        console.error(`ERROR ejecutando ${testName}:`, error.message);
        return null;
    }
}

// ======================== TESTS DE INDEX ROUTES ========================

// Test 1: Homepage
async function testHomepage() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/',
        method: 'GET'
    };
    
    return runTest('TEST HOMEPAGE', config, 'Prueba de rendimiento en la página principal');
}

// Test 2: Catálogo de productos (ruta correcta)
async function testCatalogo() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/productos/catalogo',
        method: 'GET'
    };
    
    return runTest('TEST CATÁLOGO', config, 'Prueba de rendimiento en el catálogo de productos');
}

// Test 3: Página Nosotros
async function testNosotros() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/nosotros',
        method: 'GET'
    };
    
    return runTest('TEST NOSOTROS', config, 'Prueba de rendimiento para página Nosotros');
}

// Test 4: Página de restricción
async function testRestriccion() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/restriccion',
        method: 'GET'
    };
    
    return runTest('TEST RESTRICCIÓN', config, 'Prueba de rendimiento para página de restricción');
}

// ======================== TESTS DE AUTH ROUTES ========================

// Test 5: Verificar autenticación
async function testAuthVerify() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/auth/verify',
        method: 'GET'
    };
    
    return runTest('TEST AUTH VERIFY', config, 'Prueba de rendimiento para verificar autenticación');
}

// Test 6: Login (POST)
async function testAuthLogin() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/auth/login',
        method: 'POST',
        connections: 3, // Reducir para evitar crear muchas sesiones
        duration: 5,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'test@test.com',
            password: 'test123'
        })
    };
    
    return runTest('TEST AUTH LOGIN', config, 'Prueba de rendimiento para login de usuarios');
}

// Test 7: Registro (POST)
async function testAuthRegistro() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/auth/registro',
        method: 'POST',
        connections: 2, // Muy reducido para evitar spam en DB
        duration: 3,    // Duración muy corta
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nombre: 'TestUser' + Date.now(),
            email: 'test' + Date.now() + '@test.com',
            password: '123456'
        })
    };
    
    return runTest('TEST AUTH REGISTRO', config, 'Prueba de rendimiento para registro de usuarios');
}

// Test 8: Recuperar contraseña (POST)
async function testAuthRecuperar() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/auth/recuperar-password',
        method: 'POST',
        connections: 2, // Muy reducido para evitar spam de emails
        duration: 3,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'test@test.com'
        })
    };
    
    return runTest('TEST AUTH RECUPERAR', config, 'Prueba de rendimiento para recuperar contraseña');
}

// Test 9: Logout (POST)
async function testAuthLogout() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/auth/logout',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    return runTest('TEST AUTH LOGOUT', config, 'Prueba de rendimiento para cerrar sesión');
}

// ======================== TESTS DE PRODUCTOS ROUTES ========================

// Test 10: API Productos (público)
async function testProductosAPI() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/productos/api',
        method: 'GET'
    };
    
    return runTest('TEST PRODUCTOS API', config, 'Prueba de rendimiento para API de productos');
}

// Test 11: Productos aleatorios (público)
async function testProductosAleatorios() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/productos/api/aleatorios',
        method: 'GET'
    };
    
    return runTest('TEST PRODUCTOS ALEATORIOS', config, 'Prueba de rendimiento para productos aleatorios');
}

// Test 12: Productos con filtros (público)
async function testProductosFiltros() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/productos/api/filtros?categoria=perros&precio_min=10&precio_max=100',
        method: 'GET'
    };
    
    return runTest('TEST PRODUCTOS FILTROS', config, 'Prueba de rendimiento para productos con filtros');
}

// ======================== TESTS DE CARRITO ROUTES ========================

// Test 13: Obtener carrito (requiere auth - probará sin auth)
async function testCarritoObtener() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/carrito/api/obtener',
        method: 'GET'
    };
    
    return runTest('TEST CARRITO OBTENER', config, 'Prueba de rendimiento para obtener carrito (sin auth)');
}

// Test 14: Vista carrito (requiere auth - probará sin auth)
async function testCarritoVista() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/carrito/',
        method: 'GET'
    };
    
    return runTest('TEST CARRITO VISTA', config, 'Prueba de rendimiento para vista del carrito (sin auth)');
}

// ======================== TESTS DE ESTRÉS ========================

// Test 15: Stress test - Homepage
async function stressTestHomepage() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/',
        connections: 20,
        duration: 15,
        method: 'GET'
    };
    
    return runTest('STRESS TEST HOMEPAGE', config, 'Prueba de estrés en homepage con mayor carga');
}

// Test 16: Stress test - Productos API
async function stressTestProductos() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/productos/api',
        connections: 15,
        duration: 12,
        method: 'GET'
    };
    
    return runTest('STRESS TEST PRODUCTOS API', config, 'Prueba de estrés en API de productos');
}

// Test 17: Load test intensivo
async function loadTestIntenso() {
    const config = {
        ...baseConfig,
        url: baseConfig.url + '/',
        connections: 30,
        duration: 20,
        method: 'GET'
    };
    
    return runTest('LOAD TEST INTENSO', config, 'Prueba de carga intensiva para evaluar límites del servidor');
}

// ======================== FUNCIONES DE EJECUCIÓN ========================

// Función para ejecutar tests básicos de rendimiento
async function runPerformanceTests() {
    console.log('=== TESTS DE RENDIMIENTO BASICO ===');
    
    const tests = [
        testHomepage,
        testCatalogo,
        testNosotros,
        testRestriccion,
        testAuthVerify,
        testAuthLogin,
        testAuthLogout,
        testProductosAPI,
        testProductosAleatorios,
        testCarritoObtener
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await test();
        results.push(result);
        
        // Pausa entre tests
        console.log('Pausa de 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return results;
}

// Función para ejecutar tests de estrés
async function runStressTests() {
    console.log('\n=== TESTS DE ESTRES ===');
    
    const stressTests = [
        stressTestHomepage,
        stressTestProductos,
        loadTestIntenso
    ];
    
    const results = [];
    
    for (const test of stressTests) {
        const result = await test();
        results.push(result);
        
        // Pausa más larga entre tests de estrés
        console.log('Pausa de 8 segundos entre tests de estres...');
        await new Promise(resolve => setTimeout(resolve, 8000));
    }
    
    return results;
}

// Función para ejecutar solo tests de index routes
async function runIndexTests() {
    console.log('=== TESTS DE INDEX ROUTES ===');
    
    const indexTests = [
        testHomepage,
        testCatalogo,
        testNosotros,
        testRestriccion
    ];
    
    const results = [];
    
    for (const test of indexTests) {
        const result = await test();
        results.push(result);
        
        console.log('Pausa de 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}

// Función para ejecutar solo tests de auth routes
async function runAuthTests() {
    console.log('=== TESTS DE AUTH ROUTES ===');
    
    const authTests = [
        testAuthVerify,
        testAuthLogin,
        testAuthLogout,
        testAuthRegistro,
        testAuthRecuperar
    ];
    
    const results = [];
    
    for (const test of authTests) {
        const result = await test();
        results.push(result);
        
        console.log('Pausa de 4 segundos...');
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    return results;
}

// Función para ejecutar solo tests de productos
async function runProductosTests() {
    console.log('=== TESTS DE PRODUCTOS ROUTES ===');
    
    const productosTests = [
        testProductosAPI,
        testProductosAleatorios,
        testProductosFiltros
    ];
    
    const results = [];
    
    for (const test of productosTests) {
        const result = await test();
        results.push(result);
        
        console.log('Pausa de 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}

// Función para ejecutar solo tests de carrito
async function runCarritoTests() {
    console.log('=== TESTS DE CARRITO ROUTES ===');
    
    const carritoTests = [
        testCarritoVista,
        testCarritoObtener
    ];
    
    const results = [];
    
    for (const test of carritoTests) {
        const result = await test();
        results.push(result);
        
        console.log('Pausa de 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}

// Función principal para ejecutar todos los tests
async function runAllTests() {
    console.log('=== INICIANDO BATERIA COMPLETA DE TESTS PETMARKET ===');
    console.log('Fecha:', new Date().toISOString());
    console.log('URL Base:', baseConfig.url);
    console.log('ADVERTENCIA: Esta bateria puede tomar varios minutos');
    
    // Ejecutar tests de rendimiento
    const performanceResults = await runPerformanceTests();
    
    // Pausa antes de tests de estrés
    console.log('\nPausa de 15 segundos antes de tests de estres...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Ejecutar tests de estrés
    const stressResults = await runStressTests();
    
    // Combinar resultados
    const allResults = [...performanceResults, ...stressResults];
    
    // Resumen final
    console.log('\n=== RESUMEN FINAL COMPLETO ===');
    console.log('TESTS DE RENDIMIENTO:');
    performanceResults.forEach((result, index) => {
        if (result) {
            console.log(`  • Test ${index + 1}: ${result.requests.average.toFixed(2)} req/s - ${result.latency.average.toFixed(2)}ms latencia`);
        }
    });
    
    console.log('\nTESTS DE ESTRES:');
    stressResults.forEach((result, index) => {
        if (result) {
            console.log(`  • Stress ${index + 1}: ${result.requests.average.toFixed(2)} req/s - ${result.latency.average.toFixed(2)}ms latencia`);
        }
    });
    
    // Estadísticas generales
    const validResults = allResults.filter(r => r !== null);
    if (validResults.length > 0) {
        const avgRequests = validResults.reduce((sum, r) => sum + r.requests.average, 0) / validResults.length;
        const avgLatency = validResults.reduce((sum, r) => sum + r.latency.average, 0) / validResults.length;
        
        console.log('\n=== ESTADISTICAS GENERALES ===');
        console.log(`Promedio de requests/segundo: ${avgRequests.toFixed(2)}`);
        console.log(`Promedio de latencia: ${avgLatency.toFixed(2)}ms`);
        console.log(`Tests completados exitosamente: ${validResults.length}/${allResults.length}`);
        
        // Evaluacion general del sistema
        console.log('\n=== EVALUACION GENERAL DEL SISTEMA ===');
        if (avgRequests >= 100 && avgLatency <= 100) {
            console.log('Estado del sistema: EXCELENTE - Rendimiento optimo');
        } else if (avgRequests >= 50 && avgLatency <= 200) {
            console.log('Estado del sistema: BUENO - Rendimiento aceptable');
        } else if (avgRequests >= 20 && avgLatency <= 500) {
            console.log('Estado del sistema: REGULAR - Necesita optimizacion');
        } else {
            console.log('Estado del sistema: PROBLEMATICO - Requiere atencion inmediata');
        }
    }
    
    console.log('\n=== BATERIA DE TESTS COMPLETADA ===');
    return allResults;
}

// ======================== EJECUCIÓN SEGÚN ARGUMENTOS ========================

// Detectar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'index':
                await runIndexTests();
                break;
            case 'auth':
                await runAuthTests();
                break;
            case 'productos':
                await runProductosTests();
                break;
            case 'carrito':
                await runCarritoTests();
                break;
            case 'performance':
                await runPerformanceTests();
                break;
            case 'stress':
                await runStressTests();
                break;
            case 'all':
            default:
                await runAllTests();
                break;
        }
    } catch (error) {
        console.error('ERROR en la ejecucion:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    console.log('=== AUTOCANNON TESTS EJECUTOR PETMARKET ===');
    console.log('Comandos disponibles:');
    console.log('  • node test-runner.js          -> Ejecutar todos los tests');
    console.log('  • node test-runner.js all      -> Ejecutar todos los tests');
    console.log('  • node test-runner.js index    -> Solo tests de index routes (/, /nosotros, etc.)');
    console.log('  • node test-runner.js auth     -> Solo tests de auth routes (/auth/*)');
    console.log('  • node test-runner.js productos -> Solo tests de productos (/productos/api/*)');
    console.log('  • node test-runner.js carrito  -> Solo tests de carrito (/carrito/*)');
    console.log('  • node test-runner.js performance -> Tests de rendimiento general');
    console.log('  • node test-runner.js stress   -> Solo tests de estres');
    console.log('');
    console.log('=== RUTAS DISPONIBLES EN PETMARKET ===');
    console.log('📄 INDEX: /, /nosotros, /restriccion, /productos/catalogo');
    console.log('🔐 AUTH: /auth/verify, /auth/login, /auth/logout, /auth/registro');
    console.log('🏪 PRODUCTOS: /productos/api, /productos/api/aleatorios, /productos/api/filtros');
    console.log('🛒 CARRITO: /carrito/, /carrito/api/obtener (requieren auth)');
    console.log('');
    console.log('=== CRITERIOS DE EVALUACION ===');
    console.log('EXCELENTE: >100 req/s, <50ms latencia, 0% errores');
    console.log('BUENO: 50-100 req/s, 50-100ms latencia, <1% errores');
    console.log('ACEPTABLE: 20-50 req/s, 100-300ms latencia, 1-5% errores');
    console.log('PROBLEMATICO: <20 req/s, >300ms latencia, >5% errores');
    console.log('');
    
    main().catch(console.error);
}

module.exports = {
    runAllTests,
    runPerformanceTests,
    runStressTests,
    runIndexTests,
    runAuthTests,
    runProductosTests,
    runCarritoTests,
    testHomepage,
    testCatalogo,
    testNosotros,
    testRestriccion,
    testAuthVerify,
    testAuthLogin,
    testAuthLogout,
    testAuthRegistro,
    testAuthRecuperar,
    testProductosAPI,
    testProductosAleatorios,
    testProductosFiltros,
    testCarritoVista,
    testCarritoObtener,
    stressTestHomepage,
    stressTestProductos,
    loadTestIntenso
};