// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/login', AuthController.renderLogin);
router.post('/login', AuthController.handleLogin);

router.get('/register', AuthController.renderRegister);
router.post('/register', AuthController.handleRegister);

// API for locations
router.get('/localidades/:id', AuthController.getLocalidades);

router.get('/logout', AuthController.handleLogout);

module.exports = router;
