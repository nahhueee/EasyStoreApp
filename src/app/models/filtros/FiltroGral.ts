export class FiltroGral{
  pagina = 1;
  tamanioPagina = 15;
  total = 0;
  busqueda = "";
  orden = "";
  direccion = "";
  idCliente:number;

  constructor(data?: any) {
    if (data) {
      this.pagina = data.pagina;
      this.tamanioPagina = data.tamanioPagina;
      this.total = data.total;
      this.busqueda = data.busqueda;
      this.orden = data.orden;
      this.direccion = data.direccion;
      this.idCliente = data.idCliente;
    }
  }
}

