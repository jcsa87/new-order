// src/models/productModel.js
// DATA ACCESS LAYER (MOCK)

const products = [
    {
        id: 1,
        name: "Smartphone Galaxy S24",
        description: "Última generación con IA integrada.",
        price: 999.99,
        stock: 10,
        image: "/img/s24.png"
    },
    {
        id: 2,
        name: "MacBook Air M3",
        description: "Potencia y portabilidad extrema.",
        price: 1299.00,
        stock: 5,
        image: "/img/macbook.png"
    },
    {
        id: 3,
        name: "Sony WH-1000XM5",
        description: "Cancelación de ruido líder en la industria.",
        price: 349.50,
        stock: 15,
        image: "/img/sony.png"
    },
    {
        id: 4,
        name: "Monitor LG UltraWide",
        description: "34 pulgadas para máxima productividad.",
        price: 450.00,
        stock: 8,
        image: "/img/monitor.png"
    }
];

class ProductModel {
    static getAll() {
        return products;
    }

    static getById(id) {
        return products.find(p => p.id === parseInt(id));
    }

    static updateStock(id, newStock) {
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index].stock = newStock;
            return true;
        }
        return false;
    }
}

module.exports = ProductModel;
