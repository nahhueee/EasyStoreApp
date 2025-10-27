import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';
import { Cliente } from 'src/app/models/Cliente';
import { ClientesService } from 'src/app/services/clientes.service';
import { AddmodClientesComponent } from '../../clientes/addmod-clientes/addmod-clientes.component';
import { MatTableDataSource } from '@angular/material/table';
import { DetalleFactura } from 'src/app/models/DetalleFactura';
import { crearFiltros, PropKey } from 'src/app/models/filtros/FiltrosProducto.config';
import { MiscService } from 'src/app/services/misc.service';
import { Color, Genero, Material, Producto, TablaProducto, TallesProducto, Temporada, TipoProducto } from 'src/app/models/Producto';
import { ParametrosService } from 'src/app/services/parametros.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';
import { ProductosService } from 'src/app/services/productos.service';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { TipoPago } from 'src/app/models/TipoPago';
import { TipoDescuento } from 'src/app/models/TipoDescuento';

@Component({
  selector: 'app-facturar',
  standalone: false,
  templateUrl: './facturar.component.html',
  styleUrl: './facturar.component.scss'
})
export class FacturarComponent {
  decimal_mask: any;
  esDark:boolean = false;
  clientes:Cliente[]=[];
  filterClientes: Observable<Cliente[]>;
  clienteSeleccionado:Cliente;

  procesos = [
    {id: 1, descripcion: 'FACTURA'},
    {id: 2, descripcion: 'COTIZACION'},
    {id: 3, descripcion: 'SHOWROOM'},
    {id: 4, descripcion: 'DIFUSION'},
    {id: 5, descripcion: 'CON NOTA EMPAQUE'},
  ];

  listas = [
    {id: 1, descripcion: 'CONSUMIDOR FINAL'},
    {id: 2, descripcion: 'LISTA 3 - 30%'},
    {id: 3, descripcion: 'LISTA 4 - 45%'},
    {id: 4, descripcion: 'LISTA 5 - 50%'},
  ];


  tiposDePago:TipoPago[]=[
    {id: 1, descripcion: 'CONTADO'},
    {id: 2, descripcion: 'TARJETA DEBITO'},
    {id: 3, descripcion: 'TARJETA CREDITO'},
    {id: 4, descripcion: 'MERCADO PAGO'},
  ];

  tipoDescuento:TipoDescuento[]=[
    {id: 1, descripcion: 'PORCENTAJE'},
    {id: 2, descripcion: 'VOUCHER'},
    {id: 3, descripcion: 'PROMOCION'},
  ];

  empresas=[
    {id: 1, descripcion: 'SUCEDE SRL'},
    {id: 2, descripcion: 'GABEL MARIELA'},
    {id: 3, descripcion: 'OMAR CHAZA'},
  ];

  comprobantes=[
    {id: 1, descripcion: 'FACTURA A'},
    {id: 2, descripcion: 'FACTURA B'},
    {id: 3, descripcion: 'FACTURA C'},
    {id: 3, descripcion: 'COTIZACION'},
  ];

  
  formGenerales:FormGroup;
  dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  //Filtro de productos
  formFiltroProducto:FormGroup;
  materiales:Material[]=[];
  materialesFiltrado:Material[]=[];
  temporadas:Temporada[]=[];
  temporadasFiltrado:Temporada[]=[];
  tipos:TipoProducto[]=[];
  tiposFiltrado:TipoProducto[]=[];
  subtipos:TipoProducto[]=[];
  subtiposFiltrado:TipoProducto[]=[];
  coloresMaterialNoSeleccionado:Color[] = [
    {id: 0, descripcion: "", hexa: "#6d6d6d"},
    {id: 0, descripcion: "", hexa: "#6d6d6d"},
    {id: 0, descripcion: "", hexa: "#6d6d6d"},
    {id: 0, descripcion: "", hexa: "#6d6d6d"},
    {id: 0, descripcion: "", hexa: "#6d6d6d"},
  ];
  coloresMaterial: Color[] = [];
  colorSeleccionado: Color = new Color();
  generos:Genero[]=[];

