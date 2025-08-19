export class RegistroEntrega{
  id?: number;
  fecha? : Date;
  monto?: number;

  constructor(data?: any) {
    if (data) {
      this.id = data.id;
      this.fecha = data.fecha;
      this.monto = data.monto;
    }
  }
}

