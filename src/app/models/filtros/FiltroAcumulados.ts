export class FiltroAcumulado{
    pagina = 1;
    tamanioPagina = 10;
    total = 0;
    caja: number;
    tipo: string;
    nombre: string;

    constructor(data?: any) {
        if (data) {
        this.total = data.total;
        this.pagina = data.pagina;
        this.tamanioPagina = data.tamanioPagina;

        this.caja = data.caja;     
        this.tipo = data.tipo;      
        this.nombre = data.nombre;      
        }
    }
}
  