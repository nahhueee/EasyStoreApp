import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { GlobalErrorHandlerService } from '../../../services/global-error-handler.service';
import { MatPaginator } from '@angular/material/paginator';
import { GlobalesService } from 'src/app/services/globales.service';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmacionComponent } from '../../compartidos/confirmacion/confirmacion.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-errores',
    templateUrl: './errores.component.html',
    styleUrls: ['./errores.component.scss'],
    standalone: false
})
export class ErroresComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['message', 'timestamp', 'level'];
  dataSource: any[] = []; // Lista de errores mostrados en la tabla
  @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front

  logsGenerales = new MatTableDataSource<any>([]);
  logsFacturacion = new MatTableDataSource<any>([]);
  logsBackups = new MatTableDataSource<any>([]);
  logsUpdates = new MatTableDataSource<any>([]);
    
  tabIndex = 0;
  dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  constructor( 
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private globalesService:GlobalesService,
    private authService:AuthService
  ) { }
  
  ngOnInit(){
    this.ObtenerLogsGenerales();
    this.ObtenerLogsFacturacion();
    this.ObtenerLogsBackups();
    this.ObtenerLogsUpdate();
  }
  
  ngAfterViewInit() { 
    this.paginator._intl.itemsPerPageLabel = 'Items por página';
  }

  ObtenerLogsGenerales(){
    this.globalesService.ObtenerLogsGenerales()
      .subscribe(response => {
        this.logsGenerales.data = response.reverse();
        this.logsGenerales.paginator = this.paginator;
      });
  }

  ObtenerLogsFacturacion(){
    this.globalesService.ObtenerLogsFacturacion()
      .subscribe(response => {
        this.logsFacturacion.data = response.reverse();
      });
  }

  ObtenerLogsBackups(){
    this.globalesService.ObtenerLogsBackup()
      .subscribe(response => {
        this.logsBackups.data = response.reverse();
      });
  }

  ObtenerLogsUpdate(){
    this.globalesService.ObtenerLogsUpdate()
      .subscribe(response => {
        this.logsUpdates.data = response.reverse();
      });
  }

  TabChange(index:number){
    this.tabIndex = index;

    switch (this.tabIndex) {
      case 0:{
        this.logsGenerales.paginator = this.paginator;
        break;
      }
      case 1:{
        this.logsFacturacion.paginator = this.paginator;
        break;
      }
      case 2:{
        this.logsBackups.paginator = this.paginator;
        break;
      }
      case 3:{
        this.logsUpdates.paginator = this.paginator;
        break;
      }
    }
  }
  
  getCurrentDataSource(): MatTableDataSource<any> {
    switch (this.tabIndex) {
      case 0: return this.logsGenerales;
      case 1: return this.logsFacturacion;
      case 2: return this.logsBackups;
      case 3: return this.logsUpdates;
      default: return new MatTableDataSource<any>([]);
    }
  }

  LimpiarRegistros(){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      this.dialogConfig.width = "400px";
      this.dialogConfig.data = {mensaje:"Se va a limpiar la lista de registros"};

      //Abrimos la ventana emergente para confirmar la eliminación
      this.dialog.open(ConfirmacionComponent, this.dialogConfig)
                .afterClosed()
                .subscribe(async (confirmado: boolean) => {
                  if (confirmado) {
                    this.globalesService.ClearLogs()
                    .subscribe(response => {
                      
                      if(response=="OK"){
                        this.Notificaciones.success(`Lista de registros vaciada correctamente`);
                        this.ObtenerLogsGenerales();
                        this.ObtenerLogsFacturacion();
                        this.ObtenerLogsBackups();
                        this.ObtenerLogsUpdate();
                      }

                    });
                  }
                });
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }
  }
}
