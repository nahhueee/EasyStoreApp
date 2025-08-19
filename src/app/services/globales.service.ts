import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalesService {
  constructor(
    private apiService:ApiService) {}

//#region FUNCIONES FRONT
  //Metodo para Estandarizar los nros decimales
  EstandarizarDecimal(numero:string):number{
    if(numero == "") return 0;
    const formatNro = numero.replace(/\./g, '').replace(',', '.');

    return parseFloat(formatNro);
  }

  //Convierte una fecha string al formato de angular material picker
  ConvertirFecha(fechaString: string): Date {
    const [day, month, year] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day); 
  }

  //Sube una imagen al server y devuelve el nombre
  SubirImagen(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.apiService.post('imagenes/subir', formData)
  }
//#endregion

//#region Salida a BACKEND
  
//Obtiene la ultima version desde el servidor
  ObtenerUltimaVersion(): Observable<any> {
    return this.apiService.get('adminserver/obtener-version')
  }

  //Fuerza la corrida del cron para backups
  ForzarInicioBackup(): Observable<any> {
    return this.apiService.get('backup/forzar')
  }

  //Fuerza el inicio del modo servidor
  ForzarInicioModoServidor(): Observable<any> {
    return this.apiService.get('server/forzar')
  }
 
  //Genera un backup en C/backups
  GenerarBackup(): Observable<any> {
    return this.apiService.get('backup/generar')
  }

  //Valida en admin server la existencia del cliente
  ValidarDNI(dni:number): Observable<any> {
    return this.apiService.get(`adminserver/verificar-existencia/${dni}`)
  }
  
  //Obtiene los permisos para el cliente
  ObtenerPermiso(dni:number): Observable<any> {
    return this.apiService.get(`adminserver/obtener-app-cliente/${dni}`)
  }
  VerificarPermiso(dni:number): Observable<any> {
    return this.apiService.get(`adminserver/obtener-habilitacion/${dni}`)
  }

  //Obtiene la lista de logs generales
  ObtenerLogsGenerales(): Observable<any> {
    return this.apiService.get('logs/general')
  }
  //Obtiene la lista de logs de facturacion
  ObtenerLogsFacturacion(): Observable<any> {
    return this.apiService.get('logs/facturacion')
  }
  //Obtiene la lista de logs backup
  ObtenerLogsBackup(): Observable<any> {
    return this.apiService.get('logs/backup')
  }
  //Obtiene la lista de logs update
  ObtenerLogsUpdate(): Observable<any> {
    return this.apiService.get('logs/update')
  }
  //Limpia todos los archivos de logs
  ClearLogs(): Observable<any> {
    return this.apiService.delete<any>('logs/');
  }
  //Guarda un log de tipo general
  GuardarLog(message:string,level:string): Observable<any> {
    return this.apiService.post('logs/general', {message,level});
  }
//#endregion
    
}
