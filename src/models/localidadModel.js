const db = require('../database/db');

class LocalidadModel {
    static obtenerLocalidadesPorProvincia(id_provincia) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM localidad WHERE id_provincia = ? ORDER BY nombre", [id_provincia], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = LocalidadModel;
