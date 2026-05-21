const db = require('../database/db');

class MetodoEnvioModel {
    static obtenerMetodosEnvio() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM metodo_envio WHERE estado = 'activo'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = MetodoEnvioModel;
