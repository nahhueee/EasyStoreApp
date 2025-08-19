import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Producto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from '../../../../services/productos.service';
import { GlobalesService } from 'src/app/services/globales.service';

@Component({
    selector: 'app-agregar-producto',
    templateUrl: './agregar-producto.component.html',
    styleUrls: ['./agregar-producto.component.scss'],
    standalone: false
})
export class AgregarProductoComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    formulario: FormGroup;
    decimal_mask: any;

    producto:Producto = new Producto();
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<AgregarProductoComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales:GlobalesService,
    private productosService:ProductosService,
    ) {
    this.formulario = new FormGroup({
      cantidad: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(){
    this.producto = this.data.producto;
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

  Guardar(){
    if (this.formulario.invalid) return;

    //Sumamos a la cantidad actual lo elegido por el usuario
    this.producto.cantidad =  this.producto.cantidad! + this.Globales.EstandarizarDecimal(this.formulario.get('cantidad')?.value);
    
    this.productosService.AniadirCantidad(this.producto)
    .subscribe(response => {
      if(response=='OK'){
        this.Notificaciones.success("Cantidad actualizada correctamente");
        this.dialogRef.close(true);
      }else{
        this.Notificaciones.warning(response);
      }
    });  
  }
}
