export class PagoVenta{
    idVenta? : number;
    idTipoPago?: number;
    tipoPago?: string;
    efectivo? : number;
    entrega? : number;
    restante? : number;
    digital? : number;
    recargo? : number;
    descuento? : number;
    realizado? : boolean;
  
    constructor(data?: any) {
      if (data) {
        this.idVenta = data.idVenta;
        this.efectivo = data.efectivo;
        this.digital = data.digital;
        this.realizado = data.realizado;
        this.idTipoPago = data.idTipoPago;
        this.tipoPago = data.tipoPago;
        this.entrega = data.entrega;
        this.restante = data.restante;
        this.recargo = data.recargo;
        this.descuento = data.descuento;
      }
    }
  }
  
  