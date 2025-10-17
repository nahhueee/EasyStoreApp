import { Cliente } from "./Cliente";
import { DetalleVenta } from "./DetalleVenta";
import { PagoVenta } from "./PagoVenta";
import { FacturaVenta } from "./FacturaVenta";

export class Venta{
    id? : number;
    idCaja? : number;
    hora? : string;
    fecha : Date;
    cliente? : Cliente;
    total : number;
    pago: PagoVenta;
    factura?: FacturaVenta;
    activa: boolean;
    detalles: DetalleVenta[] = [];
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.idCaja = data.idCaja;
        this.fecha = data.fecha;
        this.hora = data.hora;
        
        this.cliente = data.cliente;
        this.pago = new PagoVenta(data.pago);
        this.factura = new FacturaVenta(data.factura);
        this.activa = data.activa;
        this.detalles = data.detalles;
      }
    }
  }
  
  