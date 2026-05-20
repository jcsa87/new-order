const db = require('../database/db');

class ProvinciaModel {
    static obtenerProvincias() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM provincia ORDER BY nombre", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = ProvinciaModel;
