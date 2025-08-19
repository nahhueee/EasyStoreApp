import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  constructor(private _snackBar: MatSnackBar, private toastr: ToastrService) { }

  successCenter(mensaje:string, titulo?:string){
    this.toastr.success(mensaje, titulo!=null?titulo:'Éxito', {
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-bottom-center',
    });
  }

  success(mensaje:string, titulo?:string){
    this.toastr.success(mensaje, titulo!=null?titulo:'Éxito', {
      timeOut: 6000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-bottom-right',
    });
  }

  error(mensaje:string, titulo?:string){
    this.toastr.error(mensaje, titulo!=null?titulo:'Error', {
      timeOut: 7000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-bottom-right',
    });
  }

  info(mensaje:string, titulo?:string){
     this.toastr.info(mensaje, titulo!=null?titulo:'Atención', {
      timeOut: 7000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-bottom-right',
    });
  }

  warning(mensaje:string, titulo?:string){
   this.toastr.warning(mensaje, titulo!=null?titulo:'Atención', {
      timeOut: 7000,
      closeButton: true,
      progressBar: true,
      positionClass: 'toast-bottom-right',
    });
  }
}
