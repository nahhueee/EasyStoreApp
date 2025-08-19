import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { invoke } from '@tauri-apps/api';
import { DatosServidor } from 'src/app/models/DatosServidor';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
    selector: 'app-servidor',
    templateUrl: './servidor.component.html',
    styleUrls: ['./servidor.component.scss'],
    standalone: false
})
export class ServidorComponent implements OnInit {
  verificando = true;
  activarControl:FormControl;
  esDark:boolean;

  constructor(
      private parametrosService:ParametrosService,
      private globalesService:GlobalesService,
      private Notificaciones:NotificacionesService,
      private router:Router,
      private spinner: NgxSpinnerService,
  ){
      this.activarControl = new FormControl('');
      this.esDark = this.parametrosService.EsDark();
    }

  async ngOnInit(){
    await this.ObtenerAutorizacion();
    this.parametrosService.ObtenerEstadoServidor()
    .subscribe(async response => {
      this.activarControl.setValue(response);
    });

    this.verificando = false;
  }  

  //Verifica que el usuario tenga acceso a esta pantalla
  async ObtenerAutorizacion(){
    const datosComputador = this.parametrosService.GetDatosComputadorHabilitado();

    //Si no es un computador habilitado mostramos pantalla identidad
    if(!datosComputador || !datosComputador.habilitado){
      this.router.navigateByUrl('/navegacion/identidad');
    }
  }

  GuardarParametro(){
    const valor = this.activarControl.value.toString();
    this.parametrosService.ActualizarParametro('habilitaServidor', valor)
      .subscribe(async response => {

        if(response=="OK"){
          // await this.globalesService.ForzarInicioModoServidor();
          // this.Notificaciones.success("Modo servidor configurado correctamente.")
          try {
            this.spinner.show('resetSpinner');
            await invoke('change_config_reset', { valor: this.activarControl.value });

            setTimeout(async () => {
              this.spinner.hide('resetSpinner');
              this.Notificaciones.success("Servidor configurado correctamente.")
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error(error);
            this.spinner.hide('resetSpinner');
            this.Notificaciones.error("Ocurrio un error al intentar reiniciar el servidor");
          }
        }
    });
  }
}
