const db = require('../database/db');

class PedidoModel {
    constructor(id_pedido) {
        this.id_pedido = id_pedido;
    }

    /**
     * Instancia de cambiarEstado para cumplir con la firma del diagrama de clases.
     */
    cambiarEstado(estado) {
        return PedidoModel.cambiarEstado(this.id_pedido, estado);
    }

    static crearPedido(datos) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const { id_usuario, id_metodo_pago, id_metodo_envio, id_direccion, subtotal_pedido, descuento_aplicado, total, items } = datos;
                const fecha_creacion = new Date().toISOString();
                const estado = 'Pendiente'; // Estado inicial según Larman
                
                db.run(
                    `INSERT INTO pedido (fecha_creacion, estado, subtotal_pedido, descuento_aplicado, total, id_usuario, id_metodo_pago, id_metodo_envio, id_direccion) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [fecha_creacion, estado, subtotal_pedido, descuento_aplicado, total, id_usuario, id_metodo_pago, id_metodo_envio, id_direccion],
                    function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }

                        const id_pedido = this.lastID;
                        
                        // Insertar detalles del pedido
                        const stmt = db.prepare(`INSERT INTO detalle_pedido (cantidad, precio_unitario, subtotal_item, id_pedido, id_producto) VALUES (?, ?, ?, ?, ?)`);
                        
                        let errores = false;
                        for (const item of items) {
                            stmt.run([item.quantity, item.precio_unitario, item.subtotal_item, id_pedido, item.id_producto], (err) => {
                                if (err) errores = true;
                            });
                        }
                        stmt.finalize();

                        if (errores) {
                            db.run("ROLLBACK");
                            return reject(new Error("Error al insertar detalles del pedido"));
                        }

                        db.run("COMMIT");
                        resolve(id_pedido);
                    }
                );
            });
        });
    }

    static cambiarEstado(id_pedido, nuevoEstado) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE pedido SET estado = ? WHERE id_pedido = ?", [nuevoEstado, id_pedido], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    static obtenerPedidosPorUsuario(id_usuario) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM pedido 
                WHERE id_usuario = ? 
                ORDER BY fecha_creacion DESC
            `;
            db.all(sql, [id_usuario], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Elimina un pedido y sus detalles asociados en una transacción (compensación por falla de stock).
     * @param {number} id_pedido - ID del pedido a eliminar.
     * @returns {Promise<boolean>}
     */
    static eliminarPedido(id_pedido) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run("DELETE FROM detalle_pedido WHERE id_pedido = ?", [id_pedido], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return reject(err);
                    }
                    db.run("DELETE FROM pedido WHERE id_pedido = ?", [id_pedido], function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                        db.run("COMMIT");
                        resolve(true);
                    });
                });
            });
        });
    }
}

module.exports = PedidoModel;
