import { Cargo } from "./Cargo";

export class Usuario{
  id? : number;
  nombre?: string;
  email?: string;
  pass?: string;
 
  cargo?: Cargo = new Cargo();

  constructor(data?: any) {
    if (data) {
      this.id = data.id;
      this.nombre = data.nombre;
      this.email = data.email;
      this.pass = data.pass;
      this.cargo = new Cargo({
        id: data.idCargo,
        nombre: data.cargo
      });
    }
  }
}

