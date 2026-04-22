const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
require('dotenv').config();
const CarritoService = require('./services/carritoService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS (View Layer)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Sesiones
app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
    secret: process.env.SESSION_SECRET || 'new-order-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 semana
}));

// Pasar datos de usuario y carrito a todas las vistas
app.use((req, res, next) => {
    const itemsCarrito = CarritoService.obtenerCarrito();
    const totales = CarritoService.obtenerTotales();
    const cantidadCarrito = itemsCarrito.reduce((acc, item) => acc + item.quantity, 0);

    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        name: req.session.userName,
        role: req.session.userRole
    } : null;

    res.locals.itemsCarrito = itemsCarrito;
    res.locals.totales = totales;
    res.locals.cantidadCarrito = cantidadCarrito;
    
    // Persistencia de estado y errores vía URL (MVC-SSR compliant)
    res.locals.abrirCarrito = req.query.cart === 'open';
    
    // Normalizar error (si hay múltiples, tomar el último)
    const error = req.query.error;
    res.locals.errorMessage = Array.isArray(error) ? error[error.length - 1] : (error || null);

    next();
});

// Importación de rutas
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const autenticacionRoutes = require('./routes/autenticacionRoutes');

app.get('/', (req, res) => res.redirect('/products'));

// Páginas Informativas
app.get('/faq', (req, res) => res.render('faq', { title: 'Preguntas Frecuentes' }));
app.get('/terms', (req, res) => res.render('terms', { title: 'Términos y Condiciones' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Contacto' }));

app.use('/products', productoRoutes);
app.use('/cart', carritoRoutes);
app.use('/auth', autenticacionRoutes);

app.listen(PORT, () => {
    console.log(`New Order corriendo en http://localhost:${PORT}`);
});
