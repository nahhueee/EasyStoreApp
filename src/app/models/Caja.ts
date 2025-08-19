import { Usuario } from "./Usuario";

export class Caja{
    id : number;
    responsable? : Usuario;
    fecha? : Date;
    hora? : string;
    inicial? : number;
    ventas? : number;
    entradas? : number;
    salidas? : number;
    finalizada : boolean;
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.fecha = new Date(data.fecha);
        this.inicial = data.inicial;
        this.ventas = data.ventas;
        this.entradas = data.entradas;
        this.salidas = data.salidas;
        this.finalizada = data.finalizada;
        this.hora = data.hora;
        this.responsable = new Usuario({id: data.idResponsable, nombre: data.responsable});
      }
    }
  }
  
  