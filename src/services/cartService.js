// src/services/cartService.js
// BUSINESS LOGIC LAYER (CORE)

class CartService {
    constructor() {
        this.cart = []; // En una app real, esto podría estar en sesión o DB temporal
    }

    addToCart(product, quantity = 1) {
        // Regla de negocio: Validar stock
        if (product.stock < quantity) {
            throw new Error(`Stock insuficiente para ${product.nombre}`);
        }

        const existingItem = this.cart.find(item => item.id_producto === product.id_producto);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id_producto: product.id_producto,
                nombre: product.nombre,
                precio_unitario: product.precio_unitario,
                quantity: quantity
            });
        }

        return this.cart;
    }

    calculateTotal() {
        // Regla de negocio: Cálculo dinámico de totales
        const subtotal = this.cart.reduce((sum, item) => sum + (item.precio_unitario * item.quantity), 0);
        const taxes = subtotal * 0.21; // Ejemplo: 21% IVA
        const total = subtotal + taxes;

        return {
            subtotal: subtotal.toFixed(2),
            taxes: taxes.toFixed(2),
            total: total.toFixed(2)
        };
    }

    getCart() {
        return this.cart;
    }

    clear() {
        this.cart = [];
    }
}

// Para efectos del Sprint 1, usaremos una instancia única (Singleton) 
// para simular la sesión del usuario.
module.exports = new CartService();
