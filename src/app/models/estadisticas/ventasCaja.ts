export class VentasCaja{
    cantVentas? : number;
    totalVentas? : number;
    ganancias? : number;
  
    constructor(data?: any) {
      if (data) {
        this.cantVentas = data.cantVentas;
        this.totalVentas = data.totalVentas;
        this.ganancias = data.ganancias;
      }
    }
  }
  
  