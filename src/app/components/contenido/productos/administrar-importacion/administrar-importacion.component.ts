import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { Producto } from 'src/app/models/Producto';
import { FilesService } from 'src/app/services/files.service';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ResultadosImportacionComponent } from '../resultados-importacion/resultados-importacion.component';

interface FilaExcel {
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precio: number;
  costo: number;
}

interface ResultadoImportacion {
  errores: { fila: number; mensaje: string }[];
  datosValidos: FilaExcel[]
}

@Component({
    selector: 'app-administrar-importacion',
    templateUrl: './administrar-importacion.component.html',
    styleUrls: ['./administrar-importacion.component.scss'],
    standalone: false
})
export class AdministrarImportacionComponent implements OnInit, AfterViewInit {
  resultados: ResultadoImportacion = {
    errores: [],
    datosValidos: []
  };

  unidades = [
    {codigo: 'UNI', descripcion: 'UNIDADES'},
    {codigo: 'KG', descripcion: 'KILOGRAMOS'},      
    {codigo: 'LIT', descripcion: 'LITROS'},      
  ];
  redondeos = [
    {codigo: 0, descripcion: 'No Redondear'},
    {codigo: 5, descripcion: 'Al 5 cercano'},      
    {codigo: 10, descripcion: 'Al 10 cercano'},      
  ];

  decimal_mask: any;
  real = 0;
  redondeo = 0;

  productos: Producto[] =[];
  productosColumns: string[] = ['codigo', 'nombre', 'cantidad', 'unidad', 'costo', 'precio', 'borrar']; //Columnas a mostrar
  dataSourceProductos = new MatTableDataSource<Producto>(this.productos); //Data source de la tabla

  erroresColumns: string[] = ['fila', 'mensaje']; //Columnas a mostrar
  dataSourceErrores = new MatTableDataSource<{ fila: number; mensaje: string }>(); //Data source de la tabla

  tipoPrecio = "$";
  seleccionoProducto: boolean;
  indexSeleccionado: number;
  formulario:FormGroup;

  accionActualizar = "ACTUALIZAR";

  dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  constructor(
    private dialog: MatDialog, //Ventana emergente
    private rutaActiva:ActivatedRoute,
    private router:Router, //Servicio para navegar en la aplicacion
    private filesService:FilesService,
    private productosService:ProductosService,
    private Globales:GlobalesService,
    private Notificaciones:NotificacionesService
  ){
    this.formulario = new FormGroup({
      codigo: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      nombre: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      cantidad: new FormControl(''),
      unidad: new FormControl('UNI'),

      //Controles para cuando el precio es fijo
      costoF: new FormControl(''),
      precioF: new FormControl(''),

      //Controles para cuando el precio es porcentaje
      costoP: new FormControl(''),
      precioP: new FormControl(''),
      redondeo: new FormControl(0),
      porcentaje: new FormControl(''),
    });
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  ngOnInit(){
    this.rutaActiva.paramMap.subscribe(params => {
      this.tipoPrecio = params.get('tipo')!;
    });
    this.resultados = this.filesService.getDatosExcel();
    if(this.resultados){

      //Armamos la tabla de productos
      this.resultados.datosValidos.forEach(dato => {
        const producto:Producto = new Producto(dato);
        producto.codigo = dato.codigo.toString();
        producto.nombre = dato.nombre.toUpperCase();
        producto.unidad = dato.unidad.toUpperCase();
        producto.tipoPrecio = this.tipoPrecio;
        producto.faltante = 0;

        if(this.tipoPrecio=="%"){
          producto.precio = this.CalcularPrecioPorcentaje(producto.costo!, producto.porcentaje!, producto.redondeo!)
        }

        this.productos.push(producto);
      });

      //Armamos la tabla de errores
      this.dataSourceErrores = new MatTableDataSource<{ fila: number; mensaje: string }>(this.resultados.errores);
      //Actualizamos la tabla de productos
      this.dataSourceProductos = new MatTableDataSource<Producto>(this.productos); 

    }else{
      this.Cerrar();
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

  Cerrar(){
    this.router.navigate([`navegacion/inventario/`]);
  }

  Guardar(){
    this.dialogConfig.width = "400px";
    this.dialogConfig.data = {mensaje:`Se van a guardar ${this.productos.length} productos, ¿Deseas continuar?`};


    this.dialog.open(ConfirmacionComponent, this.dialogConfig)
                .afterClosed()
                .subscribe((confirma:boolean) => {
                  if (confirma){
                    this.productosService.GuardarDesdeExcel(this.productos, this.accionActualizar)
                    .subscribe(response => {
                      if(response){
                        this.dialogConfig.data = {
                            insertados: response.insertados, 
                            actualizados:response.actualizados,
                            errores:response.errores
                          };
                         
                        this.dialogConfig.width = "800px";
                        this.dialog.open(ResultadosImportacionComponent, this.dialogConfig)
                      }else{
                        this.Notificaciones.warning(response);
                      }
                    });
                  }
                });
  }

  EditarFila(index:number){
    this.seleccionoProducto = true;
    this.indexSeleccionado = index;

    //Desmarcamos todas los productos, y marcamos el seleccionado
    this.productos.forEach(venta => venta.activo = false);
    this.productos[index].activo = true;

    this.formulario.get('codigo')?.setValue(this.productos[index].codigo);
    this.formulario.get('nombre')?.setValue(this.productos[index].nombre);
    this.formulario.get('cantidad')?.setValue(this.productos[index].cantidad?.toString().replace('.', ','));
    this.formulario.get('unidad')?.setValue(this.productos[index].unidad);

    if(this.tipoPrecio=="$"){
      this.formulario.get('costoF')?.setValue(this.productos[index].costo?.toString().replace('.', ','));
      this.formulario.get('precioF')?.setValue(this.productos[index].precio?.toString().replace('.', ','));
    }
    if(this.tipoPrecio=="%"){
      this.formulario.get('costoP')?.setValue(this.productos[index].costo?.toString().replace('.', ','));
      this.formulario.get('redondeo')?.setValue(this.productos[index].redondeo);
      this.formulario.get('porcentaje')?.setValue(this.productos[index].porcentaje?.toString().replace('.', ','));
      
      this.CalcularPrecioPorcentajeInput();
    }  
  }

  CalcularPrecioPorcentajeInput(){
    const resultado = this.CalcularPrecioPorcentaje(
        this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value), 
        this.formulario.get('porcentaje')?.value,
        this.formulario.get('redondeo')?.value
    );

    this.formulario.get('precioP')?.setValue(resultado.toString().replace('.', ','));
  }

  GuardarFila(){

    this.markFormTouched(this.formulario);
    if(!this.formulario.valid){
      return;
    } 

    this.productos[this.indexSeleccionado].codigo = this.formulario.get('codigo')?.value;
    this.productos[this.indexSeleccionado].nombre = this.formulario.get('nombre')?.value;
    this.productos[this.indexSeleccionado].cantidad = this.formulario.get('cantidad')?.value;
    this.productos[this.indexSeleccionado].unidad = this.formulario.get('unidad')?.value;

    if (this.tipoPrecio === "$") {
      this.productos[this.indexSeleccionado].costo = this.Globales.EstandarizarDecimal(this.formulario.get('costoF')?.value);
      this.productos[this.indexSeleccionado].precio = this.Globales.EstandarizarDecimal(this.formulario.get('precioF')?.value);
    }

    if (this.tipoPrecio === "%") {
      this.productos[this.indexSeleccionado].costo = this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value);
      this.productos[this.indexSeleccionado].porcentaje = this.Globales.EstandarizarDecimal(this.formulario.get('porcentaje')?.value);
      this.productos[this.indexSeleccionado].redondeo = this.formulario.get('redondeo')?.value;
      this.productos[this.indexSeleccionado].precio =  this.Globales.EstandarizarDecimal(this.formulario.get('precioP')?.value);
    }

    this.seleccionoProducto = false;
    this.Notificaciones.success("Fila Actualizada.")
  }

  BorrarFila(index:number){
    this.productos.splice(index, 1);
    this.dataSourceProductos = new MatTableDataSource(this.productos);
  }

  CalcularPrecioPorcentaje(costo:number, porcentaje:number, redondeo:number){
    const precio: number = costo + ((costo * porcentaje) / 100);
    this.real = precio;

    let resultado:number;
    switch (redondeo) {
      case 5:
        resultado = Math.round(precio / 5) * 5;
        this.redondeo = resultado - precio;
        break;
      case 10:
        resultado = Math.round(precio / 10) * 10;
        this.redondeo = resultado - precio;
        break;
      default:
        resultado = precio;
        this.redondeo = 0;
        break;
    }

    return resultado;
  }

  getClaseRedondeo(): string {
    return this.redondeo < 0 ? 'texto-rojo' : 'texto-verde';
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
