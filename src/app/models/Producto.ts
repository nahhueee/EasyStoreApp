export class Producto {
    id : number = 0;
    codigo? : string;
    nombre? : string;
    proceso?: Proceso;
    tipo?: TipoProducto;
    subtipo?: SubtipoProducto;
    genero?: Genero;
    material?: Material;
    color?: Color;
    moldeleria?: number;
    imagen?: string;
    talles?: TallesProducto[];
    activo:boolean;
}

export class TablaProducto {
    id : number = 0;
    codigo? : string;
    nombre? : string;
    proceso?: string;
    abrevProceso?: string;
    tipo?: string;
    subtipo?: string;
    genero?: string;
    material?: string;
    color?: string;
    hexa?: string;
    moldeleria?: number;
    imagen?: string;

    t1:string = "";
    t2:string = "";
    t3:string = "";
    t4:string = "";
    t5:string = "";
    t6:string = "";
    t7:string = "";
    t8:string = "";
    t9:string = "";
    t10:string = "";

    Total:number = 0;
}

export class Proceso {
    id?:number;
    descripcion?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
        }
    }
}
export class TipoProducto {
    id?:number;
    descripcion?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
        }
    }
}
export class SubtipoProducto {
    id?:number;
    descripcion?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
        }
    }
}
export class Genero {
    id?:number;
    descripcion?:string;
    abreviatura?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
          this.abreviatura = data.abreviatura;
        }
    }
}
export class LineasTalle {
    id?:number;
    talles?:string[] = [];

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.talles = data.talles;
        }
    }
}
export class Material {
    id?:number;
    descripcion?:string;
    colores?:Color[] = []

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
        }
    }
}
export class Color {
    id?:number;
    descripcion?:string;
    hexa?:string;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.descripcion = data.descripcion;
          this.hexa = data.hexa;
        }
    }
}
export class TallesProducto {
    id?:number;
    talle?:string;
    idLineaTalle?:number;
    cantidad?:number;
    costo?:number;
    precio?:number;

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.talle = data.talle;
          this.cantidad = data.cantidad;
          this.costo = data.costo;
          this.precio = data.precio;
          this.idLineaTalle = data.idLineaTalle;
        }
    }
}

export class TalleSeleccionable{
  talle?:string;
  seleccionado?:boolean;

  constructor(data?: any) {
    if (data) {
        this.talle = data.talle;
        this.seleccionado = data.seleccionado;
    }
}
}

