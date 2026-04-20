class CarritoService {
    constructor() {
        this.items = []; // En una app real, esto podría estar en sesión o DB temporal
    }

    agregarItem(producto, cantidad) {
        // Precondiciones: id_producto válido (implícito por el objeto producto), cantidad > 0
        const cant = parseInt(cantidad);
        if (isNaN(cant) || cant <= 0) throw new Error("La cantidad debe ser mayor a cero.");

        const itemExistente = this.items.find(item => item.id_producto === producto.id_producto);
        const cantidadActual = itemExistente ? itemExistente.quantity : 0;

        // Caso Alternativo (Stock Insuficiente)
        if (producto.stock < (cantidadActual + cant)) {
            throw new Error(`Stock insuficiente. Solo quedan ${producto.stock} unidades.`);
        }

        // Caso Éxito (Stock Suficiente)
        if (itemExistente) {
            itemExistente.quantity += cant;
            itemExistente.subtotal_item = itemExistente.quantity * itemExistente.precio_unitario;
        } else {
            this.items.push({
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                precio_unitario: producto.precio_unitario,
                subtotal_item: cant * producto.precio_unitario, 
                imagen: producto.imagen,
                stock: producto.stock,
                quantity: cant
            });
        }

        this.recalcularTotales();
        return this.items;
    }

    actualizarCantidad(id_producto, nueva_cantidad) {
        const id = parseInt(id_producto);
        const qty = parseInt(nueva_cantidad);
        
        // Precondición: El producto ya debe existir en el carrito
        const item = this.items.find(i => i.id_producto === id);
        
        if (item) {
            // Validar stock si estamos incrementando
            if (qty > item.quantity) {
                const diferencia = qty - item.quantity;
                if (item.stock < qty) {
                    throw new Error(`No puedes superar el stock de ${item.stock} unidades.`);
                }
            }

            item.quantity = qty;
            item.subtotal_item = item.quantity * item.precio_unitario;

            if (item.quantity <= 0) {
                this.quitarItem(id);
            }
            
            this.recalcularTotales();
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
}

// Para efectos del Sprint 1, usaremos una instancia única (Singleton) 
// para simular la sesión del usuario.
module.exports = new CarritoService();
