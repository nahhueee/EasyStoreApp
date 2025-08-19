export class FiltroCaja{
    pagina = 1;
    tamanioPagina = 15;
    fecha: Date|null;
    responsable: number;
    finalizada: boolean;
    
    constructor(data?: any) {
      if (data) {
        this.pagina = data.pagina;
        this.tamanioPagina = data.tamanioPagina;

        this.fecha = data.fecha;        
        this.responsable = data.responsable;        
        this.finalizada = data.finalizada;        
       }
    }
  }
  