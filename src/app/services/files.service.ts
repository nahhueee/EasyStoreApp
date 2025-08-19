import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private DatosImportacionExcel: any;

  constructor(private apiService:ApiService) {}

  //Manda un pdf al server para impresion
  ImprimirPDF(file: File, printerName: string): Observable<any> {
    const formData = new FormData();
    formData.append('doc', file);
    formData.append('printerName', printerName); 
    
    return this.apiService.post('files/imprimir-pdf', formData)
  }

  //Sube un archivo excel al server para agregar Productos
  ImportarExcel(file: any, tipoImportacion:string): Observable<any> {
    const formData = new FormData();
    formData.append('excel', file);
    formData.append('tipoPrecio', tipoImportacion);

    return this.apiService.post('files/importar-excel', formData)
  }

  //Se encarga de pasar los datos procesados en excel al otro componente
  setDatosExcel(data: any) {
    this.DatosImportacionExcel = data;
  }
  getDatosExcel(): any {
    return this.DatosImportacionExcel;
  }
}
