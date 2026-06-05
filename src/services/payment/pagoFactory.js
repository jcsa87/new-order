const PagoTarjeta = require('./pagoTarjeta');
const PagoTransferencia = require('./pagoTransferencia');
const PagoMercadoPago = require('./pagoMercadoPago');

class PagoFactory {
    /**
     * Crea e instancia la estrategia de pago correcta según el ID de método de pago seleccionado.
     * @param {number|string} idMetodoPago - ID del método de pago.
     * @param {Object} datosFormulario - Cuerpo del request con los campos del formulario.
     * @returns {EstrategiaPago} Instancia de la estrategia de pago correspondiente.
     */
    static crearEstrategia(idMetodoPago, datosFormulario) {
        const id = parseInt(idMetodoPago);
        switch (id) {
            case 1:
                return new PagoTarjeta({
                    tipoTarjeta: datosFormulario.tipoTarjeta,
                    nroTarjeta: datosFormulario.nroTarjeta,
                    nombreTitular: datosFormulario.nombreTitular,
                    cvv: datosFormulario.cvv,
                    fechaVencimiento: datosFormulario.fechaVencimiento,
                    cuotas: datosFormulario.cuotas
                });
            case 2:
                return new PagoTransferencia({
                    cbuOrigen: datosFormulario.cbuOrigen
                });
            case 3:
                return new PagoMercadoPago({
                    emailCuenta: datosFormulario.emailCuenta
                });
            default:
                throw new Error("El método de pago seleccionado no es válido o no está soportado.");
        }
    }
}

module.exports = PagoFactory;
