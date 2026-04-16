const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {
        console.log("Iniciando reestructuración de base de datos según DER...");

        // Usar PRAGMA synchronous y journal_mode para estabilidad
        db.run("PRAGMA foreign_keys = OFF");
        
        const tables = [
            'detalle_pedido', 'pedido', 'producto', 'categoria', 
            'usuario', 'rol', 'direccion', 'localidad', 'provincia', 
            'pais', 'metodo_pago', 'metodo_envio'
        ];
        
        tables.forEach(table => {
            db.run(`DROP TABLE IF EXISTS ${table}`);
        });

        // Crear tablas en orden de dependencia
        db.run(`CREATE TABLE pais (
            id_pais INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE provincia (
            id_provincia INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            id_pais INTEGER,
            FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
        )`);

        db.run(`CREATE TABLE localidad (
            id_localidad INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            id_provincia INTEGER,
            FOREIGN KEY (id_provincia) REFERENCES provincia(id_provincia)
        )`);

        db.run(`CREATE TABLE direccion (
            id_direccion INTEGER PRIMARY KEY AUTOINCREMENT,
            calle TEXT NOT NULL,
            numero_calle TEXT NOT NULL,
            nro_piso TEXT,
            nro_departamento TEXT,
            codigo_postal TEXT NOT NULL,
            id_localidad INTEGER,
            FOREIGN KEY (id_localidad) REFERENCES localidad(id_localidad)
        )`);

        db.run(`CREATE TABLE rol (
            id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            estado TEXT DEFAULT 'activo'
        )`);

        db.run(`CREATE TABLE usuario (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            contrasena TEXT NOT NULL,
            estado TEXT DEFAULT 'activo',
            id_direccion INTEGER,
            id_rol INTEGER,
            FOREIGN KEY (id_direccion) REFERENCES direccion(id_direccion),
            FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
        )`);

        db.run(`CREATE TABLE categoria (
            id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT
        )`);

        db.run(`CREATE TABLE producto (
            id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio_unitario REAL NOT NULL,
            stock INTEGER NOT NULL,
            estado_producto TEXT DEFAULT 'activo',
            imagen TEXT,
            id_categoria INTEGER,
            FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        )`);

        db.run(`CREATE TABLE metodo_pago (
            id_metodo_pago INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'activo'
        )`);

        db.run(`CREATE TABLE metodo_envio (
            id_metodo_envio INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'activo',
            costo_base REAL
        )`);

        db.run(`CREATE TABLE pedido (
            id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            estado TEXT DEFAULT 'pendiente',
            subtotal_pedido REAL,
            descuento_applied REAL DEFAULT 0,
            total REAL,
            id_usuario INTEGER,
            id_metodo_pago INTEGER,
            id_metodo_envio INTEGER,
            id_direccion INTEGER,
            FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
            FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago),
            FOREIGN KEY (id_metodo_envio) REFERENCES metodo_envio(id_metodo_envio),
            FOREIGN KEY (id_direccion) REFERENCES direccion(id_direccion)
        )`);

        db.run(`CREATE TABLE detalle_pedido (
            id_detalle_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            subtotal_item REAL NOT NULL,
            id_pedido INTEGER,
            id_producto INTEGER,
            FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
            FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
        )`);

        // SEEDING (dentro del mismo serialize para garantizar orden)
        db.run("INSERT INTO pais (nombre) VALUES ('Argentina')");
        
        const provincias = [
            ['Buenos Aires', 1], ['CABA', 1], ['Córdoba', 1], ['Santa Fe', 1], 
            ['Mendoza', 1], ['Tucumán', 1], ['Entre Ríos', 1], ['Salta', 1]
        ];
        provincias.forEach(p => {
            db.run("INSERT INTO provincia (nombre, id_pais) VALUES (?, ?)", p);
        });

        const localidades = [
            ['La Plata', 1], ['Bahía Blanca', 1], ['Palermo', 2], ['Recoleta', 2],
            ['Córdoba Capital', 3], ['Rosario', 4]
        ];
        localidades.forEach(l => {
            db.run("INSERT INTO localidad (nombre, id_provincia) VALUES (?, ?)", l);
        });

        db.run("INSERT INTO rol (nombre, estado) VALUES ('Administrador', 'activo')"); 
        db.run("INSERT INTO rol (nombre, estado) VALUES ('Cliente', 'activo')");

        const categorias = [
            ['Smartphones', 'Última tecnología móvil'],
            ['Laptops', 'Computadoras portátiles de alto rendimiento'],
            ['Audio', 'Auriculares y parlantes premium'],
            ['Accesorios', 'Complementos para tus dispositivos']
        ];
        categorias.forEach(c => {
            db.run("INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)", c);
        });

        const productos = [
            ["Smartphone Galaxy S24", "Última generación con IA integrada.", 999.99, 10, 'activo', "/img/s24.png", 1],
            ["MacBook Air M3", "Potencia y portabilidad extrema.", 1299.00, 5, 'activo', "/img/macbook.png", 2],
            ["Sony WH-1000XM5", "Cancelación de ruido líder en la industria.", 349.50, 15, 'activo', "/img/sony.png", 3],
            ["Monitor LG UltraWide", "34 pulgadas para máxima productividad.", 450.00, 8, 'activo', "/img/monitor.png", 4]
        ];
        productos.forEach(p => {
            db.run("INSERT INTO producto (nombre, descripcion, precio_unitario, stock, estado_producto, imagen, id_categoria) VALUES (?, ?, ?, ?, ?, ?, ?)", p);
        });

        db.run("INSERT INTO metodo_pago (nombre, descripcion) VALUES ('Tarjeta de Crédito', 'Visa, Mastercard, American Express')");
        db.run("INSERT INTO metodo_pago (nombre, descripcion) VALUES ('Transferencia', 'Transferencia bancaria directa')");
        db.run("INSERT INTO metodo_envio (nombre, descripcion, costo_base) VALUES ('Correo Argentino', 'Envío a domicilio en todo el país', 500.00)");
        db.run("INSERT INTO metodo_envio (nombre, descripcion, costo_base) VALUES ('Retiro en Local', 'Sucursal central CABA', 0.00)");

        db.run("PRAGMA foreign_keys = ON", (err) => {
            if (err) console.error("Error activando FK:", err);
            else console.log("Base de datos adaptada al DER y sembrada con éxito.");
        });
    });
};

initDb();

module.exports = db;
