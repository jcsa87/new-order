const ProductoService = require('../services/productoService');

class ProductoController {
    static async listarProductos(req, res) {
        try {
            const categoriasAgrupadas = await ProductoService.obtenerCatalogoAgrupado();

            res.render('catalog', { 
                categorias: categoriasAgrupadas
            });
        } catch (error) {
            console.error("Error al obtener productos:", error);
            res.status(500).send("Error interno del servidor");
        }
    }

    static async verDetalle(req, res) {
        try {
            const id = req.params.id;
            const producto = await ProductoService.obtenerDetalle(id);
            
            if (!producto) {
                return res.status(404).send("Producto no encontrado");
            }

            res.render('product-detail', { producto });
        } catch (error) {
            console.error("Error al obtener detalle del producto:", error);
            res.status(500).send("Error interno del servidor");
        }
    }
}

module.exports = ProductoController;
