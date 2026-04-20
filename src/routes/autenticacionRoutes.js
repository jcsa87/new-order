const express = require('express');
const router = express.Router();
const AutenticacionController = require('../controllers/autenticacionController');

router.get('/login', AutenticacionController.mostrarLogin);
router.post('/login', AutenticacionController.procesarLogin);

router.get('/register', AutenticacionController.mostrarRegistro);
router.post('/register', AutenticacionController.procesarRegistro);

// API para localidades
router.get('/localidades/:id', AutenticacionController.obtenerLocalidades);

router.get('/logout', AutenticacionController.cerrarSesion);

module.exports = router;
