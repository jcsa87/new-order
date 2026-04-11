// src/controllers/productController.js
const ProductModel = require('../models/productModel');
const CartService = require('../services/cartService');

class ProductController {
    static index(req, res) {
        const products = ProductModel.getAll();
        const cartItems = CartService.getCart();
        const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

        res.render('catalog', { 
            products, 
            cartCount 
        });
    }
}

module.exports = ProductController;
