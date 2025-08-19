import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EliminarComponent } from 'src/app/components/compartidos/eliminar/eliminar.component';
import { Movimiento } from 'src/app/models/Movimiento';
import { TipoMovimiento } from 'src/app/models/TipoMovimiento';
import { FiltroMovimiento } from 'src/app/models/filtros/filtroMovimiento';
import { MovimientosService } from 'src/app/services/movimientos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { AddMovimientosComponent } from '../add-movimientos/add-movimientos.component';
import { AuthService } from 'src/app/services/auth.service';
import { forkJoin } from 'rxjs';


@Component({
    selector: 'app-movimientos',
    templateUrl: './main-movimientos.component.html',
    styleUrls: ['./main-movimientos.component.scss'],
    standalone: false
})
export class MainMovimientosComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    movimientos: Movimiento[] =[];

    tiposMovimiento: TipoMovimiento[] =[
      {id: 0, descripcion: "Todos los Movimientos"},
      {id: 1, descripcion: "Entradas"},
      {id: 2, descripcion: "Salidas"}
    ];
    
    tipoControl = new FormControl(0)

    displayedColumns: string[] = ['select', 'tipo', 'monto', 'descripcion']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Movimiento>(this.movimientos); //Data source de la tabla
    seleccionados = new SelectionModel<Movimiento>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @Input() idCaja: number; //Id de la caja actual
    @Input() estadoCaja: string; //Estado de la caja actual

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  //#endregion

  constructor(
  private dialog: MatDialog, //Ventana emergente
  private Notificaciones:NotificacionesService, //Servicio de Notificaciones
  private movimientosService:MovimientosService,
  private authService:AuthService) {}

  ngOnInit(): void {
    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
    }, 0.5);
  }

  //#region TABLA
   //Marca como seleccionada la fila a la cual hizo click
   OnCellClick(row:any){
    if(row!=null||row!=undefined){
        setTimeout(() => {
          this.seleccionados.toggle(row)
        }, 250)
      }
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
    
    Buscar(event?: PageEvent){
      //Eventos de la paginación
      if (!event) {
        event = new PageEvent();
        event.pageIndex = 0;
        event.pageSize = this.paginator.pageSize;
      }

      //Creamos el objeto para filtrar registros
      const filtro: FiltroMovimiento = new FiltroMovimiento({
        pagina: event.pageIndex + 1,
        total: event.length,
        tamanioPagina: event.pageSize,
        caja: this.idCaja,
        tipoMovimiento: this.tipoControl.value
      });

      
      // Obtiene listado de movimeintos y el total
      this.movimientosService.ObtenerMovimientos(filtro)
          .subscribe(response => {
            
            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Llenamos la tabla con los resultados
            this.movimientos = [];
            this.movimientos = response.registros;
            this.dataSource = new MatTableDataSource<Movimiento>(this.movimientos);
          });
    }
  //#endregion

  //#region MODAL/ABM
    Agregar(){
      if(this.estadoCaja == "FINALIZADA"){
        this.Notificaciones.warning("No puedes agregar movimientos en una caja FINALIZADA");
        return;
      }

      this.dialogConfig.width = "600px";
      this.dialogConfig.data = {idCaja: this.idCaja};
      this.dialog.open(AddMovimientosComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.Buscar(); //Recarga la tabla
                      this.seleccionados.clear();
                    }
                  });;
    }

    Eliminar(){    
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
            return this.movimientosService.Eliminar(elemento);
          });

          forkJoin(eliminaciones$).subscribe(responses => {
            // Contamos los que respondieron con 'OK'
            const contador = responses.filter(r => r === 'OK').length;

            if (contador === nroSeleccionados) {
              this.Notificaciones.success("Los movimientos fueron eliminados correctamente");
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
}
