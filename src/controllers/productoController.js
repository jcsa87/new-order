const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');
const CarritoService = require('../services/carritoService');

class ProductoController {
    static async listarProductos(req, res) {
        try {
            const productos = await ProductoModel.obtenerActivos();
            const categorias = await CategoriaModel.obtenerTodas();
            
            // Agrupar productos por categoría
            const categoriasAgrupadas = categorias.map(cat => ({
                ...cat,
                productos: productos.filter(p => p.id_categoria === cat.id_categoria)
            })).filter(cat => cat.productos.length > 0);

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
            const producto = await ProductoModel.obtenerPorId(id);
            
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
