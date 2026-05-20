const AutenticacionService = require('../services/autenticacionService');

class AutenticacionController {
    static async mostrarLogin(req, res) {
        const error = req.query.error || null;
        const success = req.query.registered ? "¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales." : null;
        res.render('auth/login', { cantidadCarrito: 0, error, success });
    }

    static async mostrarRegistro(req, res) {
        try {
            const provincias = await AutenticacionService.obtenerProvincias();
            const localidades = await AutenticacionService.obtenerLocalidades(provincias[0]?.id_provincia || 1);
            
            res.render('auth/register', { 
                cantidadCarrito: 0,
                provincias,
                localidades,
                error: null
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error cargando formulario");
        }
    }

    static async obtenerLocalidades(req, res) {
        try {
            const { id } = req.params;
            const localidades = await AutenticacionService.obtenerLocalidades(id);
            res.json(localidades);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener localidades" });
        }
    }

    static async procesarRegistro(req, res) {
        try {
            // Acción 2 (CU): Verifica los datos ingresados
            await AutenticacionService.verificarUsuario(req.body);

            // Acción 3 (CU): Registra los datos del nuevo usuario
            await AutenticacionService.registrarUsuario(req.body);

            // Acción 3.1 (CU): Muestra mje "¡Usuario registrado con éxito!" (a través de query param)
            res.redirect('/auth/login?registered=true');
        } catch (error) {
            console.error("Error en registro:", error.message);
            // Representa flujos alternativos 2.2.1 y 2.4.1 (Mostrar mensaje de error en la misma vista)
            try {
                const provincias = await AutenticacionService.obtenerProvincias();
                const localidades = await AutenticacionService.obtenerLocalidades(req.body.id_provincia || provincias[0]?.id_provincia || 1);
                
                res.status(400).render('auth/register', {
                    cantidadCarrito: 0,
                    provincias,
                    localidades,
                    error: error.message
                });
            } catch (err) {
                res.status(500).send("Error interno al cargar la página de registro.");
            }
        }
    }

    static async procesarLogin(req, res) {
        const { email, contrasena } = req.body;
        try {
            const usuario = await AutenticacionService.autenticarUsuario(email, contrasena);

            req.session.userId = usuario.id_usuario;
            req.session.userRole = usuario.id_rol;
            req.session.userName = usuario.nombre;

            res.redirect('/');
        } catch (error) {
            console.error("Error en login:", error.message);
            res.render('auth/login', { cantidadCarrito: 0, error: error.message, success: null });
        }
    }

    static cerrarSesion(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
}

module.exports = AutenticacionController;
