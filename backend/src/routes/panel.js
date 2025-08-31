const express = require('express');
const router = express.Router();
const panelController = require('../controllers/panel.controller');

router.get('/', panelController.mostrarPanel);

module.exports = router;
