import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-eliminar',
    templateUrl: './eliminar.component.html',
    styleUrls: ['./eliminar.component.scss'],
    standalone: false
})
export class EliminarComponent implements OnInit {
  nroRegistros:number;
  mensaje:string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.nroRegistros = this.data.nroRegistros;

    if(this.nroRegistros>1){
      this.mensaje = "¿Estas seguro de querer eliminar los " + this.nroRegistros.toString() + " registros seleccionados?"
    }else{
      this.mensaje = "¿Estas seguro de querer eliminar el registro seleccionado?"
    }
  }
}
