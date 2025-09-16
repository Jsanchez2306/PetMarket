const express = require('express');
const router = express.Router();

const panelController = require('../controllers/panel.controller');
const { validarAuth } = require('../middlewares/validateAuth');


router.get('/', panelController.mostrarPanel);

module.exports = router;
