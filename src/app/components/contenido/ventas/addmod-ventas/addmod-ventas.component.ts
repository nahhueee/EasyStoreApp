import { Component } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-addmod-ventas',
  standalone: false,
  templateUrl: './addmod-ventas.component.html',
  styleUrl: './addmod-ventas.component.scss'
})
export class AddmodVentasComponent {
  procesos = [
    {id: 1, descripcion: 'PRESUPUESTO'},
    {id: 2, descripcion: 'PEDIDO'},
    {id: 3, descripcion: 'NOTA EMPAQUE'},
  ];
  
  formGenerales:FormGroup;
  formProductos:FormGroup;

  constructor() {
    this.formGenerales = new FormGroup({
      proceso: new FormControl('')
    });
    this.formProductos = new FormGroup({
      
    });
  }
}
