import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';

@Component({
    selector: 'app-respaldos',
    templateUrl: './respaldos.component.html',
    styleUrls: ['./respaldos.component.scss'],
    standalone: false
})
export class RespaldosComponent implements OnInit {
  dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  diasSeleccionados: string[] = [];
  formulario: FormGroup;

  verificando = true;

  constructor(
    private parametrosService:ParametrosService,
    private globalesService:GlobalesService,
    private Notificaciones:NotificacionesService,
    private router:Router,
  ){
    //Creamos el formulario  
    this.formulario = new FormGroup({
      activar: new FormControl(''),
      hora: new FormControl('', [Validators.required]),
    });
  }

  async ngOnInit(){
    await this.ObtenerAutorizacion();
    this.verificando = false;
    
    const activar = await firstValueFrom(this.parametrosService.ObtenerParametro('backups'));
    if(activar == 'true')
      this.formulario.get('activar')?.setValue(1);

    const hora = await firstValueFrom(this.parametrosService.ObtenerParametro('hora'));
    this.formulario.get('hora')?.setValue(hora);

    const dias =  await firstValueFrom(this.parametrosService.ObtenerParametro('dias'));
    if(dias!="")
      this.diasSeleccionados = dias.split(",").map(day => day.trim());
  }

  //Verifica que el usuario tenga acceso a esta pantalla
  async ObtenerAutorizacion(){
    const datosComputador = this.parametrosService.GetDatosComputadorHabilitado();

    //Si no es un computador habilitado mostramos pantalla identidad
    if(!datosComputador || !datosComputador.habilitado){
      this.router.navigateByUrl('/navegacion/identidad');
    }
  }

  // Maneja el cambio de selección
  changeSeleccion(dia: string) {
    const index = this.diasSeleccionados.indexOf(dia);

    if (index === -1) {
      if (this.diasSeleccionados.length < 3) {
        this.diasSeleccionados.push(dia);
      }
    } else {
      this.diasSeleccionados.splice(index, 1);
    }
  }

  // Comprueba si el límite de selección ha sido alcanzado
  LimiteMaximo(dia?: string): boolean {
    if (dia) {
      return this.diasSeleccionados.length >= 3 && this.diasSeleccionados.indexOf(dia) === -1;
    }
    return this.diasSeleccionados.length >= 3;
  }

  GuardarParametros(){
    const data:any = {
      activar:this.formulario.get("activar")?.value,
      dias:this.diasSeleccionados,
      hora:this.formulario.get("hora")?.value,
    }

    this.parametrosService.GuardarParametrosBackup(data)
      .subscribe(async response => {

        if(response=="OK"){
          await this.globalesService.ForzarInicioBackup();
          this.Notificaciones.success("Parametros de respaldo guardados correctamente.")
        }
    });
  }

  async GenerarUnBackup(){
    this.globalesService.GenerarBackup()
      .subscribe(async response => {
        if(response=="OK")
          this.Notificaciones.success("Backup guardado correctamente en C:\backups");
    });
  }
}
