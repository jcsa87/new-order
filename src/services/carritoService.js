const ProductoModel = require('../models/productoModel');

class CarritoService {
    constructor() {
        this.items = [];
    }

    async agregarItem(id_producto, cantidad) {
        const id = parseInt(id_producto);
        const qty = parseInt(cantidad) || 1;

        const itemExistente = this.items.find(item => item.id_producto === id);
        const cantidadTotal = (itemExistente ? itemExistente.quantity : 0) + qty;

        // Validar stock con el modelo (esta responsabilidad ahora es del servicio)
        await ProductoModel.verificarStock(id, cantidadTotal);

        const producto = await ProductoModel.obtenerPorId(id);
        if (!producto) {
            throw new Error("Producto no encontrado");
        }

        if (itemExistente) {
            itemExistente.quantity += qty;
            itemExistente.subtotal_item = itemExistente.quantity * itemExistente.precio_unitario;
        } else {
            this.items.push({
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                precio_unitario: producto.precio_unitario,
                subtotal_item: qty * producto.precio_unitario,
                imagen: producto.imagen,
                stock: producto.stock,
                quantity: qty
            });
        }

        this.recalcularTotales();
        return this.items;
    }

    async actualizarCantidad(id_producto, nueva_cantidad) {
        const id = parseInt(id_producto);
        const qty = parseInt(nueva_cantidad);

        // Precondición: El producto ya debe existir en el carrito
        const item = this.items.find(i => i.id_producto === id);

        if (item) {
            // Reutilizamos el método de validación único y centralizado del modelo
            if (qty > item.quantity) {
                await ProductoModel.verificarStock(id, qty);
            }

            item.quantity = qty;
            item.subtotal_item = item.quantity * item.precio_unitario;

            if (item.quantity <= 0) {
                this.quitarItem(id);
            } else {
                this.recalcularTotales();
            }
        }
        return this.items;
    }

    quitarItem(id_producto) {
        const id = parseInt(id_producto);
        this.items = this.items.filter(i => i.id_producto !== id);
        this.recalcularTotales();
        return this.items;
    }

    recalcularTotales() {
        const subtotal = this.items.reduce((sum, item) => sum + item.subtotal_item, 0);
        const impuestos = subtotal * 0.21;
        const total = subtotal + impuestos;

        this.totales = {
            subtotal: subtotal.toFixed(2),
            impuestos: impuestos.toFixed(2),
            total: total.toFixed(2)
        };
    }

    obtenerTotales() {
        if (!this.totales) this.recalcularTotales();
        return this.totales;
    }

    obtenerCarrito() {
        return this.items;
    }

    vaciar() {
        this.items = [];
        this.recalcularTotales();
    }

    verificarSesionYCarrito(session) {
        const UsuarioModel = require('../models/usuarioModel');
        const isAuth = UsuarioModel.verificarAuth(session);
        const isEmpty = this.items.length === 0;

        return {
            autenticado: isAuth,
            vacio: isEmpty
        };
    }
}

module.exports = new CarritoService();
