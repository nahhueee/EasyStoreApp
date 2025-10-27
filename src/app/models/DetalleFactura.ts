export class DetalleFactura{
    id?: number;
    idFactura?: number;
    idProducto? : number;
    codProducto?: string;
    producto?: string;
    cantidad?: number;
    talle?: string;
    costo?: number;
    unitario?: number;
    total?: number;
    obs:string = "";
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.idFactura = data.idFactura;
        this.idProducto = data.idProducto;
        this.codProducto = data.codProducto;
        this.cantidad = data.cantidad;
        this.talle = data.talle;
        this.costo = data.costo;
        this.unitario = data.unitario;
        this.producto = data.producto;
        this.total = data.total;
        this.obs = data.obs;
      }
    }
  }
  
  