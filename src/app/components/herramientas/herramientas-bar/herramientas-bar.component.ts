import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-herramientas-bar',
    templateUrl: './herramientas-bar.component.html',
    styleUrls: ['./herramientas-bar.component.scss'],
    standalone: false
})
export class HerramientasBarComponent implements OnInit {
  @Output() plegado = new EventEmitter<boolean>();
  Nombre:any;
  Cargo:any;
  pantalla: any = 0;
  esApp:boolean;
  modoRed:boolean;
  menuPlegado = false;

  //Obtiene el tamaño actual de la pantalla 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.pantalla = window.innerWidth;
  }
  
  constructor(
    private router:Router,
    public authService:AuthService,
    private Notificaciones:NotificacionesService,
    private parametrosService:ParametrosService
  ) { 
    this.esApp = environment.tauri;
  }

  ngOnInit(): void {
    const estadoBar = localStorage.getItem('estadoBar');
    if(estadoBar && estadoBar == 'plegado'){
      this.menuPlegado = true;
    }
    this.plegado.emit(this.menuPlegado);

    const sesion = this.authService.GetSesion();
    if (!sesion) {
      this.router.navigateByUrl('/ingresar');
      return;
    }

    if (!this.authService.IsSesionValida(30)) {
      this.Notificaciones.info("Es necesario volver a iniciar sesión");
      this.authService.CerrarSesion();
      return;
    }

    // Sesión válida
    this.Nombre = sesion.data?.nombre;
    this.Cargo = sesion.data?.cargo;
   
    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla
    if(this.parametrosService.GetDatosServidor().modo == "red") this.modoRed = true;
  }

  informarEstadoSidebar(){
    this.menuPlegado = !this.menuPlegado;
    if(this.menuPlegado)
      localStorage.setItem('estadoBar', "plegado");
    else
      localStorage.setItem('estadoBar', "desplegado");

    this.plegado.emit(this.menuPlegado);
  }

  navegar(parametro:string){
    this.router.navigateByUrl('/navegacion/' + parametro);
  }
}
