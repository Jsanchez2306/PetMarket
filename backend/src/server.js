const app = require('./app');
const mongoose = require('../src/config/connection');
require('dotenv').config({quiet : true});

app.listen(process.env.PORT, () => {
  console.log(
    `Servidor corriendo en 
    http://localhost:${process.env.PORT}
    http://localhost:${process.env.PORT}/Clientes`);
});
