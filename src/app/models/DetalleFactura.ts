export class DetalleFactura{
    id?: number;
    idPedido?: number;
    idProducto? : number;
    producto?: string;
    cantidad?: number;
    costo?: number;
    unitario?: number;
    total?: number;
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.idPedido = data.idPedido;
        this.idProducto = data.idProducto;
        this.cantidad = data.cantidad;
        this.costo = data.costo;
        this.unitario = data.unitario;
        this.producto = data.producto;
        this.total = data.total;
      }
    }
  }
  
  