// src/controllers/productController.js
const ProductModel = require('../models/productModel');
const CartService = require('../services/cartService');

class ProductController {
    static async index(req, res) {
        try {
            const products = await ProductModel.getAll();
            const cartItems = CartService.getCart();
            const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

            res.render('catalog', { 
                products, 
                cartCount 
            });
        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).send("Error interno del servidor");
        }
    }
}

module.exports = ProductController;
