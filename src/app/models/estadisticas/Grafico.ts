export class Grafico{
    ejeX: [];
    ejeY: [];
  
    constructor(data?: any) {
      if (data) {
        this.ejeX = data.ejeX;
        this.ejeY = data.ejeY;
      }
    }
  }
  
  