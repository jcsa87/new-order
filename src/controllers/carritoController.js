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
            const id = parseInt(productId);
            const itemsCarrito = CarritoService.obtenerCarrito();
            const itemExistente = itemsCarrito.find(item => item.id_producto === id);
            const cantidadTotal = (itemExistente ? itemExistente.quantity : 0) + qty;

            await ProductoModel.verificarStock(id, cantidadTotal); 

            const producto = await ProductoModel.obtenerPorId(id);
            if (producto) {
                CarritoService.añadirProducto(producto, qty);
            }

            const referer = req.get('Referer') || '/products';
            const separator = referer.includes('?') ? '&' : '?';
            res.redirect(referer + separator + 'cart=open');
        } catch (error) {
            console.error("[CONTROLLER] Error:", error.message);
            
            // Limpiar el referer de parámetros previos de error para evitar duplicados
            const referer = req.get('Referer') || '/products';
            
            try {
                const url = new URL(referer, `http://${req.headers.host}`);
                url.searchParams.delete('error');
                url.searchParams.set('error', error.message);
                url.searchParams.set('cart', 'open');
                res.redirect(url.pathname + url.search);
            } catch (e) {
                res.redirect(`/products?error=${encodeURIComponent(error.message)}&cart=open`);
            }
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
            try {
                const url = new URL(referer, `http://${req.headers.host}`);
                url.searchParams.delete('error');
                url.searchParams.set('error', error.message);
                url.searchParams.set('cart', 'open');
                res.redirect(url.pathname + url.search);
            } catch (e) {
                res.redirect(`/cart?error=${encodeURIComponent(error.message)}&cart=open`);
            }
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
