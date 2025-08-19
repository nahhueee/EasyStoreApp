import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, Inject, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Etiqueta } from 'src/app/models/Etiqueta';
import { ProductoImprimir } from 'src/app/models/ProductoImprimir';
import { EtiquetasService } from 'src/app/services/etiquetas.service';
import { ImpresionEtiquetaService } from 'src/app/services/impresion-etiqueta.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-impimir-etiquetas',
    templateUrl: './impimir-etiquetas.component.html',
    styleUrls: ['./impimir-etiquetas.component.scss'],
    standalone: false
})
export class ImpimirEtiquetasComponent implements OnInit, AfterViewInit {
  //#region VARIABLES

    //Variables para editar la cantidad de etiquetas
    nuevaCantidadVarios = new FormControl('', [Validators.required])
    editarCelda:number | undefined;
    newCantidad = new FormControl('')
    @ViewChild('inputEditable') inputEditable: ElementRef<HTMLInputElement>;
  
    @ViewChild(MatStepper) stepper!: MatStepper;
    etiquetaSeleccionada:Etiqueta;

    etiquetas:Etiqueta[]=[];
    productos: ProductoImprimir[] =[];
    productosColumns: string[] = ['select', 'cantidad', 'nombre', 'precio', 'borrar']; //Columnas a mostrar
    dataSourceProductos = new MatTableDataSource<ProductoImprimir>(this.productos); //Data source de la tabla
    seleccionados = new SelectionModel<ProductoImprimir>(true, []); //Data source de seleccionados
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ImpimirEtiquetasComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private router:Router,
    private etiquetasService:EtiquetasService,
    private impresionEtiquetaService:ImpresionEtiquetaService
  ){}

  ngOnInit(){
    this.etiquetasService.ObtenerEtiquetas("")
      .subscribe(response => {
        this.etiquetas = response;
      });
  }

  ngAfterViewInit(){
    setTimeout(() => {
      this.productos = this.data.productosImprimir;
      this.dataSourceProductos = new MatTableDataSource<ProductoImprimir>(this.productos);
    });
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  SeleccionarPlantilla(indice:number){
    this.stepper.next();

    this.etiquetas.forEach(element => {
      element.seleccionada = false;
    });
    this.etiquetas[indice].seleccionada = true;
    this.etiquetaSeleccionada = new Etiqueta(this.etiquetas[indice]);
  }

  //#region VERIFICAR SI LOS REGISTROS ESTAN SELECCIONADOS
    //Selecciona todas las filas si no están todas seleccionadas; en caso contrario, borra la selección.
    toggleAllRows() {
      if (this.isAllSelected()) {
        this.seleccionados.clear();
        return;
      }

      this.seleccionados.select(...this.dataSourceProductos.data);
    }
    // Verifica si el numero de filas es igual al numero de filas seleccionadas
    isAllSelected() {
      const numSelected = this.seleccionados.selected.length;
      const numRows = this.dataSourceProductos.data.length;
      return numSelected === numRows;
    }
  //#endregion

  BorrarFila(index:number){
    this.productos.splice(index, 1);
    this.dataSourceProductos = new MatTableDataSource(this.productos);
  }

  Editar(index:number){
    if(this.newCantidad.value!=""){
      const nuevaCantidad = parseInt(this.newCantidad.value!,10)
      this.productos[index].cantidad = nuevaCantidad;
    }

    this.editarCelda = undefined;
  }

  HabEdicion(index:number,cantidad:number){
    this.editarCelda = index;
    this.newCantidad.setValue(cantidad.toString());
    setTimeout(() => {
      this.inputEditable.nativeElement.focus(); // Enfocar el input
      this.inputEditable.nativeElement.select(); // Enfocar el input
    })
  }

  ConfirmarNvaCantVarios(){
    if(this.nuevaCantidadVarios.invalid) return;

    this.seleccionados.selected.forEach(element => {
      const index = this.productos.findIndex(prod => prod.codigo == element.codigo);
      this.productos[index].cantidad = parseInt(this.nuevaCantidadVarios.value!);
    });

    this.nuevaCantidadVarios.setValue("");
    this.nuevaCantidadVarios.markAsUntouched();
    this.nuevaCantidadVarios.updateValueAndValidity();
    this.dataSourceProductos = new MatTableDataSource(this.productos);
  }

  GenerarImpresion(){
    if(!this.etiquetaSeleccionada){
      this.Notificaciones.warning("Es importante seleccionar una plantilla");
      return;
    }

    this.impresionEtiquetaService.GenerarEtiquetas(this.etiquetaSeleccionada, this.productos);
  }

  NuevaEtiqueta(){
    this.router.navigateByUrl(`/administrar-etiqueta/0`);
    this.dialogRef.close();
  }
}
