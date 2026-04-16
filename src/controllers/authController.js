// src/controllers/authController.js
const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class AuthController {
    static async renderLogin(req, res) {
        res.render('auth/login', { cartCount: 0 });
    }

    static async renderRegister(req, res) {
        try {
            const provincias = await UserModel.getProvincias();
            const roles = await UserModel.getRoles();
            // Para simplificar, obtenemos las localidades de la primera provincia (o todas si son pocas)
            const localidades = await UserModel.getLocalidadesByProvincia(provincias[0]?.id_provincia || 1);
            
            res.render('auth/register', { 
                cartCount: 0,
                provincias,
                localidades,
                roles
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error cargando formulario");
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
                id_rol: parseInt(id_rol),
                address: {
                    calle,
                    numero_calle,
                    nro_piso,
                    nro_departamento,
                    codigo_postal,
                    id_localidad: parseInt(id_localidad)
                }
            });

            res.redirect('/auth/login');
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
                return res.send("Credenciales inválidas");
            }

            // user.contrasena es el campo en DB ahora
            const isMatch = await bcrypt.compare(contrasena, user.contrasena);
            if (!isMatch) {
                return res.send("Credenciales inválidas");
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
