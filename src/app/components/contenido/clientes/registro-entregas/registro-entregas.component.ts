import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { RegistroEntrega } from 'src/app/models/RegistroEntrega';
import { AuthService } from 'src/app/services/auth.service';
import { CuentasCorrientesService } from 'src/app/services/cuentas-corrientes.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-registro-entregas',
    templateUrl: './registro-entregas.component.html',
    styleUrls: ['./registro-entregas.component.scss'],
    standalone: false
})
export class RegistroEntregasComponent implements AfterViewInit {
  registros: RegistroEntrega[] = [];
  displayedColumns: string[] = ['fecha', 'monto']; //Columnas a mostrar
  dataSource = new MatTableDataSource<RegistroEntrega>(this.registros); //Data source de la tabla
  @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front

  dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<RegistroEntregasComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private cuentasService:CuentasCorrientesService,
    private authService:AuthService,
    private dialog: MatDialog, //Ventana emergente
  ){}

  ngAfterViewInit() {
      this.paginator._intl.itemsPerPageLabel = 'Items por página';
  
      setTimeout(() => {
        //Obtenemos los datos de tabla
        this.Buscar();
      }, 0.5);
    }
  
  Buscar(event?: PageEvent){
    
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
      idCliente: this.data.idCliente
    });
    
    // Obtiene listado de ventas y el total
    this.cuentasService.ObtenerRegistros(filtro)
        .subscribe(response => {
          
          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Llenamos la tabla con los resultados
          this.registros = [];
          this.registros = response.registros;
          this.dataSource = new MatTableDataSource<RegistroEntrega>(this.registros);
        });

  }

  RevertirUltimaEntrega(){
    if (this.authService.GetCargo() !== "ADMINISTRADOR") {
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
      return;
    }



    this.dialogConfig.width = "400px";
    this.dialogConfig.data = {mensaje:"¿Estas seguro de revertir la última entrega de dinero?. Esto puede afectar varias ventas."};

    this.dialog.open(ConfirmacionComponent, this.dialogConfig)
    .afterClosed()
    .subscribe((actualizar:boolean) => {
      if (actualizar){
        this.cuentasService.RevertirUltimaEntrega(this.registros[0].id!)
        .subscribe(response => {
          if(response=='OK'){
            this.Notificaciones.success("Se revirtió correctamente la última entrega");
            this.dialogRef.close(true);
          }else{
            this.Notificaciones.warning(response);
          }
        });
      }
    });
  }
}
