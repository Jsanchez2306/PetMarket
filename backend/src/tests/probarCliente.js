const mongoose = require('../config/connection');
const Cliente = require('../models/cliente.model'); 

async function probarInsertarCliente() {
  try {
    const nuevoCliente = new Cliente({
      nombre: 'Juan Péssssrez',
      email: 'prueba@emssssail.com',
      telefono: '12345s6sss789',
      direccion: 'Calslesss Falsa 123'
    });

    const resultado = await nuevoCliente.save();
    console.log('Cliente guardado con éxito:', resultado);
  } catch (error) {
    console.error('Error al guardar cliente:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

probarInsertarCliente();
