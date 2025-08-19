import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { io, Socket } from 'socket.io-client';
import { Actualizacion } from 'src/app/models/Actualizacion';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { appWindow } from "@tauri-apps/api/window";
import { Command } from "@tauri-apps/api/shell";

@Component({
    selector: 'app-actualizacion',
    templateUrl: './actualizacion.component.html',
    styleUrls: ['./actualizacion.component.scss'],
    standalone: false
})
export class ActualizacionComponent implements OnInit {
  ventana:string;
  esDark:boolean;

  ultimaVersion:Actualizacion;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ActualizacionComponent>, //Ventana emergente actual
    private spinner: NgxSpinnerService,
    private parametrosService:ParametrosService,
  ){}

  ngOnInit() {
    this.esDark = this.parametrosService.EsDark();
    this.ventana = this.data.ventana;

    this.ultimaVersion = new Actualizacion();
    this.ultimaVersion = this.data.ultimaVersion;
  }

  async Actualizar(){
    this.spinner.show('updateSpinner');

    // Ejecutar el actualizador
    const command = new Command("run_updater", ["../actualizador/Actualizador.exe"]);
    await command.execute();
  }

  Ignorar(){
    this.parametrosService.ActualizarParametro('actualizado', 'false').subscribe(response => {this.dialogRef.close();});
  }

  AceptarActualizado(){
    this.parametrosService.ActualizarParametro('actualizado', 'false').subscribe(response => {this.dialogRef.close();});
  }
}
