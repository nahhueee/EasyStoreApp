import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cargo } from 'src/app/models/Cargo';
import { Usuario } from 'src/app/models/Usuario';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { ValidadoresService } from 'src/app/services/validadores.service';

@Component({
    selector: 'app-addmod-usuarios',
    templateUrl: './addmod-usuarios.component.html',
    styleUrls: ['./addmod-usuarios.component.scss'],
    standalone: false
})
export class AddmodUsuariosComponent implements OnInit {
  //#region VARIABLES
    modificando:boolean;
    titulo='';

    hide = true;
    formulario: FormGroup;
    usuario:Usuario = new Usuario();
    cargos: Cargo[];

    esAdmin:boolean;

    private emailPattern: any = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<AddmodUsuariosComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private usuariosService:UsuariosService,
    private validadoresService:ValidadoresService
    ) {

    //Creamos el formulario  
    this.formulario = new FormGroup({
      usuario: new FormControl(
        '',
        [Validators.required], // validadores síncronos
        [this.validadoresService.usuarioValidator(this.data.usuario?.usuario)] // validadores asíncronos
      ),
      nombre: new FormControl('', [Validators.required]),
      idCargo: new FormControl('', [Validators.required]),
      email: new FormControl('',[Validators.pattern(this.emailPattern)]),
      pass: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.modificando = this.data.usuario!=null ? true : false; //Si recibo un usuario está modificando
    this.titulo= this.modificando == true ? 'Modificar Usuario' : 'Agregar Nuevo Usuario';

    //Llenamos la lista de cargos
    this.ObtenerCargos();
    if(this.modificando){
      this.formulario.get('idCargo')?.setValue(this.data.usuario.idCargo);
      this.formulario.get('usuario')?.setValue(this.data.usuario.usuario);
      this.formulario.get('nombre')?.setValue(this.data.usuario.nombre);
      this.formulario.get('email')?.setValue(this.data.usuario.email);
      this.formulario.get('pass')?.setValue(this.data.usuario.pass);
      this.validarPasswordAdmin();
    }
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  ObtenerCargos(){
    this.usuariosService.SelectorCargos()
      .subscribe(response => {
        this.cargos = response;
      });
  }

  validarPasswordAdmin(){
    if(this.formulario.get('idCargo')?.value == 1) {
      this.esAdmin = true;
    }else{
      this.esAdmin = false;
    }
      

    if (this.esAdmin) {
      this.formulario.get('pass')?.setValidators(Validators.required);
    } else {
      this.formulario.get('pass')?.clearValidators();
    }
    this.formulario.get('pass')?.updateValueAndValidity();
  }

  Guardar(){
    this.markFormTouched(this.formulario);
    if(!this.formulario.valid) return;

    this.usuario.usuario =  this.formulario.get('usuario')?.value;
    this.usuario.nombre =  this.formulario.get('nombre')?.value;
    this.usuario.email =  this.formulario.get('email')?.value;
    this.usuario.pass =  this.formulario.get('pass')?.value;

    if(this.usuario.email === null)
      this.usuario.email = "";

    const cargo = new Cargo();
    cargo.id = this.formulario.get('idCargo')?.value;
    this.usuario.cargo = cargo;

    if(this.modificando){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }
  Agregar(){
    this.usuariosService.Agregar(this.usuario)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Usuario creado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(){
    this.usuario.id = this.data.usuario.id;
    this.usuariosService.Modificar(this.usuario)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Usuario modificado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  markFormTouched(control: AbstractControl) {
  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach(c => this.markFormTouched(c));
  } else {
    control.markAsTouched();
    control.markAsDirty();
  }
}
}
