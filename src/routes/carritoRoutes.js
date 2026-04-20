const express = require('express');
const router = express.Router();
const CarritoController = require('../controllers/carritoController');

router.get('/', CarritoController.verCarrito);
router.post('/agregar', CarritoController.agregarItem);
router.post('/actualizar', CarritoController.actualizarCantidad);
router.post('/quitar', CarritoController.quitarItem);

module.exports = router;
