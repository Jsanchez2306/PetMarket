require('dotenv').config();
const mongoose = require('./src/config/connection');

setTimeout(async () => {
  try {
    const Empleado = require('./src/models/empleado.model');
    
    console.log('🔍 Buscando empleados con rol admin...');
    const admins = await Empleado.find({rol: 'admin'});
    console.log(`📊 Total admins encontrados: ${admins.length}`);
    
    if (admins.length === 0) {
      console.log('❌ No hay admins en la base de datos');
      
      // Buscar cualquier empleado
      const empleados = await Empleado.find();
      console.log(`📊 Total empleados: ${empleados.length}`);
      
      if (empleados.length > 0) {
        console.log('👥 Empleados existentes:');
        empleados.forEach((emp, i) => {
          console.log(`  ${i+1}. Email: ${emp.email}, Rol: ${emp.rol}, Password: ${emp.contrasena?.substring(0,10)}...`);
        });
      }
    } else {
      console.log('🔑 Admins encontrados:');
      admins.forEach((admin, i) => {
        console.log(`  ${i+1}. Email: ${admin.email}`);
        console.log(`     Rol: ${admin.rol}`);
        console.log(`     Password starts with: ${admin.contrasena?.substring(0,15)}...`);
        console.log(`     Is BCrypt hash: ${admin.contrasena?.startsWith('$2') ? 'SÍ' : 'NO'}`);
        console.log('');
      });
    }
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
  
  process.exit(0);
}, 2000);