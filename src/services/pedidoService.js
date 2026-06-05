const PedidoModel = require('../models/pedidoModel');
const ProductoModel = require('../models/productoModel');
const CarritoService = require('./carritoService');
const MetodoEnvioModel = require('../models/metodoEnvioModel');

class PedidoService {
    /**
     * Confirma y registra un pedido, descontando stock de productos uno por uno utilizando instancias de ProductoModel.
     * Si falla el stock, revierte la creación del pedido.
     * @param {Object} datosConfirmacion - { id_usuario, id_metodo_pago, id_metodo_envio, id_direccion }
     * @returns {Promise<number>} ID del pedido generado.
     */
    static async confirmarPedido({ id_usuario, id_metodo_pago, id_metodo_envio, id_direccion }) {
        const items = CarritoService.obtenerCarrito();
        //Exige que si el carrito está vacío, se rechace.
        if (items.length === 0) {
            throw new Error("El carrito está vacío.");
        }

        const totales = CarritoService.obtenerTotales();
        
        const subtotal = parseFloat(totales.subtotal);
        const descuento = 0.0; // Valor por defecto
        const totalFinal = subtotal + parseFloat(totales.impuestos);
        //Exige que el sistema ya conozca al Usuario, Método de Pago y Dirección. 
        const datosPedido = {
            id_usuario,
            id_metodo_pago: parseInt(id_metodo_pago),
            id_metodo_envio: parseInt(id_metodo_envio),
            id_direccion: parseInt(id_direccion),
            subtotal_pedido: subtotal,
            descuento_aplicado: descuento,
            total: parseFloat(totalFinal.toFixed(2)),
            items: items.map(item => ({
                id_producto: item.id_producto,
                quantity: item.quantity,
                precio_unitario: item.precio_unitario,
                subtotal_item: item.subtotal_item
            }))
        };

        // 1. Registrar el pedido (crearPedido() retorna el id_pedido generado)
        const id_pedido = await PedidoModel.crearPedido(datosPedido);

        try {
            // 2. Solicitar actualizar el inventario (descontar stock obteniendo la instancia del producto)
            for (const item of items) {
                const producto = await ProductoModel.obtenerPorId(item.id_producto);
                if (!producto) {
                    throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
                }
                // Llamamos al método de instancia para descontar stock
                await producto.descontarStock(item.quantity);
            }
        } catch (error) { //Contrato de operaciones, excepcion de si "Si durante la verificación algún producto posee stock inferior, el sistema cancela la operación".
            console.error("[PedidoService] Falla de stock durante el procesamiento. Cancelando pedido id:", id_pedido);
            await PedidoModel.eliminarPedido(id_pedido);
            throw new Error("Error al procesar: Stock agotado");
        }

        // Contrato, post-condiciones "Se eliminaron todas las instancias de ItemCarrito..."
        CarritoService.vaciarCarrito();

        return id_pedido;
    }
}

module.exports = PedidoService;
