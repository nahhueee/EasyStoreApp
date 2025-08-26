import { Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, debounceTime, distinctUntilChanged, filter, firstValueFrom, map, startWith, switchMap, tap } from 'rxjs';
import { DetalleVenta } from 'src/app/models/DetalleVenta';
import { Producto } from 'src/app/models/Producto';
import { ProductosService } from 'src/app/services/productos.service';
import { RegistrarVentaComponent } from '../registrar-venta/registrar-venta.component';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { GlobalesService } from 'src/app/services/globales.service';
import { AddmodProductosComponent } from 'src/app/components/contenido/productos/addmod-productos/addmod-productos.component';

@Component({
    selector: 'app-new-venta',
    templateUrl: './new-venta.component.html',
    styleUrls: ['./new-venta.component.scss'],
    standalone: false
})
export class NewVentaComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    pathIcon:string;
    prodVario: boolean;
    prodVarioNombre: string;

    detalles: DetalleVenta[] = [];
    nvoDetalleVenta: DetalleVenta = new DetalleVenta();
    
    totalItems = 0;
    decimal_mask: any;
    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    formulario: FormGroup;

    productos: Producto[] = [];
    filterProductos: Observable<Producto[]>;
    unidadProd: string;
    productosSoloPrecio: { id: number, codigo:string, nombre: string }[] = [];

    desdeSeleccionable = false;
    modalAbierto = false;

    displayedColumns: string[] = ['cantidad', 'unidad', 'producto', 'precio', 'total', 'acciones']; //Columnas a mostrar
    dataSource = new MatTableDataSource<DetalleVenta>(this.detalles); //Data source de la tabla

    @Input() idCaja: number; //Id de la caja actual
    @Input() tabSeleccionada: number;
    @Input() estadoCaja: string; //Estado de la caja actual
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front
    @ViewChild(MatAutocomplete) matAutocomplete: MatAutocomplete; //Para Manejar el autocomplete

    @ViewChild('inputCodigo') inputCodigo: ElementRef<HTMLInputElement>; //Para usar el input de codigo
    @ViewChild('inputCantidad') inputCantidad: ElementRef<HTMLInputElement>; //Para usar el input de cantidad
    @ViewChild('inputPrecioVario') inputPrecioVario: ElementRef<HTMLInputElement>; //Para usar el input de precio vario

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  //#endregion

  constructor(
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales: GlobalesService, //Metodos globales
    private productosService:ProductosService,
    private parametroService:ParametrosService
  )
  {
    this.formulario = new FormGroup({
      codigo: new FormControl('', [Validators.required]),
      producto: new FormControl(''),
      cantidad: new FormControl(''),
      precio: new FormControl(''),

      precioVario: new FormControl(''),
      cantVario: new FormControl(''),
    });
  }

  //#region CONTROLS
    get codigoControl(): string { return this.formulario.get('codigo')?.value; }
    get productoControl(): string { return this.formulario.get('producto')?.value; }
    get precioControl(): number { return this.Globales.EstandarizarDecimal(this.formulario.get('precio')?.value); }
    get precioVarioControl(): number { return this.Globales.EstandarizarDecimal(this.formulario.get('precioVario')?.value); }

    get cantidadControl(): number { 
      const cantidad = this.formulario.get('cantidad')?.value;
      return this.Globales.EstandarizarDecimal(!cantidad || cantidad === "" ? "1" : cantidad); 
    }
    get cantVarioControl(): number {
      const cantidad = this.formulario.get('cantVario')?.value;
      return this.Globales.EstandarizarDecimal(!cantidad || cantidad === "" ? "1" : cantidad); 
    }
  //#endregion


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (event.key === 'F1') {
      this.Vender();
    }
    if (event.key === 'F2') {
      this.CancelarVenta();
    }

    if (event.key === 'F7') {
      if(this.detalles.length > 0)
        this.Editar(this.detalles.length - 1);
    }
    if (event.key === 'F8') {
      if(this.detalles.length > 0)
        this.Borrar(this.detalles.length - 1);
    }
  }

  ngOnInit(){
    if(this.parametroService.EsDark()){
      this.pathIcon = "assets/IconoWhite.png"
    }else{
      this.pathIcon = "assets/IconoBlack.png"
    }

    //Detecta el cambio en el input autocomplete
    //Busca en base de datos los productos relacionados con lo escrito por el usuario
    this.formulario.get('producto')?.valueChanges
    .pipe(
      
      debounceTime(300), // Reduce la frecuencia de peticiones
      distinctUntilChanged(), // Evita peticiones duplicadas
      map(value => value?.toString().toLowerCase()), // Asegura que siempre sea minúscula
      switchMap(value => {
        if (!value || value.length < 3) {
          // Reinicia el autocomplete si el input es menor de 3 caracteres
          this.filterProductos = this.formulario.get("producto")!
          .valueChanges.pipe(
            startWith(""),
            map(() => [])
          );
          return []; // Retorna un array vacío para evitar peticiones
        }
        // Si tiene 3 o más caracteres, realiza la búsqueda
        return this.productosService.BuscarProductos("nombre", value);
      })
    )
    .subscribe(resultados => {
      //Llena el autocomplete con los resultados
      this.productos = resultados;
      this.filterProductos = this.formulario.get("producto")!
          .valueChanges.pipe(
            startWith(""),
            map((value) => this._filterProductos(value))
          );
    });
  }

  //Filtro de autocomplete
  private _filterProductos(value: string): Producto[] {
    if(value!=null){
      const filterValue = value.length > 0 ? value.toLocaleLowerCase() : value;
      return this.productos.filter((option) =>
        option.nombre?.toLocaleLowerCase().includes(filterValue)
      );
    }
    return this.productos;
  }

  ngAfterViewInit() {
    this.focusCodigo();
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

  focusCodigo(){
    setTimeout(() => {this.inputCodigo.nativeElement.focus();}, 100);
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  CompletarInputs(producto:Producto){
    this.formulario.get('producto')!.setValue(producto.nombre);
    this.formulario.get('codigo')!.setValue(producto.codigo);
    //this.formulario.get('precio')!.setValue(producto.precio?.toString());

    if(this.formulario.get('cantidad')?.value == "")
      this.formulario.get('cantidad')?.setValue("1");
   
  }

  //#region FORMULARIO

  //InputProducto
  productoChange(seleccionado: Producto) { //Detecta el cambio de seleccion de producto
    this.desdeSeleccionable = true;
    this.nvoDetalleVenta.producto = seleccionado;
    //this.nvoDetalleVenta.precio = seleccionado.precio;
    this.CompletarInputs(seleccionado)
  }
  //--------------------------------


  //InputCodigo
  //Para manejar productos varios *
  codigoKeyUp(){
    if(this.codigoControl==='*' || (this.codigoControl.startsWith('/') && this.codigoControl.length>1)){
      this.prodVario = true;

      const producto = this.productosSoloPrecio.find(p => p.codigo === this.codigoControl.replace("/",""));
      if (producto) {
        this.prodVarioNombre = producto.nombre;
      } else {
        if(this.codigoControl!="*")
          this.Notificaciones.warning("No se encontraron productos con este código, se usará PRODUCTO VARIO");

        this.prodVarioNombre = "PRODUCTO VARIO";
      }
            
      // Establece el validador requerido en 'precioVario'
      this.formulario.get('precioVario')?.setValidators(Validators.required);
      this.formulario.get('precioVario')?.updateValueAndValidity(); 

      // Elimina los validadores de 'codigo'
      this.formulario.get('codigo')?.clearValidators();
      this.formulario.get('codigo')?.updateValueAndValidity();

      setTimeout(() => {this.inputPrecioVario.nativeElement.focus();}, 0);

    }else{
      this.prodVario = false;

      // Establece el validador requerido en 'codigo'
      this.formulario.get('codigo')?.setValidators(Validators.required);
      this.formulario.get('codigo')?.updateValueAndValidity();

      // Elimina los validadores de 'precioVario'
      this.formulario.get('precioVario')?.clearValidators();
      this.formulario.get('precioVario')?.updateValueAndValidity();
    }
  }
  codigoInputChange() {
    if(this.formulario.get('codigo')?.value == "")
      this.prodVario = false;
  }
  //--------------------------------


  async ValidarCodigo(): Promise<boolean> {
    if (this.codigoControl === '*' || (this.codigoControl.startsWith('/') && this.codigoControl.length > 1)) {
      const producto = this.productosSoloPrecio.find(p => p.codigo === this.codigoControl.replace("/", ""));
      if (producto) {
        // this.nvoDetalleVenta.producto = new Producto({
        //   id: producto.id,
        //   codigo: producto.codigo,
        //   nombre: producto.nombre,
        //   unidad: "---",
        //   soloPrecio: true
        // });
      } else {
        //this.nvoDetalleVenta.producto = new Producto({ id: 1, codigo: "*", nombre: "VARIOS", unidad: "---" });
      }
      this.nvoDetalleVenta.precio = this.precioVarioControl;
      this.nvoDetalleVenta.costo = this.precioVarioControl;
      return true;
    } else {
      try {
        const resultado = await firstValueFrom(this.productosService.BuscarProductos("codigo", this.codigoControl));
        if (resultado && resultado.length > 0) {
          this.CompletarInputs(resultado[0]);
          this.nvoDetalleVenta.precio = resultado[0].precio;
          this.nvoDetalleVenta.producto = resultado[0];
          return true;
        } else {
          this.Notificaciones.warning("No se encontraron productos con este código");
          return false;
        }
      } catch (error) {
        this.Notificaciones.error("Error buscando producto por código");
        return false;
      }
    }
  }



  async AgregarProducto(event?: Event){
    event?.preventDefault(); 

    if(this.estadoCaja == "FINALIZADA"){
      this.Notificaciones.warning("No puedes realizar ventas en una caja FINALIZADA");
      return;
    }

    //Validamos formulario y mostramos errores
    for (const control of Object.values(this.formulario.controls)) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
    if (this.formulario.invalid)
      return;

    //Evalua si el usuario tomo el producto desde el seleccionable o escribió un codigo 
    if(this.desdeSeleccionable == false){
      const codigoValido = await this.ValidarCodigo();

      //Verificamos que el codigo sea válido para avanzar
      this.inputCodigo.nativeElement.select();
      if(!codigoValido)
        return;
    }

    this.nvoDetalleVenta.cantidad = this.codigoControl == "*" || this.codigoControl.startsWith('/') ? this.cantVarioControl : this.cantidadControl;
    this.nvoDetalleVenta.total = this.nvoDetalleVenta.precio! * this.nvoDetalleVenta.cantidad;
    this.detalles.push(this.nvoDetalleVenta)
    this.dataSource = new MatTableDataSource<DetalleVenta>(this.detalles); //Recargamos la grilla

    //Sumamos el total
    this.totalItems += this.nvoDetalleVenta.total; 

    //Dejamos foco en el input de Código para seguir trabajando
    this.inputCodigo.nativeElement.focus(); 
    
    this.Limpiar();    
  }

  Limpiar(){
    this.nvoDetalleVenta = new DetalleVenta();
    this.desdeSeleccionable = false;

    if(this.prodVario){

      //Limpiamos el producto vario
      this.prodVario = false;
      this.formulario.get('cantVario')!.setValue('');
      this.formulario.get('precioVario')!.setValue('');
      
      // Elimina los validadores de 'precioVario'
      this.formulario.get('precioVario')?.clearValidators();
      this.formulario.get('precioVario')?.updateValueAndValidity();

    }else{

      //Limpiamos el autocomplete
      this.formulario.get('producto')!.setValue('');
      this.matAutocomplete.options.forEach((item) => {
        item.deselect()
      });

      this.formulario.get('precio')!.setValue('');
    }
   
    this.unidadProd = "";
    this.formulario.get('codigo')!.setValue('');
    this.formulario.get('cantidad')!.setValue('');
  }


  NuevoProducto(){
      this.dialogConfig.disableClose = true;
      this.dialogConfig.autoFocus = true;
      this.dialogConfig.height = "auto";
      this.dialogConfig.width = "700px";
      this.dialogConfig.data = {categoria:null};
      this.dialog.open(AddmodProductosComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.Limpiar();
                    }
                  });
  }
  //#endregion

  //#region BOTONES DE ACCION
  Vender(){
    if(this.detalles.length==0) return;
    if(this.modalAbierto) return;

    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
    this.dialogConfig.width = "800px";
    this.modalAbierto = true;

    this.dialogConfig.data = {idCaja: this.idCaja, detalles: this.detalles, total: this.totalItems} //Pasa como la caja, los detalles de la venta y el total
    this.dialog.open(RegistrarVentaComponent, this.dialogConfig)
            .afterClosed()
            .subscribe((vendido:boolean) => {
              if (vendido){
                this.CancelarVenta(); //Si esta vendido, limpiamos todo con este metodo
                this.inputCodigo.nativeElement.focus(); //Damos el foco a la cantidad
              }

              this.modalAbierto = false;
            });
  }

  CancelarVenta(){
    this.Limpiar();
    this.totalItems = 0;
    this.detalles = [];
    this.dataSource = new MatTableDataSource<DetalleVenta>(this.detalles); //Recargamos la grilla
  }
  //#endregion

  //#region GRILLA
  //Evento que sirve para saber si se hace un click o dos sobre una celda y realizar acción al respecto
  OnCellClick(index:number){
    if(index!=null||index!=undefined){
      this.clickCount++;
      setTimeout(() => {
          if (this.clickCount === 2) {
            this.Editar(index);
          }
          this.clickCount = 0;
      }, 250)
    }
  }

  Editar(index:number){
    //Seteamos los inputs
    this.nvoDetalleVenta = this.detalles[index];
    if(this.nvoDetalleVenta.producto?.codigo == "*") return;

    this.CompletarInputs(this.nvoDetalleVenta.producto!);
       
    this.Borrar(index);

    setTimeout(() => {
    //Dejamos foco en el input de Cantidad dado que por lo general solo se edita la cantidad
    this.inputCantidad.nativeElement.focus(); 
    this.inputCantidad.nativeElement.select();
    }, 250)
  }

  Borrar(index:number){
    //Seteamos totales
    this.totalItems -= this.detalles[index].total;

    //Eliminamos de la lista el registro
    this.detalles.splice(index,1);
    this.dataSource = new MatTableDataSource<DetalleVenta>(this.detalles); //Recargamos la grilla

    //Dejamos foco en el input de Codigo
    this.inputCodigo.nativeElement.focus(); 
  }
  //#endregion
  
}
