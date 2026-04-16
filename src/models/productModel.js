// src/models/productModel.js
// DATA ACCESS LAYER (SQLITE - DER ADAPTED)

const db = require('../database/db');

class ProductModel {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM producto WHERE estado_producto = 'activo'", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM producto WHERE id_producto = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static updateStock(id, newStock) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE producto SET stock = ? WHERE id_producto = ?", [newStock, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }
}

module.exports = ProductModel;
