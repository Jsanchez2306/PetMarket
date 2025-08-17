const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rutas para registro y login
router.post('/registro', authController.registro);
router.post('/login', authController.login);

module.exports = router;
