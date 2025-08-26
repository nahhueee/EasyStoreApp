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
  //#endregion
}
