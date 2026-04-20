const ProductoModel = require('../models/productoModel');
const CarritoService = require('../services/carritoService');

class CarritoController {
    static verCarrito(req, res) {
        const itemsCarrito = CarritoService.obtenerCarrito();
        const totales = CarritoService.calcularTotales();
        const cantidadCarrito = itemsCarrito.reduce((acc, item) => acc + item.quantity, 0);

        res.render('cart', { 
            itemsCarrito, 
            totales, 
            cantidadCarrito 
        });
    }

    static async agregarItem(req, res) {
        const { productId } = req.body;
        try {
            const producto = await ProductoModel.obtenerPorId(productId);

            if (producto) {
                CarritoService.agregarItem(producto, 1);
            }
            res.redirect('/');
        } catch (error) {
            console.error("Error al agregar item al carrito:", error.message);
            // Redirigir con error si se desea mostrar en UI en el futuro
            res.redirect('/?error=' + encodeURIComponent(error.message));
        }
    }

    static actualizarCantidad(req, res) {
        const { productId, delta } = req.body;
        try {
            CarritoService.actualizarCantidad(productId, parseInt(delta));
        } catch (error) {
            console.error("Error al actualizar cantidad:", error.message);
        }
        res.redirect('back');
    }

    static quitarItem(req, res) {
        const { productId } = req.body;
        try {
            CarritoService.quitarItem(productId);
        } catch (error) {
            console.error("Error al quitar item:", error);
        }
        res.redirect('back');
    }
}

module.exports = CarritoController;
