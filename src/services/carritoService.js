class CarritoService {
    constructor() {
        this.items = []; // En una app real, esto podría estar en sesión o DB temporal
    }

    agregarItem(producto, cantidad = 1) {
        const itemExistente = this.items.find(item => item.id_producto === producto.id_producto);
        const cantidadActual = itemExistente ? itemExistente.quantity : 0;

        // Regla de negocio: Validar stock acumulado
        if (producto.stock < (cantidadActual + cantidad)) {
            throw new Error(`Stock insuficiente. Solo quedan ${producto.stock} unidades.`);
        }

        if (itemExistente) {
            itemExistente.quantity += cantidad;
        } else {
            this.items.push({
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                precio_unitario: producto.precio_unitario,
                imagen: producto.imagen,
                stock: producto.stock, // Guardamos el stock para validaciones rápidas
                quantity: cantidad
            });
        }

        return this.items;
    }

    actualizarCantidad(idProducto, delta) {
        const item = this.items.find(i => i.id_producto === parseInt(idProducto));
        if (item) {
            const nuevaCantidad = item.quantity + delta;

            // Validar contra stock guardado
            if (delta > 0 && nuevaCantidad > item.stock) {
                return this.items; // Ignorar si supera stock
            }

            item.quantity = nuevaCantidad;

            if (item.quantity <= 0) {
                this.quitarItem(idProducto);
            }
        }
        return this.items;
    }

    quitarItem(idProducto) {
        this.items = this.items.filter(i => i.id_producto !== parseInt(idProducto));
        return this.items;
    }

    calcularTotales() {
        // Regla de negocio: Cálculo dinámico de totales e impuestos
        const subtotal = this.items.reduce((sum, item) => sum + (item.precio_unitario * item.quantity), 0);
        const impuestos = subtotal * 0.21; // Ejemplo: 21% IVA
        const total = subtotal + impuestos;

        return {
            subtotal: subtotal.toFixed(2),
            impuestos: impuestos.toFixed(2),
            total: total.toFixed(2)
        };
    }

    obtenerCarrito() {
        return this.items;
    }

    vaciar() {
        this.items = [];
    }
}

// Para efectos del Sprint 1, usaremos una instancia única (Singleton) 
// para simular la sesión del usuario.
module.exports = new CarritoService();
