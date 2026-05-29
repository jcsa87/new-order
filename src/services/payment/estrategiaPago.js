class EstrategiaPago {
    /**
     * Valida los datos del formulario asociados a este método de pago.
     * @returns {boolean} True si son válidos, de lo contrario lanza un Error.
     */
    validarDatos() {
        throw new Error("El método validarDatos() debe ser implementado.");
    }

    /**
     * Procesa el pago simulado.
     * @param {number} monto - Monto a cobrar.
     * @returns {boolean} True si se procesó correctamente.
     */
    procesarPago(monto) {
        throw new Error("El método procesarPago() debe ser implementado.");
    }

    /**
     * Reembolsa/cancela el pago si hay rollback en el flujo principal.
     * @param {number} monto - Monto a reembolsar.
     * @returns {boolean} True si se reembolsó correctamente.
     */
    reembolsarPago(monto) {
        throw new Error("El método reembolsarPago() debe ser implementado.");
    }
}

module.exports = EstrategiaPago;
