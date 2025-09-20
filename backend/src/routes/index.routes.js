const express = require('express');
const router = express.Router();
const indexController = require('../controllers/index.controller');

router.get('/', indexController.mostrarInicio);
router.get('/productos/catalogo', indexController.mostrarCatalogo);
router.get('/nosotros', indexController.nosotrosVisitantes);
router.get('/restriccion', indexController.restriccion);


module.exports = router;
