const ProductoModel = require('../models/productoModel');
const CarritoService = require('../services/carritoService');

class CarritoController {
    static verCarrito(req, res) {
        const itemsCarrito = CarritoService.obtenerCarrito();
        const totales = CarritoService.obtenerTotales();
        const cantidadCarrito = itemsCarrito.reduce((acc, item) => acc + item.quantity, 0);

        res.render('cart', {
            itemsCarrito,
            totales,
            cantidadCarrito,
            error: req.query.error || null
        });
    }

    static async agregarItem(req, res) {
        const { productId, cantidad } = req.body;
        const qty = parseInt(cantidad) || 1;

        try {
            await ProductoModel.verificarStock(productId, qty); // 1. verificarStock(cantidad)

            const producto = await ProductoModel.obtenerPorId(productId);
            if (producto) {
                CarritoService.añadirProducto(producto, qty); // 2. añadirProducto()
            }

            res.redirect('/products?cart=open');
        } catch (error) {
            // Caso Alternativo: Stock Insuficiente 
            console.error("[CONTROLLER] Error:", error.message);
            res.redirect('/products?error=' + encodeURIComponent(error.message));
        }
    }

    static actualizarCantidad(req, res) {
        const { productId, nuevaCantidad } = req.body;

        try {
            CarritoService.actualizarCantidad(productId, parseInt(nuevaCantidad));
            const referer = req.get('Referer') || '/cart';
            const separator = referer.includes('?') ? '&' : '?';
            res.redirect(referer + separator + 'cart=open');
        } catch (error) {
            console.error("[CONTROLLER] Error:", error.message);
            const referer = req.get('Referer') || '/cart';
            const separator = referer.includes('?') ? '&' : '?';
            res.redirect(referer + separator + 'error=' + encodeURIComponent(error.message) + '&cart=open');
        }
    }

    static quitarItem(req, res) {
        const { productId } = req.body;
        try {
            CarritoService.quitarItem(productId);
        } catch (error) {
            console.error("[CONTROLLER] Error:", error.message);
        }

        const referer = req.get('Referer') || '/cart';
        const separator = referer.includes('?') ? '&' : '?';
        res.redirect(referer + separator + 'cart=open');
    }
}

module.exports = CarritoController;
