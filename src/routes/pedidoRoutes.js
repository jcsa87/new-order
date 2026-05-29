const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');

router.get('/', PedidoController.mostrarCheckout);
router.post('/', PedidoController.procesarCheckout);
router.get('/success', PedidoController.mostrarExito);
router.get('/localidades', PedidoController.obtenerLocalidades);

module.exports = router;
