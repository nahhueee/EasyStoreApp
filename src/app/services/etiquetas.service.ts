import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { FiltroGral } from '../models/filtros/FiltroGral';
import { Etiqueta } from '../models/Etiqueta';

@Injectable({
  providedIn: 'root'
})
export class EtiquetasService {
  constructor(private apiService:ApiService) {}
    
  //#region OBTENER
  ObtenerEtiquetas(descripcion:string): Observable<any> {
    return this.apiService.get(`etiquetas/obtener/${descripcion}`)
  }
  ObtenerEtiqueta(id:number): Observable<any> {
    return this.apiService.get(`etiquetas/obtener-etiqueta/${id}`)
  }
  //#endregion

  //#region ABM
  Agregar(etiqueta:Etiqueta): Observable<any>{
    return this.apiService.post('etiquetas/agregar', etiqueta)
  }

  Modificar(etiqueta:Etiqueta): Observable<any>{
    return this.apiService.put('etiquetas/modificar', etiqueta)
  }

  Eliminar(id:number): Observable<any>{
    return this.apiService.delete(`etiquetas/eliminar/${id}`)
  }
  //#endregion
}
