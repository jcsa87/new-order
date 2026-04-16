// src/models/userModel.js
const db = require('../database/db');

class UserModel {
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Create a user with mandatory address
     * @param {Object} userData - { nombre, apellido, email, contrasena, roleId, address: { calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad } }
     */
    static create(userData) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const { address } = userData;
                db.run(
                    `INSERT INTO direccion (calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [address.calle, address.numero_calle, address.nro_piso, address.nro_departamento, address.codigo_postal, address.id_localidad],
                    function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }

                        const id_direccion = this.lastID;
                        const { nombre, apellido, email, contrasena, id_rol } = userData;
                        
                        db.run(
                            `INSERT INTO usuario (nombre, apellido, email, contrasena, id_direccion, id_rol) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [nombre, apellido, email, contrasena, id_direccion, id_rol || 2], // 2 = Cliente by default
                            function(err) {
                                if (err) {
                                    db.run("ROLLBACK");
                                    return reject(err);
                                }
                                db.run("COMMIT");
                                resolve(this.lastID);
                            }
                        );
                    }
                );
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE id_usuario = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Geo selection helpers
    static getProvincias() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM provincia ORDER BY nombre", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getLocalidadesByProvincia(idProvincia) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM localidad WHERE id_provincia = ? ORDER BY nombre", [idProvincia], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getRoles() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM rol WHERE estado = 'activo'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = UserModel;
