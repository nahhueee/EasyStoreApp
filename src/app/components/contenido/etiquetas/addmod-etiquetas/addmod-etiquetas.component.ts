import { Component, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Etiqueta } from 'src/app/models/Etiqueta';
import { Producto } from 'src/app/models/Producto';
import { ProductoImprimir } from 'src/app/models/ProductoImprimir';
import { EtiquetasService } from 'src/app/services/etiquetas.service';
import { ImpresionEtiquetaService } from 'src/app/services/impresion-etiqueta.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-addmod-etiquetas',
    templateUrl: './addmod-etiquetas.component.html',
    styleUrls: ['./addmod-etiquetas.component.scss'],
    standalone: false
})
export class AddmodEtiquetasComponent implements AfterViewInit {
  etiqueta:Etiqueta = new Etiqueta();
  idEtiqueta:number;
  titulo:string;
  formParametros:FormGroup;

  tamanios:string[] = [
    "GRANDE",
    "MEDIANA",
    "PEQUEÑA"
  ]

  constructor(
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private etiquetasService:EtiquetasService,
    private impresionEtiquetaService:ImpresionEtiquetaService,
    private Notificaciones:NotificacionesService,
  ){
    this.formParametros = new FormGroup({
      descripcion: new FormControl('', [Validators.required]),
      tamanio: new FormControl('', [Validators.required]),
      titulo: new FormControl(''),

      //checks
      moferta: new FormControl(false),
      mcodigo: new FormControl(false),
      mprecio: new FormControl(false),
      mvencimiento: new FormControl(false),
      mnombre: new FormControl(false),

      //personalizacion
      bordeColor: new FormControl("#1b1b1b"),
      bordeAncho: new FormControl("1px"),
      tituloColor: new FormControl("#1b1b1b"),
      tituloAlineacion: new FormControl("center"),
      ofertaFondo: new FormControl("#e4ff4d"),
      ofertaAlineacion: new FormControl("center"),
      nombreAlineacion: new FormControl("center"),
      vencimientoAlineacion: new FormControl("center"),
      precioAlineacion: new FormControl("center"),
      precioColor: new FormControl("#1b1b1b"),
    });
  }

  //#region CONTROLES Y GETTERS
  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  get tamanioEtiqueta() { return this.formParametros.get('tamanio')?.value; }
  get tituloTarjeta() { return this.formParametros.get('titulo')?.value; }

  get mostrarCodigo() { return this.formParametros.get('mcodigo')?.value; }
  get mostrarOferta() { return this.formParametros.get('moferta')?.value; }
  get mostrarPrecio() { return this.formParametros.get('mprecio')?.value; }
  get mostrarNombre() { return this.formParametros.get('mnombre')?.value; }
  get mostrarVencimiento() { return this.formParametros.get('mvencimiento')?.value; }

  get bordeColor () { return this.formParametros.get('bordeColor')?.value; }
  get bordeAncho () { return this.formParametros.get('bordeAncho')?.value; }
  get tituloColor () { return this.formParametros.get('tituloColor')?.value; }
  get tituloAlineacion () { return this.formParametros.get('tituloAlineacion')?.value; }
  get ofertaFondo () { return this.formParametros.get('ofertaFondo')?.value; }
  get ofertaAlineacion () { return this.formParametros.get('ofertaAlineacion')?.value; }
  get nombreAlineacion () { return this.formParametros.get('nombreAlineacion')?.value; }
  get precioAlineacion () { return this.formParametros.get('precioAlineacion')?.value; }
  get precioColor () { return this.formParametros.get('precioColor')?.value; }
  get vencimientoAlineacion () { return this.formParametros.get('vencimientoAlineacion')?.value; }
  //#endregion

  ngAfterViewInit(){
    setTimeout(() => {
      //Obtenemos el id de la caja desde la url
      this.idEtiqueta = this.rutaActiva.snapshot.params['idEtiqueta'];
      if(this.idEtiqueta != 0){
        this.ObtenerEtiqueta();
        this.titulo = "Modificar Etiqueta";
      }else{
        this.titulo = "Crear Nueva Etiqueta"
      }
    });
  }

