export class ObjComprobante {
    papel?:string;
    nombreLocal?:string;
    fechaVenta?:string;
    horaVenta?:string;
    descuento?:number;
    recargo?:number;
    filasTabla?:any[];
    totalProductos?:number;
    totalFinal?:number;

    constructor(data?: any) {
        if (data) {
          this.papel = data.papel;
          this.nombreLocal = data.nombreLocal;
          this.fechaVenta = data.fechaVenta;
          this.horaVenta = data.horaVenta;
          this.descuento = data.descuento;
          this.recargo = data.recargo;
          this.filasTabla = data.filasTabla;
          this.totalProductos = data.totalProductos;
          this.totalFinal = data.totalFinal;
        }
    }
}