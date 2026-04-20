// src/controllers/authController.js
const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class AuthController {
    static async renderLogin(req, res) {
        const error = req.query.error || null;
        const success = req.query.registered ? "¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales." : null;
        res.render('auth/login', { cartCount: 0, error, success });
    }

    static async renderRegister(req, res) {
        try {
            const provincias = await UserModel.getProvincias();
            // Para simplificar, obtenemos las localidades de la primera provincia
            const localidades = await UserModel.getLocalidadesByProvincia(provincias[0]?.id_provincia || 1);
            
            res.render('auth/register', { 
                cartCount: 0,
                provincias,
                localidades
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error cargando formulario");
        }
    }

    static async getLocalidades(req, res) {
        try {
            const { id } = req.params;
            const localidades = await UserModel.getLocalidadesByProvincia(id);
            res.json(localidades);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener localidades" });
        }
    }

    static async handleRegister(req, res) {
        const { 
            nombre, apellido, email, contrasena, id_rol,
            calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad 
        } = req.body;

        try {
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.send("El usuario ya existe");
            }

            const hashedPassword = await bcrypt.hash(contrasena, 10);
            
            await UserModel.create({
                nombre,
                apellido,
                email,
                contrasena: hashedPassword,
                id_rol: id_rol || 2, // Default to Cliente (2) if not provided
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

    static async handleLogin(req, res) {
        const { email, contrasena } = req.body; // Cambiado de password a contrasena (aunque el name en ejs sigue siendo password usualmente)
        try {
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.render('auth/login', { cartCount: 0, error: "El correo electrónico no está registrado.", success: null });
            }

            const isMatch = await bcrypt.compare(contrasena, user.contrasena);
            if (!isMatch) {
                return res.render('auth/login', { cartCount: 0, error: "La contraseña ingresada es incorrecta.", success: null });
            }

            req.session.userId = user.id_usuario;
            req.session.userRole = user.id_rol;
            req.session.userName = user.nombre;

            res.redirect('/');
        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).send("Error en el servidor");
        }
    }

    static handleLogout(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
}

module.exports = AuthController;
