const express = require('express');
const path = require('path');
require('dotenv').config();

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

// Importación de rutas
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

app.get('/', (req, res) => res.redirect('/products'));

app.use('/products', productRoutes);
app.use('/cart', cartRoutes);

app.listen(PORT, () => {
    console.log(`New Order corriendo en http://localhost:${PORT}`);
});
