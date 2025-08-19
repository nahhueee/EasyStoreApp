import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, Injector } from '@angular/core';
import { NotificacionesService } from './notificaciones.service';
import { GlobalesService } from './globales.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {

  constructor(@Inject(Injector) private readonly injector: Injector) { }

  // Inyecta el servicio de notificaciones para no crear dependencia circular
  private get Notificaciones() {
    return this.injector.get(NotificacionesService);
  }

  // Inyecta el servicio de globales para no crear dependencia circular
  private get GlobalesService() {
    return this.injector.get(GlobalesService);
  }

  private ultimoError = '';
  private tiempoUltimoError = 0;

  handleError(error: Error | HttpErrorResponse) {
    console.error(error)
    let mensaje = 'Error desconocido';

    // Evitar guardar errores con status 0 (sin conexión)
    if (error instanceof HttpErrorResponse) {
      mensaje = 'No se pudo conectar con el servidor.';
      return; 
    }

    //Evita guardar errores de que no se pudo conectar con el servidor en tauri
    if (error instanceof Error && error.message.includes('No se pudo conectar con el servidor')) {
      this.Notificaciones.error("No se logró la conexion con el servidor");
      return;
    }

    if (error instanceof Error) {
      mensaje = error.message || error.toString();
    } else if (typeof error === 'string') {
      mensaje = error;
    } 

    const ahora = Date.now();
    // Si el mismo error se repite dentro de 1 segundo, lo ignoramos
    if (mensaje === this.ultimoError && (ahora - this.tiempoUltimoError) < 2000) {
      return;
    }

    this.ultimoError = mensaje;
    this.tiempoUltimoError = ahora;
    
    //Envia el error al registro
    this.GlobalesService.GuardarLog(mensaje, 'error');

    //Notifica al usuario del error
    this.Notificaciones.warning('Ocurrió un error en la app, si el error persiste prueba reiniciar la aplicación');
  }
}
