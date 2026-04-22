const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/productoController');

router.get('/', ProductoController.listarProductos);
router.get('/:id', ProductoController.verDetalle);

module.exports = router;
