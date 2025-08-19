import { Component, Inject, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Movimiento } from 'src/app/models/Movimiento';
import { TipoMovimiento } from 'src/app/models/TipoMovimiento';
import { GlobalesService } from 'src/app/services/globales.service';
import { MovimientosService } from 'src/app/services/movimientos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-add-movimientos',
    templateUrl: './add-movimientos.component.html',
    styleUrls: ['./add-movimientos.component.scss'],
    standalone: false
})
export class AddMovimientosComponent implements AfterViewInit {
  //#region VARIABLES
    formulario: FormGroup;
    movimiento:Movimiento = new Movimiento();

    decimal_mask: any;
  
    tiposMovimiento: TipoMovimiento[] =[
      {id: 1, descripcion: "ENTRADA"},
      {id: 2, descripcion: "SALIDA"}
    ];
  //#endregion

  constructor(
  @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
  public dialogRef: MatDialogRef<AddMovimientosComponent>, //Ventana emergente actual
  private Notificaciones:NotificacionesService, //Servicio de notificaciones
  private Globales:GlobalesService, //Servicio con metodos globales para la aplicacion
  private movimientosService:MovimientosService
  ) {
    this.formulario = new FormGroup({
      tipoMovimiento: new FormControl('ENTRADA', [Validators.required]),
      descripcion: new FormControl(''),
      monto: new FormControl('', [Validators.required]),
    });
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

  Agregar(){
  if(!this.formulario.valid) return;

  this.movimiento.idCaja = this.data.idCaja;
  this.movimiento.tipoMovimiento =  this.formulario.get('tipoMovimiento')?.value;
  this.movimiento.descripcion =  this.formulario.get('descripcion')?.value;
  this.movimiento.monto =  this.Globales.EstandarizarDecimal(this.formulario.get('monto')?.value);

  this.movimientosService.Agregar(this.movimiento)
    .subscribe(response => {
      if(response=='OK'){
        this.Notificaciones.success("Movimiento agregado correctamente");
        this.dialogRef.close(true);
      }else{
        this.Notificaciones.warning(response);
      }
    });
  }
}
