const EstrategiaPago = require('./estrategiaPago');

class PagoTransferencia extends EstrategiaPago {
    constructor(datos) {
        super();
        this.cbuOrigen = datos.cbuOrigen ? datos.cbuOrigen.replace(/\s+/g, '') : '';
        this.cbuDestino = '0000003100000000012345'; // CBU Ficticio de la tienda
        this.nroComprobante = datos.nroComprobante ? datos.nroComprobante.trim() : 'COMP-SIMULADO';
    }

    validarDatos() {
        if (!this.cbuOrigen || !/^\d{22}$/.test(this.cbuOrigen)) {
            throw new Error("El CBU de origen debe tener exactamente 22 dígitos numéricos.");
        }
        return true;
    }

    procesarPago(monto) {
        console.log(`[PagoTransferencia] Transferencia simulada de $${monto} desde CBU ${this.cbuOrigen} a CBU ${this.cbuDestino} procesada.`);
        return true;
    }

    reembolsarPago(monto) {
        console.log(`[PagoTransferencia] Reembolso simulado de $${monto} devuelto al CBU ${this.cbuOrigen}.`);
        return true;
    }

    generarInstruccionPago() {
        return `Por favor transferir $ a CBU: ${this.cbuDestino}`;
    }

    aprobarPagoManualmente() {
        return true;
    }
}

module.exports = PagoTransferencia;
