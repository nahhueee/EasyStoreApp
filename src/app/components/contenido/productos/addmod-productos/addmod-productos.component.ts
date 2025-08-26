import { Component, ElementRef, Inject, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { Producto } from 'src/app/models/Producto';
import { Rubro } from 'src/app/models/Rubro';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-addmod-productos',
    templateUrl: './addmod-productos.component.html',
    styleUrls: ['./addmod-productos.component.scss'],
    standalone: false
})
export class AddmodProductosComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    modificando:boolean;
    titulo='';
    decimal_mask: any;

    real = 0;
    redondeo = 0;
    inputVtoValorReal = "";

    // Variables para la subida de archivo
    selectedFile: File;
    uploadProgress = 0;
    pathImgProd = "";
    
    formulario: FormGroup;
    producto:Producto = new Producto();
    
    rubros: Rubro[] = [];

    soloPrecio:boolean; //Identifica si el usuario va a cargar un producto que no registra cantidad
    
    tiposPrecio = [
      {codigo: '$', descripcion: 'Precio Fijo'},
      {codigo: '%', descripcion: 'Precio Porcentaje'}      
    ];
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

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente de rubros
    @ViewChild('codigoInput') codigoInput!: ElementRef<HTMLInputElement>;
    @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    private dialog: MatDialog, //Ventana emergente de rubros
    public dialogRef: MatDialogRef<AddmodProductosComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales:GlobalesService, //Servicio con metodos globales para la aplicacion
    private productosService:ProductosService,
    ) {
    this.formulario = new FormGroup({
      codigo: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      nombre: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      cantidad: new FormControl(''),
      unidad: new FormControl('UNI'),
      idRubro: new FormControl(''),
      tipoPrecio: new FormControl('$'),

      //Controles para cuando el precio es fijo
      costoF: new FormControl(''),
      precioF: new FormControl(''),

      //Controles para cuando el precio es porcentaje
      costoP: new FormControl(''),
      precioP: new FormControl(''),
      redondeo: new FormControl(0),
      porcentaje: new FormControl(''),

      vencimiento: new FormControl(''),
      faltante: new FormControl(''),
    });

  }

  //#region CONTROLS
    //Para obtener de manera facil el control tipo Pago
    get tipoPrecioControl(): string {
      return this.formulario.get('tipoPrecio')?.value;
    }

    onDateInput(event: any) {
      // event.target.value es la cadena del input (si el usuario borró la fecha será '')
      if(event?.target?.value)
        this.inputVtoValorReal = event?.target?.value.toString();
      else
        this.inputVtoValorReal = "";
    }

    SelectContent(event: FocusEvent) {
      const input = event.target as HTMLInputElement;
      input.select();
    }
  //#endregion

  ngOnInit(): void {
    this.modificando = this.data.producto!=null ? true : false; //Si recibo un producto está modificando
    this.titulo= this.modificando == true ? 'Modificar Producto' : 'Agregar Nuevo Producto';

    if(this.modificando){
      this.completarInputs();
    }
  }

  completarInputs(){
    this.formulario.get('codigo')?.setValue(this.data.producto.codigo);
    this.formulario.get('nombre')?.setValue(this.data.producto.nombre);
    this.formulario.get('cantidad')?.setValue(this.data.producto.cantidad);
    this.formulario.get('unidad')?.setValue(this.data.producto.unidad);
    this.formulario.get('tipoPrecio')?.setValue(this.data.producto.tipoPrecio);
    this.formulario.get('faltante')?.setValue(this.data.producto.faltante);
    this.soloPrecio = this.data.producto.soloPrecio;

    if(this.data.producto.vencimiento != null)
      this.formulario.get('vencimiento')?.setValue(this.Globales.ConvertirFecha(this.data.producto.vencimiento));

    if(this.data.producto.tipoPrecio=="$"){
      this.formulario.get('costoF')?.setValue(this.data.producto.costo.toString());
      this.formulario.get('precioF')?.setValue(this.data.producto.precio.toString());
    }
    if(this.data.producto.tipoPrecio=="%"){
      this.formulario.get('costoP')?.setValue(this.data.producto.costo?.toString());
      this.formulario.get('redondeo')?.setValue(this.data.producto.redondeo);
      this.formulario.get('porcentaje')?.setValue(this.data.producto.porcentaje.toString());
      this.CalcularPrecioPorcentaje();
    }

    if(this.data.producto.imagen)
      this.pathImgProd = environment.apiUrl + `imagenes/obtener/${this.data.producto.imagen!}`;
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

      this.codigoInput.nativeElement.focus();
      
      if(this.modificando)
        this.soloPrecio = this.data.producto.soloPrecio === 1 ? true : false;

    },500);

  }

  convertirFecha(fechaString: string): Date {
    const [day, month, year] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day); 
  }

  async Guardar(){

    //Verificamos la existencia del codigo si es que ingresó, para traer el producto a modificar si el usuario lo desea
    if (!this.modificando) {
      this.producto.codigo = this.formulario.get('codigo')?.value;
  
      if (this.producto.codigo != '') {
        const response = await firstValueFrom(this.productosService.ObtenerProducto(this.producto.codigo!));

        if (response) {
          const confirmacion = await this.abrirConfirmacion("Se encontró un producto con el código ingresado, ¿Deseas obtener la info de este producto para modificación?");
          
          if (confirmacion) {
            this.data.producto = response;
            this.completarInputs();
            this.titulo = "Modificar Producto";
            this.modificando = true;
          } else {
            this.Notificaciones.warning("Ya existe un producto con el mismo código");
          }
          
          return; 
        }
      }
    }

    const vencimiento = this.formulario.get('vencimiento')!;
    if(vencimiento.value == "Invalid Date" && this.inputVtoValorReal == "") //No toco el input y lo dejo vacio, dejamos guardar
    {
      const errors = { ...vencimiento.errors };
      delete errors['matDatepickerParse'];
      vencimiento.setErrors(Object.keys(errors).length ? errors : null);
    }

    this.markFormTouched(this.formulario);

    if(!this.formulario.valid){
      if(this.formulario.get('codigo')?.value != "")
        this.nombreInput.nativeElement.focus();

      return;
    } 

    this.producto.codigo =  this.formulario.get('codigo')?.value;
    this.producto.nombre =  this.formulario.get('nombre')?.value;
    // this.producto.tipoPrecio =  this.formulario.get('tipoPrecio')?.value;

    // if(this.formulario.get('cantidad')?.value == "")
    //   this.formulario.get('cantidad')?.setValue("1");

    // this.producto.cantidad =  this.formulario.get('cantidad')?.value;

    // if(this.tipoPrecioControl == '$'){
    //   this.producto.costo = this.Globales.EstandarizarDecimal(this.formulario.get('costoF')?.value);
    //   this.producto.precio =  this.Globales.EstandarizarDecimal(this.formulario.get('precioF')?.value);
    // }else if(this.tipoPrecioControl == '%'){
    //   this.producto.costo =  this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value);
    //   this.producto.precio =  this.Globales.EstandarizarDecimal(this.formulario.get('precioP')?.value);
    //   this.producto.porcentaje =  this.formulario.get('porcentaje')?.value;
    //   this.producto.redondeo =  this.formulario.get('redondeo')?.value;
    // }
    
    // if(this.formulario.get('idRubro')?.value == "")
    //   this.formulario.get('idRubro')?.setValue(1);

    // if(this.formulario.get('vencimiento')?.value)
    //   this.producto.vencimiento =  this.formulario.get('vencimiento')?.value;
    // else
    //   this.producto.vencimiento = null;

    // if(this.formulario.get('faltante')?.value != ''){
    //   this.producto.faltante = this.formulario.get('faltante')?.value
    // }else{
    //   this.producto.faltante = 1;
    // }

    if(this.modificando){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }

  Agregar(){
    this.productosService.Agregar(this.producto)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Producto creado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(){
    this.producto.id = this.data.producto.id;
    this.productosService.Modificar(this.producto)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Producto modificado correctamente");
          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  CalcularPrecioPorcentaje(){
    const costo: number = this.Globales.EstandarizarDecimal(this.formulario.get('costoP')?.value);
    const porcentaje: number = this.formulario.get('porcentaje')?.value;

    const precio: number = costo + ((costo * porcentaje) / 100);
    this.real = precio;

    let resultado:number;
    switch (this.formulario.get('redondeo')?.value) {
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

    this.formulario.get('precioP')?.setValue(resultado.toString().replace('.', ','));
  }

  getClaseRedondeo(): string {
    return this.redondeo < 0 ? 'texto-rojo' : 'texto-verde';
  }

  //#region IMAGEN
  SeleccionarImagen(): void {
    const fileInput = document.getElementById('imageInput');
    if (fileInput) {
      fileInput.click(); // Simula un clic en el input de tipo file al hacer clic en el botón personalizado
    }
  }

  async onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
    //Espero a subir la imagen al servidor y obtengo su path
    if(this.selectedFile){
      await this.SubirImagen();
    }
  }

  async SubirImagen(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.Globales.SubirImagen(this.selectedFile)
      .subscribe(response => {
      
        if(response == "Error"){
          this.Notificaciones.info("No se logró guardar la imagen para este producto");
        }else{
          this.producto.imagen = response;
          this.pathImgProd = environment.apiUrl + `imagenes/obtener/${response}`;
        }

        resolve();
      });
    });
  }
//#endregion

//#region OTRAS FUNCIONES
  soloPrecioChange(){
    this.formulario.get('tipoPrecio')?.setValue('$');
    this.formulario.get('costoF')?.setValue('1');
    this.formulario.get('precioF')?.setValue('1');
    this.formulario.get('cantidad')?.setValue('1');
    this.soloPrecio = !this.soloPrecio;
  }

  abrirConfirmacion(mensaje: string): Promise<boolean> {
    this.dialogConfig.data = { mensaje };
    this.dialogConfig.autoFocus = true;
    const modal = this.dialog.open(ConfirmacionComponent, this.dialogConfig);
    return firstValueFrom(modal.afterClosed());
  }

  markFormTouched(control: AbstractControl) {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach(c => this.markFormTouched(c));
    } else {
      control.markAsTouched();
      control.markAsDirty();
    }
  }
//#endregion


}
