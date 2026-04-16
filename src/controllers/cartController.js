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

    static async addItem(req, res) {
        const { productId } = req.body;
        try {
            const product = await ProductModel.getById(productId);

            if (product) {
                CartService.addToCart(product, 1);
            }
        } catch (error) {
            console.error("Error adding item to cart:", error);
        }
        res.redirect('/');
    }
}

module.exports = CartController;