  ObtenerEtiqueta(){
    this.etiquetasService.ObtenerEtiqueta(this.idEtiqueta)
    .subscribe(response => {
      this.etiqueta = new Etiqueta(response);
      this.formParametros.get('descripcion')?.setValue(this.etiqueta.descripcion);
      this.formParametros.get('tamanio')?.setValue(this.etiqueta.tamanio);
      this.formParametros.get('titulo')?.setValue(this.etiqueta.titulo);
      this.formParametros.get('mcodigo')?.setValue(this.etiqueta.mCodigo);
      this.formParametros.get('moferta')?.setValue(this.etiqueta.mOferta);
      this.formParametros.get('mprecio')?.setValue(this.etiqueta.mPrecio);
      this.formParametros.get('mnombre')?.setValue(this.etiqueta.mNombre);
      this.formParametros.get('mvencimiento')?.setValue(this.etiqueta.mVencimiento);
      this.formParametros.get('bordeColor')?.setValue(this.etiqueta.bordeColor);
      this.formParametros.get('bordeAncho')?.setValue(this.etiqueta.bordeAncho);
      this.formParametros.get('tituloColor')?.setValue(this.etiqueta.tituloColor);
      this.formParametros.get('tituloAlineacion')?.setValue(this.etiqueta.tituloAlineacion);
      this.formParametros.get('ofertaFondo')?.setValue(this.etiqueta.ofertaFondo);
      this.formParametros.get('ofertaAlineacion')?.setValue(this.etiqueta.ofertaAlineacion);
      this.formParametros.get('nombreAlineacion')?.setValue(this.etiqueta.nombreAlineacion);
      this.formParametros.get('vencimientoAlineacion')?.setValue(this.etiqueta.vencimientoAlineacion);
      this.formParametros.get('precioAlineacion')?.setValue(this.etiqueta.precioAlineacion);
      this.formParametros.get('precioColor')?.setValue(this.etiqueta.precioColor);
    });
  }

  Guardar(){
    if(!this.formParametros.valid) return;

    this.CompletarObjeto();
    
    if(this.idEtiqueta != 0){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }

  Agregar(){
    this.etiquetasService.Agregar(this.etiqueta)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Etiqueta creada correctamente");
          this.router.navigate([`navegacion/etiquetas/`]);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(){
    this.etiqueta.id = this.idEtiqueta;
    this.etiquetasService.Modificar(this.etiqueta)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Etiqueta modificada correctamente");
          this.router.navigate([`navegacion/etiquetas/`]);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Cerrar(){
    this.router.navigate([`navegacion/etiquetas/`]);
  }

  VerResultado(){
    if(!this.formParametros.valid) return;

    const productos:ProductoImprimir[] = [];
    this.CompletarObjeto();

    //#region EJEMPLO
    const producto: ProductoImprimir = new ProductoImprimir();
    producto.nombre = "PRUEBA DE NOMBRE PRODUCTO";
    producto.precio = 25000;
    producto.codigo = "554445888";
    producto.cantidad = 1;
    producto.vencimiento = "25/05/25";
    productos.push(producto);

    const producto1: ProductoImprimir = new ProductoImprimir();
    producto1.nombre = "PRUEBA DE NOMBRE PRODUCTO 1";
    producto1.precio = 2600;
    producto1.codigo = "77898";
    producto1.cantidad = 1; 
    producto1.vencimiento = "25/05/25"; 
    productos.push(producto1);

    const producto2: ProductoImprimir = new ProductoImprimir();
    producto2.nombre = "PRUEBA DE NOMBRE PRODUCTO 2";
    producto2.precio = 1000;
    producto2.codigo = "778888";
    producto2.cantidad = 1; 
    producto2.vencimiento = "25/05/25"; 
    productos.push(producto2);
    //#endregion
    
    this.impresionEtiquetaService.GenerarEtiquetas(this.etiqueta, productos);
  }

  CompletarObjeto(){
    this.etiqueta.descripcion = this.formParametros.get("descripcion")?.value;
    this.etiqueta.tamanio = this.tamanioEtiqueta;
    this.etiqueta.titulo = this.tituloTarjeta;
    this.etiqueta.mCodigo = this.mostrarCodigo;
    this.etiqueta.mOferta = this.mostrarOferta;
    this.etiqueta.mPrecio = this.mostrarPrecio;
    this.etiqueta.mNombre = this.mostrarNombre;
    this.etiqueta.mVencimiento = this.mostrarVencimiento;
    this.etiqueta.bordeColor = this.bordeColor;
    this.etiqueta.bordeAncho = this.bordeAncho;
    this.etiqueta.tituloColor = this.tituloColor;
    this.etiqueta.tituloAlineacion = this.tituloAlineacion;
    this.etiqueta.ofertaFondo = this.ofertaFondo;
    this.etiqueta.ofertaAlineacion = this.ofertaAlineacion;
    this.etiqueta.vencimientoAlineacion = this.vencimientoAlineacion;
    this.etiqueta.nombreAlineacion = this.nombreAlineacion;
    this.etiqueta.precioAlineacion = this.precioAlineacion;
    this.etiqueta.precioColor = this.precioColor;
  }
}
