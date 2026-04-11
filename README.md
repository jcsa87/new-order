# New Order - Sistema de Gestión de Pedidos

![New Order Banner](https://img.shields.io/badge/Proyecto-Ingeniería_Del_Software_II-blue?style=for-the-badge)
![Arquitectura](https://img.shields.io/badge/Architecture-Modular_Monolith-green?style=for-the-badge)
![Metodología](https://img.shields.io/badge/Methodology-Scrum-orange?style=for-the-badge)

## Descripción del Proyecto
Sistema de gestión de pedidos desarrollado como parte de una investigación de campo para la asignatura **Ingeniería del Software II**. El proyecto se basa en un catálogo genérico donde el núcleo es el **Módulo de Gestión de Pedidos**, abarcando desde la navegación hasta la confirmación de la compra.

## Stack Tecnológico
- **Entorno:** Node.js
- **Framework:** Express.js
- **Motor de Vistas:** EJS (Embedded JavaScript templates)
- **Estilos:** CSS3 Custom Properties

## Arquitectura y Diseño
El sistema sigue un enfoque de **Monolito Modular** bajo una **Arquitectura Multicapa**, utilizando el patrón **MVC**.

### Estructura de Capas:
- **`src/views/` (Presentación):** Interfaz enfocada en la experiencia de usuario (UX).
- **`src/services/` (Lógica de Negocio - Core):** Centraliza las reglas, validaciones de stock y cálculos dinámicos (IVA, descuentos). *Nota: En esta arquitectura, el controlador coordina y los servicios contienen el conocimiento de dominio.*
- **`src/controllers/` (Controladores):** Manejan el flujo de las peticiones HTTP y la comunicación entre capas.
- **`src/models/` (Acceso a Datos):** Actualmente implementado mediante **Mocks** para facilitar el testeo rápido de la lógica de negocio.

### Estructura de Directorios:
```text
src/
├── controllers/  # Coordinación de flujo
├── models/       # Datos (Mocks)
├── public/       # CSS, Imágenes y JS Cliente
├── routes/       # Definición de Endpoints
├── services/     # EL NÚCLEO (Lógica de Negocio)
├── views/        # Plantillas EJS
└── app.js        # Configuración principal
```

## Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Ejecutar en modo producción:**
   ```bash
   npm start
   ```
3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```
*Acceso:* `http://localhost:3000`


---
*Este proyecto es de carácter académico enfocado en la aplicación de patrones de ingeniería de software.*