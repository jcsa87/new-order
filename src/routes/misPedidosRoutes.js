const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');

// Rutas para consultar pedidos (protegidas por sesión en el controlador o middleware)
router.get('/', PedidoController.listarPedidosUsuario);
router.get('/:id', PedidoController.verDetallePedido);

module.exports = router;
