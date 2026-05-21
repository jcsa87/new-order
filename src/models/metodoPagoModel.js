const db = require('../database/db');

class MetodoPagoModel {
    static obtenerMetodosPago() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM metodo_pago WHERE estado = 'activo'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = MetodoPagoModel;
