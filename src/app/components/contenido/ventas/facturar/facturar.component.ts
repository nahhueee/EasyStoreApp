import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { Color, Genero, Material, Producto, TablaProducto, Temporada, TipoProducto } from 'src/app/models/Producto';
import { ParametrosService } from 'src/app/services/parametros.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
  selector: 'app-facturar',
  standalone: false,
  templateUrl: './facturar.component.html',
  styleUrl: './facturar.component.scss'
})
export class FacturarComponent {
  esDark:boolean = false;
  clientes:Cliente[]=[];
  filterClientes: Observable<Cliente[]>;
  clienteSeleccionado:Cliente;

  procesos = [
    {id: 1, descripcion: 'ECOMMERCE'},
    {id: 2, descripcion: 'DIFUSION'},
    {id: 3, descripcion: 'SHOWROOM'},
    {id: 4, descripcion: 'MAYORISTA'},
    {id: 5, descripcion: 'CON NOTA EMPAQUE'},
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
  productos:TablaProducto[]=[];
  productoSeleccionado:TablaProducto;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  //Lista de productos seleccionados
  detalleFactura: DetalleFactura[] = [];
  dataSource: MatTableDataSource<DetalleFactura>; //Data source de la tabla
  displayedColumns: string[] = ['cantidad', 'producto', 'unitario', 'total', 'actions']; //Columnas a mostrar

  //Variables para editar la cantidad
  editarCelda:number | undefined;
  newCantidad = new FormControl('')
  @ViewChild('inputEditable') inputEditable: ElementRef<HTMLInputElement>;

  cantItems:number = 0;
  totalItems:number = 0;

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
      cliente: new FormControl(''),
    });
    this.formFiltroProducto = new FormGroup({
      codigoNombre: new FormControl(''),
      temporada: new FormControl(''),
      tipo: new FormControl(''),
      subtipo: new FormControl(''),
      material: new FormControl(''),
      genero: new FormControl(''),
    });

    this.esDark = this.parametrosService.EsDark();
  }

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
    //DEPENDIENDO EL PROCESO HABILITAMOS NOTA DE EMPAQUE
    this.formGenerales.get('proceso')?.valueChanges.subscribe((valor) => {
    const nroNotaControl = this.formGenerales.get('nroNota');
      if (valor != 5) {
        nroNotaControl?.disable({ emitEvent: false });
      } else {
        nroNotaControl?.enable({ emitEvent: false });
      }
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

    this.productoSeleccionado = new TablaProducto();

   const filtro = new FiltroProducto({
      pagina: event.pageIndex + 1,
      total: event.length,
      tamanioPagina: event.pageSize,
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

  SeleccionarProducto(producto:TablaProducto){
    this.productoSeleccionado = producto;  }
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
