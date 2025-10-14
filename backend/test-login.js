const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Probando login del admin...');
    
    const response = await axios.post('http://localhost:3191/auth/login', {
      email: 'admin@petmarket.com',
      contrasena: 'admin1'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login exitoso!');
    console.log('📊 Respuesta:', response.data);
    
  } catch (error) {
    console.log('❌ Login fallido');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Error:', error.response.data);
    } else {
      console.log('📊 Error:', error.message);
    }
  }
}

testLogin();