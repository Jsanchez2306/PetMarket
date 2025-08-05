const mongoose = require('../config/connection');
const Cliente = require('../models/cliente.model');

async function obtenerClientes() {
  try {
    const clientes = await Cliente.find();

    if (clientes.length === 0) {
      console.log('No hay clientes registrados.');
    } else {
      console.log('Lista de clientes:\n');
      clientes.forEach((cliente) => {
        console.log(`ID: ${cliente._id}`);
        console.log(`Nombre: ${cliente.nombre}`);
        console.log(`Email: ${cliente.email}`);
        console.log(`Teléfono: ${cliente.telefono}`);
        console.log(`Dirección: ${cliente.direccion}`);
      });
    }

  } catch (error) {
    console.error('Error al obtener clientes:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

obtenerClientes();
