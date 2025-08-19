export class Movimiento{
  id? : number;
  idCaja? : number;
  monto? : number;
  descripcion?: string;
  tipoMovimiento?: string;
  
  constructor(data?: any) {
    if (data) {
      this.id = data.id;
      this.idCaja = data.idCaja;
      this.monto = data.monto;
      this.descripcion = data.descripcion;
      this.tipoMovimiento = data.tipoMovimiento;
    }
  }
}

