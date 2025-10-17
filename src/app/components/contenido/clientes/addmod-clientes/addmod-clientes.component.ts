import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { debounceTime, map, Observable, of, startWith, switchMap } from 'rxjs';
import { Cliente } from 'src/app/models/Cliente';
import { CondicionesIva } from 'src/app/models/CondicionesIva';
import { ClientesService } from 'src/app/services/clientes.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { MiscService } from 'src/app/services/misc.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
    selector: 'app-addmod-clientes',
    templateUrl: './addmod-clientes.component.html',
    styleUrls: ['./addmod-clientes.component.scss'],
    standalone: false
})
export class AddmodClientesComponent implements OnInit {
  //#region VARIABLES
    modificando:boolean;
    titulo:string = '';

    formulario: FormGroup;
    cliente:Cliente = new Cliente();
    
    condicionesIVAReceptor: CondicionesIva[] = [];
    tiposDocumento = [
      {id: 80, descripcion: 'CUIT'},
      {id: 86, descripcion: 'CUIL'},
      {id: 96, descripcion: 'DNI'}
    ];
    condicionesPago = [
      {id: 1, descripcion: 'CONTADO'},
      {id: 2, descripcion: 'CUENTA CORRIENTE'},
      {id: 3, descripcion: 'PAGO DIGITAL'},
      {id: 4, descripcion: 'OTRO'},
    ];
    categorias = [
      {id: 1, descripcion: 'MAYORISTA'},
      {id: 2, descripcion: 'MINORISTA'},
    ];

    provincias : any[] = [];
    provinciasFiltradas$: Observable<any[]> = of([]);
  
    ciudades: any[] = [];
    calles: any[] = [];

