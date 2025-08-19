export class FiltroVenta{
    pagina = 1;
    tamanioPagina = 10;
    caja: number;
    cliente: number;
    estado: string;
    
    constructor(data?: any) {
      if (data) {
        this.pagina = data.pagina;
        this.tamanioPagina = data.tamanioPagina;

        this.caja = data.caja;     
        this.cliente = data.cliente;     
        this.estado = data.estado;     
       }
    }
  }
  