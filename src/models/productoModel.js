const db = require('../database/db');

class ProductoModel {
    constructor(row = {}) {
        this.id_producto = row.id_producto;
        this.nombre = row.nombre;
        this.descripcion = row.descripcion;
        this.precio = row.precio !== undefined ? row.precio : row.precio_unitario;
        this.precio_unitario = row.precio_unitario !== undefined ? row.precio_unitario : row.precio;
        this.stock = row.stock;
        this.imagen = row.imagen;
        this.id_categoria = row.id_categoria;
        this.estado_producto = row.estado_producto;
        this.categoria_nombre = row.categoria_nombre;
    }

    /**
     * Obtiene una lista de productos activos instanciados.
     * @returns {Promise<ProductoModel[]>} Array de instancias de ProductoModel.
     */
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
                else resolve(rows.map(row => new ProductoModel(row)));
            });
        });
    }

    /**
     * Verifica stock como método de instancia.
     * @param {number} cantidad - Cantidad a verificar.
     * @returns {Promise<boolean>}
     */
    async verificarStock(cantidad) {
        if (this.stock < cantidad) {
            throw new Error(`Stock insuficiente. Solo quedan ${this.stock} unidades.`);
        }
        return true;
    }

    /**
     * Verifica stock como método estático (para compatibilidad).
     * @param {number} id - ID del producto.
     * @param {number} cantidad - Cantidad a verificar.
     * @returns {Promise<boolean>}
     */
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

    /**
     * Obtiene un producto instanciado por su ID.
     * @param {number} id - ID del producto.
     * @returns {Promise<ProductoModel|null>} Instancia de ProductoModel.
     */
    static obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM producto WHERE id_producto = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? new ProductoModel(row) : null);
            });
        });
    }

    /**
     * Actualiza el stock de la instancia actual del producto y lo persiste en la base de datos.
     * @param {number} nuevoStock - El nuevo stock.
     * @returns {Promise<boolean>}
     */
    async actualizarStock(nuevoStock) {
        const self = this;
        return new Promise((resolve, reject) => {
            db.run("UPDATE producto SET stock = ? WHERE id_producto = ?", [nuevoStock, self.id_producto], function(err) {
                if (err) reject(err);
                else {
                    const success = this.changes > 0;
                    if (success) {
                        self.stock = nuevoStock;
                    }
                    resolve(success);
                }
            });
        });
    }

    /**
     * Actualiza stock estáticamente (para compatibilidad).
     * @param {number} id - ID del producto.
     * @param {number} nuevoStock - El nuevo stock.
     * @returns {Promise<boolean>}
     */
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

    /**
     * Descuenta el stock de la instancia actual y persiste el cambio en la base de datos de manera atómica.
     * @param {number} cantidad - Cantidad a descontar.
     * @returns {Promise<boolean>} Resolves to true if stock was updated.
     */
    async descontarStock(cantidad) {
        const self = this;
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE producto SET stock = stock - ? WHERE id_producto = ? AND stock >= ?",
                [cantidad, self.id_producto, cantidad],
                function(err) {
                    if (err) reject(err);
                    else if (this.changes === 0) {
                        reject(new Error("Stock insuficiente."));
                    } else {
                        self.stock -= cantidad;
                        resolve(true);
                    }
                }
            );
        });
    }

    /**
     * Descuenta el stock de un producto si hay suficiente disponible (estático, para compatibilidad).
     * @param {number} id - ID del producto.
     * @param {number} cantidad - Cantidad a descontar.
     * @returns {Promise<boolean>} Resolves to true if stock was updated.
     */
    static descontarStock(id, cantidad) {
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE producto SET stock = stock - ? WHERE id_producto = ? AND stock >= ?",
                [cantidad, id, cantidad],
                function(err) {
                    if (err) reject(err);
                    else if (this.changes === 0) {
                        reject(new Error("Stock insuficiente."));
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }
}

module.exports = ProductoModel;
