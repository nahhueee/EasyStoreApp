export class TipoFactura{
    codigo? : number;
    nombre? : string;
    habilitada? : boolean;
    
    constructor(data?: any) {
      if (data) {
        this.codigo = data.codigo;
        this.nombre = data.nombre;
        this.habilitada = data.habilitada;
      }
    }
}
  