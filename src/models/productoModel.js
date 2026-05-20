const db = require('../database/db');

class ProductoModel {
    static obtenerActivos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, c.nombre as categoria_nombre 
                FROM producto p
                JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.estado_producto = 'activo'
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static async verificarStock(id, cantidad) {
        return new Promise((resolve, reject) => {
            db.get("SELECT stock FROM producto WHERE id_producto = ?", [id], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error("Producto no encontrado."));
                
                if (row.stock < cantidad) {
                    return reject(new Error(`Stock insuficiente. Solo quedan ${row.stock} unidades.`));
                }
                resolve(true); // Stock suficiente
            });
        });
    }

    static obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM producto WHERE id_producto = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static actualizarStock(id, nuevoStock) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE producto SET stock = ? WHERE id_producto = ?", [nuevoStock, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    static async obtenerCatalogoAgrupado() {
        const productos = await this.obtenerActivos();
        
        // Agrupar por categoría
        const catalogoAgrupado = productos.reduce((acc, producto) => {
            const categoria = producto.categoria_nombre || 'Sin Categoría';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(producto);
            return acc;
        }, {});
        
        return catalogoAgrupado;
    }
}

module.exports = ProductoModel;
