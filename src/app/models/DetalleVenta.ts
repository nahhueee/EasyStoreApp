import { Producto } from "./Producto";

export class DetalleVenta{
    id? : number;
    idVenta? : number;
    producto?: Producto;
    cantidad : number;
    costo? : number;
    precio? : number;
    total: number;
   
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.idVenta = data.idVenta;
        this.cantidad = data.cantidad;
        this.costo = data.costo;
        this.precio = data.precio;
        this.total = data.total;
        this.producto = new Producto();
      }
    }
  }
  
  