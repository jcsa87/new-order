// src/controllers/cartController.js
const ProductModel = require('../models/productModel');
const CartService = require('../services/cartService');

class CartController {
    static viewCart(req, res) {
        const items = CartService.getCart();
        const totals = CartService.calculateTotal();
        const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

        res.render('cart', { 
            items, 
            totals, 
            cartCount 
        });
    }

    static addItem(req, res) {
        const { productId } = req.body;
        const product = ProductModel.getById(productId);

        if (product) {
            try {
                CartService.addToCart(product, 1);
                // En un caso real, aquí decrementaríamos stock o lo haríamos en el checkout
                // Para este sprint, solo simulamos la adición
            } catch (error) {
                console.error(error.message);
            }
        }
        res.redirect('/');
    }
}

module.exports = CartController;
