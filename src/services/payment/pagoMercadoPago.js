const EstrategiaPago = require('./estrategiaPago');

class PagoMercadoPago extends EstrategiaPago {
    constructor(datos) {
        super();
        this.emailCuenta = datos.emailCuenta ? datos.emailCuenta.trim() : '';
        this.nroTransaccionMp = 'MP-' + Math.floor(Math.random() * 1000000);
    }

    validarDatos() {
        if (!this.emailCuenta || !this.emailCuenta.includes('@')) {
            throw new Error("El correo de la cuenta de Mercado Pago no es válido.");
        }
        return true;
    }

    procesarPago(monto) {
        console.log(`[PagoMercadoPago] Pago simulado de $${monto} aprobado para la cuenta ${this.emailCuenta}. Transacción: ${this.nroTransaccionMp}`);
        return true;
    }

    reembolsarPago(monto) {
        console.log(`[PagoMercadoPago] Reembolso simulado de $${monto} realizado para la cuenta ${this.emailCuenta}.`);
        return true;
    }

    generarLinkPago() {
        return `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${this.nroTransaccionMp}`;
    }
}

module.exports = PagoMercadoPago;
