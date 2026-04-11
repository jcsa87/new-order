# New Order - Sistema de Gestión de Pedidos

![New Order Banner](https://img.shields.io/badge/Project-Software_Engineering_II-blue?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Modular_Monolith-green?style=for-the-badge)
![Methodology](https://img.shields.io/badge/Methodology-Scrum-orange?style=for-the-badge)

## Descripción del Proyecto
Sistema de gestión de pedidos. Desarrollado como parte de  investigación de campo para la asignatura **Ingeniería del Software II**. El proyecto se centra en un catálogo genérico donde el núcleo, en una primera instancia, es el **Módulo de Gestión de Pedidos**, abarcando desde la visualización de productos hasta la generación del comprobante final.

## Arquitectura y Diseño
El sistema sigue un enfoque de **Monolito Modular** bajo una **Arquitectura Multicapa**, utilizando el patrón de diseño **MVC (Modelo-Vista-Controlador)** para garantizar la separación de responsabilidades y la mantenibilidad.

### Capas del Sistema:
- **Vista (UI):** Interfaz intuitiva enfocada en la experiencia de usuario (UX) durante el proceso de compra.
- **Controlador (Lógica de Negocio):** El "corazón" del sistema. Centraliza:
  - Reglas de negocio y validaciones.
  - Gestión de inventario y stock en tiempo real.
  - Cálculos dinámicos (impuestos, descuentos, costos de envío).
- **Modelo (Acceso a Datos):** Encargado de la persistencia e integridad referencial de entidades como Usuarios, Pedidos, Detalle de Pedido y Productos.

## Gestión de Riesgos
- Adaptabilidad ante cambios en los requerimientos del flujo de compra.
- Mitigación de errores críticos en el carrito y checkout.
- Control de estabilidad en integraciones externas (pagos/envío).

---
*Proyecto de carácter académico con fines de aplicar las mejores prácticas de ingeniería de software.*