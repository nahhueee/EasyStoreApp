import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EliminarComponent } from 'src/app/components/compartidos/eliminar/eliminar.component';
import { Etiqueta } from 'src/app/models/Etiqueta';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { AuthService } from 'src/app/services/auth.service';
import { EtiquetasService } from 'src/app/services/etiquetas.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-etiquetas',
    templateUrl: './main-etiquetas.component.html',
    styleUrls: ['./main-etiquetas.component.scss'],
    standalone: false
})
export class MainEtiquetasComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    etiquetas: Etiqueta[] =[];
    filtroActual: FiltroGral;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'descripcion']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Etiqueta>(this.etiquetas); //Data source de la tabla
    seleccionados = new SelectionModel<Etiqueta>(true, []); //Data source de seleccionados

    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front

    dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  //#endregion

  constructor(
    private router:Router, //Servicio para navegar en la aplicacion
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private etiquetasService:EtiquetasService,
    private authService:AuthService) {}

  ngOnInit(): void {
    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.maxHeight = "90vh";
  }

  ngAfterViewInit() {
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
    
    Buscar(busqueda = ""){
      this.seleccionados.clear();

      // Obtiene listado de clientes y el total
      this.etiquetasService.ObtenerEtiquetas(busqueda)
          .subscribe(response => {
            //Llenamos la tabla con los resultados
            this.etiquetas = [];
            this.etiquetas = response;
            this.dataSource = new MatTableDataSource<Etiqueta>(this.etiquetas);
            
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
      this.router.navigateByUrl(`/administrar-etiqueta/0`); 
    }

    Modificar(row?:any) { 
      let data: any;
      if(row==null){ //Si no hizo doble click sobre una celda y selecciono mas de una
        if(this.seleccionados.selected.length == 0)return
        data = this.seleccionados.selected[0];
      }else{ //Si quiere editar solo un registro dando doble click
        data = row;
      }
      this.router.navigateByUrl(`/administrar-etiqueta/${data.id}`);
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
            return this.etiquetasService.Eliminar(elemento.id!);
          });

          forkJoin(eliminaciones$).subscribe(responses => {
            // Contamos los que respondieron con 'OK'
            const contador = responses.filter(r => r === 'OK').length;

            if (contador === nroSeleccionados) {
              this.Notificaciones.success("Las etiquetas fueron eliminados correctamente");
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
  ImprimirProductos(){
    
  }
  //#endregion
}
