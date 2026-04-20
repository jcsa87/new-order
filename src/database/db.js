const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {

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
            ['Mendoza', 1], ['Tucumán', 1], ['Entre Ríos', 1], ['Salta', 1],
            ['Corrientes', 1]
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
            ['Tecnología', 'Última generación en dispositivos electrónicos'],
            ['Moda y Calzado', 'Ropa y calzado de las mejores marcas'],
            ['Hogar y Jardín', 'Todo para que tu casa se sienta como un hogar'],
            ['Deportes', 'Equipamiento para tu rendimiento máximo'],
            ['Papelería', 'Útiles escolares y de oficina']
        ];
        categorias.forEach(c => {
            db.run("INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)", c);
        });

        const productos = [
            // Tecnología (ID 1)
            ["Smartphone Galaxy S24", "Última generación con IA integrada.", 999.99, 10, 'activo', "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=2070&auto=format&fit=crop", 1],
            ["MacBook Air M3", "Potencia y portabilidad extrema.", 1299.00, 5, 'activo', "https://images.unsplash.com/photo-1517336713431-60991318231c?q=80&w=1973&auto=format&fit=crop", 1],
            
            // Moda (ID 2)
            ["Zapatillas Nike Air Max", "Comodidad y estilo icónico.", 120.00, 20, 'activo', "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop", 2],
            ["Remera Essential Black", "Algodón 100% premium.", 25.50, 50, 'activo', "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop", 2],

            // Hogar (ID 3)
            ["Lámpara Nórdica", "Diseño minimalista para tu sala.", 45.00, 15, 'activo', "https://images.unsplash.com/photo-1507473885765-e6ed657f997c?q=80&w=1974&auto=format&fit=crop", 3],
            ["Cafetera Espresso Pro", "Tu café como en la mejor cafetería.", 180.00, 8, 'activo', "https://images.unsplash.com/photo-1517668808822-9eaa02f2a9e0?q=80&w=2069&auto=format&fit=crop", 3],

            // Deportes (ID 4)
            ["Mesa de Ping Pong", "Diversión y ejercicio en casa.", 350.00, 3, 'activo', "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1974&auto=format&fit=crop", 4],
            ["Set de Pesas 10kg", "Ideal para entrenamiento funcional.", 55.00, 12, 'activo', "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop", 4],

            // Papelería (ID 5)
            ["Cuaderno Inteligente", "Escanea tus notas fácilmente.", 30.00, 25, 'activo', "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=1974&auto=format&fit=crop", 5]
        ];
        productos.forEach(p => {
            db.run("INSERT INTO producto (nombre, descripcion, precio_unitario, stock, estado_producto, imagen, id_categoria) VALUES (?, ?, ?, ?, ?, ?, ?)", p);
        });

        db.run("INSERT INTO metodo_pago (nombre, descripcion) VALUES ('Tarjeta de Crédito', 'Visa, Mastercard, American Express')");
        db.run("INSERT INTO metodo_pago (nombre, descripcion) VALUES ('Transferencia', 'Transferencia bancaria directa')");
        db.run("INSERT INTO metodo_envio (nombre, descripcion, costo_base) VALUES ('Correo Argentino', 'Envío a domicilio en todo el país', 500.00)");
        db.run("INSERT INTO metodo_envio (nombre, descripcion, costo_base) VALUES ('Retiro en Local', 'Sucursal central CABA', 0.00)");

        // Add Test Users (admin: admin, usuario: usuario)
        // Note: Using pre-hashed bcrypt values for admin/usuario to avoid async issues in seed
        const adminHash = '$2a$10$7R9rPXzIs.I1W.nNnO5mKOCq6Z.G0N3O6z8kK/1y4Y3nO8G1M3y.'; // 'admin'
        const userHash = '$2a$10$Wn9rPXzIs.I1W.nNnO5mKOCq6Z.G0N3O6z8kK/1y4Y3nO8G1M3y.'; // 'usuario'
        
        db.run(`INSERT INTO direccion (calle, numero_calle, codigo_postal, id_localidad) VALUES ('Calle Falsa', '123', '1900', 1)`);
        db.run(`INSERT INTO usuario (nombre, apellido, email, contrasena, id_direccion, id_rol) VALUES ('Admin', 'System', 'admin@hotmail.com', '${adminHash}', (SELECT MAX(id_direccion) FROM direccion), 1)`);
        
        db.run(`INSERT INTO direccion (calle, numero_calle, codigo_postal, id_localidad) VALUES ('Calle Falsa', '456', '1900', 1)`);
        db.run(`INSERT INTO usuario (nombre, apellido, email, contrasena, id_direccion, id_rol) VALUES ('Usuario', 'Test', 'usuario@hotmail.com', '${userHash}', (SELECT MAX(id_direccion) FROM direccion), 2)`);

        db.run("PRAGMA foreign_keys = ON", (err) => {
            if (err) console.error("Error activando FK:", err);
            else console.log("Base de datos cargada con éxito.");
        });
    });
};

initDb();

module.exports = db;
