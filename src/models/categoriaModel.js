const db = require('../database/db');

class CategoriaModel {
    // Aquí traemos todas las categorías, incluso las inactivas, para que el admin las vea.
    static obtenerTodas() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM categoria", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Traemos solo las categorías activas (para la vista de los clientes)
    static obtenerActivas() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM categoria WHERE estado = 'activo' OR estado IS NULL", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // [CASO DE USO: Gestionar Categorias] - Crear nueva categoría
    static crear(nombre, descripcion) {
        return new Promise((resolve, reject) => {
            db.run("INSERT INTO categoria (nombre, descripcion, estado) VALUES (?, ?, 'activo')", [nombre, descripcion], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // [CASO DE USO: Gestionar Categorias] - Desactivar categoría (Borrado lógico)
    static desactivar(id_categoria) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE categoria SET estado = 'inactivo' WHERE id_categoria = ?", [id_categoria], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    // [CASO DE USO: Gestionar Categorias] - Reactivar
    static activar(id_categoria) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE categoria SET estado = 'activo' WHERE id_categoria = ?", [id_categoria], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }
}

module.exports = CategoriaModel;
