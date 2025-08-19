import { Component, Inject, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { Producto } from 'src/app/models/Producto';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
    selector: 'app-cambio-precio',
    templateUrl: './cambio-precio.component.html',
    styleUrls: ['./cambio-precio.component.scss'],
    standalone: false
})
export class CambioPrecioComponent implements OnInit, AfterViewInit {
  
  //#region VARIABLES
    decimal_mask: any;
    formulario: FormGroup;
    tipoPrecio: string;
    totalProductos: number;

    real = 0;
    redondeo = 0;

    panelAbierto:number;

    redondeos = [
      {codigo: 0, descripcion: 'No Redondear'},
      {codigo: 5, descripcion: 'Al 5 cercano'},      
      {codigo: 10, descripcion: 'Al 10 cercano'},      
    ];

    productos: Producto[] =[];
    productosColumns: string[] = ['nombre', 'costo', 'precio', 'borrar']; //Columnas a mostrar
    dataSourceProductos = new MatTableDataSource<Producto>(this.productos); //Data source de la tabla
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<CambioPrecioComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales:GlobalesService, //Servicio con metodos globales para la aplicacion
    private productosService:ProductosService,
    ) {
      this.formulario = new FormGroup({
        //Controles para cuando el precio es fijo
        costoF: new FormControl(''),
        precioF: new FormControl(''),
  
        //Controles para cuando el precio es porcentaje
        costoP: new FormControl(''),
        precioP: new FormControl(''),
        redondeo: new FormControl(0),
        porcentaje: new FormControl(''),

        //Controles para la suma de porcentajes
        sumaCosto: new FormControl(''),
        sumaPrecio: new FormControl(''),
      });
    }
  

  ngOnInit(){
    this.totalProductos = this.data.registros.length;
    
    const primerSeleccionado: Producto = this.data.registros[0];
    this.tipoPrecio = primerSeleccionado?.tipoPrecio!;
    
    this.formulario.get('costoF')?.setValue(primerSeleccionado.costo?.toString());
    this.formulario.get('costoP')?.setValue(primerSeleccionado.costo?.toString());

    if(this.tipoPrecio=="$"){
      this.formulario.get('precioF')?.setValue(primerSeleccionado.precio?.toString());
    }

    if(this.tipoPrecio=="%"){
      this.formulario.get('redondeo')?.setValue(primerSeleccionado.redondeo);
      this.formulario.get('porcentaje')?.setValue(primerSeleccionado.porcentaje);
      this.CalcularPrecioPorcentajeInput();
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

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  MostrarResultados(){
    this.productos = [];
    
    switch(this.panelAbierto){
      case 1: //Actualizar Precios
        this.ActualizarPrecio(this.tipoPrecio)
        break;
      case 2: //Sumar Porcentaje
        this.SumarPorcentaje();
        break;
      case 3: //Cambiar Tipo Precio
        const nvoTipoPrecio = this.tipoPrecio == "$" ? "%" : "$";
        this.ActualizarPrecio(nvoTipoPrecio)
        break;
    }

    this.dataSourceProductos = new MatTableDataSource<Producto>(this.productos); 
  }

  BorrarFila(index:number){
    this.productos.splice(index, 1);
    this.dataSourceProductos = new MatTableDataSource(this.productos);
  }

  ActualizarPrecio(tipoPrecio:string){
    for (let i = 0; i < this.data.registros.length; i++) {
      const producto: Producto = new Producto(this.data.registros[i]);

      if(tipoPrecio == '$'){ //Precio Fijo
        this.productosColumns = ['nombre', 'costo', 'precio', 'borrar'];

        producto.costo = this.Globales.EstandarizarDecimal(this.formulario.get('costoF')?.value);
        producto.precio =  this.Globales.EstandarizarDecimal(this.formulario.get('precioF')?.value);
        producto.tipoPrecio =  "$";

      }else if(tipoPrecio == '%'){ //Precio Porcentaje
        this.productosColumns = ['nombre', 'costo', 'porcentaje', 'precio', 'borrar'];

        producto.costo =  this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value);
        producto.precio =  this.Globales.EstandarizarDecimal(this.formulario.get('precioP')?.value);
        producto.porcentaje =  this.formulario.get('porcentaje')?.value;
        producto.redondeo =  this.formulario.get('redondeo')?.value;
        producto.tipoPrecio =  "%";
      }

      this.productos.push(producto);
    }
  }

  SumarPorcentaje(){
    if(this.tipoPrecio == "$")
      this.productosColumns = ['nombre', 'costo', 'precio', 'borrar'];
    else
      this.productosColumns = ['nombre', 'costo', 'porcentaje', 'precio', 'borrar'];

    for (let i = 0; i < this.data.registros.length; i++) {
      const producto: Producto = new Producto(this.data.registros[i]);

      producto.costo! += ((producto.costo! * this.Globales.EstandarizarDecimal(this.formulario.get('sumaCosto')?.value)) / 100); 
      producto.precio! += ((producto.precio! * this.Globales.EstandarizarDecimal(this.formulario.get('sumaPrecio')?.value)) / 100); 

      switch (this.formulario.get('redondeo')?.value) {
        case 5:
          producto.costo = Math.round(producto.costo! / 5) * 5;
          producto.precio = Math.round(producto.precio! / 5) * 5;
          break;
        case 10:
          producto.costo = Math.round(producto.costo! / 10) * 10;
          producto.precio = Math.round(producto.precio! / 10) * 10;
          break;
      }

      if(this.tipoPrecio == "%"){
        producto.precio = this.CalcularPrecioPorcentaje(producto.costo!, producto.porcentaje!, producto.redondeo!)
      }

      this.productos.push(producto);
    }
  }

  Guardar() {
    let contador = 0;

    // Array de observables para actualizar cada producto
    const actualizaciones$ = this.productos.map(producto =>
      this.productosService.ActualizarPrecios(producto)
    );

    forkJoin(actualizaciones$).subscribe(responses => {
      // Contamos cuántas respuestas fueron 'OK'
      contador = responses.filter(response => response === 'OK').length;

      if (contador === this.productos.length) {
        this.Notificaciones.success("Los productos fueron actualizados correctamente");
      } else {
        this.Notificaciones.warning(`Solo ${contador} de ${this.productos.length} actualizaron su precio correctamente.`);
      }

      this.dialogRef.close(true);
    });
  }

  CalcularPrecioPorcentajeInput(){
    const resultado = this.CalcularPrecioPorcentaje(
        this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value), 
        this.formulario.get('porcentaje')?.value,
        this.formulario.get('redondeo')?.value
    );

    this.formulario.get('precioP')?.setValue(resultado.toString().replace('.', ','));
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
}
