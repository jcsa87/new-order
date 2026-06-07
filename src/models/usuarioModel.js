const db = require('../database/db');

class UsuarioModel {
    constructor(row = {}) {
        this.id_usuario = row.id_usuario;
        this.nombre = row.nombre;
        this.apellido = row.apellido;
        this.email = row.email;
        this.contrasena = row.contrasena;
        this.id_direccion = row.id_direccion;
        this.id_rol = row.id_rol;
    }

    /**
     * Busca un usuario por email e instancia la clase.
     * @param {string} email - Correo del usuario.
     * @returns {Promise<UsuarioModel|null>} Instancia de UsuarioModel.
     */
    static buscarPorEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row ? new UsuarioModel(row) : null);
            });
        });
    }

    static async verificarUsuario(datosRegistro) {
        const { email, nombre, apellido, contrasena, confirmarContrasena, id_provincia, id_localidad } = datosRegistro;

        //Excepcion del contrato de operaciones-CU Registro usuario 
        // Flujo Alternativo: Campos incompletos
        if (!email || !nombre || !apellido || !contrasena || !confirmarContrasena || !id_provincia || !id_localidad) {
            throw new Error("Campo obligatorio incompleto. Por favor completa todos los datos obligatorios.");
        }

        // Validar longitud mínima de la contraseña
        if (contrasena.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        // Validar coincidencia de contraseñas
        if (contrasena !== confirmarContrasena) {
            throw new Error("Las contraseñas no coinciden. Por favor verifícalas.");
        }

        //Excepcion del contrato de operaciones-CU Registro usuario 
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

    // Aquí traemos a todos los usuarios registrados en el sistema, cruzando datos con su rol para que el Administrador vea quién es quién.
    static obtenerTodos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, r.nombre as rol_nombre 
                FROM usuario u
                JOIN rol r ON u.id_rol = r.id_rol
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Para evitar borrar datos históricos de compras, cuando "borramos" a un usuario, en realidad solo le cambiamos el estado a inactivo para que no pueda loguearse más.
    static desactivar(id) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuario SET estado = 'inactivo' WHERE id_usuario = ?", [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    // Reactivar usuario (borrado lógico)
    static activar(id) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuario SET estado = 'activo' WHERE id_usuario = ?", [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
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

    /**
     * Obtiene un usuario instanciado por su ID.
     * @param {number} id - ID del usuario.
     * @returns {Promise<UsuarioModel|null>} Instancia de UsuarioModel.
     */
    static obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuario WHERE id_usuario = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? new UsuarioModel(row) : null);
            });
        });
    }

    /**
     * Guarda una nueva dirección como método de instancia, actualizando la referencia de la instancia y la BD.
     * @param {Object} datosDireccion - Datos de la dirección.
     * @returns {Promise<number>} El id_direccion de la dirección creada.
     */
    async guardarDireccion(datosDireccion) {
        const id_direccion = await UsuarioModel.guardarDireccion(this.id_usuario, datosDireccion);
        this.id_direccion = id_direccion;
        return id_direccion;
    }

    /**
     * Guarda una nueva dirección para el usuario y la asocia a su cuenta (estático, para compatibilidad).
     * @param {number} id_usuario - ID del usuario.
     * @param {Object} datosDireccion - { calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad }
     * @returns {Promise<number>} El id_direccion de la dirección creada.
     */
    static guardarDireccion(id_usuario, datosDireccion) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const { calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad } = datosDireccion;
                db.run(
                    `INSERT INTO direccion (calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [calle, numero_calle, nro_piso, nro_departamento, codigo_postal, parseInt(id_localidad)],
                    function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }

                        const id_direccion = this.lastID;

                        db.run(
                            `UPDATE usuario SET id_direccion = ? WHERE id_usuario = ?`,
                            [id_direccion, id_usuario],
                            function(err) {
                                if (err) {
                                    db.run("ROLLBACK");
                                    return reject(err);
                                }
                                db.run("COMMIT");
                                resolve(id_direccion);
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Inicia sesión del usuario verificando las credenciales.
     * @param {string} email - Correo del usuario.
     * @param {string} contrasena - Contraseña.
     * @returns {Promise<boolean>}
     */
    static async iniciarSesion(email, contrasena) {
        try {
            const usuario = await this.buscarPorEmail(email);
            // Si el usuario no existe, o si el administrador lo desactivó (baneó), le bloqueamos el paso.
            if (!usuario || usuario.estado !== 'activo') return false;
            
            const bcrypt = require('bcryptjs');
            return await bcrypt.compare(contrasena, usuario.contrasena);
        } catch (err) {
            return false;
        }
    }

    /**
     * Obtiene el Carrito activo para el usuario.
     * @returns {Object} CarritoService singleton.
     */
    static obtenerCarrito() {
        return require('../services/carritoService');
    }
}

module.exports = UsuarioModel;
