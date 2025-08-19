import { Component, OnDestroy, ViewChild, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CajasService } from 'src/app/services/cajas.service';
import { Caja } from 'src/app/models/Caja';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { AddmodCajasComponent } from '../addmod-cajas/addmod-cajas.component';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { NewVentaComponent } from '../detalles/new-venta/new-venta.component';
import { environment } from 'src/environments/environment';
import { getCurrent } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import { AuthService } from 'src/app/services/auth.service';
import { ParametrosService } from 'src/app/services/parametros.service';

@Component({
    selector: 'app-det-cajas',
    templateUrl: './det-cajas.component.html',
    styleUrls: ['./det-cajas.component.scss'],
    standalone: false
})
export class DetCajasComponent implements OnInit {
  //#region VARIABLES
    estado = "EN CURSO";

    dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

    tabSeleccionada: number;
    idCaja: number;
    caja: Caja = new Caja();
    esApp:boolean;

    @ViewChild('tab1') tab1: NewVentaComponent;
    sinPermiso:boolean;
  //#endregion
  
  constructor(
    private dialog: MatDialog, //Ventana emergente
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private titlepage:Title, //Para actualizar el titulo de la ventana
    private cajasService: CajasService,
    private authService:AuthService,
    private parametrosService:ParametrosService
  ){
    this.esApp = environment.tauri;
  }

  ngOnInit(): void {
    this.titlepage.setTitle('Detalle Caja | EasySales App')

    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";

    //Obtenemos el id de la caja desde la url
    this.idCaja = this.rutaActiva.snapshot.params['idCaja']
    this.ObtenerCaja();

    //Evalua que el empleado tenga permisos para ver esto
    if(this.authService.GetCargo() == "EMPLEADO"){
      if(!this.parametrosService.PermitirResumenCaja()){
        this.sinPermiso = true;
      }
    }
  }

  TabChanged(event) {
    this.tabSeleccionada = event.index;
    if (event.index === 0) 
      this.tab1.focusCodigo(); 
  }

  ObtenerCaja(){
    this.cajasService.ObtenerCaja(this.idCaja)
    .subscribe(response => {
      this.caja = new Caja(response);
      this.estado = this.caja.finalizada ? "FINALIZADA" : "EN CURSO";
    });
  }

  Modificar() { 
    this.dialogConfig.width = "400px";
    this.dialogConfig.data = {caja:this.caja};
    this.dialog.open(AddmodCajasComponent, this.dialogConfig)
                .afterClosed()
                .subscribe((actualizar:boolean) => {
                  if (actualizar)
                    this.ObtenerCaja(); //Recarga los datos
                });
  }  

  ActualizarEstado(){
    this.dialogConfig.width = "400px";
    
    if(this.estado == "FINALIZADA"){
      this.dialogConfig.data = {mensaje:"¿Estas seguro de revertir el estado de esta caja?"};
    }else{
      this.dialogConfig.data = {mensaje:"La caja pasará a estado FINALIZADA"};
    }

    this.dialog.open(ConfirmacionComponent, this.dialogConfig)
                .afterClosed()
                .subscribe((actualizar:boolean) => {
                  if (actualizar){
                    this.cajasService.Finalizar(this.caja.id, this.caja.finalizada)
                    .subscribe(response => {
                      if(response=='OK'){
                        this.Notificaciones.success("Estado de la caja actualizado correctamente");
                        this.estado = this.estado == "EN CURSO" ? "FINALIZADA" : "EN CURSO"; //Actualizamos por el estado contrario
                        
                        if(this.esApp && this.estado == "FINALIZADA"){
                          emit('caja-finalizada');
                          getCurrent().close();
                        }
                      }else{
                        this.Notificaciones.warning(response);
                      }
                    });
                  }
                });
  }
}