  //Productos
  productos:Producto[]=[];
  productoSeleccionado:Producto = new Producto();
  popoverAbierto: NgbPopover | null = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  //Lista de productos seleccionados
  detalleFactura: DetalleFactura[] = [];
  dataSource: MatTableDataSource<DetalleFactura>; //Data source de la tabla
  displayedColumns: string[] = ['cantidad', 'producto', 'talle', 'unitario', 'total', 'actions']; //Columnas a mostrar

  //Variables para editar la cantidad
  editarCelda:number | undefined;
  newCantidad = new FormControl('')
  @ViewChild('inputEditable') inputEditable: ElementRef<HTMLInputElement>;

  cantItems:number = 0;
  totalItems:number = 0;

  //Lista de verificacion
  columnsVerificar: string[] = ['cantidad', 'codigo', 'producto', 'talle', 'unitario', 'total']; //Columnas a mostrar
  formDatosFinales:FormGroup;

  constructor(
    private clientesService: ClientesService,
    private productosService:ProductosService,
    private miscService:MiscService,
    private parametrosService:ParametrosService,
    private dialog: MatDialog, //Ventana emergente
  ) {
    this.formGenerales = new FormGroup({
      proceso: new FormControl(''),
      nroNota: new FormControl({ value: '', disabled: true }),
      fecha: new FormControl(''),
      cliente: new FormControl(''),
      lista: new FormControl(''),
    });

    this.formFiltroProducto = new FormGroup({
      codigoNombre: new FormControl(''),
      temporada: new FormControl(''),
      tipo: new FormControl(''),
      subtipo: new FormControl(''),
      material: new FormControl(''),
      genero: new FormControl(''),
    });

    this.formDatosFinales = new FormGroup({
      tipoPago: new FormControl(''),
      tipoDescuento: new FormControl(''),
      descuento: new FormControl({ value: '', disabled: true }),
      empresa: new FormControl(''),
      comprobante: new FormControl(''),
      redondeo: new FormControl(''),
    });


    this.esDark = this.parametrosService.EsDark();
  }

  get nroNotaControl() {return this.formGenerales.get('nroNota')?.value;}
  get procesoValor() {return this.procesos.find(p => p.id === this.formGenerales.get('proceso')?.value)?.descripcion || '';}

  get materialControl() {return this.formFiltroProducto.get('material')?.value;}
  get generoControl() {return this.formFiltroProducto.get('genero')?.value;}

