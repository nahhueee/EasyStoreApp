import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Caja } from 'src/app/models/Caja';
import { Usuario } from 'src/app/models/Usuario';
import { CajasService } from 'src/app/services/cajas.service';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { environment } from 'src/environments/environment';
import { invoke } from '@tauri-apps/api/tauri';
import { AuthService } from 'src/app/services/auth.service';


@Component({
    selector: 'app-addmod-cajas',
    templateUrl: './addmod-cajas.component.html',
    styleUrls: ['./addmod-cajas.component.scss'],
    standalone: false
})
export class AddmodCajasComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    modificando:boolean;
    titulo='';
    decimal_mask: any;

    formulario: FormGroup;
    caja:Caja = new Caja();
    responsables: Usuario[];
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<AddmodCajasComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales:GlobalesService, //Servicio con metodos globales para la aplicacion
    private router:Router,
    private cajasSevice:CajasService,
    private usuariosService:UsuariosService,
    private authService:AuthService
    ) {
    this.formulario = new FormGroup({
      fecha: new FormControl('', [Validators.required]),
      idResponsable: new FormControl('', [Validators.required]),
      inicial: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.modificando = this.data.caja!=null ? true : false; //Si recibo una caja está modificando
    this.titulo= this.modificando == true ? 'Modificar Caja' : 'Agregar Nueva Caja';

    this.ObtenerResponsables();
    this.SetearFechaHora();

    if(this.modificando){
      this.caja = this.data.caja;
      
      this.formulario.get('fecha')?.setValue(this.caja.fecha);
      this.formulario.get('idResponsable')?.setValue(this.caja.responsable?.id);
      this.formulario.get('inicial')?.setValue(this.caja.inicial?.toString());
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      //Configuracion para la mascara decimal Imask
      this.decimal_mask = {
        mask: Number,
        scale: 2,
        thousandsSeparator: '.',
        radix: ',',
        normalizeZeros: true,
        padFractionalZeros: true,
        lazy: false,
        signed: true
      }
    },0);
  }

  SetearFechaHora(){ //Setea la fecha actual al input de fecha
    const fechaActual = new Date();

    // Obtener horas y minutos 
    const horas = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();
    
    this.caja.hora = `${horas}:${minutos}`;
    this.formulario.get('fecha')?.setValue(fechaActual);
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  Guardar(){
    if (this.formulario.invalid) return;

    this.caja.fecha =  this.formulario.get('fecha')?.value;

    if(this.formulario.get('inicial')?.value != ''){
      this.caja.inicial = this.Globales.EstandarizarDecimal(this.formulario.get('inicial')?.value);
    }else{
      this.caja.inicial = 0;
    }
    
    const responsable = new Usuario();
    responsable.id = this.formulario.get('idResponsable')?.value;
    this.caja.responsable = responsable;

    if(this.modificando){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }

  Agregar(){
    this.caja.entradas = 0;
    this.caja.salidas = 0;
    this.caja.ventas = 0;

    this.cajasSevice.Agregar(this.caja)
      .subscribe(async response => {
        if(response!=0){
          this.Notificaciones.success("Caja creada correctamente");
          this.dialogRef.close(true);

          
          //Abrimos el detalle de la caja
          //Para Tauri y web manejamos diferentes redireccionamientos
          if(environment.tauri){
            await this.openDetalleWindow(`index.html#/cajas/detalle/${response}`);
          }else{
            this.router.navigate([`/cajas/detalle/${response}`]);
          }

        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  async openDetalleWindow(url:string) {
    try {
      await invoke('open_detail', {url});
    } catch (error) {
      console.error('Error al abrir Ventana de detalles de caja:', error);
    }
  }

  Modificar(){
    this.cajasSevice.Modificar(this.caja)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Caja modificada correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  //#region SELECTORES
  ObtenerResponsables(){
    this.usuariosService.SelectorUsuarios()
      .subscribe(response => {
      if (Array.isArray(response)) {
        this.responsables = response;
      }         
      this.formulario.get('idResponsable')?.setValue(parseInt(this.authService.GetUsuarioId()!));
      });
  }
  //#endregion
}
