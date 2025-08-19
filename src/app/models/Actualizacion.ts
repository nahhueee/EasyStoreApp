export class Actualizacion{
    version? : string;
    link? : string;
    info? : string;
  
    constructor(data?: any) {
      if (data) {
        this.version = data.version;
        this.link = data.link;
        this.info = data.info;
      }
    }
  }
  
  