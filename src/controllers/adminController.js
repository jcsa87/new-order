const ProductoModel = require('../models/productoModel');
const CategoriaModel = require('../models/categoriaModel');
const PedidoModel = require('../models/pedidoModel');
const UsuarioModel = require('../models/usuarioModel');

class AdminController {
    // === DASHBOARD (Panel Principal) ===
    // Muestra la pantalla inicial de bienvenida al Administrador
    static async mostrarDashboard(req, res) {
        res.render('admin/dashboard', { title: 'Panel de Administrador' });
    }

    // Muestra la pantalla de soporte técnico para el administrador
    static async mostrarSoporte(req, res) {
        res.render('admin/soporte', { title: 'Soporte Técnico Administrador' });
    }

    // === GESTION DE PRODUCTOS ===
    // Trae todos los productos de la base de datos y los envía a la tabla de la vista.
    // [CASO DE USO: Gestionar Productos] - Soporta filtrado por categoría.
    static async listarProductos(req, res) {
        try {
            let productos = await ProductoModel.obtenerTodos();
            const categorias = await CategoriaModel.obtenerTodas();
            
            // Si el admin seleccionó un filtro en la URL (ej: ?categoria=1)
            const categoriaIdFiltro = req.query.categoria;
            if (categoriaIdFiltro) {
                productos = productos.filter(p => p.id_categoria == categoriaIdFiltro);
            }

            res.render('admin/productos', { 
                productos, 
                categorias,
                categoriaActual: categoriaIdFiltro || '',
                title: 'Gestión de Productos' 
            });
        } catch (error) {
            res.redirect('/admin/dashboard?error=' + encodeURIComponent('Error al cargar productos'));
        }
    }

    // Muestra el formulario vacío para registrar un nuevo producto.
    static async mostrarCrearProducto(req, res) {
        try {
            const categorias = await CategoriaModel.obtenerTodas();
            res.render('admin/producto_form', { producto: null, categorias, title: 'Registrar Nuevo Producto' });
        } catch (error) {
            res.redirect('/admin/productos?error=Error');
        }
    }

    // Recibe los datos del formulario y los guarda en la base de datos.
    static async procesarCrearProducto(req, res) {
        try {
            // Si el usuario subió una imagen, la guardamos. Si no, usamos null.
            req.body.imagen = req.file ? '/uploads/' + req.file.filename : null;
            await ProductoModel.crear(req.body);
            res.redirect('/admin/productos');
        } catch (error) {
            res.redirect('/admin/productos/nuevo?error=' + encodeURIComponent('Error al guardar el producto'));
        }
    }

    // Busca los datos de un producto específico y los carga en el formulario para poder editarlos.
    static async mostrarEditarProducto(req, res) {
        try {
            const producto = await ProductoModel.obtenerPorId(req.params.id);
            const categorias = await CategoriaModel.obtenerTodas();
            res.render('admin/producto_form', { producto, categorias, title: 'Modificar Datos de Producto' });
        } catch (error) {
            res.redirect('/admin/productos?error=Error');
        }
    }

    // Recibe los datos modificados del formulario y sobreescribe el producto en la base de datos.
    static async procesarEditarProducto(req, res) {
        try {
            // Si el usuario subió una imagen nueva, la actualizamos. Si no subió ninguna, 
            // no sobreescribimos la propiedad 'imagen' para que el Modelo no borre la anterior.
            if (req.file) {
                req.body.imagen = '/uploads/' + req.file.filename;
            } else {
                // Obtenemos el producto actual para no perder su imagen
                const productoActual = await ProductoModel.obtenerPorId(req.params.id);
                req.body.imagen = productoActual.imagen;
            }
            
            await ProductoModel.actualizar(req.params.id, req.body);
            res.redirect('/admin/productos');
        } catch (error) {
            res.redirect('/admin/productos/editar/' + req.params.id + '?error=' + encodeURIComponent('Error al actualizar'));
        }
    }

    // Oculta un producto del catálogo para que los clientes ya no puedan comprarlo (Borrado Lógico).
    static async desactivarProducto(req, res) {
        try {
            await ProductoModel.desactivar(req.params.id);
            res.redirect('/admin/productos');
        } catch (error) {
            res.redirect('/admin/productos?error=Error');
        }
    }

