import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { Usuario } from 'src/app/models/Usuario';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AddmodUsuariosComponent } from '../addmod-usuarios/addmod-usuarios.component';
import { EliminarComponent } from 'src/app/components/compartidos/eliminar/eliminar.component';
import { AuthService } from 'src/app/services/auth.service';
import { forkJoin, of } from 'rxjs';


@Component({
    selector: 'app-usuarios',
    templateUrl: './main-usuarios.component.html',
    styleUrls: ['./main-usuarios.component.scss'],
    standalone: false
})
export class MainUsuariosComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    usuarios: Usuario[] =[];
    
    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'usuario', 'nombre', 'email', 'cargo']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Usuario>(this.usuarios); //Data source de la tabla
    seleccionados = new SelectionModel<Usuario>(true, []); //Data source de seleccionados

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front

    dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  //#endregion

  constructor( 
  private dialog: MatDialog, //Ventana emergente
  private Notificaciones:NotificacionesService, //Servicio de Notificaciones
  private usuariosService:UsuariosService,
  private authService:AuthService) { }

  ngOnInit(): void {
    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
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

    Buscar(event?: PageEvent, busqueda?:string){
      this.seleccionados.clear();

      //Eventos de la paginación
      if (!event) {
        event = new PageEvent();
        event.pageIndex = 0;
        event.pageSize = this.paginator.pageSize;
      }

      //Creamos el objeto para filtrar registros
      const filtro: FiltroGral = new FiltroGral({
        pagina: event.pageIndex + 1,
        total: event.length,
        tamanioPagina: event.pageSize,
        busqueda: busqueda
      });

      // Obtiene listado de usuarios y el total
      this.usuariosService.ObtenerUsuarios(filtro)
          .subscribe(response => {
            
            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Llenamos la tabla con los resultados
            this.usuarios = [];
            this.usuarios = response.registros;
            this.dataSource = new MatTableDataSource<Usuario>(this.usuarios);
            
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
      if(this.authService.GetCargo() == "ADMINISTRADOR"){
        this.dialogConfig.width = "500px";
        this.dialogConfig.data = {usuario:null};
        this.dialog.open(AddmodUsuariosComponent, this.dialogConfig)
                    .afterClosed()
                    .subscribe((actualizar:boolean) => {
                      if (actualizar)
                      this.Buscar(); //Recarga la tabla
                      this.seleccionados.clear();
                    });
      }else{
        this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
      }
    }

    Modificar(row?:any) { 
      
      let data: any;
      if(row==null){ //Si no hizo doble click sobre una celda y selecciono mas de una
        if(this.seleccionados.selected.length==0)return
        data = this.seleccionados.selected[0];
      }else{ //Si quiere editar solo un registro dando doble click
        data = row;
      }

      if(this.authService.GetCargo() == "ADMINISTRADOR"){
        this.dialogConfig.width = "500px";
        this.dialogConfig.data = {usuario:data} //Pasa como dato el usuario
        this.dialog.open(AddmodUsuariosComponent, this.dialogConfig)
                .afterClosed()
                .subscribe((actualizar:boolean) => {
                  if (actualizar){
                    this.Buscar(); //Recarga la tabla
                    this.seleccionados.clear();
                  }
                });
      }else{
        this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
      }
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
          // Si es el usuario activo, no se elimina
          if (elemento.id?.toString() === this.authService.GetUsuarioId()) {
            this.Notificaciones.warning("No puedes eliminar el usuario activo");
            return of(null); // Emitimos un valor nulo para seguir el flujo
          }
          // Devolvemos el Observable de eliminación
          return this.usuariosService.Eliminar(elemento.id!);
        });

        forkJoin(eliminaciones$).subscribe(responses => {
          // Contamos los que respondieron con 'OK'
          const contador = responses.filter(r => r === 'OK').length;

          if (contador === nroSeleccionados) {
            this.Notificaciones.success("Los usuarios fueron eliminados correctamente");
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
