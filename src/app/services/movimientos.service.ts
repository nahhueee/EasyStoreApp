import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movimiento } from 'src/app/models/Movimiento';
import { FiltroMovimiento } from 'src/app/models/filtros/filtroMovimiento';
import { ParametrosService } from './parametros.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  constructor(private apiService:ApiService) {}
 
  //#region OBTENER
  ObtenerMovimientos(filtro:FiltroMovimiento): Observable<any> {
    return this.apiService.post('movimientos/obtener', filtro)
  }
  //#endregion


  //#region ABM
  Agregar(mov:Movimiento): Observable<any>{
    return this.apiService.post('movimientos/agregar', mov)
  }
  Eliminar(mov:Movimiento): Observable<any>{
    return this.apiService.put(`movimientos/eliminar`, mov)
  }
  //#endregion
}
