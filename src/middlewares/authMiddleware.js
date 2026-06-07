const verificarRolAdmin = (req, res, next) => {
    // Si no hay sesión o el rol no es 1 (Administrador), lo pateamos al inicio
    if (!req.session.userId || req.session.userRole !== 1) {
        // Redirigir al inicio con un mensaje de error
        return res.redirect('/products?error=' + encodeURIComponent('Acceso denegado: Debes ser administrador.'));
    }
    
    // Si es administrador, lo dejamos pasar a la siguiente función
    next();
};

module.exports = { verificarRolAdmin };
