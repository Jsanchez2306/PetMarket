const ngrok = require('ngrok');

async function createTunnel() {
  try {
    console.log('🚀 Iniciando túnel ngrok...');
    
    // Esperar un poco para asegurar que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar si ya hay un túnel activo
    try {
      const tunnels = await ngrok.getApi().listTunnels();
      if (tunnels.data && tunnels.data.length > 0) {
        const existingTunnel = tunnels.data.find(t => t.config && t.config.addr === 'localhost:3191');
        if (existingTunnel) {
          console.log('✅ Túnel existente encontrado:', existingTunnel.public_url);
          console.log('🌐 URL pública:', existingTunnel.public_url);
          printUrls(existingTunnel.public_url);
          return;
        }
      }
    } catch (e) {
      console.log('📋 No hay túneles existentes, creando uno nuevo...');
    }
    
    // Crear túnel para el puerto 3191
    const url = await ngrok.connect({
      addr: 3191,
      proto: 'http',
      region: 'us',
      name: 'petmarket-tunnel'
    });
    
    console.log('✅ Túnel ngrok creado exitosamente!');
    console.log('🌐 URL pública:', url);
    printUrls(url);
    
    // Mantener el proceso activo
    // Mantener el proceso activo
    console.log('⚠️  Para detener el túnel, presiona Ctrl+C');
    
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    
  } catch (error) {
    console.error('❌ Error creando túnel ngrok:', error);
    if (error.body && error.body.details) {
      console.error('💡 Detalles:', error.body.details);
    }
    process.exit(1);
  }
}

function printUrls(url) {
  console.log('🏠 URL local: http://localhost:3191');
  console.log('📝 Copia esta URL pública para usar en Mercado Pago');
  console.log('');
  console.log('🔗 URLs para Mercado Pago:');
  console.log('   Success:', `${url}/mercadopago/success`);
  console.log('   Failure:', `${url}/mercadopago/failure`);
  console.log('   Pending:', `${url}/mercadopago/pending`);
  console.log('   Webhook:', `${url}/mercadopago/webhook`);
  console.log('');
}

async function cleanup() {
  console.log('\n🛑 Cerrando túnel ngrok...');
  try {
    await ngrok.disconnect();
    await ngrok.kill();
  } catch (e) {
    // Ignorar errores de limpieza
  }
  process.exit(0);
}

createTunnel();