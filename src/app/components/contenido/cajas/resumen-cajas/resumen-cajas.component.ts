import { Component, Inject, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Caja } from 'src/app/models/Caja';
import { Movimiento } from 'src/app/models/Movimiento';
import { Venta } from 'src/app/models/Venta';
import { FiltroVenta } from 'src/app/models/filtros/FiltroVenta';
import { FiltroMovimiento } from 'src/app/models/filtros/filtroMovimiento';
import { CajasService } from 'src/app/services/cajas.service';
import { MovimientosService } from 'src/app/services/movimientos.service';
import { VentasService } from 'src/app/services/ventas.service';

@Component({
    selector: 'app-resumen-cajas',
    templateUrl: './resumen-cajas.component.html',
    styleUrls: ['./resumen-cajas.component.scss'],
    standalone: false
})
export class ResumenCajasComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    idCaja: number;
    caja: Caja = new Caja();
    totalCaja: number;
    ventas: Venta[] = [];
    ventasFiltradas: Venta[] = [];

    movimientos: Movimiento[] = [];

    totalEfectivo = 0;
    totalTransferencias = 0;
    totalTarjetas = 0;
    totalRestoCombinados = 0;

    cantVentas: number;
    cantPagas: number;
    cantImpagas: number;
    
    columnsVentas: string[] = ['cliente', 'hora', 'total', 'pagado', 'tpago', 'facturado']; //Columnas a mostrar
    dataSourceVentas = new MatTableDataSource<Venta>(this.ventas); //Data source de la tabla

    columnsMovimientos: string[] = ['tipo', 'monto', 'descripcion']; //Columnas a mostrar
    dataSourceMovimientos = new MatTableDataSource<Movimiento>(this.movimientos); //Data source de la tabla

    @ViewChild('paginator1') paginator1!: MatPaginator;
    @ViewChild('paginator2') paginator2!: MatPaginator;
  //#endregion

  constructor(
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private cajasService: CajasService,
    private ventasService:VentasService,
    private movimientosService:MovimientosService
  ){}

  ngOnInit(){
    //Obtenemos el id de la caja desde la url
    this.idCaja = this.rutaActiva.snapshot.params['idCaja']
    this.ObtenerCaja();
  }

  ngAfterViewInit() {
   this.paginator1._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(async () => {
      //Obtenemos los datos de tabla
      this.BuscarVentas();
      this.BuscarMovimientos();

      this.ventasService.ObtenerTotalesXTipoPago(this.idCaja)
      .subscribe(totales => {
        if(totales){
          this.totalEfectivo = this.caja.inicial! + totales.efectivo + this.caja.entradas! - this.caja.salidas!;
          this.totalTransferencias = totales.transferencias;
          this.totalTarjetas = totales.tarjetas;
          this.totalRestoCombinados = totales.otros;
        }
      });

      this.ventasService.ObtenerPagasImpagas(this.idCaja)
      .subscribe(pagasImpagas => {
        if(pagasImpagas){
          this.cantPagas = pagasImpagas.pagas;
          this.cantImpagas = pagasImpagas.impagas;
        }
      });
    }, 0.5);
  }

  ObtenerCaja(){
    this.cajasService.ObtenerCaja(this.idCaja)
    .subscribe(response => {
      this.caja = new Caja(response);
      this.totalCaja = this.caja.inicial! + this.caja.ventas! + this.caja.entradas! - this.caja.salidas!;
    });
  }

  Cerrar(){
    this.router.navigate([`navegacion/cajas/`]);
  }

  //#region TABLAS
  BuscarVentas(event?: PageEvent){
     
    //Eventos de la paginación
    if (!event) {
      event = new PageEvent();
      event.pageIndex = 0;
      event.pageSize = this.paginator1.pageSize;
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
          this.paginator1.length = response.total;
          this.cantVentas = response.total;

          //Llenamos la tabla con los resultados
          this.ventas = [];
          this.ventas = response.registros;
          this.dataSourceVentas = new MatTableDataSource<Venta>(this.ventas);
        });
  }

  BuscarMovimientos(event?: PageEvent){
        //Eventos de la paginación
        if (!event) {
          event = new PageEvent();
          event.pageIndex = 0;
          event.pageSize = this.paginator2.pageSize;
        }
  
        //Creamos el objeto para filtrar registros
        const filtro: FiltroMovimiento = new FiltroMovimiento({
          pagina: event.pageIndex + 1,
          total: event.length,
          tamanioPagina: event.pageSize,
          caja: this.idCaja,
          tipoMovimiento: 0
        });
  
        
        // Obtiene listado de movimeintos y el total
        this.movimientosService.ObtenerMovimientos(filtro)
            .subscribe(response => {
              
              //Llenamos el total del paginador
              this.paginator2.length = response.total;
  
              //Llenamos la tabla con los resultados
              this.movimientos = [];
              this.movimientos = response.registros;
              this.dataSourceMovimientos = new MatTableDataSource<Movimiento>(this.movimientos);
            });
  }
  //#endregion
}