    // [CASO DE USO: Gestionar Productos] - Vuelve a habilitar la venta de un producto que había sido desactivado.
    static async activarProducto(req, res) {
        try {
            await ProductoModel.activar(req.params.id);
            res.redirect('/admin/productos');
        } catch (error) {
            res.redirect('/admin/productos?error=Error');
        }
    }

    // === GESTION DE CATEGORIAS ===
    // Trae todas las categorías y las muestra en una tabla.
    static async listarCategorias(req, res) {
        try {
            const categorias = await CategoriaModel.obtenerTodas();
            res.render('admin/categorias', { categorias, title: 'Gestión de Categorías' });
        } catch (error) {
            res.redirect('/admin/dashboard?error=Error');
        }
    }

    // Guarda una nueva categoría en el sistema.
    static async procesarCrearCategoria(req, res) {
        try {
            await CategoriaModel.crear(req.body.nombre, req.body.descripcion);
            res.redirect('/admin/categorias');
        } catch (error) {
            res.redirect('/admin/categorias?error=Error');
        }
    }

    // Oculta una categoría para que ya no aparezca en el menú de clientes.
    static async desactivarCategoria(req, res) {
        try {
            await CategoriaModel.desactivar(req.params.id);
            res.redirect('/admin/categorias');
        } catch (error) {
            res.redirect('/admin/categorias?error=Error');
        }
    }

    // Vuelve a mostrar una categoría
    static async activarCategoria(req, res) {
        try {
            await CategoriaModel.activar(req.params.id);
            res.redirect('/admin/categorias');
        } catch (error) {
            res.redirect('/admin/categorias?error=Error');
        }
    }

    // === GESTION DE PEDIDOS ===
    // Muestra todos los pedidos que han hecho los clientes, idealmente para revisar los que están Pendientes.
    static async listarPedidos(req, res) {
        try {
            const pedidos = await PedidoModel.obtenerTodos();
            res.render('admin/pedidos', { pedidos, title: 'Gestión de Pedidos' });
        } catch (error) {
            res.redirect('/admin/dashboard?error=Error');
        }
    }

    // Entra al detalle específico de un pedido para ver qué productos compró el cliente.
    static async verDetallePedido(req, res) {
        try {
            const pedido = await PedidoModel.obtenerPedidoPorId(req.params.id);
            const detalles = await PedidoModel.obtenerDetallesPorPedido(req.params.id);
            res.render('admin/pedido_detalle', { pedido, detalles, title: 'Consultar Detalle Pedido' });
        } catch (error) {
            res.redirect('/admin/pedidos?error=Error');
        }
    }

    // Cambia el estado logístico del pedido (ejemplo: de 'Pendiente' a 'Enviado' o 'Entregado').
    static async actualizarEstadoPedido(req, res) {
        try {
            await PedidoModel.cambiarEstado(req.params.id, req.body.estado);
            res.redirect('/admin/pedidos');
        } catch (error) {
            res.redirect('/admin/pedidos?error=Error');
        }
    }

    // === GESTION DE USUARIOS ===
    // Muestra la lista de todos los clientes y administradores registrados.
    static async listarUsuarios(req, res) {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.render('admin/usuarios', { usuarios, title: 'Gestión de Usuarios' });
        } catch (error) {
            res.redirect('/admin/dashboard?error=Error');
        }
    }

    // Banea a un usuario cambiando su estado a 'inactivo' para que su inicio de sesión sea rechazado.
    static async desactivarUsuario(req, res) {
        try {
            await UsuarioModel.desactivar(req.params.id);
            res.redirect('/admin/usuarios');
        } catch (error) {
            res.redirect('/admin/usuarios?error=Error');
        }
    }

    // Vuelve a habilitar el acceso a un usuario baneado.
    static async activarUsuario(req, res) {
        try {
            await UsuarioModel.activar(req.params.id);
            res.redirect('/admin/usuarios');
        } catch (error) {
            res.redirect('/admin/usuarios?error=Error');
        }
    }

    // === REPORTE DE VENTAS ===
    // Suma todos los ingresos y agrupa la información financiera para que el administrador la revise.
    static async generarReporteVentas(req, res) {
        try {
            const reporte = await PedidoModel.obtenerReporteVentas();
            const topProductos = await PedidoModel.obtenerProductosMasVendidos();
            res.render('admin/reportes', { reporte, topProductos, title: 'Generar Reporte de Ventas' });
        } catch (error) {
            res.redirect('/admin/dashboard?error=Error');
        }
    }
}

module.exports = AdminController;
