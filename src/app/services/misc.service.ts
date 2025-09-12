import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MiscService {
  constructor(private apiService:ApiService) {}
 
  //#region OBTENER
  ObtenerLineasTalle(): Observable<any> {
    return this.apiService.get('misc/lineas-talle')
  }
  ObtenerProcesos(): Observable<any> {
    return this.apiService.get('misc/procesos')
  }
  ObtenerTiposProducto(): Observable<any> {
    return this.apiService.get('misc/tipos-producto')
  }
  ObtenerSubtiposProducto(): Observable<any> {
    return this.apiService.get('misc/subtipos-producto')
  }
  ObtenerMateriales(): Observable<any> {
    return this.apiService.get('misc/materiales')
  }
  ObtenerGeneros(): Observable<any> {
    return this.apiService.get('misc/generos')
  }
  ObtenerColores(): Observable<any> {
    return this.apiService.get('misc/colores')
  }
  ObtenerTemporadas(): Observable<any> {
    return this.apiService.get('misc/temporadas')
  }
  //#endregion
}
