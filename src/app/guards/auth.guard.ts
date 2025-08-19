import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router:Router,private authService:AuthService){}

  //Verifica que el usuario tenga un token en cache
  canActivate(): boolean{
    if(this.authService.GetSesion()){
      return true
    }
    
    this.router.navigate(['/ingresar'])
    return false
  }

}
