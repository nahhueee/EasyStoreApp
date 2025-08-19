import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-resultados-importacion',
    templateUrl: './resultados-importacion.component.html',
    styleUrls: ['./resultados-importacion.component.scss'],
    standalone: false
})
export class ResultadosImportacionComponent implements OnInit {
  errores:string[] = [];
  insertados = 0;
  actualizados = 0;

  constructor(    
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ResultadosImportacionComponent>, //Ventana emergente actual
    private router:Router
  ){}

  ngOnInit(): void {
    if(this.data){
      this.insertados = this.data.insertados;
      this.actualizados = this.data.actualizados;
      this.errores = this.data.errores;
    }
  }

  Cerrar(){
    this.router.navigate([`navegacion/inventario/`]);
    this.dialogRef.close()
  }
}
