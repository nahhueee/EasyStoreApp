import { Component, ElementRef, Inject, ViewChild, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmacion',
    templateUrl: './confirmacion.component.html',
    styleUrls: ['./confirmacion.component.scss'],
    standalone: false
})
export class ConfirmacionComponent implements OnInit {
  mensaje:string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfirmacionComponent>){ }

  ngOnInit(): void {
    this.mensaje = this.data.mensaje;
  }
}
