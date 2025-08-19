import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FacturaVenta } from 'src/app/models/FacturaVenta';
import { ObjFacturar } from 'src/app/models/ObjFacturar';
import { TipoFactura } from 'src/app/models/TipoFactura';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { VentasService } from 'src/app/services/ventas.service';

@Component({
    selector: 'app-datos-facturacion',
    templateUrl: './datos-facturacion.component.html',
    styleUrls: ['./datos-facturacion.component.scss'],
    standalone: false
})
export class DatosFacturacionComponent implements OnInit {
  formulario:FormGroup;
  tipoTitular: string;
  tiposFactura: TipoFactura[] = [];
  esDark:boolean;
  datosRequeridos:boolean;
  noSelecciono:boolean;

  tiposDocumento = [
    {id: 80, descripcion: 'CUIT'},
    {id: 86, descripcion: 'CUIL'},
    {id: 96, descripcion: 'DNI'}
  ];

  condicionesIVAReceptor = [
    {id: 5, descripcion: 'Consumidor Final'},
    {id: 1, descripcion: 'IVA Responsable Inscripto'},
    {id: 6, descripcion: 'Responsable Monotributo'},
    {id: 13, descripcion: 'Monotributista Social'},
    {id: 15, descripcion: 'IVA No Alcanzado'}
  ];

  private cuitcuilPattern: any = /^[2037][0-9]{9}[0-9]$/;
  private dniPattern = /^[0-9]{7,8}$/;

  constructor(
      @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
      public dialogRef: MatDialogRef<DatosFacturacionComponent>, //Ventana emergente actual
      private parametroService:ParametrosService,
      private ventasService:VentasService
      ) {
      this.formulario = new FormGroup({
        tDocumento: new FormControl(''),
        documento: new FormControl(''),
        tFactura: new FormControl('', [Validators.required]),
        condReceptor: new FormControl(5),
      });
  }

  get documento() {
    return this.formulario.get('documento');
  }

  get tiposDocumentoFiltrados() {
    if (this.formulario.get('tFactura')?.value == 1) {
      return this.tiposDocumento.filter(doc => doc.id === 80); // Solo CUIT
    }
    return this.tiposDocumento;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (event.key === 'F9') {
      this.Facturar();
    }
    if (event.key == 'ESC') {
      this.dialogRef.close(true);
    }
  }

  ngOnInit(): void {
    this.cargarTiposFactura();
    this.tFacturaChange();

    this.esDark = this.parametroService.EsDark();

    //valida DNI o CUIT CUIL respectivamente
    this.formulario.get('tDocumento')?.valueChanges.subscribe(tipo => {
      const docCtrl = this.formulario.get('documento');
      docCtrl?.clearValidators();
  
      if (tipo === 96) { //DNI
        docCtrl?.setValidators([Validators.required, Validators.pattern(this.dniPattern)]);
      } else if (tipo === 80 || tipo === 86) { //CUIT CUIL
        docCtrl?.setValidators([Validators.required, Validators.pattern(this.cuitcuilPattern)]);
      }
  
      docCtrl?.updateValueAndValidity();
    });
  }

  async cargarTiposFactura(){
    this.parametroService.ObtenerParametrosFacturacion()
      .subscribe(async response => {
        this.tipoTitular = response.condicion;

        this.tiposFactura = [
          {
            nombre: 'A',
            codigo: 1,
            habilitada: this.tipoTitular === 'responsable_inscripto'
          },
          {
            nombre: 'B',
            codigo: 6,
            habilitada: this.tipoTitular === 'responsable_inscripto'
          },
          {
            nombre: 'C',
            codigo: 11,
            habilitada: this.tipoTitular === 'monotributista'
          }
        ];
        
        if(this.tipoTitular == "monotributista")
          this.formulario.get('tFactura')?.setValue(11); //Factura C
        else{

          this.formulario.get('tFactura')?.setValue(6); //Factura B

          //Requerimos los campos si es necesario
          if(this.data.total >= 417288){
            this.datosRequeridos = true;
            this.RequerirCampos();
          }
        }

    });
  }

  tFacturaChange(){
    this.datosRequeridos = false;
    this.noSelecciono = false;
    
    //Para Facturas A es necesario datos del cliente
    //Para Facturas B es necesario si el monto es mayor a 417288
    if(this.formulario.get('tFactura')?.value == 1){

      this.datosRequeridos = true;
      this.formulario.get('tDocumento')?.setValue(80);
      this.RequerirCampos();

    }
    else if(this.formulario.get('tFactura')?.value == 6){
      if(this.data.total >= 417288){

        this.datosRequeridos = true;
        this.RequerirCampos();

      }
    }
  }

  Facturar(){
    //validamos que elija factura
    if(this.formulario.get('tFactura')?.value == ""){
      this.noSelecciono = true;
      return;
    }
      
    //Validamos el formulario
    this.markFormTouched(this.formulario);
    if(!this.formulario.valid) return;

    let nroDocumento = 0;
    let tipoDocumento = 99;
    let condicionReceptor = 5;

    if(this.datosRequeridos){
      nroDocumento = this.formulario.get('documento')?.value;
      tipoDocumento = this.formulario.get('tDocumento')?.value;
      condicionReceptor = this.formulario.get('condReceptor')?.value;
    }

    //Creamos el objeto a Facturar
    const nvaFactura:ObjFacturar = new ObjFacturar({
      total:this.data.total,
      tipoFactura: this.formulario.get('tFactura')?.value,
      docNro: nroDocumento,
      docTipo: tipoDocumento,
      condReceptor: condicionReceptor
    })

    this.ventasService.Facturar(nvaFactura)
      .subscribe(response => {

        const factura:FacturaVenta = new FacturaVenta({
          cae: response.cae,
          caeVto: response.caeVto,
          ticket: response.ticket,
          tipoFactura: this.formulario.get('tFactura')?.value,
          neto: response.neto,
          iva: response.iva,
          dni: nroDocumento,
          tipoDni: tipoDocumento,
          ptoVenta: response.ptoVenta,
          condReceptor: this.formulario.get('condReceptor')?.value
        });

        this.dialogRef.close({resultado:response.estado, factura });
      });
  }

  //Pone como requerido el campo de documento y tipo
  RequerirCampos(){
    this.formulario.get('documento')?.setValidators(Validators.required);
    this.formulario.get('documento')?.updateValueAndValidity(); 
    this.formulario.get('tDocumento')?.setValidators(Validators.required);
    this.formulario.get('tDocumento')?.updateValueAndValidity(); 
    this.formulario.get('condReceptor')?.setValidators(Validators.required);
    this.formulario.get('condReceptor')?.updateValueAndValidity(); 
  }

  //Limpia los validadores requeridos
  LimpiarValidadores(){
    this.formulario.get('documento')?.clearValidators();
    this.formulario.get('documento')?.updateValueAndValidity();
    this.formulario.get('tDocumento')?.clearValidators();
    this.formulario.get('tDocumento')?.updateValueAndValidity();
    this.formulario.get('condReceptor')?.clearValidators();
    this.formulario.get('condReceptor')?.updateValueAndValidity();
  }

  //Marca los campos del formulario como tocados para validar
  markFormTouched(control: AbstractControl) {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach(c => this.markFormTouched(c));
    } else {
      control.markAsTouched();
      control.markAsDirty();
    }
  }
}