    private cuitcuilPattern: any = /^[2037][0-9]{9}[0-9]$/;
    private dniPattern = /^[0-9]{7,8}$/;
    private emailPattern: any = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  //#endregion

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any = null, //Datos que envia la pantalla anterior
    @Optional() private dialogRef: MatDialogRef<AddmodClientesComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private clientesService:ClientesService,
    private miscService:MiscService,
    private direccionesService: DireccionesService,
    private router:Router, 
    ) {
    this.formulario = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      
      telefono: new FormControl(''),
      celular: new FormControl(''),
      contacto: new FormControl(''),
      email: new FormControl('',[Validators.pattern(this.emailPattern)]),
      
      razon: new FormControl(''),
      condIva: new FormControl(5),
      tDocumento: new FormControl(''),
      documento: new FormControl(''),

      condPago: new FormControl(1),
      categoria: new FormControl(1),

      calle: new FormControl(''),
      numero: new FormControl(''),
      ciudad: new FormControl(''),
      provincia: new FormControl(''),
      pais: new FormControl('Argentina'),
      codPostal: new FormControl(''),
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

  get calleControl() {return this.formulario.get('calle');}
  get ciudadControl() {return this.formulario.get('ciudad');}
  get provinciaControl() {return this.formulario.get('provincia');}
  get nroControl() {return this.formulario.get('numero');}
  get codPostalControl() {return this.formulario.get('codPostal');}

  ngAfterViewInit() {
    setTimeout(() => {      
      if(this.data){
        if(this.data.cliente.id == 0){
          this.modificando = false;
          this.titulo = "Agregar Nuevo Cliente";
          return;
        }

        this.modificando = true;
        this.titulo = "Modificar Cliente";

        this.formulario.get('nombre')?.setValue(this.data.cliente.nombre);
        this.formulario.get('celular')?.setValue(this.data.cliente.celular);
        this.formulario.get('contacto')?.setValue(this.data.cliente.contacto);
        this.formulario.get('telefono')?.setValue(this.data.cliente.telefono);
        this.formulario.get('email')?.setValue(this.data.cliente.email);
        this.formulario.get('razon')?.setValue(this.data.cliente.razonSocial);
        this.formulario.get('condPago')?.setValue(this.data.cliente.idCondicionPago);
        this.formulario.get('categoria')?.setValue(this.data.cliente.idCategoria);
        this.formulario.get('condIva')?.setValue(this.data.cliente.idCondicionIva);
        this.formulario.get('tDocumento')?.setValue(this.data.cliente.idTipoDocumento);
        this.formulario.get('documento')?.setValue(this.data.cliente.documento);
        if(this.data.cliente.direcciones && this.data.cliente.direcciones.length>0){
          const direccion = this.data.cliente.direcciones[0];
          this.formulario.get('calle')?.setValue(direccion.calle);
          this.formulario.get('numero')?.setValue(direccion.numero);
          this.formulario.get('ciudad')?.setValue(direccion.localidad);
          this.formulario.get('provincia')?.setValue(direccion.provincia);
          this.formulario.get('codPostal')?.setValue(direccion.codPostal);
        }
        this.cliente = this.data.cliente;
      }
    }, 0.5);
  }
  ngOnInit(): void {
    this.ObtenerCondiciones();

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

    //Direccion
    this.ObtenerProvincias();
    
    this.provinciasFiltradas$ = this.provinciaControl!.valueChanges.pipe(
      startWith(''), 
      map(value => this._filterProvincias(value || ''))
    );

    // Autocomplete localidades
    this.ciudadControl?.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (!value || value.length < 3) {
          this.ciudades = [];
          return of([]);
        }
        return this.direccionesService.ObtenerLocalidades(this.provinciaControl?.value, value);
      })
    ).subscribe(results => this.ciudades = results);

    // Autocomplete calles
    this.calleControl?.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => {
        if (!value || value.length < 3) {
          this.calles = [];
          return of([]);
        }
        return this.direccionesService.ObtenerCalles(this.ciudadControl?.value, value);
      })
    ).subscribe(results => this.calles = results);
  }

  _filterProvincias(value: string) {
    if (!value) return this.provincias;
    const filterValue = value.toLowerCase();
    return this.provincias.filter(p =>
      p.nombre.toLowerCase().includes(filterValue)
    );
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  ObtenerProvincias(){
    this.direccionesService.ObtenerProvincias()
      .subscribe(response => {
        this.provincias = response;
      });
  }

  ObtenerCondiciones(){
    this.miscService.ObtenerCondicionesIva()
      .subscribe(response => {
        this.condicionesIVAReceptor = response;
      });
  }

   Cerrar(valor:boolean){
    if(this.data){
      this.dialogRef.close(valor);
    }else{
      this.router.navigate([`navegacion/clientes/`]);
    }
  }

  Guardar(){
    if(!this.formulario.valid) return;
    this.cliente.nombre =  this.formulario.get('nombre')?.value;
    this.cliente.telefono =  this.formulario.get('telefono')?.value;
    this.cliente.celular =  this.formulario.get('celular')?.value;
    this.cliente.email =  this.formulario.get('email')?.value;
    this.cliente.contacto =  this.formulario.get('contacto')?.value;
    this.cliente.razonSocial =  this.formulario.get('razon')?.value;
    this.cliente.idTipoDocumento =  this.formulario.get('tDocumento')?.value;
    this.cliente.idCondicionPago =  this.formulario.get('condPago')?.value;
    this.cliente.idCategoria =  this.formulario.get('categoria')?.value;
    this.cliente.idCondicionIva = this.formulario.get('condIva')?.value;
    this.cliente.documento = this.formulario.get('documento')?.value;
    this.cliente.direcciones = [{
      resumen: `${this.formulario.get('calle')?.value} ${this.formulario.get('numero')?.value}, ${this.formulario.get('ciudad')?.value}, ${this.formulario.get('provincia')?.value}`,
      calle: this.formulario.get('calle')?.value,
      numero: this.formulario.get('numero')?.value,
      codPostal: this.formulario.get('codPostal')?.value,
      localidad: this.formulario.get('ciudad')?.value,
      provincia: this.formulario.get('provincia')?.value,
      observaciones: ''
    }];

    if(this.modificando){
      this.Modificar();
    } else{
      this.Agregar();
    }
  }

  Agregar(){
    this.clientesService.Agregar(this.cliente)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Cliente creado correctamente");
          this.Cerrar(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(){
    this.cliente.id = this.data.cliente.id;
    this.clientesService.Modificar(this.cliente)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Cliente modificado correctamente");
          this.Cerrar(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

}
