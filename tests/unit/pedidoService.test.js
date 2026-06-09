jest.mock('../../src/database/db', () => ({
    get: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn(cb => cb())
}));

const PedidoService = require('../../src/services/pedidoService');
const PedidoModel = require('../../src/models/pedidoModel');
const ProductoModel = require('../../src/models/productoModel');
const CarritoService = require('../../src/services/carritoService');

describe('PedidoService - Confirmación de Pedidos', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mockear las llamadas a PedidoModel
        PedidoModel.crearPedido = jest.fn();
        PedidoModel.eliminarPedido = jest.fn();

        // Mockear las llamadas a ProductoModel
        ProductoModel.obtenerPorId = jest.fn();

        // Mockear las llamadas del servicio de Carrito
        CarritoService.obtenerCarrito = jest.fn();
        CarritoService.obtenerTotales = jest.fn();
        CarritoService.vaciarCarrito = jest.fn();
    });

    test('Debe lanzar error si el carrito está vacío', async () => {
        CarritoService.obtenerCarrito.mockReturnValue([]);

        await expect(PedidoService.confirmarPedido({
            id_usuario: 1,
            id_metodo_pago: 1,
            id_metodo_envio: 1,
            id_direccion: 5
        })).rejects.toThrow('El carrito está vacío.');

        expect(PedidoModel.crearPedido).not.toHaveBeenCalled();
    });

    test('Debe registrar el pedido, descontar stock de productos y vaciar carrito en flujo feliz', async () => {
        const mockItems = [
            { id_producto: 10, quantity: 2, precio_unitario: 50.0, subtotal_item: 100.0 },
            { id_producto: 20, quantity: 1, precio_unitario: 80.0, subtotal_item: 80.0 }
        ];
        CarritoService.obtenerCarrito.mockReturnValue(mockItems);
        CarritoService.obtenerTotales.mockReturnValue({
            subtotal: '180.00',
            impuestos: '37.80',
            total: '217.80'
        });

        const mockPedidoId = 99;
        PedidoModel.crearPedido.mockResolvedValue(mockPedidoId);

        // Mockear los objetos del producto retornado e instanciado
        const mockDescontarStock1 = jest.fn().mockResolvedValue(true);
        const mockDescontarStock2 = jest.fn().mockResolvedValue(true);

        ProductoModel.obtenerPorId
            .mockResolvedValueOnce({ id_producto: 10, descontarStock: mockDescontarStock1 })
            .mockResolvedValueOnce({ id_producto: 20, descontarStock: mockDescontarStock2 });

        const idGenerado = await PedidoService.confirmarPedido({
            id_usuario: 1,
            id_metodo_pago: 2,
            id_metodo_envio: 1,
            id_direccion: 5
        });

        expect(idGenerado).toBe(mockPedidoId);

        // 1. Debe haber creado el pedido con los totales y los items mapeados
        expect(PedidoModel.crearPedido).toHaveBeenCalledWith({
            id_usuario: 1,
            id_metodo_pago: 2,
            id_metodo_envio: 1,
            id_direccion: 5,
            subtotal_pedido: 180.0,
            descuento_aplicado: 0.0,
            total: 217.80, // Total sin costo de envío (subtotal + impuestos)
            items: [
                { id_producto: 10, quantity: 2, precio_unitario: 50.0, subtotal_item: 100.0 },
                { id_producto: 20, quantity: 1, precio_unitario: 80.0, subtotal_item: 80.0 }
            ]
        });

        // 2. Debe haber llamado a descontarStock para cada producto
        expect(mockDescontarStock1).toHaveBeenCalledWith(2);
        expect(mockDescontarStock2).toHaveBeenCalledWith(1);

        // 3. Debe haber vaciado el carrito al finalizar
        expect(CarritoService.vaciarCarrito).toHaveBeenCalled();
        expect(PedidoModel.eliminarPedido).not.toHaveBeenCalled();
    });

    test('Debe ejecutar rollback (eliminar pedido) y lanzar error si falla el descuento de stock (compensación)', async () => {
        const mockItems = [
            { id_producto: 10, quantity: 2, precio_unitario: 50.0, subtotal_item: 100.0 }
        ];
        CarritoService.obtenerCarrito.mockReturnValue(mockItems);
        CarritoService.obtenerTotales.mockReturnValue({
            subtotal: '100.00',
            impuestos: '21.00',
            total: '121.00'
        });

        const mockPedidoId = 100;
        PedidoModel.crearPedido.mockResolvedValue(mockPedidoId);

        // Simular que descontarStock lanza un error
        const mockDescontarStock = jest.fn().mockRejectedValue(new Error('Sin stock suficiente'));
        ProductoModel.obtenerPorId.mockResolvedValue({ id_producto: 10, descontarStock: mockDescontarStock });

        await expect(PedidoService.confirmarPedido({
            id_usuario: 1,
            id_metodo_pago: 2,
            id_metodo_envio: 1,
            id_direccion: 5
        })).rejects.toThrow('Error al procesar: Stock agotado');

        // Verificar compensación
        expect(PedidoModel.eliminarPedido).toHaveBeenCalledWith(mockPedidoId);

        // El carrito NO debe haberse vaciado para no perder los datos del cliente
        expect(CarritoService.vaciarCarrito).not.toHaveBeenCalled();
    });
});