  ngOnInit(){
    this.ObtenerClientes();

    //FILTROS
    this.miscService.ObtenerMateriales()
    .subscribe(response => {
      this.materiales = response;
      this.materialesFiltrado = response;
    });

    this.miscService.ObtenerTemporadas()
    .subscribe(response => {
      this.temporadas = response;
      this.temporadasFiltrado = response;
    });

    this.miscService.ObtenerTiposProducto()
    .subscribe(response => {
      this.tipos = response;
      this.tiposFiltrado = response;
    });

    this.miscService.ObtenerSubtiposProducto()
    .subscribe(response => {
      this.subtipos = response;
      this.subtiposFiltrado = response;
    });

    this.miscService.ObtenerGeneros()
    .subscribe(response => {
      this.generos = response;
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

    //DEPENDIENDO EL PROCESO HABILITAMOS NOTA DE EMPAQUE
    this.formGenerales.get('proceso')?.valueChanges.subscribe((valor) => {
    const nroNotaControl = this.formGenerales.get('nroNota');
      if (valor != 5) {
        nroNotaControl?.disable({ emitEvent: false });
      } else {
        nroNotaControl?.enable({ emitEvent: false });
      }
    });

    //HABILITAMOS EL CAMPO DE DESCUENTO AL SELECICONAR TIPO DE DESCUENTO
    this.formDatosFinales.get('tipoDescuento')?.valueChanges.subscribe((valor) => {
      this.formDatosFinales.get('descuento')?.enable({ emitEvent: false });
    });
  }

  //#region CLIENTES
    ObtenerClientes(){
      this.clientesService.SelectorClientes()
        .subscribe(response => {
          this.clientes = response;
          this.filterClientes = this.formGenerales.get("cliente")!
            .valueChanges.pipe(
              startWith(""),
              map((value) => this._filterClientes(value))
            );
        });
    }
    private _filterClientes(value: string): Cliente[] {
      if(value!=null){
        const filterValue = value.length > 0 ? value.toLocaleLowerCase() : value;
        return this.clientes.filter((option) =>
          option.nombre?.toLocaleLowerCase().includes(filterValue) || option.documento?.toString().includes(filterValue)
        );
      }
      return this.clientes;
    }
  
    ChangeCliente(seleccionado: number) { //Detecta el cambio de seleccion de cliente
      this.clientesService.ObtenerCliente(seleccionado)
        .subscribe(response => {
          this.clienteSeleccionado = response;
          this.formGenerales.get('cliente')?.setValue(this.clienteSeleccionado.documento);
        });
    }
  
    NuevoCliente() { 
      this.dialogConfig.width = "100wv";
      let cliente = new Cliente();
      cliente.id = 0;
      this.dialogConfig.data = {cliente};
      this.dialog.open(AddmodClientesComponent, this.dialogConfig)
              .afterClosed()
              .subscribe((actualizar:boolean) => {
                if (actualizar){
                  this.ObtenerClientes();
                }
              });
    }
  //#endregion

  //#region FILTROS
  cambioSeleccionable(seleccionable:string){
    if(seleccionable == 'material'){
      const materialSeleccionado = this.materiales.find(m=> m.id == this.materialControl);
      this.coloresMaterial = materialSeleccionado?.colores!;
    }

    this.Buscar();
  }

  filtrarSeleccionable(event: any, listaOrigen: any[], propiedadDestino: string, campo: string = 'descripcion') {
    const valor = event.target.value?.toUpperCase() || '';

    if (!valor) {
      this[propiedadDestino] = [...listaOrigen]; 
      return;
    }

    this[propiedadDestino] = listaOrigen.filter(item =>
      item[campo]?.toUpperCase().includes(valor)
    );
  }
  
  limpiarSeleccionable(campo:string){
    this.formFiltroProducto.get(campo)?.reset();
      switch (campo) {
        case 'temporada':
          this.temporadasFiltrado = [...this.temporadas];
          break;
        case 'tipo':
          this.tiposFiltrado = [...this.tipos];
          break;
        case 'subtipo':
          this.subtiposFiltrado = [...this.subtipos];
          break;
        case 'material':
          this.materialesFiltrado = [...this.materiales];
          this.coloresMaterial = [];
          this.colorSeleccionado = new Color();
          break;
    }  

    this.Buscar();
  }

  limpiarInput(){
    this.formFiltroProducto.get('codigoNombre')?.reset();
  }

  limpiarGenero(){
    this.formFiltroProducto.get('genero')?.reset();
    this.Buscar();
  }

  limpiarColor(){
    this.colorSeleccionado = new Color();
    this.Buscar();
  }
  //#endregion

  //#region PRODUCTOS
  Buscar(event?: PageEvent){
    //Eventos de la paginación
    if (!event) {
      event = new PageEvent();
      event.pageIndex = 0;
      event.pageSize = this.paginator.pageSize;
    }

    this.productoSeleccionado = new Producto();

   const filtro = new FiltroProducto({
      pagina: event.pageIndex + 1,
      total: event.length,
      tamanioPagina: event.pageSize,
      desdeFacturacion: true,
      busqueda: this.formFiltroProducto.get('codigoNombre')?.value,
      proceso: 1,
      tipo: this.formFiltroProducto.get('tipo')?.value,
      subtipo: this.formFiltroProducto.get('subtipo')?.value,
      genero: this.formFiltroProducto.get('genero')?.value,
      material: this.formFiltroProducto.get('material')?.value,
      color: this.colorSeleccionado.id ?? 0,
      temporada: this.formFiltroProducto.get('temporada')?.value,
    });

    // Obtiene listado de productos y el total
    this.productosService.ObtenerProductos(filtro)
        .subscribe(response => {

          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Llenamos la tabla con los resultados
          this.productos = [];
          this.productos = response.registros;
        });
  }

  SelecionarProducto(producto:Producto, popover:NgbPopover){
    // Si hago clic sobre el mismo producto y ya está abierto
    if (this.productoSeleccionado?.id === producto.id) {
      popover.close();
      this.DeseleccionarProducto();
      return;
    }

    if (this.popoverAbierto) {
      this.popoverAbierto.close();
      this.popoverAbierto = null;

      // Esperar hasta que cierre el popover anterior antes de abrir el nuevo
      setTimeout(() => {
        this.abrirPopover(producto, popover);
      }, 200); 
    } else {
      // Si no había ningún popover abierto, abrir directamente
      this.abrirPopover(producto, popover);
    }
  }

  private abrirPopover(producto: Producto, popover: NgbPopover) {
    this.productoSeleccionado = producto;
    popover.open();
    this.popoverAbierto = popover;
  }

  DeseleccionarProducto(){
    this.productoSeleccionado = new Producto();
    this.popoverAbierto = null;
  }
 
  AgregarItem(talle:TallesProducto){
    // Buscar si ya existe el producto con ese id y nombre
    const existente = this.detalleFactura.find(
      d => d.idProducto === this.productoSeleccionado.id  && d.talle === talle.talle
    );

    if (existente) {
      // Si ya existe, actualizo cantidad y totales
      existente.cantidad! += 1;
      existente.total = existente.unitario! * existente.cantidad!;
    } else {
      // Si no existe, creo uno nuevo
      const detFactura = new DetalleFactura();
      detFactura.id = 0;
      detFactura.idFactura = 0;
      detFactura.idProducto = this.productoSeleccionado.id;
      detFactura.codProducto = this.productoSeleccionado.codigo;
      detFactura.producto = this.productoSeleccionado.nombre;
      detFactura.cantidad = 1;
      detFactura.talle = talle.talle;
      detFactura.unitario = talle.precio;
      detFactura.total = talle.precio;
      detFactura.obs = "";

      this.detalleFactura.push(detFactura);
    }
    this.dataSource = new MatTableDataSource<DetalleFactura>(this.detalleFactura);

    this.RecontarTotales();
  }

   RecontarTotales() {
    this.cantItems = this.detalleFactura.reduce((acc, d) => acc + d.cantidad!, 0);
    this.totalItems = this.detalleFactura.reduce((acc, d) => acc + d.total!, 0);
  }
  //#endRegion PRODUCTOS


  //#region PRODUCTOS FACTURA
  HabEdicionItem(index:number,cantidad:number){
    this.editarCelda = index;
    this.newCantidad.setValue(cantidad.toString());
    setTimeout(() => {
      this.inputEditable.nativeElement.focus(); // Enfocar el input
      this.inputEditable.nativeElement.select(); // Enfocar el input
    })
  }

  EditarItemCantidad(index:number){
    if(this.newCantidad.value!=""){
      var nuevaCantidad = parseInt(this.newCantidad.value!,10)
      this.detalleFactura[index].cantidad = nuevaCantidad;
      this.detalleFactura[index].total = this.detalleFactura[index].unitario! * nuevaCantidad;

      //Seteamos totales
      const sumaTotal = this.detalleFactura.reduce((acumulador, objeto) => {
        return acumulador + objeto.total!;
      }, 0);
      this.totalItems = sumaTotal;
    }

    this.editarCelda = undefined;
  }

  //Quita un elemento de la lista
  QuitarItem(index:number){
    if (index >= 0 && index < this.detalleFactura.length) {

      //Seteamos totales
      this.cantItems -= 1;
      this.totalItems -= this.detalleFactura[index].total!;
      this.detalleFactura.splice(index,1);

      this.dataSource = new MatTableDataSource<DetalleFactura>(this.detalleFactura);
    }
  }
  //#endregion
}
