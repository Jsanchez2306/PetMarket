const express = require('express');
const router = express.Router();

console.log('🛒 ARCHIVO SUPER SIMPLE CARGADO');

router.get('/test', (req, res) => {
    console.log('🧪 TEST FUNCIONANDO');
    res.send('TEST FUNCIONANDO - RUTAS DEL CARRITO OK');
});

console.log('🛒 ARCHIVO SUPER SIMPLE TERMINADO');

module.exports = router;