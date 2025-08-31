import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cliente } from 'src/app/models/Cliente';
import { ClientesService } from 'src/app/services/clientes.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-addmod-clientes',
    templateUrl: './addmod-clientes.component.html',
    styleUrls: ['./addmod-clientes.component.scss'],
    standalone: false
})
export class AddmodClientesComponent implements OnInit {
  //#region VARIABLES
    modificando:boolean;
    titulo='';

    formulario: FormGroup;
    cliente:Cliente = new Cliente();
    private emailPattern: any = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<AddmodClientesComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private clientesService:ClientesService
    ) {
    this.formulario = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      email: new FormControl('',[Validators.pattern(this.emailPattern)]),
      telefono: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.modificando = this.data.cliente!=null ? true : false; //Si recibo un cliente está modificando
    this.titulo= this.modificando == true ? 'Modificar Cliente' : 'Agregar Nuevo Cliente';

    if(this.modificando){
      this.formulario.get('nombre')?.setValue(this.data.cliente.nombre);
      this.formulario.get('email')?.setValue(this.data.cliente.email);
      this.formulario.get('telefono')?.setValue(this.data.cliente.telefono);
    }
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  Guardar(){
    if(!this.formulario.valid) return;
    this.cliente.nombre =  this.formulario.get('nombre')?.value;
    this.cliente.email =  this.formulario.get('email')?.value;
    this.cliente.telefono =  this.formulario.get('telefono')?.value;

    if(this.modificando){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }

  Agregar(){
    this.clientesService.Agregar(this.cliente)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Cliente creado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(){
    this.cliente.id = this.data.cliente.id;
    this.clientesService.Modificar(this.cliente)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Cliente modificado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

}
