import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, HostListener, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { AddmodProductosComponent } from '../addmod-productos/addmod-productos.component';
import { EliminarComponent } from '../../../compartidos/eliminar/eliminar.component';
import { ProductosService } from 'src/app/services/productos.service';
import { CambioPrecioComponent } from '../cambio-precio/cambio-precio.component';
import { AgregarProductoComponent } from '../agregar-producto/agregar-producto.component';
import { environment } from 'src/environments/environment';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ImagenProductoComponent } from '../imagen-producto/imagen-producto.component';
import { AuthService } from 'src/app/services/auth.service';
import { FilesService } from 'src/app/services/files.service';
import { Router } from '@angular/router';
import { BusquedaComponent } from 'src/app/components/compartidos/busqueda/busqueda.component';
import { of, forkJoin } from 'rxjs';
import { ImpimirEtiquetasComponent } from '../impimir-etiquetas/impimir-etiquetas.component';
import { ProductoImprimir } from 'src/app/models/ProductoImprimir';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';

@Component({
    selector: 'app-productos',
    templateUrl: './main-productos.component.html',
    styleUrls: ['./main-productos.component.scss'],
    standalone: false
})
export class MainProductosComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    productos: Producto[] =[];
    filtroActual: FiltroProducto;
    vistaSeleccionada = "lista"

    tipoImportacionExcel:string;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'codigo', 'nombre', 'cantidad', 'unidad', 'precio']; //Columnas a mostrar
    adminColumns: string[] = [ 'costo', 'tipoPrecio'] //Columnas a mostrar para admin
    
    dataSource = new MatTableDataSource<Producto>(this.productos); //Data source de la tabla
    seleccionados = new SelectionModel<Producto>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front
    @ViewChild('btnAgregar') btnAgregar!: ElementRef<HTMLButtonElement>;
    @ViewChild(BusquedaComponent) busquedaComponent!: BusquedaComponent;

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
    pantalla: any = 0;
  //#endregion

  constructor(
    private router:Router,
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private parametrosService: ParametrosService,
    private productosService:ProductosService,
    private authService:AuthService,
    private filesService:FilesService) {}

  
  //Obtiene el tamaño actual de la pantalla 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
  this.pantalla = window.innerWidth;
  }
  
  ngOnInit(): void {
    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla

    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.maxHeight = "90vh";

    this.vistaSeleccionada = this.parametrosService.GetVistaProductos();
    this.CambioDeVista();
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    this.sort.sortChange.subscribe(() => {
      this.Buscar(); 
    });

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
      this.btnAgregar.nativeElement.focus();
    }, 0.5);
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
    
    Buscar(event?: PageEvent, busqueda?:string, recargaConFiltro = false){
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
          busqueda: busqueda,
          orden: this.sort.active,
          direccion: this.sort.direction
        });
      }
     
      // Obtiene listado de productos y el total
      this.productosService.ObtenerProductos(this.filtroActual)
          .subscribe(response => {
            
            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Agrega campos extras si es administrador
            if (this.authService.GetCargo() === "ADMINISTRADOR") {
              // Filtramos para evitar duplicados
              const columnasFaltantes = this.adminColumns.filter(col => !this.displayedColumns.includes(col));
              this.displayedColumns.push(...columnasFaltantes);
            }

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

            this.dataSource = new MatTableDataSource<Producto>(this.productos);
            
            //Edicion rapida
            //Si esta activo el parametro, en a busqueda si encuentra un resultado unico lo pone en editar
            //Si no encuentra te permite agregarlo
            if(this.parametrosService.GetEdicionResultadoUnico() && !recargaConFiltro && busqueda){
              if(this.productos.length===1)
                this.Modificar(this.productos[0]);
              else if(this.productos.length===0)
                this.Agregar();
            }
          });
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
      this.dialogConfig.width = "900px";
      this.dialogConfig.data = {cliente:null};
      this.dialog.open(AddmodProductosComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.Buscar(); //Recarga la tabla
                      this.seleccionados.clear();

                      //Si no esta activo el parametro hacemos foco en el boton agregar
                      if(!this.parametrosService.GetEdicionResultadoUnico())
                        this.btnAgregar.nativeElement.focus();
                      else //De lo contrario hacemos foco en el input de busqueda
                        this.busquedaComponent.FocusInput();

                    }
                  });;
    }

    Modificar(row?:any) { 
      
      let data: any;
      if(row==null){ //Si no hizo doble click sobre una celda y selecciono mas de una
        if(this.seleccionados.selected.length==0)return
        data = this.seleccionados.selected[0];
      }else{ //Si quiere editar solo un registro dando doble click
        data = row;
      }

      this.dialogConfig.width = "900px";
      this.dialogConfig.data = {producto:data} //Pasa como dato el cliente
      this.dialog.open(AddmodProductosComponent, this.dialogConfig)
              .afterClosed()
              .subscribe((actualizar:boolean) => {
                if (actualizar){
                  this.Buscar(undefined,"",true); //Recarga la tabla
                  this.seleccionados.clear();

                  //Si no esta activo el parametro hacemos foco en el boton agregar
                  if(!this.parametrosService.GetEdicionResultadoUnico())
                    this.btnAgregar.nativeElement.focus();
                  else //De lo contrario hacemos foco en el input de busqueda
                    this.busquedaComponent.FocusInput();

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
    if(this.seleccionados.selected.length==0)return

    if(this.seleccionados.selected[0].soloPrecio){
      this.Notificaciones.info("Este producto fue marcado para no registrar cantidad")
      return;
    }

    if(this.authService.GetCargo() == "EMPLEADO"){
      if(!this.parametrosService.PermitirCambioPrecio()){
        this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
        return;
      }
    }
    
    //Obtenemos el nro de registros seleccionados
    const lstEditar = this.seleccionados.selected.filter(x=>x.tipoPrecio==this.seleccionados.selected[0].tipoPrecio)

    if(lstEditar.length>0){
      this.dialogConfig.width = "100vw";
      this.dialogConfig.data = {registros:lstEditar } //Pasa como dato la lista de registros a modificar

      //Abrimos la ventana emergente de cambio de precio
      this.dialog.open(CambioPrecioComponent, this.dialogConfig)
      .afterClosed()
      .subscribe((actualizar:boolean) => {
        if (actualizar){
          this.Buscar(undefined,"",true); //Recarga la tabla
          this.seleccionados.clear();
        }
      });
    }
  }

  //Anañir cantidad al producto
  AgregarCantidad(){

    //Verificamos que haya algun producto seleccionado
    if(this.seleccionados.selected.length==0)return
    if(this.seleccionados.selected[0].soloPrecio){
      this.Notificaciones.info("Este producto fue marcado para no registrar cantidad")
      return;
    }

    this.dialogConfig.width = "400px";
    this.dialogConfig.data = {producto:this.seleccionados.selected[0] } //Pasa como dato el producto al que se le agrega la cantidad

    //Abrimos la ventana emergente de cambio agregar-cantidad-producto
    this.dialog.open(AgregarProductoComponent, this.dialogConfig)
    .afterClosed()
    .subscribe((actualizar:boolean) => {
      if (actualizar){
        this.Buscar(undefined,"",true); //Recarga la tabla
        this.seleccionados.clear();
      }
    });
  }

  //Abre la lista de faltantes de productos
  AbrirFaltantes(){
    this.router.navigateByUrl("productos/faltantes");
  }

  //Abre la lista de vencimientos de productos
  AbrirVencimientos(){
    this.router.navigateByUrl("productos/vencimientos");
  }

  //Abre la pantalla de impresion de etiquetas
  AbrirEtiquetas(){
    //Verificamos que haya algun producto seleccionado
    if(this.seleccionados.selected.length==0)return
    
    const productosImprimir:ProductoImprimir[] = [];
    this.seleccionados.selected.forEach(prod => {
      const producto:ProductoImprimir = new ProductoImprimir();
      producto.codigo = prod.codigo;
      producto.nombre = prod.nombre;
      producto.precio = prod.precio;
      producto.vencimiento = prod.vencimiento?.toString();
      producto.cantidad = 1;

      productosImprimir.push(producto);
    });

    this.dialogConfig.width = "100vw";
    this.dialogConfig.data = {productosImprimir} //Pasa como dato la lista de registros a imprimir

    //Abrimos la ventana emergente de cambio de precio
    this.dialog.open(ImpimirEtiquetasComponent, this.dialogConfig)
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
        this.Buscar(undefined,"",true); //Recarga la tabla
      }
    });
  }

  //Importar Excel

  seleccionarExcel(){
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.click(); // Simula un clic en el input de tipo file al hacer clic en el botón personalizado
    }
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('excel', file);

    this.filesService.ImportarExcel(file, this.tipoImportacionExcel)
      .subscribe(response => {
        if(response){
          this.filesService.setDatosExcel(response);
          this.router.navigate(['/administrar-excel/' + this.tipoImportacionExcel]);

        } else{
          this.Notificaciones.error("Ocurrió un error al intentar procesar el archivo de excel.")
        }
      });
  }
}
