jest.mock('../../src/database/db', () => ({
    get: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn(cb => cb())
}));

const CarritoService = require('../../src/services/carritoService');
const ProductoModel = require('../../src/models/productoModel');

describe('CarritoService - Gestión de Carrito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Resetear el estado del singleton del carrito para cada test
        CarritoService.vaciar();
        
        // Mockear las llamadas estáticas de ProductoModel
        ProductoModel.verificarStock = jest.fn().mockResolvedValue(true);
        ProductoModel.obtenerPorId = jest.fn();
    });

    describe('agregarItem', () => {
        test('Debe agregar un item nuevo correctamente y calcular totales', async () => {
            const mockProducto = {
                id_producto: 1,
                nombre: 'Teclado Mecánico',
                precio_unitario: 100.0,
                imagen: 'teclado.jpg',
                stock: 10
            };
            ProductoModel.obtenerPorId.mockResolvedValue(mockProducto);

            const items = await CarritoService.agregarItem(1, 2);

            expect(items).toHaveLength(1);
            expect(items[0]).toEqual({
                id_producto: 1,
                nombre: 'Teclado Mecánico',
                precio_unitario: 100.0,
                subtotal_item: 200.0,
                imagen: 'teclado.jpg',
                stock: 10,
                quantity: 2
            });

            // Verificar totales del carrito (Subtotal: 200, IVA 21%: 42, Total: 242)
            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('200.00');
            expect(totales.impuestos).toBe('42.00');
            expect(totales.total).toBe('242.00');
            expect(ProductoModel.verificarStock).toHaveBeenCalledWith(1, 2);
        });

        test('Debe acumular la cantidad si se agrega un item que ya está en el carrito', async () => {
            const mockProducto = {
                id_producto: 1,
                nombre: 'Teclado Mecánico',
                precio_unitario: 100.0,
                imagen: 'teclado.jpg',
                stock: 10
            };
            ProductoModel.obtenerPorId.mockResolvedValue(mockProducto);

            // Agregar primera vez
            await CarritoService.agregarItem(1, 2);
            // Agregar segunda vez
            const items = await CarritoService.agregarItem(1, 3);

            expect(items).toHaveLength(1);
            expect(items[0].quantity).toBe(5);
            expect(items[0].subtotal_item).toBe(500.0);

            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('500.00');
            expect(totales.impuestos).toBe('105.00');
            expect(totales.total).toBe('605.00');
            expect(ProductoModel.verificarStock).toHaveBeenLastCalledWith(1, 5); // Verifica stock total acumulado
        });

        test('Debe fallar y lanzar error si no hay stock suficiente', async () => {
            ProductoModel.verificarStock.mockRejectedValue(new Error('Stock insuficiente. Quedan 2 unidades.'));

            await expect(CarritoService.agregarItem(1, 5))
                .rejects
                .toThrow('Stock insuficiente. Quedan 2 unidades.');

            expect(CarritoService.obtenerCarrito()).toHaveLength(0);
        });
    });

    describe('actualizarCantidad', () => {
        beforeEach(async () => {
            // Setup: cargar un item en el carrito
            const mockProducto = {
                id_producto: 2,
                nombre: 'Mouse Gamer',
                precio_unitario: 50.0,
                imagen: 'mouse.jpg',
                stock: 5
            };
            ProductoModel.obtenerPorId.mockResolvedValue(mockProducto);
            await CarritoService.agregarItem(2, 2);
            jest.clearAllMocks();
        });

        test('Debe actualizar cantidad hacia arriba validando stock', async () => {
            ProductoModel.verificarStock.mockResolvedValue(true);

            const items = await CarritoService.actualizarCantidad(2, 4);

            expect(items[0].quantity).toBe(4);
            expect(items[0].subtotal_item).toBe(200.0);
            expect(ProductoModel.verificarStock).toHaveBeenCalledWith(2, 4);

            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('200.00');
        });

        test('Debe actualizar cantidad hacia abajo sin validar stock', async () => {
            const items = await CarritoService.actualizarCantidad(2, 1);

            expect(items[0].quantity).toBe(1);
            expect(items[0].subtotal_item).toBe(50.0);
            expect(ProductoModel.verificarStock).not.toHaveBeenCalled(); // No debe validar ya que disminuye

            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('50.00');
        });

        test('Debe eliminar el item del carrito si la cantidad es 0 o menor', async () => {
            const items = await CarritoService.actualizarCantidad(2, 0);

            expect(items).toHaveLength(0);
            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('0.00');
        });
    });

    describe('quitarItem', () => {
        test('Debe remover el item del carrito y actualizar los totales', async () => {
            const mockProducto1 = { id_producto: 1, nombre: 'A', precio_unitario: 10.0 };
            const mockProducto2 = { id_producto: 2, nombre: 'B', precio_unitario: 20.0 };
            
            ProductoModel.obtenerPorId.mockResolvedValueOnce(mockProducto1).mockResolvedValueOnce(mockProducto2);
            
            await CarritoService.agregarItem(1, 2);
            await CarritoService.agregarItem(2, 1);

            const items = CarritoService.quitarItem(1);

            expect(items).toHaveLength(1);
            expect(items[0].id_producto).toBe(2);
            
            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('20.00');
        });
    });

    describe('vaciarCarrito', () => {
        test('Debe vaciar todos los items y poner totales en 0', async () => {
            ProductoModel.obtenerPorId.mockResolvedValue({ id_producto: 1, nombre: 'A', precio_unitario: 10.0 });
            await CarritoService.agregarItem(1, 2);

            expect(CarritoService.obtenerCarrito()).toHaveLength(1);

            CarritoService.vaciarCarrito();

            expect(CarritoService.obtenerCarrito()).toHaveLength(0);
            const totales = CarritoService.obtenerTotales();
            expect(totales.subtotal).toBe('0.00');
            expect(totales.total).toBe('0.00');
        });
    });
});
