import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ParametrosService } from './parametros.service';
import { ApiService } from './api.service';
import { FiltroAcumulado } from '../models/filtros/FiltroAcumulados';

@Injectable({
  providedIn: 'root'
})
export class GraficosService {
  constructor(private apiService:ApiService) {}
 
  ObtenerDatosVentaCaja(idCaja:number): Observable<any> {
    return this.apiService.get(`estadisticas/datos-ventas/${idCaja}`)
  }

  ObtenerTotalesAcumulados(filtros:FiltroAcumulado): Observable<any> {
    return this.apiService.post(`estadisticas/ventas-acumuladas`, filtros)
  }

  ObtenerGraficoProductos(idCaja:number): Observable<any> {
    return this.apiService.get(`estadisticas/grafico-productos/${idCaja}`)
  }

  ObtenerGraficoGanancias(idCaja:number): Observable<any> {
    return this.apiService.get(`estadisticas/grafico-ganancias/${idCaja}`)
  }
}
