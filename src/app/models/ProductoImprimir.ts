export class ProductoImprimir{
  codigo? : string;
  nombre? : string;
  cantidad? : number;
  precio? : number;
  vencimiento? : string;
    
  constructor(data?: any) {
    if (data) {
      this.nombre = data.nombre;
      this.codigo = data.codigo;
      this.cantidad = data.cantidad;
      this.precio = data.precio;
      this.vencimiento = data.vencimiento;
    }
  }
}

