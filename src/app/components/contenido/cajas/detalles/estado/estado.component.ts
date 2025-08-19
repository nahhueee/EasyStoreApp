import { Component, Input, AfterViewInit } from '@angular/core';
import { Caja } from 'src/app/models/Caja';
import { CajasService } from 'src/app/services/cajas.service';
import { VentasService } from 'src/app/services/ventas.service';

@Component({
    selector: 'app-estado',
    templateUrl: './estado.component.html',
    styleUrls: ['./estado.component.scss'],
    standalone: false
})
export class EstadoComponent implements AfterViewInit {
  @Input() idCaja: number; //Id de la caja actual
  caja: Caja = new Caja();

  totalEfectivo = 0;
  totalTransferencias = 0;
  totalTarjetas = 0;
  totalRestoCombinados = 0;

  constructor(
    private ventasService:VentasService,
    private cajasService:CajasService
  ){}

  ngAfterViewInit(){
    setTimeout(() => {
         this.ObtenerCaja();
    }, 0.5);
  }

  ObtenerCaja(){
      this.cajasService.ObtenerCaja(this.idCaja)
      .subscribe(response => {
        this.caja = new Caja(response);
        this.ObtenerMontosCaja();
      });
  }

  ObtenerMontosCaja(){
    this.ventasService.ObtenerTotalesXTipoPago(this.idCaja)
      .subscribe(totales => {
        if(totales){
          this.totalEfectivo = this.caja.inicial! + totales.efectivo + this.caja.entradas! - this.caja.salidas!;
          this.totalTransferencias = totales.transferencias;
          this.totalTarjetas = totales.tarjetas;
          this.totalRestoCombinados = totales.otros;
        }
      });
  }
}
