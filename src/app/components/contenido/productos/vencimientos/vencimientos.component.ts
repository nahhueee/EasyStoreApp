import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BusquedaComponent } from 'src/app/components/compartidos/busqueda/busqueda.component';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';
import { Producto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ActualizarVencimientosComponent } from '../actualizar-vencimientos/actualizar-vencimientos.component';

@Component({
    selector: 'app-vencimientos',
    templateUrl: './vencimientos.component.html',
    styleUrls: ['./vencimientos.component.scss'],
    standalone: false
})
export class VencimientosComponent implements AfterViewInit {
  //#region VARIABLES
    productos: Producto[] =[];
    filtroActual: FiltroProducto;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'codigo', 'nombre', 'vencimiento']; //Columnas a mostrar
    
    dataSource = new MatTableDataSource<Producto>(this.productos); //Data source de la tabla
    seleccionados = new SelectionModel<Producto>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front
    @ViewChild(BusquedaComponent) busquedaComponent!: BusquedaComponent;

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
    pantalla: any = 0;
  //#endregion

  constructor(
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private productosService:ProductosService,
    private router:Router
  ) {}

  ngAfterViewInit(){
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.maxHeight = "auto";

    this.sort.sortChange.subscribe(() => {
      this.Buscar(); 
    });

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
    }, 0.5);
  }


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
        direccion: this.sort.direction,
        faltantes:false,
        vencimientos:true
      });
    }
    
    // Obtiene listado de productos y el total
    this.productosService.ObtenerProductos(this.filtroActual)
        .subscribe(response => {

          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Llenamos la tabla con los resultados
          this.productos = [];
          this.productos = response.registros;

          this.productos.forEach(element => {
            element.estadoVencimiento = this.EstaVencido(element.vencimiento!.toString());
          });

          this.dataSource = new MatTableDataSource<Producto>(this.productos);
    });
  }

  //Evento que sirve para saber si se hace un click o dos sobre una celda y realizar acción al respecto
  OnCellClick(row:any){
    if(row!=null||row!=undefined){

      this.clickCount++;
      setTimeout(() => {
          this.seleccionados.toggle(row)

          if (this.clickCount === 2) 
            this.ActualizarFechaVencimiento()
          
          this.clickCount = 0;
      }, 250)

    }
  }

  ActualizarFechaVencimiento(){
    if(this.seleccionados.selected.length==0)return

    this.dialogConfig.width = "500px";
    this.dialogConfig.data = {registros:this.seleccionados.selected } //Pasa como dato la lista de registros a modificar

    this.dialog.open(ActualizarVencimientosComponent, this.dialogConfig)
    .afterClosed()
    .subscribe((actualizar:boolean) => {
      if (actualizar){
        this.Buscar(undefined,"",true); //Recarga la tabla
        this.seleccionados.clear();
      }
    });
  }

  Cerrar(){
    this.router.navigateByUrl("navegacion/inventario");
  }

  EstaVencido(vencimiento: string): number{
    //0 no esta vencido ni en advertencia
    //1 está vencido
    //2 está en advertencia
    const [dia, mes, anio] = vencimiento.split("-").map(Number);
    const fechaVenc = new Date(anio, mes - 1, dia);

    const fechaLimiteVenc = new Date();
    const fechaAdvertencia = new Date();

    //Sumamos un dia, si un producto está a un día de vencer, lo consideramos vencido
    fechaLimiteVenc.setDate(fechaLimiteVenc.getDate() + 5); 

    //Sumamos a la fechaLimiteVenc 35 dias para poner una advertencia a productos que estan pronto a vencer
    fechaAdvertencia.setDate(fechaLimiteVenc.getDate() + 35)

    if(fechaVenc <= fechaLimiteVenc){
      return 1;
    }else if(fechaVenc <= fechaAdvertencia){
      return 2;
    }
    return 0;
  }
}
