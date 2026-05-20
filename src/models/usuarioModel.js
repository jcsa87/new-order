const db = require('../database/db');

class UsuarioModel {
    static buscarPorEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async verificarUsuario(datosRegistro) {
        const { email, nombre, apellido, contrasena, id_provincia, id_localidad } = datosRegistro;

        // Flujo Alternativo: Campos incompletos
        if (!email || !nombre || !apellido || !contrasena || !id_provincia || !id_localidad) {
            throw new Error("Campo obligatorio incompleto. Por favor completa todos los datos obligatorios.");
        }

        // Flujo Alternativo: Datos incorrectos (usuario duplicado)
        const usuarioExistente = await this.buscarPorEmail(email);
        if (usuarioExistente) {
            throw new Error("Los datos son incorrectos: El correo electrónico ya está registrado.");
        }

        return true;
    }

    static verificarAuth(session) {
        return !!(session && session.userId);
    }

    /**
     * Crear un usuario con dirección obligatoria
     * @param {Object} datosUsuario - { nombre, apellido, email, contrasena, id_rol, address: { calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad } }
     */
    static crear(datosUsuario) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const { address } = datosUsuario;
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
                        const { nombre, apellido, email, contrasena, id_rol } = datosUsuario;
                        
                        db.run(
                            `INSERT INTO usuario (nombre, apellido, email, contrasena, id_direccion, id_rol) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [nombre, apellido, email, contrasena, id_direccion, id_rol || 2], // 2 = Cliente por defecto
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

    static obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE id_usuario = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }


}

module.exports = UsuarioModel;
