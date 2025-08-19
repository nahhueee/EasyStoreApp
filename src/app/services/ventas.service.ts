import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Venta } from 'src/app/models/Venta';
import { FiltroVenta } from 'src/app/models/filtros/FiltroVenta';
import { ObjFacturar } from '../models/ObjFacturar';
import { FacturaVenta } from '../models/FacturaVenta';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  constructor(private apiService:ApiService) {}
 
  //#region OBTENER
  ObtenerVentas(filtro:FiltroVenta): Observable<any> {
    return this.apiService.post('ventas/obtener', filtro)
  }
  SelectorTiposPago(): Observable<any> {
    return this.apiService.get('ventas/selector-tpagos')
  }

  ObtenerTotalesXTipoPago(idCaja:number): Observable<any> {
    return this.apiService.get(`ventas/totales-tipo-pago/${idCaja}`)
  }
  ObtenerPagasImpagas(idCaja:number): Observable<any> {
    return this.apiService.get(`ventas/totales-pagas-impagas/${idCaja}`)
  }
  //#endregion


  //#region ABM
  Agregar(venta:Venta): Observable<any>{
    return this.apiService.post('ventas/agregar', venta)
  }

  GuardarFactura(factura:FacturaVenta, idVenta:number): Observable<any>{
    return this.apiService.post('ventas/guardar-factura', {factura, idVenta})
  }

  Eliminar(venta:Venta): Observable<any> {
    return this.apiService.put('ventas/eliminar', venta)
  }

  Facturar(objFacturar:ObjFacturar): Observable<any>{
    return this.apiService.post('ventas/facturar', objFacturar)
  }
  ObtenerQR(idventa:number): Observable<any>{
    return this.apiService.get(`ventas/obtenerQR/${idventa}`)
  }
 //#endregion
}
