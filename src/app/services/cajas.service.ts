import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Caja } from 'src/app/models/Caja';
import { FiltroCaja } from 'src/app/models/filtros/FiltroCaja';
import { ParametrosService } from './parametros.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CajasService {
  constructor(private apiService:ApiService) {}

  //#region OBTENER
  ObtenerCajas(filtro:FiltroCaja): Observable<any> {
    return this.apiService.post('cajas/obtener', filtro)
  }
  ObtenerCaja(id:number): Observable<any> {
    return this.apiService.get(`cajas/obtener-caja/${id}`)
  }
 //#endregion


  //#region ABM
  Finalizar(idCaja:number, finalizada:boolean): Observable<any>{
    return this.apiService.put('cajas/finalizar', {idCaja:idCaja, finalizada:finalizada ? 0 : 1})
  }

  Agregar(caj:Caja): Observable<any>{
    return this.apiService.post('cajas/agregar', caj)
  }

  Modificar(caj:Caja): Observable<any>{
    return this.apiService.put('cajas/modificar', caj)
  }

  Eliminar(id:number): Observable<any>{
    return this.apiService.delete(`cajas/eliminar/${id}`)
  }
  //#endregion
}
