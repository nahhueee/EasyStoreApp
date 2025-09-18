import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Cliente } from 'src/app/models/Cliente';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { ClientesService } from 'src/app/services/clientes.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Router } from '@angular/router';
import { AddmodClientesComponent } from '../addmod-clientes/addmod-clientes.component';
import { EliminarComponent } from 'src/app/components/compartidos/eliminar/eliminar.component';
import { AuthService } from 'src/app/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-clientes',
    templateUrl: './main-clientes.component.html',
    styleUrls: ['./main-clientes.component.scss'],
    standalone: false
})
export class MainClientesComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    clientes: Cliente[] =[];
    filtroActual: FiltroGral;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'nombre', 'email', 'telefono', 'condicion', 'documento']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Cliente>(this.clientes); //Data source de la tabla
    seleccionados = new SelectionModel<Cliente>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front

    dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  //#endregion

  constructor(
    private router:Router, //Servicio para navegar en la aplicacion
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private clientesService:ClientesService,
    private authService:AuthService) {}

  ngOnInit(): void {
    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.maxHeight = "90vh";
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
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
        this.filtroActual = new FiltroGral({
          pagina: event.pageIndex + 1,
          total: event.length,
          tamanioPagina: event.pageSize,
          busqueda: busqueda
        });
      }
      
      // Obtiene listado de clientes y el total
      this.clientesService.ObtenerClientes(this.filtroActual)
          .subscribe(response => {
            
            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Llenamos la tabla con los resultados
            this.clientes = [];
            this.clientes = response.registros;
            this.dataSource = new MatTableDataSource<Cliente>(this.clientes);
            
            //DT de la tabla va a ser igual a lo que ordenamos con Sort
            this.dataSource.sort = this.sort;
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
      this.dialogConfig.width = "500px";
      this.dialogConfig.data = {cliente:null};
      this.dialog.open(AddmodClientesComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar)
                    this.Buscar(); //Recarga la tabla
                    this.seleccionados.clear();
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

      
      this.dialogConfig.width = "500px";
      this.dialogConfig.data = {cliente:data} //Pasa como dato el cliente
      this.dialog.open(AddmodClientesComponent, this.dialogConfig)
              .afterClosed()
              .subscribe((actualizar:boolean) => {
                if (actualizar){
                  this.Buscar(undefined,"",true); //Recarga la tabla
                  this.seleccionados.clear();
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
            return this.clientesService.Eliminar(elemento.id!);
          });

          forkJoin(eliminaciones$).subscribe(responses => {
            // Contamos los que respondieron con 'OK'
            const contador = responses.filter(r => r === 'OK').length;

            if (contador === nroSeleccionados) {
              this.Notificaciones.success("Los clientes fueron eliminados correctamente");
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

  //#region HERRAMIENTAS
  VentasCliente() { 
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      if(this.seleccionados.selected.length==0) return;
      if(this.seleccionados.selected[0].id === 1) return;

      this.router.navigate([`/clientes/ventas/${this.seleccionados.selected[0].id}`]);
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }
  }
  //#endregion
}
