import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Producto } from 'src/app/models/Producto';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
    selector: 'app-actualizar-vencimientos',
    templateUrl: './actualizar-vencimientos.component.html',
    styleUrls: ['./actualizar-vencimientos.component.scss'],
    standalone: false
})
export class ActualizarVencimientosComponent implements OnInit {
  //#region VARIABLES
    decimal_mask: any;
    vencimiento:FormControl = new FormControl('');
    totalProductos:number;
    productos:Producto[] = [];
    inputVtoValorReal = "";
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ActualizarVencimientosComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private productosService:ProductosService,
    ) {
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  ngOnInit(){
    this.totalProductos = this.data.registros.length;
    const primerVencimiento = this.data.registros[0].vencimiento;
    const [dia, mes, anio] = primerVencimiento.split("-").map(Number);
    const fechaVenc = new Date(anio, mes - 1, dia);
    
    this.vencimiento.setValue(fechaVenc);
  }

  onDateInput(event: any) {
    // event.target.value es la cadena del input (si el usuario borró la fecha será '')
    if(event?.target?.value)
      this.inputVtoValorReal = event?.target?.value.toString();
    else
      this.inputVtoValorReal = "";
  }

  Guardar(){
    if(this.vencimiento.value == "Invalid Date" && this.inputVtoValorReal == "") //No toco el input y lo dejo vacio, dejamos guardar
    {
      const errors = { ...this.vencimiento.errors };
      delete errors['matDatepickerParse'];
      this.vencimiento.setErrors(Object.keys(errors).length ? errors : null);
    }

    for (let i = 0; i < this.data.registros.length; i++) {
      const producto: Producto = new Producto(this.data.registros[i]);
      producto.vencimiento = this.vencimiento.value ?? null;
      this.productos.push(producto);
    }

    let contador = 0;
    
    // Array de observables para actualizar cada producto
    const actualizaciones$ = this.productos.map(producto => this.productosService.ActualizarVencimiento(producto));

    forkJoin(actualizaciones$).subscribe(responses => {
      // Contamos cuántas respuestas fueron 'OK'
      contador = responses.filter(response => response === 'OK').length;

      if (contador === this.data.registros.length) {
        this.Notificaciones.success("Los productos fueron actualizados correctamente");
      } else {
        this.Notificaciones.warning(`Solo ${contador} de ${this.data.registros.length} actualizaron su vencimiento correctamente.`);
      }

      this.dialogRef.close(true);
    });
  }
}
