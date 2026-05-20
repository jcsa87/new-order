const db = require('../database/db');

class PaisModel {
    static obtenerPaises() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM pais ORDER BY nombre", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = PaisModel;
