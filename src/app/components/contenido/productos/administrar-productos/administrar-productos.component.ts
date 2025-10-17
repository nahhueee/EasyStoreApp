import { Component, Inject, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { Cliente } from 'src/app/models/Cliente';
import { Color, Genero, LineasTalle, Material, Proceso, Producto, SubtipoProducto, TalleSeleccionable, TallesProducto, Temporada, TipoProducto } from 'src/app/models/Producto';
import { MiscService } from 'src/app/services/misc.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { AddmodClientesComponent } from '../../clientes/addmod-clientes/addmod-clientes.component';
import { ClientesService } from 'src/app/services/clientes.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ProductosService } from 'src/app/services/productos.service';
import { GlobalesService } from 'src/app/services/globales.service';

@Component({
  selector: 'app-administrar-productos',
  templateUrl: './administrar-productos.component.html',
  styleUrl: './administrar-productos.component.scss',
  standalone:false
})
export class AdministrarProductosComponent {
  decimal_mask: any;
  formulario: FormGroup;

  idProducto:number = 0;
  producto:Producto = new Producto();
  titulo:string = "";

  empresas:string[] = ['SUCEDE', 'SERVICIOS'];
  clientes:Cliente[]=[];
  filterClientes: Observable<Cliente[]>;
  clienteSeleccionado: Cliente = new Cliente();
  temporadas: Temporada[] = [];
  tiposProducto: TipoProducto[] = [];
  tipoSeleccionado: TipoProducto = new TipoProducto();
  subtiposProducto: SubtipoProducto[] = [];
  subtipoSeleccionado: SubtipoProducto = new SubtipoProducto();
  generos: Genero[] = [];
  materiales: Material[] = [];
  
  coloresMaterial: Color[] = [];
  colorSeleccionado: Color;
  
  lineasTalles: LineasTalle[] = [];
  tallesSeleccionables: TalleSeleccionable[] = [];

  dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any = null, //Datos que envia la pantalla anterior
    @Optional() private dialogRef: MatDialogRef<AdministrarProductosComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private miscService:MiscService,
    private fb: FormBuilder,
    private clientesService:ClientesService,
    private productosService:ProductosService,
    private Globales:GlobalesService,
    private dialog: MatDialog
  ) { 
    this.formulario = new FormGroup({
      empresa: new FormControl(''),
      cliente: new FormControl(''),
      temporada: new FormControl(''),
      producto: new FormControl(''),
      tipo: new FormControl(''),
      genero: new FormControl(''),
      material: new FormControl(''),
      lineaTalle: new FormControl(''),
      codigo: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      moldeleria: new FormControl(''),
      tallesProducto: this.fb.array([])
    });

    //#region valueChanges
    // Suscripción para cuando cambia cliente
    this.formulario.get('cliente')?.valueChanges.subscribe((value) => {
      setTimeout(() => {
        const clienteId: string = this.clienteSeleccionado ? (this.clienteSeleccionado.id?.toString() ?? "") : "";
        const cliente: string = this.clienteSeleccionado ? (this.clienteSeleccionado.nombre?.toString().split(' ')[0] ?? "") : "";
        const tipoAbrev:string = this.tipoSeleccionado ? this.tipoSeleccionado.abreviatura?.toString() ?? "" : "";
        const subtipoAbrev:string = this.subtipoSeleccionado ? this.subtipoSeleccionado.abreviatura?.toString() ?? "" : "";

        // Actualiza efectivo sin disparar su valueChanges
        this.formulario.get('codigo')?.setValue(clienteId + "-" + this.tipo, { emitEvent: false });
        this.formulario.get('nombre')?.setValue(cliente + "-" + tipoAbrev + "-" + subtipoAbrev , { emitEvent: false });
      }, 10);
    });

    // Suscripción para cuando cambia tipo de producto
    this.formulario.get('producto')?.valueChanges.subscribe((value) => {
      setTimeout(() => {
        const clienteId: string = this.clienteSeleccionado ? (this.clienteSeleccionado.id?.toString() ?? "") : "";
        const cliente: string = this.clienteSeleccionado ? (this.clienteSeleccionado.nombre?.toString().split(' ')[0] ?? "") : "";
        const tipoAbrev:string = this.tipoSeleccionado ? this.tipoSeleccionado.abreviatura?.toString() ?? "" : "";
        const subtipoAbrev:string = this.subtipoSeleccionado ? this.subtipoSeleccionado.abreviatura?.toString() ?? "" : "";

        // Actualiza efectivo sin disparar su valueChanges
        this.formulario.get('codigo')?.setValue(clienteId + "-" + value, { emitEvent: false });
        this.formulario.get('nombre')?.setValue(cliente + "-" + tipoAbrev + "-" + subtipoAbrev , { emitEvent: false });
      }, 10);
    });

    // Suscripción para cuando cambia subtipo de producto
    this.formulario.get('tipo')?.valueChanges.subscribe((value) => {
      setTimeout(() => {
        const cliente: string = this.clienteSeleccionado ? (this.clienteSeleccionado.nombre?.toString().split(' ')[0] ?? "") : "";
        const tipoAbrev:string = this.tipoSeleccionado ? this.tipoSeleccionado.abreviatura?.toString() ?? "" : "";
        const subtipoAbrev:string = this.subtipoSeleccionado ? this.subtipoSeleccionado.abreviatura?.toString() ?? "" : "";

        // Actualiza efectivo sin disparar su valueChanges
        this.formulario.get('nombre')?.setValue(cliente + "-" + tipoAbrev + "-" + subtipoAbrev , { emitEvent: false });
      }, 10);
    });
    //#endregion
  }

  //#region Controles formulario
  get material() {return this.formulario.get('material')?.value;}
  get tipo() {return this.formulario.get('producto')?.value;}
  get subtipo() {return this.formulario.get('tipo')?.value;}
  get lineaTalle() {return this.formulario.get('lineaTalle')?.value;}
  get tallesProducto(): FormArray {
    return this.formulario.get('tallesProducto') as FormArray;
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }
  //#endregion

  ngAfterViewInit() {
    setTimeout(() => {
      //Configuracion para la mascara decimal Imask
      this.decimal_mask = {
        mask: Number,
        scale: 2,
        thousandsSeparator: '.',
        radix: ',',
        normalizeZeros: true,
        padFractionalZeros: true,
        lazy: false,
        signed: true
      }

      if(this.data){
        this.idProducto = this.data.producto;
        this.titulo = "Modificar Producto";
        this.ObtenerProducto();
      }
      //

      // this.idProducto = this.rutaActiva.snapshot.params['producto'];
      // if(this.idProducto != undefined && this.idProducto != 0){
      //   this.titulo = "Modificar Producto";
      //   this.ObtenerProducto();
      // }
    },0);
  }
  

  ngOnInit(): void {
    this.miscService.ObtenerLineasTalle()
    .subscribe(response => {
      this.lineasTalles = response;
    });

    this.miscService.ObtenerGeneros()
    .subscribe(response => {
      this.generos = response;
    });

    this.miscService.ObtenerMateriales()
    .subscribe(response => {
      this.materiales = response;
    });

    this.miscService.ObtenerTiposProducto()
    .subscribe(response => {
      this.tiposProducto = response;
    });

    this.miscService.ObtenerSubtiposProducto()
    .subscribe(response => {
      this.subtiposProducto = response;
    });

    this.miscService.ObtenerTemporadas()
    .subscribe(response => {
      this.temporadas = response;
    });

    this.ObtenerClientes();
  }

  ObtenerProducto(){ 
    this.productosService.ObtenerProducto(this.idProducto)
    .subscribe(response => {
      this.producto = new Producto(response);
            
      this.colorSeleccionado = this.coloresMaterial.find(c=> c.id == this.producto.color) ?? new Color();
      this.formulario.get('empresa')?.setValue(this.producto.empresa);
      this.formulario.get('temporada')?.setValue(this.producto.temporada);
      this.formulario.get('producto')?.setValue(this.producto.tipo);
      this.formulario.get('tipo')?.setValue(this.producto.subtipo);
      this.formulario.get('genero')?.setValue(this.producto.genero);
      this.formulario.get('material')?.setValue(this.producto.material);
      this.MaterialChange();
      this.formulario.get('color')?.setValue(this.producto.color);
      this.formulario.get('moldeleria')?.setValue(this.producto.moldeleria);
      this.formulario.get('cliente')?.setValue(this.clientes.find(c=> c.id == this.producto.cliente)?.nombre);

      this.clienteSeleccionado = this.clientes.find(c=> c.id == this.producto.cliente) ?? new Cliente();
      this.tipoSeleccionado = this.tiposProducto.find(t=> t.id == this.producto.tipo) ?? new TipoProducto();
      this.subtipoSeleccionado = this.subtiposProducto.find(t=> t.id == this.producto.subtipo) ?? new SubtipoProducto();
      this.colorSeleccionado = this.coloresMaterial.find(c=> c.id == this.producto.color) ?? new Color();

      const lineaTalle = this.producto.talles && this.producto.talles.length > 0 ? this.producto.talles[0].idLineaTalle : null
      this.formulario.get('lineaTalle')?.setValue(lineaTalle);
      this.LineaTalleChange();

      setTimeout(() => {
        this.formulario.get('nombre')?.setValue(this.producto.nombre);
        this.formulario.get('codigo')?.setValue(this.producto.codigo);
      }, 1000);


      this.producto.talles?.forEach(pTalle => {
        const talleSeleccionado = this.tallesSeleccionables.find(t=> t.talle == pTalle.talle);
        if(talleSeleccionado){
          talleSeleccionado.seleccionado = true;
          const indice = this.tallesSeleccionables.indexOf(talleSeleccionado);

          this.tallesProducto.push(
            this.ConstruirRow(talleSeleccionado, indice)
          );

          setTimeout(() => {
            const indexInForm = this.tallesProducto.controls.findIndex(
              ctrl => ctrl.get('talle')?.value === talleSeleccionado.talle
            );
            if (indexInForm !== -1) {
              this.tallesProducto.at(indexInForm).get('id')?.setValue(pTalle.id);
              this.tallesProducto.at(indexInForm).get('cantidad')?.setValue(pTalle.cantidad);
              this.tallesProducto.at(indexInForm).get('precio')?.setValue(pTalle.precio!.toString().replace('.', ','));
            }
          }, 100);
        }
      });
    });
  }

  TipoChange($value:any){
    this.tipoSeleccionado = this.tiposProducto.find(t=> t.id == $value) ?? new TipoProducto();
  }
  SubTipoChange($value:any){
    this.subtipoSeleccionado = this.subtiposProducto.find(t=> t.id == $value) ?? new SubtipoProducto();
  }

  MaterialChange(){
    const materialSeleccionado = this.materiales.find(m=> m.id == this.material);
    this.coloresMaterial = materialSeleccionado?.colores!;
  }

  LineaTalleChange(){
    const lineaTalleSeleccionada = this.lineasTalles.find(l=> l.id == this.lineaTalle);
    this.tallesSeleccionables = (lineaTalleSeleccionada?.talles ?? []).map(talle => {
                                  return new TalleSeleccionable(
                                    {talle, seleccionado:false}
                                  )
                                });
  }
 
  SeleccionarTalle(indice:number) {
    this.tallesSeleccionables[indice].seleccionado = !this.tallesSeleccionables[indice].seleccionado;

    if(this.tallesSeleccionables[indice].seleccionado){
      this.tallesProducto.push(
        this.ConstruirRow(this.tallesSeleccionables[indice], indice)
      );
    }else{
      // buscar índice real dentro del FormArray
      const indexInForm = this.tallesProducto.controls.findIndex(
        ctrl => ctrl.get('talle')?.value === this.tallesSeleccionables[indice].talle
      );

      if (indexInForm !== -1) {
        this.tallesProducto.removeAt(indexInForm);
      }
    }
  }
  
  ConstruirRow(item: any, indice:number): FormGroup {
    return this.fb.group({
      id: 0,
      ubicacion: indice,
      talle: [item.talle],
      cantidad: [''],
      precio: [''],
      idLineaTalle: [this.lineaTalle]
    });
  }


  Guardar(){
    if(this.formulario.invalid) return;

    this.tallesProducto.value.forEach(element => {
      element.precio = this.Globales.EstandarizarDecimal(element.precio);
    });

    const nvoProducto = new Producto({
      id: this.idProducto,
      empresa: this.formulario.get('empresa')?.value,
      cliente: this.clienteSeleccionado?.id,
      temporada: this.formulario.get('temporada')?.value,
      tipo: this.formulario.get('producto')?.value,
      subtipo: this.formulario.get('tipo')?.value,
      genero: this.formulario.get('genero')?.value,
      material: this.formulario.get('material')?.value,
      color: this.colorSeleccionado?.id,
      codigo: this.formulario.get('codigo')?.value,
      nombre: this.formulario.get('nombre')?.value,
      moldeleria: this.formulario.get('moldeleria')?.value,
      talles: this.tallesProducto.value
    });

    if(this.idProducto != 0){
      nvoProducto.proceso = this.producto.proceso
      this.Modificar(nvoProducto);
    } else{
      nvoProducto.proceso = 1;
      this.Agregar(nvoProducto);
    }
  }

  Agregar(producto:Producto){
    this.productosService.Agregar(producto)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Producto creado correctamente");
          this.Cerrar(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Modificar(producto:Producto){
    this.productosService.Modificar(producto)
      .subscribe(response => {
        if(response=='OK'){
          this.Notificaciones.success("Producto modificado correctamente");
          this.Cerrar(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  Cerrar(valor:boolean){
    if(this.data){
      this.dialogRef.close(valor);
    }else{
      this.router.navigate([`navegacion/inventario/`]);
    }
  }


  //#region Clientes
  ObtenerClientes(){
    this.clientesService.SelectorClientes()
      .subscribe(response => {
        this.clientes = response;
        this.filterClientes = this.formulario.get("cliente")!
          .valueChanges.pipe(
            startWith(""),
            map((value) => this._filterClientes(value))
          );
      });
  }
  private _filterClientes(value: string): Cliente[] {
    if(value!=null){
      const filterValue = value.length > 0 ? value.toLocaleLowerCase() : value;
      return this.clientes.filter((option) =>
        option.nombre?.toLocaleLowerCase().includes(filterValue)
      );
    }
    return this.clientes;
  }

  ChangeCliente(seleccionado: Cliente) { //Detecta el cambio de seleccion de cliente
    this.formulario.get('cliente')!.setValue(seleccionado.nombre);
    this.clienteSeleccionado = seleccionado;
  }

  NuevoCliente() { 
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
    this.dialogConfig.width = "500px";
    this.dialogConfig.data = {cliente:null};
    this.dialog.open(AddmodClientesComponent, this.dialogConfig)
                .afterClosed()
                .subscribe((actualizar:boolean) => {
                  if (actualizar){
                    this.ObtenerClientes();
                  }
                });
  }
  //#endregion
}
