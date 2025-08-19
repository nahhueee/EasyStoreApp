import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/models/Usuario';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ServidorComponent } from '../herramientas/servidor/servidor.component';
import { environment } from 'src/environments/environment';
import { ModoTrabajoComponent } from '../herramientas/modo-trabajo/modo-trabajo.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {
  //Fondos tema claro
  backsWhite = [
    {path: "assets/backgrounds/white/1.jpg"},
    {path: "assets/backgrounds/white/2.jpg"},
    {path: "assets/backgrounds/white/3.jpg"},
    {path: "assets/backgrounds/white/4.jpg"},
    {path: "assets/backgrounds/white/5.jpg"},
    {path: "assets/backgrounds/white/6.jpg"},
  ];

  //Fondos tema oscuro
  backsDark = [
    {path: "assets/backgrounds/dark/1.jpg"},
    {path: "assets/backgrounds/dark/2.jpg"},
    {path: "assets/backgrounds/dark/3.jpg"},
    {path: "assets/backgrounds/dark/4.jpg"},
    {path: "assets/backgrounds/dark/5.jpg"},
    {path: "assets/backgrounds/dark/6.jpg"},
  ];
  pathIcon:string;

  background:string;
  formulario: FormGroup;
 
  usuario:Usuario;
  esAdmin:boolean;

  esDark:boolean;
  esApp:boolean;
  nombre = "";

  dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  constructor(
    private dialog: MatDialog, //Ventana emergente
    private router:Router,
    private Notificaciones:NotificacionesService,
    private usuariosService:UsuariosService,
    private parametroService:ParametrosService,
    private spinner: NgxSpinnerService,
  ) {
    this.esDark = this.parametroService.EsDark();
    this.esApp = environment.tauri;

    this.formulario = new FormGroup({
      usuario: new FormControl('', [Validators.required]),
      pass: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    // Revisa si el tema es white o dark, luego obtiene una imagen de fondo al azar dependiendo el tema
    // El color del icono cambia segun el tema
    if(this.esDark){
      this.background = this.backsDark[Math.floor(Math.random() * this.backsDark.length)].path;
      this.pathIcon = "assets/IconoWhite.png"
    }else{
      this.background = this.backsWhite[Math.floor(Math.random() * this.backsWhite.length)].path;
      this.pathIcon = "assets/IconoBlack.png"
    }
  }

  AbrirConfiguracion(){
    this.dialogConfig.width = '500px';
    this.dialog.open(ModoTrabajoComponent, this.dialogConfig);
  }

  Ingresar(){
    if(this.formulario.invalid) return;

    this.usuariosService.ObtenerUsuarioxUsername(this.formulario.get("usuario")?.value)
    .subscribe(response=> {
      if (response) {
        this.usuario = response;
        const sesion = {
          data: { 
            idUsuario: this.usuario.id?.toString()!,
            nombre: this.usuario.nombre!,
            cargo: this.usuario.cargo!
          },
          timestamp: new Date().getTime(), // guardás el momento actual
        };
        localStorage.setItem('sesion', JSON.stringify(sesion));
        this.spinner.show("welcomeSpinner");
        
        this.nombre = this.usuario.nombre!;

        setTimeout(() => {
          this.spinner.hide("welcomeSpinner");
          this.router.navigate(['/navegacion/inicio'])
        }, 2500);

      } else{
        this.Notificaciones.warning("Usuario o contraseña incorrecto");
        this.formulario.get("pass")?.setValue("");
      }
    });    
   
  }
}
