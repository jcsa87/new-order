const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const CartService = require('../services/cartService');

class ProductController {
    static async index(req, res) {
        try {
            const products = await ProductModel.getAll();
            const categories = await CategoryModel.getAll();
            const cartItems = CartService.getCart();
            const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

            // Agrupar productos por categoría
            const groupedProducts = categories.map(cat => ({
                ...cat,
                products: products.filter(p => p.id_categoria === cat.id_categoria)
            })).filter(cat => cat.products.length > 0);

            res.render('catalog', { 
                categories: groupedProducts
            });
        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).send("Error interno del servidor");
        }
    }
}

module.exports = ProductController;
