// src/models/categoryModel.js
const db = require('../database/db');

class CategoryModel {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM categoria", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = CategoryModel;
