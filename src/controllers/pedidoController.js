const UsuarioModel = require('../models/usuarioModel');
const DireccionModel = require('../models/direccionModel');
const MetodoEnvioModel = require('../models/metodoEnvioModel');
const MetodoPagoModel = require('../models/metodoPagoModel');
const PedidoService = require('../services/pedidoService');
const CarritoService = require('../services/carritoService');

class PedidoController {
    /**
     * Muestra la vista de checkout con los datos del usuario, dirección, métodos de pago y envío.
     */
    static async mostrarCheckout(req, res) {
        try {
            // Caso Alternativo 1: El cliente no ha iniciado sesión
            const isAuth = UsuarioModel.verificarAuth(req.session);
            if (!isAuth) {
                return res.redirect('/auth/login?error=Debes iniciar sesion para continuar');
            }

            // Caso Alternativo 2: El carrito está vacío
            const itemsCarrito = CarritoService.obtenerCarrito();
            if (itemsCarrito.length === 0) {
                return res.redirect('/products?error=Tu carrito esta vacio!');
            }

            // Obtener datos del usuario para extraer id_direccion
            const usuario = await UsuarioModel.obtenerPorId(req.session.userId);
            if (!usuario) {
                return res.redirect('/auth/login?error=Usuario no encontrado');
            }

            // Obtener dirección asociada
            let direccionCompleta = '';
            let id_direccion = null;
            if (usuario.id_direccion) {
                id_direccion = usuario.id_direccion;
                const direccionInstance = await DireccionModel.obtenerPorId(id_direccion);
                if (direccionInstance) {
                    direccionCompleta = direccionInstance.obtenerDireccionCompleta();
                }
            }

            // Obtener métodos de envío y pago activos
            const metodosEnvio = await MetodoEnvioModel.obtenerMetodosEnvio();
            const metodosPago = await MetodoPagoModel.obtenerMetodosPago();
            const totales = CarritoService.obtenerTotales();

            // Cargar provincias para el Caso Alternativo 4
            const ProvinciaModel = require('../models/provinciaModel');
            const provincias = await ProvinciaModel.obtenerProvincias();

            res.render('checkout', {
                usuario,
                id_direccion,
                direccionCompleta,
                metodosEnvio,
                metodosPago,
                itemsCarrito,
                totales,
                provincias,
                error: req.query.error || null
            });
        } catch (error) {
            console.error("Error al cargar checkout:", error);
            res.status(500).send("Error interno del servidor al cargar la página de confirmación");
        }
    }

    /**
     * Retorna las localidades asociadas a una provincia como JSON.
     */
    static async obtenerLocalidades(req, res) {
        try {
            const { provinciaId } = req.query;
            if (!provinciaId) {
                return res.status(400).json({ error: "Falta provinciaId" });
            }
            const LocalidadModel = require('../models/localidadModel');
            const localidades = await LocalidadModel.obtenerLocalidadesPorProvincia(parseInt(provinciaId));
            res.json(localidades);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al obtener localidades" });
        }
    }

