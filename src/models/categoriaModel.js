const db = require('../database/db');

class CategoriaModel {
    static obtenerTodas() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM categoria", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = CategoriaModel;
