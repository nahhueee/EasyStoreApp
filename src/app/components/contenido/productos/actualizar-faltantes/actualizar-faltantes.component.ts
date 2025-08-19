import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Producto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
    selector: 'app-actualizar-faltantes',
    templateUrl: './actualizar-faltantes.component.html',
    styleUrls: ['./actualizar-faltantes.component.scss'],
    standalone: false
})
export class ActualizarFaltantesComponent implements OnInit {
  //#region VARIABLES
    decimal_mask: any;
    faltante:FormControl = new FormControl('');
    totalProductos:number;
    productos:Producto[] = [];
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ActualizarFaltantesComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private productosService:ProductosService,
  ) {}

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }
  ngOnInit(){
    this.totalProductos = this.data.registros.length;
    this.faltante.setValue(this.data.registros[0].faltante);
  }

  Guardar(){
    for (let i = 0; i < this.data.registros.length; i++) {
      const producto: Producto = new Producto(this.data.registros[i]);
      producto.faltante = this.faltante.value == "" ? 1 : this.faltante.value;
      this.productos.push(producto);
    }

    let contador = 0;
    
    // Array de observables para actualizar cada producto
    const actualizaciones$ = this.productos.map(producto => this.productosService.ActualizarFaltante(producto));

    forkJoin(actualizaciones$).subscribe(responses => {
      // Contamos cuántas respuestas fueron 'OK'
      contador = responses.filter(response => response === 'OK').length;

      if (contador === this.data.registros.length) {
        this.Notificaciones.success("Los productos fueron actualizados correctamente");
      } else {
        this.Notificaciones.warning(`Solo ${contador} de ${this.data.registros.length} actualizaron su faltante correctamente.`);
      }

      this.dialogRef.close(true);
    });
  }
}
