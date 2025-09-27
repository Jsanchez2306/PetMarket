const express = require('express');
const router = express.Router();

const panelController = require('../controllers/panel.controller');
const { validarAuth, validarAdmin } = require('../middlewares/validateAuth');


router.get('/', panelController.mostrarPanel);

module.exports = router;
