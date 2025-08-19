import { Injectable } from '@angular/core';
import { NotificacionesService } from './notificaciones.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class FetchInterceptorService {

  constructor(
    private Notificaciones:NotificacionesService, 
    private spinner:NgxSpinnerService 
  ) { }

  async req(url: string, metodo:string, parametros?:any) {
    try {
      const modificadores: RequestInit = {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: (metodo=="POST" || metodo=="PUT") ? JSON.stringify(parametros) : null
      };

      const response = await fetch(url, modificadores);
      this.spinner.hide();

      if (!response.ok)
        throw new Error(`Error al conectarse con el back - ${response.status}`);

      // Si el cuerpo no está vacío, parsear el JSON
      const text = await response.text();
      if (text) 
        return JSON.parse(text);
      else
        return null;
      
    } catch (error) {
      this.Notificaciones.error("Ocurrió un errror intentando ejecutar operación con el servidor.")
    }
  }
}
