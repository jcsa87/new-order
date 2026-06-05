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

    /**
     * Obtiene el listado de métodos de pago (alias singular que coincide con el Diagrama de Clases).
     * @returns {Promise<Array>}
     */
    static obtenerMetodoPago() {
        return this.obtenerMetodosPago();
    }
}

module.exports = MetodoPagoModel;
