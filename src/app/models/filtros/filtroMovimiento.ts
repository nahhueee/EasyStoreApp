export class FiltroMovimiento{
    pagina = 1;
    tamanioPagina = 10;
    caja: number;
    tipoMovimiento: number;
    
    constructor(data?: any) {
      if (data) {
        this.pagina = data.pagina;
        this.tamanioPagina = data.tamanioPagina;

        this.caja = data.caja;     
        this.tipoMovimiento = data.tipoMovimiento      
       }
    }
  }
  