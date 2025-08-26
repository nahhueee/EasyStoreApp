import { formatDate } from '@angular/common';
import { Component, Inject, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Cliente } from 'src/app/models/Cliente';
import { DetalleVenta } from 'src/app/models/DetalleVenta';
import { Venta } from 'src/app/models/Venta';
import { FiltroVenta } from 'src/app/models/filtros/FiltroVenta';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { VentasService } from 'src/app/services/ventas.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from 'src/app/services/clientes.service';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { EntregaVentasComponent } from '../entrega-ventas/entrega-ventas.component';
import { AuthService } from 'src/app/services/auth.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { CuentasCorrientesService } from 'src/app/services/cuentas-corrientes.service';
import { RegistroEntregasComponent } from '../registro-entregas/registro-entregas.component';

@Component({
    selector: 'app-ventas-clientes',
    templateUrl: './ventas-clientes.component.html',
    styleUrls: ['./ventas-clientes.component.scss'],
    standalone: false
})
export class VentasClientesComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    titulo='Ventas y Deudas Cliente';
    estado = "Impagas";
    decimal_mask: any;

    idCliente: number;
    cliente: Cliente = new Cliente();
    verVentasPagas:boolean;
    
    ventaSeleccionada: Venta;
    seleccionoVenta: boolean;
    ventas: Venta[] = [];
    detallesVenta: DetalleVenta[] = [];
    totalDeuda = 0;
    advertencia = "";

    totalActualizado = 0;
    prodActualizados = 0;

    displayedColumns: string[] = ['fecha', 'total', 'entrega', 'restante', 'accion']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Venta>(this.ventas); //Data source de la tabla
    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front

    displayedColumnsDetventa: string[] = ['producto', 'cantidad', 'precio', 'total']; //Columnas a mostrar para el detalle
    dtDetalleVenta = new MatTableDataSource<DetalleVenta>(this.detallesVenta); //Data source de la tabla de detalles

    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  //#endregion

  constructor(
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private dialog: MatDialog, //Ventana emergente
    private Notificaciones:NotificacionesService, //Servicio de Notificaciones
    private ventasService:VentasService,
    private clientesService:ClientesService,
    private cuentasService:CuentasCorrientesService,
    private authService:AuthService,
    private parametrosService:ParametrosService
  ){}

  ngOnInit(){
    //Obtenemos el id del cliente desde la url
    this.idCliente = this.rutaActiva.snapshot.params['idCliente'];
    this.ObtenerCliente();
    this.verVentasPagas = this.parametrosService.VerVentasCliente();
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
    }, 0.5);
  }

  ObtenerCliente(){
    this.clientesService.ObtenerCliente(this.idCliente)
    .subscribe(response => {
      this.cliente = new Cliente(response);
    });
  }

  Cerrar(){
    this.router.navigate([`navegacion/clientes/`]);
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
      caja: 0,
      cliente: this.idCliente,
      estado: this.estado
    });

    if(this.estado=="Impagas")
      this.totalDeuda = 0;
    
    // Obtiene listado de ventas y el total
    this.ventasService.ObtenerVentas(filtro)
        .subscribe(response => {
          
          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Llenamos la tabla con los resultados
          this.ventas = [];
          this.ventas = response.registros;
          this.dataSource = new MatTableDataSource<Venta>(this.ventas);
        });

    // Obtiene total de deuda
    this.cuentasService.ObtenerTotalDeuda(this.idCliente)
      .subscribe(response => {
        this.totalDeuda = response;
      });
  }
  //#endregion

  MostrarDetalle(index:number){
      this.seleccionoVenta = true;
      this.ventaSeleccionada = new Venta();
      this.ventaSeleccionada = this.ventas[index];
      this.advertencia = "";

      //Desmarcamos todas las ventas, y marcamos la seleccionada
      this.ventas.forEach(venta => venta.activa = false);
      this.ventas[index].activa = true;

      this.detallesVenta = [];
      this.detallesVenta = this.ventaSeleccionada.detalles;
      this.dtDetalleVenta = new MatTableDataSource<DetalleVenta>(this.detallesVenta);

      //Calculamos el total de la venta actualizada 
      //e identificamos que productos actualizaron su precio
      //A modo de ver si el precio en que se realizo la venta es el mismo al actual
      this.totalActualizado = 0;
      this.prodActualizados = 0;
      
      // for (let i = 0; i < this.detallesVenta.length; i++) {
      //   const precioActualizado: number = this.detallesVenta[i].producto?.precio!;
      //   const precioVenta: number = this.detallesVenta[i].precio!;

      //   if(this.detallesVenta[i].producto?.nombre!='VARIOS' && this.detallesVenta[i].producto?.soloPrecio == false){
      //     this.totalActualizado += (precioActualizado * this.detallesVenta[i].cantidad);

      //     if(precioActualizado != precioVenta)
      //       this.prodActualizados += 1;
      //   }else{
      //     //Para productos varios o de solo precio simplemente multiplicamos el precio de venta por la cantidad
      //     //No varian su precio de producto, siempre es 1
      //     this.totalActualizado += (this.detallesVenta[i].precio! * this.detallesVenta[i].cantidad);
      //   }
      // }


      //Informamos descuento o recarga
      //Asignamos descuento o recarga al total actual
      if(this.ventaSeleccionada.pago.descuento != 0){
        this.advertencia = `Se aplicó un ${this.ventaSeleccionada.pago.descuento}% de descuento`;
        this.totalActualizado = this.totalActualizado - (this.totalActualizado * (this.ventaSeleccionada.pago.descuento! / 100));
      }

      if(this.ventaSeleccionada.pago.recargo != 0){
        this.advertencia = `Se aplicó un ${this.ventaSeleccionada.pago.recargo}% de recargo`;
        this.totalActualizado = this.totalActualizado + (this.totalActualizado * (this.ventaSeleccionada.pago.recargo! / 100));
      }
  }

  ActualizarEstado(venta:Venta){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      this.dialogConfig.width = "400px";
      
      if(venta.pago.realizado){
        this.dialogConfig.data = {mensaje:"¿Estas seguro de revertir el pago de esta venta?"};
      }else{
        this.dialogConfig.data = {mensaje:`¿Estas seguro marcar como paga esta venta por un total de ${venta.pago.restante!.toLocaleString('es-AR', {minimumFractionDigits:2})}?`};
      }

      this.dialog.open(ConfirmacionComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.cuentasService.ActualizarEstadoPago(venta.id!, venta.pago.realizado ? 0 : 1, venta.total!)
                      .subscribe(response => {
                        if(response=='OK'){
                          this.Notificaciones.success("Estado del pago actualizado correctamente");
                          this.Buscar();
                        }else{
                          this.Notificaciones.warning(response);
                        }
                      });
                    }
                  });
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }                
  }

  EntregaDinero(){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      this.dialogConfig.width = "400px";
      this.dialogConfig.data = {idCliente : this.idCliente, deuda: this.totalDeuda}

      this.dialog.open(EntregaVentasComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.Buscar();
                    }
                  });
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }   
  }

  VerRegistrosEntrega(){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      this.dialogConfig.width = "700px";
      this.dialogConfig.data = {idCliente : this.idCliente}

      this.dialog.open(RegistroEntregasComponent, this.dialogConfig)
                  .afterClosed()
                  .subscribe((actualizar:boolean) => {
                    if (actualizar){
                      this.Buscar();
                    }
                  });
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }   
  }
}
