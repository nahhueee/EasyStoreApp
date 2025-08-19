import { Component, OnInit } from '@angular/core';
import { ParametrosService } from '../../../services/parametros.service';
import { FormControl, Validators } from '@angular/forms';
import { GlobalesService } from 'src/app/services/globales.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-identidad',
    templateUrl: './identidad.component.html',
    styleUrls: ['./identidad.component.scss'],
    standalone: false
})
export class IdentidadComponent implements OnInit {
  DNIcontrol: FormControl;

  verificando = true;
  solicitarDNI:boolean;
  DNIInvalido:boolean;
  habilitado:boolean;
  pcIncorrecta:boolean;
  pcInhabilitada:boolean;

  cliente:string;
  
  constructor(
    private parametrosService:ParametrosService,
    private globalesService:GlobalesService,
  ){
    this.DNIcontrol = new FormControl('', [Validators.required]);
  }

  async ngOnInit(){
    const DNI = await firstValueFrom(this.parametrosService.ObtenerParametro('dni'));
    if(DNI){
      this.ValidarDNI(DNI, false);
    }else{
      this.solicitarDNI = true;
      this.verificando = false;
    }
  }

  Enviar(){
    if(!this.DNIcontrol.valid) return;
    this.ValidarDNI(this.DNIcontrol.value, true);
  }

  //Verificamos DNI
  //Si existe en la tabla de clientes, verificamos los permisos para esta app
  //Si no existe, solicitamos un nuevo DNI
  ValidarDNI(DNI:number, nuevoDNI:boolean){
    this.verificando = true;
    this.globalesService.ValidarDNI(DNI)
    .subscribe(async existe=> {
      this.verificando = false;

      if(!existe){
        this.DNIInvalido = true;
        this.solicitarDNI = true;
      }else{

        if(nuevoDNI)
          this.parametrosService.ActualizarParametro('dni', DNI.toString())

        this.solicitarDNI = false;
        this.DNIInvalido = false;
        this.ObtenerHabilitacion(DNI);
      }
    });
  }


  //Habilitaciones:
  //Verificamos que el cliente tenga una relacion entre su id y el id de la app

  //Si no ocurre ningun error al consultar permisos
  //verificamos nro de terminal, y nro de mac: Si la terminal es 0 y no tiene mac, esta ingresando desde otra pc que no fue identificada
  //si el permiso no esta habilitado, damos aviso
  //si la terminal es distinta de 0 y tiene el permiso habilitado, dejamos continuar

  //Si ocurre algun error al ejecutar la consulta, damos aviso y mostramos pantala DNI

  ObtenerHabilitacion(DNI:number){
    this.verificando = true;

    this.globalesService.ObtenerPermiso(DNI)
    .subscribe(async permiso=> {
      this.verificando = false;
     
      if(permiso){
        this.cliente = permiso.nombre;

        if(permiso.terminal==0 && permiso.mac=="")
          this.pcIncorrecta = true;

        if(permiso?.habilitado==0)
          this.pcInhabilitada = true;

        if(permiso?.terminal!=0 && permiso?.habilitado==1){
          this.habilitado = true;

          // Guardar localmente la fecha y el permiso
          const hoy = new Date().toISOString().slice(0, 10); 

          const nuevosDatos = {
            fechaVerificacion: hoy,
            habilitado: true
          };

          localStorage.setItem('datosComputador', JSON.stringify(nuevosDatos));
        }
      }else{
        this.solicitarDNI = true;
        this.verificando = false;
      }
    });
  }
}
