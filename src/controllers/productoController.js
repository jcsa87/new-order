const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');
const CarritoService = require('../services/carritoService');

class ProductoController {
    static async index(req, res) {
        try {
            const productos = await ProductoModel.obtenerTodos();
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
}

module.exports = ProductoController;
