const db = require('../database/db');

class DireccionModel {
    constructor(row = {}) {
        this.id_direccion = row.id_direccion;
        this.calle = row.calle;
        this.numero_calle = row.numero_calle;
        this.nro_piso = row.nro_piso;
        this.nro_departamento = row.nro_departamento;
        this.codigo_postal = row.codigo_postal;
        this.id_localidad = row.id_localidad;
        this.id_provincia = row.id_provincia;
        this.localidad_nombre = row.localidad_nombre;
        this.provincia_nombre = row.provincia_nombre;
    }

    /**
     * Obtiene una dirección por su id_direccion, incluyendo la provincia y localidad.
     * @param {number} id - ID de la dirección.
     * @returns {Promise<DireccionModel|null>} Instancia de la dirección.
     */
    static obtenerPorId(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT d.*, l.nombre as localidad_nombre, p.nombre as provincia_nombre, l.id_provincia as id_provincia
                FROM direccion d
                LEFT JOIN localidad l ON d.id_localidad = l.id_localidad
                LEFT JOIN provincia p ON l.id_provincia = p.id_provincia
                WHERE d.id_direccion = ?
            `;
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? new DireccionModel(row) : null);
            });
        });
    }

    /**
     * Formatea la dirección completa utilizando los atributos de la instancia.
     * @returns {string} Dirección formateada.
     */
    obtenerDireccionCompleta() {
        const piso = this.nro_piso ? `, Piso ${this.nro_piso}` : '';
        const depto = this.nro_departamento ? `, Depto ${this.nro_departamento}` : '';
        const localidad = this.localidad_nombre || '';
        const provincia = this.provincia_nombre || '';
        return `${this.calle} ${this.numero_calle}${piso}${depto} (CP ${this.codigo_postal}), ${localidad}, ${provincia}`;
    }

    /**
     * Formatea la dirección completa según los atributos de la clase en el Diagrama de Clases.
     * (Mantenido como alias estático por compatibilidad)
     * @param {Object} direccion - Instancia o Fila de dirección.
     * @returns {string} Dirección formateada.
     */
    static obtenerDireccionCompleta(direccion) {
        if (!direccion) return '';
        if (direccion instanceof DireccionModel) {
            return direccion.obtenerDireccionCompleta();
        }
        const piso = direccion.nro_piso ? `, Piso ${direccion.nro_piso}` : '';
        const depto = direccion.nro_departamento ? `, Depto ${direccion.nro_departamento}` : '';
        const localidad = direccion.localidad_nombre || '';
        const provincia = direccion.provincia_nombre || '';
        return `${direccion.calle} ${direccion.numero_calle}${piso}${depto} (CP ${direccion.codigo_postal}), ${localidad}, ${provincia}`;
    }
}

module.exports = DireccionModel;
