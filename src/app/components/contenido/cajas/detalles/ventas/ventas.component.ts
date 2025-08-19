import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { EliminarComponent } from 'src/app/components/compartidos/eliminar/eliminar.component';
import { DetalleVenta } from 'src/app/models/DetalleVenta';
import { Venta } from 'src/app/models/Venta';
import { FiltroVenta } from 'src/app/models/filtros/FiltroVenta';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { VentasService } from 'src/app/services/ventas.service';
import { ParametrosService } from '../../../../../services/parametros.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { ComprobanteService } from 'src/app/services/comprobante.service';
import { DatosFacturacionComponent } from '../datos-facturacion/datos-facturacion.component';
import { FacturaVenta } from 'src/app/models/FacturaVenta';

@Component({
    selector: 'app-ventas',
    templateUrl: './ventas.component.html',
    styleUrls: ['./ventas.component.scss'],
    standalone: false
})
export class VentasComponent implements AfterViewInit {
  //#region VARIABLES
    ventaSeleccionada: Venta;
    seleccionoVenta: boolean;
    ventas: Venta[] = [];
    detallesVenta: DetalleVenta[] = [];

    displayedColumns: string[] = ['hora', 'cliente', 'total', 'pagado', 'tpago', 'facturado']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Venta>(this.ventas); //Data source de la tabla
    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front

    displayedColumnsDetventa: string[] = ['producto', 'cantidad', 'precio', 'total']; //Columnas a mostrar para el detalle
    dtDetalleVenta = new MatTableDataSource<DetalleVenta>(this.detallesVenta); //Data source de la tabla de detalles
    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

    @Input() idCaja: number; //Id de la caja actual
    esApp:boolean;
    sinPermisos:boolean;
  //#endregion

  constructor(
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private ventasService:VentasService,
    private authService:AuthService,
    private parametrosService:ParametrosService,
    private comprobanteService:ComprobanteService
  ){
    this.esApp = environment.tauri;
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
    }, 0.5);
  }

  //#region TABLA VENTAS
  Buscar(event?: PageEvent){
     
    //Eventos de la paginación
    if (!event) {
      event = new PageEvent();
      event.pageIndex = 0;
      event.pageSize = this.paginator.pageSize;
    }

    //Creamos el objeto para filtrar registros
    const filtro: FiltroVenta = new FiltroVenta({
      pagina: event.pageIndex + 1,
      total: event.length,
      tamanioPagina: event.pageSize,
      caja: this.idCaja,
      cliente: 0,
      estado: ""
    });

    
    // Obtiene listado de ventas y el total
    this.ventasService.ObtenerVentas(filtro)
        .subscribe(response => {

          //Llenamos el total del paginador
          this.paginator.length = response.total;


          //Agrega campos extras si es administrador
          if (this.authService.GetCargo() === "EMPLEADO" && !this.parametrosService.PermitirVentasyTotales()) {
            this.sinPermisos = true;
            this.displayedColumns = this.displayedColumns.filter(col => col !== 'total');
          }

          //Llenamos la tabla con los resultados
          this.ventas = [];
          this.ventas = response.registros;
          this.dataSource = new MatTableDataSource<Venta>(this.ventas);
        });
  }

  //Elimina la venta seleccionada
  Eliminar(){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      //Configuraciones básicas de la ventana emergente 
      this.dialogConfig.disableClose = true;
      this.dialogConfig.autoFocus = true;
      this.dialogConfig.height = "auto";
      this.dialogConfig.width = "500px";
      this.dialogConfig.data = {nroRegistros:1} //Pasa como dato el numero de registros a borrar

      //Abrimos la ventana emergente para confirmar la eliminación
      this.dialog.open(EliminarComponent, this.dialogConfig)
                .afterClosed()
                .subscribe(async (confirmado: boolean) => {
                  if (confirmado) {

                    this.ventasService.Eliminar(this.ventaSeleccionada)
                    .subscribe(response => {
                      if(response=='OK'){
                        this.Notificaciones.success("Venta eliminada correctamente.");
                        this.ventaSeleccionada = new Venta();
                        this.seleccionoVenta = false;
                        
                        this.Buscar();
                      }else{
                        this.Notificaciones.warning(response);
                      }
                    });

                  }
                })

    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }
  }
  //#endregion

  MostrarDetalle(index:number){
      this.seleccionoVenta = true;
      this.ventaSeleccionada = new Venta();
      this.ventaSeleccionada = this.ventas[index];

      //Desmarcamos todas las ventas, y marcamos la seleccionada
      this.ventas.forEach(venta => venta.activa = false);
      this.ventas[index].activa = true;

      this.detallesVenta = [];
      this.detallesVenta = this.ventaSeleccionada.detalles;
      this.dtDetalleVenta = new MatTableDataSource<DetalleVenta>(this.detallesVenta);
  }


  //#region PDF
  async VerComprobante(tipo:string) {
    this.comprobanteService.VerComprobante(tipo, this.ventaSeleccionada);
  }

  async ImprimirComprobante(tipo:string){
    this.comprobanteService.ImprimirComprobante(tipo, this.ventaSeleccionada);
  }

  Facturar(){
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
    this.dialogConfig.width = "500px";

    this.dialogConfig.data = {total: this.ventaSeleccionada.total}
    this.dialog.open(DatosFacturacionComponent, this.dialogConfig)
            .afterClosed()
            .subscribe((respFacturacion:any) => {
              if(respFacturacion){

                if(respFacturacion.resultado === "Aprobado"){
                  this.GuardarFactura(respFacturacion.factura);
                }else if(respFacturacion.resultado === "Rechazado"){
                  this.Notificaciones.warning("Ocurrió uno o mas errores al intentar facturar.")
                  this.Notificaciones.info("Revisa los registros para más detalle, o consulta al equipo de desarrollo.")
                }
                  
              }
            });
  }

  GuardarFactura(factura:FacturaVenta){
    this.ventasService.GuardarFactura(factura, this.ventaSeleccionada.id!)
      .subscribe(response => {

       if(response=="OK"){
        this.Notificaciones.success("Factura realizada correctamente, ya puedes imprimir el comprobante.")
        this.Buscar();
        this.seleccionoVenta = false;
       }else{
        this.Notificaciones.error("Ocurrió un error intentando guardar los datos de facturacion.")
       }
    });

  }
  //#endregion
}
