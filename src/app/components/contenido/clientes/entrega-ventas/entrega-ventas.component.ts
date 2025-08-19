import { Component, Inject, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientesService } from 'src/app/services/clientes.service';
import { CuentasCorrientesService } from 'src/app/services/cuentas-corrientes.service';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { VentasService } from 'src/app/services/ventas.service';

@Component({
    selector: 'app-entrega-ventas',
    templateUrl: './entrega-ventas.component.html',
    styleUrls: ['./entrega-ventas.component.scss'],
    standalone: false
})
export class EntregaVentasComponent implements AfterViewInit {
  //#region VARIABLES
    formulario: FormGroup;
    decimal_mask: any;
  //#endregion

constructor(
  @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
  public dialogRef: MatDialogRef<EntregaVentasComponent>, //Ventana emergente actual
  private Notificaciones:NotificacionesService, //Servicio de notificaciones
  private Globales:GlobalesService,
  private ventasService:VentasService,
  private cuentasService:CuentasCorrientesService
  ) {
  this.formulario = new FormGroup({
    entrega: new FormControl('', [Validators.required]),
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

SelectContent(event: FocusEvent) {
  const input = event.target as HTMLInputElement;
  input.select();
}

Guardar(){
  if (this.formulario.invalid) return;

  const monto = this.Globales.EstandarizarDecimal(this.formulario.get('entrega')?.value);
  if(monto > this.data.deuda){ //Verificamos que entregue el total o el menor de la deuda
    this.Notificaciones.warning("La entrega no puede ser superior al valor de la deuda");
    return;
  }
  
  this.cuentasService.Entrega(monto, this.data.idCliente)
    .subscribe(response => {
      if(response=='OK'){
        this.Notificaciones.success("Entrega registrada correctamente");
        this.dialogRef.close(true);
      }else{
        this.Notificaciones.warning(response);
      }
    });
  }
}
