export class FiltroProducto{
  pagina = 1;
  tamanioPagina = 15;
  total = 0;
  busqueda = "";
  orden = "";
  direccion = "";
  faltantes:boolean;
  proceso:number = 0;
  tipo:number = 0;
  subtipo:number = 0;

  constructor(data?: any) {
    if (data) {
      this.pagina = data.pagina;
      this.tamanioPagina = data.tamanioPagina;
      this.total = data.total;
      this.busqueda = data.busqueda;
      this.orden = data.orden;
      this.direccion = data.direccion;
      this.faltantes = data.faltantes;
      this.proceso = data.proceso;
      this.tipo = data.tipo;
      this.subtipo = data.subtipo;
    }
  }
}

