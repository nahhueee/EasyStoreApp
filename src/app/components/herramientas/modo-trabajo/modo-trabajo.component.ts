import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { invoke } from '@tauri-apps/api';
import { NgxSpinnerService } from 'ngx-spinner';
import { DatosServidor } from 'src/app/models/DatosServidor';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-modo-trabajo',
    templateUrl: './modo-trabajo.component.html',
    styleUrls: ['./modo-trabajo.component.scss'],
    standalone: false
})
export class ModoTrabajoComponent implements OnInit {
  modo: FormControl;
  esDark:boolean;
  servidorEncontrado = "";
  urlServEncontrado:string;

  constructor(
      private parametrosService:ParametrosService,
      private Notificaciones:NotificacionesService,
      private spinner: NgxSpinnerService,
    ) {
    this.modo =  new FormControl('local');
    this.esDark = this.parametrosService.EsDark();
  }

  get modoControl() {return this.modo.value;}

  ngOnInit(){
    const datosServidor = this.parametrosService.GetDatosServidor();
    this.modo.setValue(datosServidor.modo);
  }

  async CambiarModo(){
    const datosServidor:DatosServidor = new DatosServidor();
    datosServidor.modo = this.modoControl;

    if(this.modoControl == "red"){
      datosServidor.apiUrl = await this.BuscarServidor();
      this.spinner.hide("buscandoSpinner")
    }

    if(this.modoControl == "local" || datosServidor.apiUrl == ""){
      datosServidor.apiUrl = environment.apiUrl
      datosServidor.modo = "local";
    }

    //Guardamos los datos en local storage
    localStorage.setItem('datosServidor', JSON.stringify(datosServidor));
    this.Notificaciones.info("Se reiniciará la app");

    setTimeout(async () => {
        window.location.reload();
    }, 3000);
  }

  async BuscarServidor(): Promise<string> {
    this.spinner.show("buscandoSpinner");

    const respuesta = await invoke<string | null>('discover_server');
    if (respuesta) {
      const partes = respuesta.split('|');
      const ip = partes[1];
      const puerto = partes[2];

      this.servidorEncontrado = "true";
      this.urlServEncontrado = `Servidor encontrado: http://${ip}:${puerto}`;
      
      return `http://${ip}:${puerto}/easysales/`;
    }       
    
    this.servidorEncontrado = "false";
    return "";
  }
}
