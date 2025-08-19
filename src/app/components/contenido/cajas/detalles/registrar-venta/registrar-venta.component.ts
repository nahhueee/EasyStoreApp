import { Component, HostListener, Inject, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, startWith } from 'rxjs';
import { Cliente } from 'src/app/models/Cliente';
import { PagoVenta } from 'src/app/models/PagoVenta';
import { TipoPago } from 'src/app/models/TipoPago';
import { Venta } from 'src/app/models/Venta';
import { ClientesService } from 'src/app/services/clientes.service';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { VentasService } from 'src/app/services/ventas.service';
import { DatosFacturacionComponent } from '../datos-facturacion/datos-facturacion.component';
import { FacturaVenta } from 'src/app/models/FacturaVenta';
import { ConfirmacionComponent } from 'src/app/components/compartidos/confirmacion/confirmacion.component';
import { ComprobanteService } from 'src/app/services/comprobante.service';
import { AddmodClientesComponent } from '../../../clientes/addmod-clientes/addmod-clientes.component';
import { ParametrosService } from 'src/app/services/parametros.service';

@Component({
    selector: 'app-registrar-venta',
    templateUrl: './registrar-venta.component.html',
    styleUrls: ['./registrar-venta.component.scss'],
    standalone: false
})
export class RegistrarVentaComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    modificando:boolean;
    decimal_mask: any;

    formulario: FormGroup;
    venta:Venta = new Venta();

    tiposDePago:TipoPago[]=[];
    clientes:Cliente[]=[];
    filterClientes: Observable<Cliente[]>;

    totalGeneral:number;
    advertencia = '';
    dialogConfig:MatDialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente

    errorFacturacion = false;
    modalAbierto = false;
    computadorHabilitado = false;
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<RegistrarVentaComponent>, //Ventana emergente actual
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private Globales:GlobalesService, //Servicio con metodos globales para la aplicacion
    private dialog: MatDialog, //Ventana emergente
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private comprobanteService:ComprobanteService,
    private parametrosService:ParametrosService
    ) {
    this.formulario = new FormGroup({
      pagaCon: new FormControl(''),
      vuelto: new FormControl(''),
      pagado: new FormControl(true),
      cliente: new FormControl(''),
      idTipoPago: new FormControl(1),
      efectivo: new FormControl(''),
      digital: new FormControl(''),
      entrega: new FormControl(''),
      descuento: new FormControl(''),
      recargo: new FormControl(''),
    });

    //Revisa el valor del campo en pagaCon para asignar el vuelto que tiene que dar en el campo vuelto
    this.formulario.get('pagaCon')?.valueChanges.subscribe((value) => {
      if(value!=""){
        const pagaCon =  this.Globales.EstandarizarDecimal(value);
        this.formulario.get('vuelto')?.setValue((pagaCon - this.data.total).toString(), { emitEvent: false });
      }
    });

    //Revisa el valor del campo en efectivo para asignar el resto del total al campo en digital
    this.formulario.get('efectivo')?.valueChanges.subscribe((value) => {
      const efectivo =  this.Globales.EstandarizarDecimal(value);
      this.formulario.get('digital')?.setValue((this.data.total - efectivo).toString(), { emitEvent: false });
    });

    //Revisa el valor del campo descuento para asignar el nuevo valor al total de la venta
    this.formulario.get('descuento')?.valueChanges.subscribe((value) => {
      if(value!=""){
        const descuento =  this.Globales.EstandarizarDecimal(value);
        const totalConDescuento = this.data.total - (this.data.total * (descuento / 100));

        this.totalGeneral = parseFloat(totalConDescuento.toFixed(2));
        this.advertencia = "Descuento Aplicado"
      }else{
        this.advertencia = "";
        this.totalGeneral = this.data.total;
      }
    });

    //Revisa el valor del campo recargo para asignar el nuevo valor al total de la venta
    this.formulario.get('recargo')?.valueChanges.subscribe((value) => {
      if(value!=""){
        const recargo =  this.Globales.EstandarizarDecimal(value);
        const totalConRecargo = this.data.total + (this.data.total * (recargo / 100));

        this.totalGeneral = parseFloat(totalConRecargo.toFixed(2));
        this.advertencia = "Recargo Aplicado"
      }else{
        this.totalGeneral = this.data.total;
        this.advertencia = "";
      }
    });
  }

  //Para obtener de manera facil el control tipo de pago y el resto
  get tipoPagoControl(): number { return this.formulario.get('idTipoPago')?.value;}

  //Para obtener de manera facil el control pagado
  get pagadoControl(): boolean { return this.formulario.get('pagado')?.value;}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    if (event.key === 'F1') {
      this.Guardar();
    }
    if (event.key == 'ESC') {
      this.dialogRef.close(true);
    }
    if (event.key == 'F9') {
      this.Facturar();
    }
  }

  ngOnInit(){
    this.totalGeneral = this.data.total;

    //Verifica si es un terminal habilitado
    const datosComputador = this.parametrosService.GetDatosComputadorHabilitado();
    if(datosComputador)
      this.computadorHabilitado = datosComputador.habilitado;

    this.ObtenerTiposPago();
    this.ObtenerClientes();
  }

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
    },0);
  }

  EvaluarEntrega(){
    if(this.formulario.get('entrega')?.value!=""){
      
      const entrega = this.Globales.EstandarizarDecimal(this.formulario.get('entrega')?.value);
      if(entrega >= this.totalGeneral){
        this.Notificaciones.warning("La entrega debe ser menor al total de la venta");
        this.formulario.get('entrega')?.setValue("");
        return;
      }

    }
  }

  Facturar(){
    if(this.modalAbierto) return;
    this.modalAbierto = true;
    
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
    this.dialogConfig.height = "auto";
    this.dialogConfig.width = "500px";

    this.dialogConfig.data = {total: this.totalGeneral}
    this.dialog.open(DatosFacturacionComponent, this.dialogConfig)
            .afterClosed()
            .subscribe((respFacturacion:any) => {
              if(respFacturacion){

                if(respFacturacion.resultado === "Aprobado"){
                  this.Guardar(respFacturacion.factura);
                }else if(respFacturacion.resultado === "Rechazado"){
                  this.errorFacturacion = true;
                  this.Notificaciones.warning("Ocurrió uno o mas errores al intentar facturar.")
                  this.Notificaciones.info("Revisa los registros para más detalle, o consulta al equipo de desarrollo.")
                }
                  
              }

              this.modalAbierto = false;
            });
  }

  Guardar(factura?:FacturaVenta){
    this.venta.idCaja = this.data.idCaja;
    this.venta.detalles = this.data.detalles
    this.venta.total = this.totalGeneral;

    //Cliente al que se le asigna la venta
    const cliente = this.formulario.get('cliente')?.value;
    if (cliente == "")
      this.venta.cliente = new Cliente({id: 1, nombre: ""}); //Se asigna a consumidor final

    //Fecha y Hora de la venta
    const fechaActual = new Date();
    // Obtener horas y minutos 
    const horas = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();

    this.venta.fecha = fechaActual;
    this.venta.hora = `${horas}:${minutos}`;
    

    //Metodo de pago de la venta
    const pagoVenta: PagoVenta = new PagoVenta;
    pagoVenta.idTipoPago = this.formulario.get('idTipoPago')?.value;
    pagoVenta.efectivo = 0;
    pagoVenta.digital = 0;
    pagoVenta.recargo = 0;
    pagoVenta.descuento = 0;

    pagoVenta.realizado = this.formulario.get('pagado')?.value;

    if(pagoVenta.realizado){
      pagoVenta.entrega = this.venta.total;

      switch (pagoVenta.idTipoPago) {
        case 1: //Efectivo
          pagoVenta.efectivo = this.venta.total;
          pagoVenta.digital = 0;
          pagoVenta.descuento = this.Globales.EstandarizarDecimal(this.formulario.get('descuento')?.value);
          break;
        case 2: //Tarjeta 
          pagoVenta.efectivo = 0;
          pagoVenta.digital = this.venta.total;
          pagoVenta.recargo = this.Globales.EstandarizarDecimal(this.formulario.get('recargo')?.value);
          break;
        case 3: //Transferencia
          pagoVenta.efectivo = 0;
          pagoVenta.digital = this.venta.total;
          break;
        case 4:
          pagoVenta.efectivo = this.Globales.EstandarizarDecimal(this.formulario.get('efectivo')?.value);
          pagoVenta.digital = this.Globales.EstandarizarDecimal(this.formulario.get('digital')?.value);
          break;
      }
    }else{
      //Guardamos la entrega que puede llegar a hacer el clietne
      const entrega = this.formulario.get('entrega')?.value;
      pagoVenta.entrega = this.Globales.EstandarizarDecimal(entrega);
    }
    
    this.venta.pago = pagoVenta;
    this.venta.factura = factura;

    this.ventasService.Agregar(this.venta)
      .subscribe(response => {
        if(response!=0){
          this.venta.id = response;
          this.Notificaciones.success("Vendido Correctamente");

          if(factura){
            this.dialogConfig.width = "400px";
            this.dialogConfig.data = {mensaje:"Factura realizada correctamente. ¿Deseas imprimir?"};
            
            this.dialog.open(ConfirmacionComponent, this.dialogConfig)
                        .afterClosed()
                        .subscribe((imprimir:boolean) => {
                          if (imprimir){
                            this.comprobanteService.ImprimirComprobante("factura", this.venta);
                          }
                        });
          }

          this.dialogRef.close(true);
        }else{
          this.Notificaciones.warning(response);
        }
      });
  }

  //#region SELECTORES
  ObtenerTiposPago(){
    this.ventasService.SelectorTiposPago()
      .subscribe(response => {
        this.tiposDePago = response;
      });
  }

  TiposPagoChange(){
    this.formulario.get('recargo')?.setValue('');
    this.formulario.get('descuento')?.setValue('');
    this.advertencia = '';
  }

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
    this.venta.cliente = new Cliente(seleccionado);
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
