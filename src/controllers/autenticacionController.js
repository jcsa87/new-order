const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

class AutenticacionController {
    static async mostrarLogin(req, res) {
        const error = req.query.error || null;
        const success = req.query.registered ? "¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales." : null;
        res.render('auth/login', { cantidadCarrito: 0, error, success });
    }

    static async mostrarRegistro(req, res) {
        try {
            const provincias = await UsuarioModel.obtenerProvincias();
            // Para simplificar, obtenemos las localidades de la primera provincia
            const localidades = await UsuarioModel.obtenerLocalidadesPorProvincia(provincias[0]?.id_provincia || 1);
            
            res.render('auth/register', { 
                cantidadCarrito: 0,
                provincias,
                localidades
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error cargando formulario");
        }
    }

    static async obtenerLocalidades(req, res) {
        try {
            const { id } = req.params;
            const localidades = await UsuarioModel.obtenerLocalidadesPorProvincia(id);
            res.json(localidades);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener localidades" });
        }
    }

    static async procesarRegistro(req, res) {
        const { 
            nombre, apellido, email, contrasena, id_rol,
            calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad 
        } = req.body;

        try {
            const usuarioExistente = await UsuarioModel.buscarPorEmail(email);
            if (usuarioExistente) {
                return res.send("El usuario ya existe");
            }

            const hashedPassword = await bcrypt.hash(contrasena, 10);
            
            await UsuarioModel.crear({
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

            res.redirect('/auth/login?registered=true');
        } catch (error) {
            console.error("Error en registro:", error);
            res.status(500).send("Error en el servidor al registrar");
        }
    }

    static async procesarLogin(req, res) {
        const { email, contrasena } = req.body;
        try {
            const usuario = await UsuarioModel.buscarPorEmail(email);
            if (!usuario) {
                return res.render('auth/login', { cantidadCarrito: 0, error: "El correo electrónico no está registrado.", success: null });
            }

            const esIgual = await bcrypt.compare(contrasena, usuario.contrasena);
            if (!esIgual) {
                return res.render('auth/login', { cantidadCarrito: 0, error: "La contraseña ingresada es incorrecta.", success: null });
            }

            req.session.userId = usuario.id_usuario;
            req.session.userRole = usuario.id_rol;
            req.session.userName = usuario.nombre;

            res.redirect('/');
        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).send("Error en el servidor");
        }
    }

    static cerrarSesion(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
}

module.exports = AutenticacionController;
