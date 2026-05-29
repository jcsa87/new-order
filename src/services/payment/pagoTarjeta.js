const EstrategiaPago = require('./estrategiaPago');

class PagoTarjeta extends EstrategiaPago {
    constructor(datos) {
        super();
        this.tipoTarjeta = datos.tipoTarjeta ? datos.tipoTarjeta.trim() : '';
        this.nroTarjeta = datos.nroTarjeta ? datos.nroTarjeta.replace(/\s+/g, '') : '';
        this.nombreTitular = datos.nombreTitular ? datos.nombreTitular.trim() : '';
        this.cvv = datos.cvv ? datos.cvv.replace(/\s+/g, '') : '';
        this.fechaVencimiento = datos.fechaVencimiento ? datos.fechaVencimiento.trim() : '';
        this.cuotas = datos.cuotas ? parseInt(datos.cuotas) : 1;
    }

    validarDatos() {
        if (!this.tipoTarjeta) {
            throw new Error("El tipo de tarjeta es obligatorio.");
        }
        if (!this.nroTarjeta || !/^\d{16}$/.test(this.nroTarjeta)) {
            throw new Error("El número de tarjeta debe tener exactamente 16 dígitos.");
        }
        if (!this.nombreTitular) {
            throw new Error("El nombre del titular es obligatorio.");
        }
        if (!this.cvv || !/^\d{3,4}$/.test(this.cvv)) {
            throw new Error("El código de seguridad (CVV) debe tener 3 o 4 dígitos.");
        }
        if (!this.fechaVencimiento || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.fechaVencimiento)) {
            throw new Error("La fecha de vencimiento debe tener el formato MM/AA.");
        }
        if (isNaN(this.cuotas) || this.cuotas <= 0) {
            throw new Error("El número de cuotas seleccionado no es válido.");
        }
        return true;
    }

    procesarPago(monto) {
        console.log(`[PagoTarjeta] Pago simulado de $${monto} aprobado en ${this.cuotas} cuota(s) para la tarjeta ${this.tipoTarjeta} final ${this.enmascararNumero()}`);
        return true;
    }

    reembolsarPago(monto) {
        console.log(`[PagoTarjeta] Reembolso simulado de $${monto} realizado con éxito para la tarjeta ${this.tipoTarjeta} ${this.enmascararNumero()}`);
        return true;
    }

    permiteFinanciacion() {
        return true;
    }

    enmascararNumero() {
        if (this.nroTarjeta.length < 4) return '****';
        return `**** **** **** ${this.nroTarjeta.slice(-4)}`;
    }
}

module.exports = PagoTarjeta;
