import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private apiService:ApiService, private router:Router) {}

  GetSesion() {
    const raw = localStorage.getItem("sesion");
    return raw ? JSON.parse(raw) : null;
  }

  GetUsuarioId(): string | null {
    const sesion = this.GetSesion();
    return sesion?.data?.idUsuario?.toString() || null;
  }

  GetCargo(): string | null {
    const sesion = this.GetSesion();
    return sesion?.data?.cargo?.toString() || null;
  }

  IsSesionValida(minutos = 30): boolean {
    const sesion = this.GetSesion();
    if (!sesion || !sesion.timestamp) return false;

    // Si es EMPLEADO, no verificamos el tiempo y consideramos válida la sesión
    if (sesion.data.cargo === "EMPLEADO") return true;

    const ahora = Date.now();
    return (ahora - sesion.timestamp) < minutos * 60 * 1000;
  }

  CerrarSesion() {
    localStorage.removeItem("sesion");
    this.router.navigate(['/ingresar'])
  }
  
  ClienteHabilitado(dni:string): Observable<any>{
    return this.apiService.get(`adminserver/obtener-habilitacion/${dni}`)
  }

}
