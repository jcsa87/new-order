const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');

class ProductoService {
    static async obtenerCatalogoAgrupado() {
        const productos = await ProductoModel.obtenerActivos();
        const categorias = await CategoriaModel.obtenerActivas();

        // Agrupar productos por categoría
        const categoriasAgrupadas = categorias.map(cat => ({
            ...cat,
            productos: productos.filter(p => p.id_categoria === cat.id_categoria)
        })).filter(cat => cat.productos.length > 0);

        return categoriasAgrupadas;
    }

    static async obtenerDetalle(id) {
        return await ProductoModel.obtenerPorId(id);
    }
}
 
module.exports = ProductoService;
