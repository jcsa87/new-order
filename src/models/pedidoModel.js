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
                db.run("BEGIN TRANSACTION"); //transaccion atomica pura para garantizar integridad de datos

                const { id_usuario, id_metodo_pago, id_metodo_envio, id_direccion, subtotal_pedido, descuento_aplicado, total, items } = datos;
                const fecha_creacion = new Date().toISOString();
                const estado = 'Pendiente'; // Estado inicial según Larman
                
                db.run(
                    //asociando id_usuario, id_metodo_pago y id_direccion. Postcondicion 1,2,3,4 del contrato
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
                        //hace un INSERT INTO detalle_pedido, asociando el ID del producto y el ID del pedido recién creado. (Cumpliendo la post-condición "Por cada ItemCarrito").
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

                        db.run("COMMIT"); //el commit significa que a nivel de base de datos, si algo falla, no se guardan pedidos "a medias"
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

    // [CASO DE USO: Gestionar Pedidos] - El administrador necesita ver un listado de todos los pedidos de la plataforma.
    static obtenerTodos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, u.nombre, u.apellido, u.email 
                FROM pedido p
                JOIN usuario u ON p.id_usuario = u.id_usuario
                ORDER BY p.fecha_creacion DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // [CASO DE USO: Generar Reporte Ventas] - Agrupamos cuánto dinero ingresó según el estado del pedido.
    static obtenerReporteVentas() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT estado, COUNT(id_pedido) as cantidad_pedidos, SUM(total) as ingresos_totales 
                FROM pedido 
                GROUP BY estado
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static obtenerProductosMasVendidos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.nombre, SUM(dp.cantidad) as total_vendido, SUM(dp.subtotal_item) as ingresos
                FROM detalle_pedido dp
                JOIN producto p ON dp.id_producto = p.id_producto
                GROUP BY p.id_producto
                ORDER BY total_vendido DESC
                LIMIT 5
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static obtenerPedidoPorId(id_pedido) {
        return new Promise((resolve, reject) => {
            // Unimos el pedido con el usuario y su dirección para ver todos los datos del cliente
            const sql = `
                SELECT p.*, u.nombre, u.apellido, u.email,
                       d.calle, d.numero_calle, d.nro_piso, d.nro_departamento, d.codigo_postal
                FROM pedido p
                LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
                LEFT JOIN direccion d ON p.id_direccion = d.id_direccion
                WHERE p.id_pedido = ?
            `;
            db.get(sql, [id_pedido], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static obtenerDetallesPorPedido(id_pedido) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT dp.*, p.nombre as producto_nombre, p.imagen as producto_imagen, p.descripcion as producto_descripcion
                FROM detalle_pedido dp
                LEFT JOIN producto p ON dp.id_producto = p.id_producto
                WHERE dp.id_pedido = ?
            `;
            db.all(sql, [id_pedido], (err, rows) => {
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
