const db = require('../database/db');

class RolModel {
    static obtenerRoles() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM rol WHERE estado = 'activo'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = RolModel;
