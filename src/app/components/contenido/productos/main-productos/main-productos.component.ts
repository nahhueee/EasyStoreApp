import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, HostListener, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Color, Genero, LineasTalle, Material, Proceso, Producto, SubtipoProducto, TablaProducto, TipoProducto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { AddmodProductosComponent } from '../addmod-productos/addmod-productos.component';
import { EliminarComponent } from '../../../compartidos/eliminar/eliminar.component';
import { ProductosService } from 'src/app/services/productos.service';
import { environment } from 'src/environments/environment';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ImagenProductoComponent } from '../imagen-producto/imagen-producto.component';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { BusquedaComponent } from 'src/app/components/compartidos/busqueda/busqueda.component';
import { forkJoin, Observable } from 'rxjs';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';
import { MiscService } from 'src/app/services/misc.service';
import { AdministrarProductosComponent } from '../administrar-productos/administrar-productos.component';
import { FormControl } from '@angular/forms';
import { crearFiltros, PropKey } from 'src/app/models/filtros/FiltrosProducto.config';
import { FilesService } from 'src/app/services/files.service';

@Component({
    selector: 'app-productos',
    templateUrl: './main-productos.component.html',
    styleUrls: ['./main-productos.component.scss'],
    standalone: false
})
export class MainProductosComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    productos: TablaProducto[] =[];
    totalProductos:number = 0;
    filtroActual: FiltroProducto;
    vistaSeleccionada = "lista"
    lineasTalles: LineasTalle[] = [];

    tipoImportacionExcel:string;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda
    esDark:boolean;
    displayedColumns: string[] = ['editar', 'proceso', 'temporada', 'codigo', 'nombre', 'tipo', 'subtipo', 'genero', 'material', 'color', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 'total']; //Columnas a mostrar
    
    dataSource = new MatTableDataSource<TablaProducto>(this.productos); //Data source de la tabla
    seleccionados = new SelectionModel<TablaProducto>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front
    @ViewChild('btnAgregar') btnAgregar!: ElementRef<HTMLButtonElement>;
    @ViewChild(BusquedaComponent) busquedaComponent!: BusquedaComponent;

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
    pantalla: any = 0;

    filtros = crearFiltros();
    filtroKeys: PropKey[] = ['procesos', 'temporadas', 'codigo', 'tipos', 'subtipos', 'generos', 'materiales', 'colores']; // para recorrer
    busquedaControl: FormControl = new FormControl('');
 //#endregion

  constructor(
    private router:Router,
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private parametrosService: ParametrosService,
    private productosService:ProductosService,
    private authService:AuthService,
    private miscService:MiscService,
    private filesService:FilesService
  ) {
    this.esDark = this.parametrosService.EsDark();
  }

  
  //Obtiene el tamaño actual de la pantalla 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
  this.pantalla = window.innerWidth;
  }
  
  ngOnInit(): void {
    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla

    //Reacciona al input de busqueda
    this.busquedaControl.valueChanges.subscribe(valor => {
      const sinFiltros = Object.values(this.filtros)
      .every(f => f.seleccionado == null || f.seleccionado === 0);

      if(sinFiltros && this.busquedaControl.value == ""){
        this.productos = [];
        this.dataSource = new MatTableDataSource<TablaProducto>(this.productos);
      }
      else{
        this.Buscar(valor);
      }
    });

    this.vistaSeleccionada = this.parametrosService.GetVistaProductos();
    this.CambioDeVista();
    this.ObtenerLineasTalle();
    
    this.cargarDatos('tipos', this.miscService.ObtenerTiposProducto.bind(this.miscService));
    this.cargarDatos('subtipos', this.miscService.ObtenerSubtiposProducto.bind(this.miscService));
    this.cargarDatos('procesos', this.miscService.ObtenerProcesos.bind(this.miscService));
    this.cargarDatos('generos', this.miscService.ObtenerGeneros.bind(this.miscService));
    this.cargarDatos('materiales', this.miscService.ObtenerMateriales.bind(this.miscService));
    this.cargarDatos('colores', this.miscService.ObtenerColores.bind(this.miscService));
    this.cargarDatos('temporadas', this.miscService.ObtenerTemporadas.bind(this.miscService));
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    this.sort.sortChange.subscribe(() => {
      this.Buscar(); 
    });

  setTimeout(() => {
      //Obtenemos los datos de tabla
      //this.Buscar();
      //this.btnAgregar.nativeElement.focus();
    }, 0.5);
  }

  ObtenerLineasTalle(){
    this.miscService.ObtenerLineasTalle()
      .subscribe(response => {
        this.lineasTalles = response;
      });
  }

  //#region TABLA
    
    //#region VERIFICAR SI LOS REGISTROS ESTAN SELECCIONADOS
    //Selecciona todas las filas si no están todas seleccionadas; en caso contrario, borra la selección.
    toggleAllRows() {
      if (this.isAllSelected()) {
        this.seleccionados.clear();
        return;
      }

      this.seleccionados.select(...this.dataSource.data);
    }
    // Verifica si el numero de filas es igual al numero de filas seleccionadas
    isAllSelected() {
      const numSelected = this.seleccionados.selected.length;
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    }
    //#endregion
    
    Buscar(event?: PageEvent, recargaConFiltro = false){
      this.seleccionados.clear();

      //Eventos de la paginación
      if (!event) {
        event = new PageEvent();
        event.pageIndex = 0;
        event.pageSize = this.paginator.pageSize;
      }

      //Creamos el objeto para filtrar registros
      if(!recargaConFiltro){
        this.filtroActual = new FiltroProducto({
          pagina: event.pageIndex + 1,
          total: event.length,
          tamanioPagina: event.pageSize,
          busqueda: this.busquedaControl.value,
          orden: this.sort.active,
          direccion: this.sort.direction,
          proceso: this.filtros.procesos.seleccionado,
          tipo: this.filtros.tipos.seleccionado,
          subtipo: this.filtros.subtipos.seleccionado,
          genero: this.filtros.generos.seleccionado,
          material: this.filtros.materiales.seleccionado,
          color: this.filtros.colores.seleccionado,
          temporada: this.filtros.temporadas.seleccionado
        });
      }

      // Obtiene listado de productos y el total
      this.productosService.ObtenerProductos(this.filtroActual)
          .subscribe(response => {

            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Llenamos la tabla con los resultados
            this.productos = [];
            this.productos = response.registros.map((producto: Producto) => ({
              ...producto,
              pathImagen: producto.imagen 
                          ? `${environment.apiUrl}imagenes/obtener/${producto.imagen}` 
                          : 'assets/noimage.png'
            }));

            //Verificamos la vista seleccionada
            this.CambioDeVista();

            this.dataSource = new MatTableDataSource<TablaProducto>(this.productos);
          });
    }

    getTotal(col: keyof TablaProducto): number {
      return this.dataSource?.data?.reduce((acc, item) => {
        const valor = Number(item[col] || 0);
        return acc + valor;  
      }, 0) ?? 0;
    }

  //#endregion

  //#region MODAL/ABM

    //Evento que sirve para saber si se hace un click o dos sobre una celda y realizar acción al respecto
    OnCellClick(row:any){
      if(row!=null||row!=undefined){

        this.clickCount++;
        setTimeout(() => {
            if (this.clickCount === 1) {
              this.seleccionados.toggle(row)
            } else if (this.clickCount === 2) {
              this.Modificar(row);
            }
            this.clickCount = 0;
        }, 250)

      }

    }

    Agregar(){
      this.router.navigateByUrl(`/administrar-producto/0`); 
    }

    Modificar(row?:any) { 
      
      let data: any;
      if(row==null){ //Si no hizo doble click sobre una celda y selecciono mas de una
        if(this.seleccionados.selected.length==0)return
        data = this.seleccionados.selected[0];
      }else{ //Si quiere editar solo un registro dando doble click
        data = row;
      }

      //this.router.navigateByUrl(`/administrar-producto/${data.id}`);
      this.dialogConfig.width = "100wh";
      this.dialogConfig.maxHeight = "90vh";
      this.dialogConfig.disableClose = false;
      this.dialogConfig.autoFocus = true;

      this.dialogConfig.data = {producto:data.id} //Pasa como dato el cliente
      this.dialog.open(AdministrarProductosComponent, this.dialogConfig)
              .afterClosed()
              .subscribe((actualizar:boolean) => {
                if (actualizar){
                  this.Buscar(undefined, true); //Recarga la tabla
                }
              }); 
    }

    Eliminar() {
      if (this.authService.GetCargo() !== "ADMINISTRADOR") {
        this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
        return;
      }

      const nroSeleccionados = this.seleccionados.selected.length;

      if (nroSeleccionados === 0) return;

      this.dialogConfig.width = "500px";
      this.dialogConfig.data = { nroRegistros: nroSeleccionados };

      this.dialog.open(EliminarComponent, this.dialogConfig)
        .afterClosed()
        .subscribe(confirmado => {
          if (!confirmado) return;

          const eliminaciones$ = this.seleccionados.selected.map(elemento => {
            // Devolvemos el Observable de eliminación
            return this.productosService.Eliminar(elemento.id!);
          });

          forkJoin(eliminaciones$).subscribe(responses => {
            // Contamos los que respondieron con 'OK'
            const contador = responses.filter(r => r === 'OK').length;

            if (contador === nroSeleccionados) {
              this.Notificaciones.success("Los productos fueron eliminados correctamente");
            } else {
              this.Notificaciones.warning(`Solo ${contador} de ${nroSeleccionados} se eliminaron correctamente.`);
            }

            // Recargar tabla y limpiar selección
            this.Buscar();
            this.seleccionados.clear();
          });
        });
  }
  //#endregion

  //Actualizar precio masivo
  ActualizarPrecio(){
    //Verificamos que haya algun producto seleccionado
    // if(this.seleccionados.selected.length==0)return

    // if(this.seleccionados.selected[0].soloPrecio){
    //   this.Notificaciones.info("Este producto fue marcado para no registrar cantidad")
    //   return;
    // }

    // if(this.authService.GetCargo() == "EMPLEADO"){
    //   if(!this.parametrosService.PermitirCambioPrecio()){
    //     this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    //     return;
    //   }
    // }
    
    // //Obtenemos el nro de registros seleccionados
    // const lstEditar = this.seleccionados.selected.filter(x=>x.tipoPrecio==this.seleccionados.selected[0].tipoPrecio)

    // if(lstEditar.length>0){
    //   this.dialogConfig.width = "100vw";
    //   this.dialogConfig.data = {registros:lstEditar } //Pasa como dato la lista de registros a modificar

    //   //Abrimos la ventana emergente de cambio de precio
    //   this.dialog.open(CambioPrecioComponent, this.dialogConfig)
    //   .afterClosed()
    //   .subscribe((actualizar:boolean) => {
    //     if (actualizar){
    //       this.Buscar(undefined,"",true); //Recarga la tabla
    //       this.seleccionados.clear();
    //     }
    //   });
    // }
  }

  //Anañir cantidad al producto
  AgregarCantidad(){

    //Verificamos que haya algun producto seleccionado
    // if(this.seleccionados.selected.length==0)return
    // if(this.seleccionados.selected[0].soloPrecio){
    //   this.Notificaciones.info("Este producto fue marcado para no registrar cantidad")
    //   return;
    // }

    // this.dialogConfig.width = "400px";
    // this.dialogConfig.data = {producto:this.seleccionados.selected[0] } //Pasa como dato el producto al que se le agrega la cantidad

    // //Abrimos la ventana emergente de cambio agregar-cantidad-producto
    // this.dialog.open(AgregarProductoComponent, this.dialogConfig)
    // .afterClosed()
    // .subscribe((actualizar:boolean) => {
    //   if (actualizar){
    //     this.Buscar(undefined,"",true); //Recarga la tabla
    //     this.seleccionados.clear();
    //   }
    // });
  }

  //Abre la pantalla de impresion de etiquetas
  AbrirEtiquetas(){
    //Verificamos que haya algun producto seleccionado
    // if(this.seleccionados.selected.length==0)return
    
    // const productosImprimir:ProductoImprimir[] = [];
    // this.seleccionados.selected.forEach(prod => {
    //   const producto:ProductoImprimir = new ProductoImprimir();
    //   producto.codigo = prod.codigo;
    //   producto.nombre = prod.nombre;
    //   producto.precio = prod.talles;
    //   producto.vencimiento = prod.vencimiento?.toString();
    //   producto.cantidad = 1;

    //   productosImprimir.push(producto);
    // });

    // this.dialogConfig.width = "100vw";
    // this.dialogConfig.data = {productosImprimir} //Pasa como dato la lista de registros a imprimir

    // //Abrimos la ventana emergente de cambio de precio
    // this.dialog.open(ImpimirEtiquetasComponent, this.dialogConfig)
  }

  //Descarga los resultados en excel
  DescargarResultados(){
    this.filesService.DescargarResultadosExcel(this.filtroActual).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Fecha en formato DD-MM-YY
      const fecha = new Date();
      const dd = String(fecha.getDate()).padStart(2, '0');
      const mm = String(fecha.getMonth() + 1).padStart(2, '0'); // Meses empiezan en 0
      const yy = String(fecha.getFullYear()).slice(-2); // últimos 2 dígitos del año

      const nombreArchivo = `Resultados_${dd}-${mm}-${yy}.xlsx`;

      a.href = url;
      a.download = nombreArchivo; 
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }



  CambioDeVista(){
    if(this.vistaSeleccionada == "grilla"){
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'imagen');
      this.displayedColumns.push('imagen');

      this.parametrosService.SetVistaProductos('grilla')
    }
    else{
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'imagen');
      this.parametrosService.SetVistaProductos('lista')
    }
  }

  AbrirImagen(path:string, id:number){
    this.dialogConfig.width = "600px";
    this.dialogConfig.data = {pathImagen:path, idProducto: id} //Pasa como dato la url de la imagen

    //Abrimos la ventana emergente de imagen-producto
    this.dialog.open(ImagenProductoComponent, this.dialogConfig)
    .afterClosed()
    .subscribe((actualizar:boolean) => {
      if (actualizar){
        this.Buscar(undefined,true); //Recarga la tabla
      }
    });
  }

  //#region FILTROS
   /** Cargar datos los arrays */
  cargarDatos(prop: PropKey, serviceFn: () => Observable<any[]>) {
    serviceFn().subscribe(response => {
      this.filtros[prop].data = response;
      this.filtros[prop].filtrado = response;
    });
  }

  /** Limpiar selección */
  limpiar(prop: PropKey) {
    this.filtros[prop].control.setValue('');
    this.filtros[prop].seleccionado = 0;

    const sinFiltros = Object.values(this.filtros)
    .every(f => f.seleccionado == null || f.seleccionado === 0);

    if(sinFiltros && this.busquedaControl.value == ""){
      this.productos = [];
      this.dataSource = new MatTableDataSource<TablaProducto>(this.productos);
    }
    else{
      this.Buscar();
    }
  }

  /** Selección de un valor */
  onChange(prop: PropKey, event: any) {
    this.filtros[prop].seleccionado = event.value;
    this.Buscar();
  }

  /** Filtrar */
  filtrar(prop: PropKey, event: any) {
    const texto = event.target.value?.toUpperCase() || '';
    this.filtros[prop].filtrado = !texto
      ? this.filtros[prop].data
      : this.filtros[prop].data.filter(s =>
          s.descripcion?.toUpperCase().includes(texto)
        );
  }
  //#endregion
  
}
