import { Rubro } from "./Rubro";

export class Producto{
  id? : number;
  codigo? : string;
  nombre? : string;
  cantidad? : number;
  costo? : number;
  precio? : number;
  tipoPrecio? : string;
  redondeo? : number;
  porcentaje? : number;
  vencimiento? : Date | null;
  faltante? : number;
  unidad? : string;
  imagen? : string;
  pathImagen? : string;
  categoria?: Rubro = new Rubro();
  soloPrecio? : boolean;
  activo? : boolean;
  estadoVencimiento?:number;
  
  constructor(data?: any) {
    if (data) {
      this.id = data.id;
      this.nombre = data.nombre;
      this.codigo = data.codigo;
      this.cantidad = data.cantidad;
      this.costo = data.costo;
      this.precio = data.precio;
      this.tipoPrecio = data.tipoPrecio;
      this.redondeo = data.redondeo;
      this.porcentaje = data.porcentaje;
      this.vencimiento = data.vencimiento;
      this.faltante = data.faltante;
      this.unidad = data.unidad;
      this.imagen = data.imagen;
      this.categoria = new Rubro(data.categoria);
      this.soloPrecio = data.soloPrecio;
      this.activo = data.activo;
    }
  }
}

