// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');

router.get('/', CartController.viewCart);
router.post('/add', CartController.addItem);

module.exports = router;