    /**
     * Procesa la finalización de la compra.
     */
    static async procesarCheckout(req, res) {
        let paymentProcessed = false;
        let estrategia = null;
        let totalFinalString = "0.00";

        try {
            const isAuth = UsuarioModel.verificarAuth(req.session);
            if (!isAuth) {
                return res.redirect('/auth/login?error=Debes iniciar sesion para continuar');
            }

            const id_usuario = req.session.userId;
            let { id_metodo_pago, id_metodo_envio, id_direccion, modificar_direccion } = req.body;

            if (!id_metodo_pago || !id_metodo_envio) {
                return res.redirect('/checkout?error=Por favor, completa todos los campos del formulario');
            }

            // --- CASO ALTERNATIVO 4: Modificar o crear dirección de entrega ---
            const sinDireccion = !id_direccion || id_direccion === 'null' || id_direccion === '';
            if (modificar_direccion === 'true' || sinDireccion) {
                const { calle, numero_calle, nro_piso, nro_departamento, codigo_postal, id_localidad } = req.body;
                
                if (!calle || !numero_calle || !codigo_postal || !id_localidad) {
                    throw new Error("Datos de dirección incompletos. Por favor completa los campos requeridos.");
                }

                // Obtener instancia del usuario para guardar su dirección
                const usuario = await UsuarioModel.obtenerPorId(id_usuario);
                if (!usuario) {
                    throw new Error("Usuario no encontrado.");
                }

                // Guardar la nueva dirección y asociarla al usuario (llamando al método de instancia)
                id_direccion = await usuario.guardarDireccion({
                    calle,
                    numero_calle,
                    nro_piso,
                    nro_departamento,
                    codigo_postal,
                    id_localidad
                });
            }

            // --- CÁLCULO DEL TOTAL FINAL ---
            const totales = CarritoService.obtenerTotales();
            const subtotal = parseFloat(totales.subtotal);
            const metodosEnvio = await MetodoEnvioModel.obtenerMetodosEnvio();
            const metodoSeleccionado = metodosEnvio.find(m => m.id_metodo_envio === parseInt(id_metodo_envio));
            const costoEnvio = metodoSeleccionado ? parseFloat(metodoSeleccionado.costo_base) : 0.0;
            const totalFinal = subtotal + parseFloat(totales.impuestos) + costoEnvio;
            totalFinalString = totalFinal.toFixed(2);

            // --- APLICACIÓN DEL PATRÓN STRATEGY DE PAGOS ---
            const PagoFactory = require('../services/payment/pagoFactory');
            try {
                // Instanciar la estrategia polimórfica adecuada
                estrategia = PagoFactory.crearEstrategia(id_metodo_pago, req.body);
            } catch (err) {
                throw new Error("Método de pago no válido: " + err.message);
            }

            // 1. Validar los datos específicos del pago (Tarjeta, CBU, Email)
            estrategia.validarDatos();

            // 2. Procesar el cobro
            estrategia.procesarPago(totalFinalString);
            paymentProcessed = true; // Flag para saber si logramos debitar el pago

            // 3. Registrar el pedido y realizar el descuento de stock (PedidoService coordinará la transacción de dominio)
            const id_pedido = await PedidoService.confirmarPedido({
                id_usuario,
                id_metodo_pago,
                id_metodo_envio,
                id_direccion
            });

            // Redirigir a pantalla de éxito
            res.redirect(`/checkout/success?id=${id_pedido}`);
        } catch (error) {
            console.error("Error al procesar el checkout:", error.message);

            // --- CASO ALTERNATIVO 3 (ROLLBACK / COMPENSACIÓN): ---
            // Si el pago ya fue debitado pero falló el registro del pedido (ej. stock insuficiente), reembolsamos el importe.
            if (paymentProcessed && estrategia) {
                try {
                    console.log(`[PedidoController] Falla posterior al pago. Ejecutando compensación/reembolso...`);
                    estrategia.reembolsarPago(totalFinalString);
                } catch (refundError) {
                    console.error("Error crítico: No se pudo realizar el reembolso del pago:", refundError.message);
                }
            }

            res.redirect(`/checkout?error=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * Muestra la pantalla de confirmación exitosa de compra.
     */
    static mostrarExito(req, res) {
        const id_pedido = req.query.id;
        if (!id_pedido) {
            return res.redirect('/');
        }
        res.render('order-success', { id_pedido });
    }

    /**
     * Lista todos los pedidos del usuario autenticado
     */
    static async listarPedidosUsuario(req, res) {
        try {
            const isAuth = UsuarioModel.verificarAuth(req.session);
            if (!isAuth) {
                return res.redirect('/auth/login?error=Debes iniciar sesion para ver tus pedidos');
            }

            const id_usuario = req.session.userId;
            const PedidoModel = require('../models/pedidoModel');
            const pedidos = await PedidoModel.obtenerPedidosPorUsuario(id_usuario);

            res.render('mis-pedidos', { pedidos, error: req.query.error || null });
        } catch (error) {
            console.error("Error al listar pedidos:", error);
            res.status(500).send("Error interno del servidor");
        }
    }

    /**
     * Muestra el detalle de un pedido específico
     */
    static async verDetallePedido(req, res) {
        try {
            const isAuth = UsuarioModel.verificarAuth(req.session);
            if (!isAuth) {
                return res.redirect('/auth/login?error=Debes iniciar sesion para ver el detalle');
            }

            const id_usuario = req.session.userId;
            const id_pedido = req.params.id;
            const PedidoModel = require('../models/pedidoModel');

            const pedido = await PedidoModel.obtenerPedidoPorId(id_pedido);

            if (!pedido) {
                return res.redirect('/pedidos?error=Pedido no encontrado');
            }

            // Validar que el pedido pertenece al usuario
            if (pedido.id_usuario !== id_usuario) {
                return res.redirect('/pedidos?error=No tienes permiso para ver este pedido');
            }

            const detalles = await PedidoModel.obtenerDetallesPorPedido(id_pedido);
            
            // Obtener entidades adicionales para mostrar la info completa
            const metodosEnvio = await MetodoEnvioModel.obtenerMetodosEnvio();
            const metodoEnvio = metodosEnvio.find(m => m.id_metodo_envio === pedido.id_metodo_envio) || null;
            
            const metodosPago = await MetodoPagoModel.obtenerMetodosPago();
            const metodoPago = metodosPago.find(m => m.id_metodo_pago === pedido.id_metodo_pago) || null;

            let direccionCompleta = 'No especificada';
            if (pedido.id_direccion) {
                const direccionInstance = await DireccionModel.obtenerPorId(pedido.id_direccion);
                if (direccionInstance) {
                    direccionCompleta = direccionInstance.obtenerDireccionCompleta();
                }
            }

            res.render('detalle-pedido', {
                pedido,
                detalles,
                metodoEnvio,
                metodoPago,
                direccionCompleta,
                error: req.query.error || null
            });

        } catch (error) {
            console.error("Error al obtener detalle del pedido:", error);
            res.status(500).send("Error interno del servidor");
        }
    }
}

module.exports = PedidoController;
