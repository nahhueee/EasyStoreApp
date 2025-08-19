import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, HostBinding } from '@angular/core';
import { ParametrosService } from 'src/app/services/parametros.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  esDark = false;
  color = '';

  @HostBinding('class') componentsCssClass:any;

  constructor(
    public overlayContainer:OverlayContainer,
    private parametroService:ParametrosService){
      
    //Comprueba el tema y si es dark al inicio de la aplicación
    this.color = this.parametroService.GetTema();
    
    //Si no existe el parametro en Local Storage procedemos a asignar un color y tema
    if(this.color=='null' || this.color==''){
      this.color = 'green-theme';
      this.parametroService.SetDark('false');
      this.parametroService.SetTema('green-theme');
    }

    if(this.parametroService.EsDark()){
      this.color += "-dark";
      this.esDark = true;
    }else{
      this.esDark = false;
    }

    //Setea los colores a toda la aplicacion
    this.overlayContainer.getContainerElement().classList.add(this.color);
    this.componentsCssClass = this.color;

    // Actualiza el color de fondo del body para diseño responsive
    this.updateBodyBackgroundColor();

    //Muestra la url de trabajo
    const url:string = this.parametroService.GetDatosServidor().apiUrl!;
    console.log("Consultando a: " + url);
    
    //Define el nombre del local
    if(this.parametroService.GetNombreLocal==null)
      this.parametroService.SetNombreLocal('Easy Sales');
    
  }

  private updateBodyBackgroundColor(): void {
    const body = document.body;
    body.classList.add(this.color);
  }
}
