export class Cliente{
  id? : number;
  nombre? : string;
  email? : string;
  telefono? : string;
  direccion?: string;
  condIva?: number;
  condicion?: string;
  documento?: number;

  constructor(data?: any) {
    if (data) {
      this.id = data.id;
      this.nombre = data.nombre;
      this.email = data.email;
      this.direccion = data.direccion;
      this.condIva = data.condIva;
      this.documento = data.documento;
    }
  }
}

