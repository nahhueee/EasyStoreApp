import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { FiltroGral } from '../models/filtros/FiltroGral';

@Injectable({
  providedIn: 'root'
})
export class CuentasCorrientesService {

  constructor(private apiService:ApiService) {}

  ObtenerRegistros(filtro:FiltroGral): Observable<any> {
    return this.apiService.post('cuentas/obtener', filtro)
  }

  ObtenerTotalDeuda(idCliente:number): Observable<any> {
    return this.apiService.get(`cuentas/obtener-deuda/${idCliente}`)
  }

  Entrega(monto:number, idCliente:number): Observable<any>{
    return this.apiService.put('cuentas/entrega', {monto, idCliente})
  }
  
  ActualizarEstadoPago(idVenta:number, realizado:number, total:number): Observable<any>{
    return this.apiService.put('cuentas/actualizar-pago', {idVenta, realizado, total})
  }

  RevertirUltimaEntrega(idEntrega:number): Observable<any>{
    return this.apiService.put('cuentas/revertir-entrega', {idEntrega})
  }
}
