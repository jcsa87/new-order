const db = require('../database/db');

class LocalidadModel {
    static obtenerLocalidadesPorProvincia(idProvincia) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM localidad WHERE id_provincia = ? ORDER BY nombre", [idProvincia], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = LocalidadModel;
