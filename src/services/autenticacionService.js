const UsuarioModel = require('../models/usuarioModel');
const ProvinciaModel = require('../models/provinciaModel');
const LocalidadModel = require('../models/localidadModel');
const bcrypt = require('bcryptjs');

class AutenticacionService {
    // Paso 2 del Caso de Uso: Verifica los datos ingresados
    static async verificarUsuario(datosRegistro) {
        // La validación pura de dominio ahora está centralizada en UsuarioModel (Patrón Experto)
        return await UsuarioModel.verificarUsuario(datosRegistro);
    }

    // Paso 3 del Caso de Uso: Registra los datos del nuevo usuario
    static async registrarUsuario(datosRegistro) {
        const {
            nombre, apellido, email, contrasena, id_rol,
            calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad
        } = datosRegistro;

        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const nuevoId = await UsuarioModel.crear({
            nombre,
            apellido,
            email,
            contrasena: hashedPassword,
            id_rol: id_rol || 2, // 2 = Cliente por defecto
            address: {
                calle,
                numero_calle,
                nro_piso,
                nro_departamento,
                codigo_postal,
                id_localidad: parseInt(id_localidad)
            }
        });

        return nuevoId;
    }

    static async autenticarUsuario(email, contrasena) {
        const usuario = await UsuarioModel.buscarPorEmail(email);
        if (!usuario) {
            throw new Error("El correo electrónico no está registrado.");
        }

        const esIgual = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esIgual) {
            throw new Error("La contraseña ingresada es incorrecta.");
        }

        return usuario;
    }

    static async obtenerProvincias() {
        return await ProvinciaModel.obtenerProvincias();
    }

    static async obtenerLocalidades(idProvincia) {
        return await LocalidadModel.obtenerLocalidadesPorProvincia(idProvincia);
    }
}

module.exports = AutenticacionService;
