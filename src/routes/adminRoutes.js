const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verificarRolAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta de subidas si no existe
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para guardar las imágenes localmente
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

// === APLICAR MIDDLEWARE A TODAS LAS RUTAS DE ESTE ARCHIVO ===
// Todo lo que pase por /admin/... tendrá que ser un Administrador
router.use(verificarRolAdmin);

// === DASHBOARD ===
router.get('/dashboard', AdminController.mostrarDashboard);
router.get('/soporte', AdminController.mostrarSoporte);

// === GESTION DE PRODUCTOS ===
// [CASO DE USO: Gestionar Productos]
router.get('/productos', AdminController.listarProductos);
router.get('/productos/nuevo', AdminController.mostrarCrearProducto);
router.post('/productos/nuevo', upload.single('imagen'), AdminController.procesarCrearProducto);
router.get('/productos/editar/:id', AdminController.mostrarEditarProducto);
router.post('/productos/editar/:id', upload.single('imagen'), AdminController.procesarEditarProducto);
router.post('/productos/desactivar/:id', AdminController.desactivarProducto);
router.post('/productos/activar/:id', AdminController.activarProducto);

// === GESTION DE CATEGORIAS ===
// [CASO DE USO: Gestionar Categorias]
router.get('/categorias', AdminController.listarCategorias);
router.post('/categorias/nueva', AdminController.procesarCrearCategoria);
router.post('/categorias/desactivar/:id', AdminController.desactivarCategoria);
router.post('/categorias/activar/:id', AdminController.activarCategoria);

// === GESTION DE PEDIDOS ===
// [CASO DE USO: Gestionar Pedidos]
router.get('/pedidos', AdminController.listarPedidos);
router.get('/pedidos/:id', AdminController.verDetallePedido);
router.post('/pedidos/:id/estado', AdminController.actualizarEstadoPedido);

// === GESTION DE USUARIOS ===
// [CASO DE USO: Gestionar Usuarios]
router.get('/usuarios', AdminController.listarUsuarios);
router.post('/usuarios/desactivar/:id', AdminController.desactivarUsuario);
router.post('/usuarios/activar/:id', AdminController.activarUsuario);

// === REPORTE DE VENTAS ===
// [CASO DE USO: Generar Reporte Ventas]
router.get('/reportes', AdminController.generarReporteVentas);

module.exports = router;
