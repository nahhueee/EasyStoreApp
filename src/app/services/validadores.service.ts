import { inject, Injectable } from '@angular/core';
import { UsuariosService } from './usuarios.service';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ValidadoresService {
  private usuariosService = inject(UsuariosService);
  
  usuarioValidator(usuario:string): AsyncValidatorFn {

    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null); // si está vacío, no valida
      }

      if(usuario && usuario == control.value){
        return of(null); // si el usuario es el mismo que el original, no valida
      }

      return this.usuariosService.ValidarUsuario(control.value).pipe(
        map(existe => (!existe ? null : { usuarioExistente: true })),
        catchError(() => of(null)) 
      );
    };
  }
}
