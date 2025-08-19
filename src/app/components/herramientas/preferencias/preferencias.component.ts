import { Component, AfterViewInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-preferencias',
    templateUrl: './preferencias.component.html',
    styleUrls: ['./preferencias.component.scss'],
    standalone: false
})
export class PreferenciasComponent implements AfterViewInit {
  
  colores = [
    {img: "assets/colores/rojo.png", texto: 'Rojo', value: 'red-theme'},
    {img: "assets/colores/rosa.png", texto: 'Rosa', value: 'pink-theme'},
    {img: "assets/colores/azul.png", texto: 'Azul', value: 'blue-theme'},
    {img: "assets/colores/verde.png", texto: 'Verde', value: 'green-theme'},
    {img: "assets/colores/amarillo.png", texto: 'Amarillo', value: 'yellow-theme'},
    {img: "assets/colores/naranja.png", texto: 'Naranja', value: 'orange-theme'},
  ];

  papeles = [
    {value: '58mm'},
    {value: 'A4'}
  ];

  formulario: FormGroup;
  formFacturacion: FormGroup;
  esApp:boolean;

  condicionesIVA = [
    {value: 'responsable_inscripto', desc:'Responsable Inscripto'},
    {value: 'monotributista', desc:'Monotributista'}
  ];

  constructor(
    private parametroService:ParametrosService,
  ) {
    this.formulario = new FormGroup({
      dark: new FormControl(false),
      color: new FormControl(''),
      nomLocal: new FormControl('', [Validators.required]),
      impresora: new FormControl(''),
      papel: new FormControl(''),

      //Permisos
      ventasYtotales: new FormControl(false),
      resumenCaja: new FormControl(false),
      ventasCliente: new FormControl(false),
      cambioPrecio: new FormControl(false),

      //otros
      edicionResultadoUnico:new FormControl(false),
    });

    this.formFacturacion = new FormGroup({
      condicion: new FormControl('', [Validators.required]),
      puntoVta: new FormControl('', [Validators.required]),
      CUIL: new FormControl('', [Validators.required]),
      razon: new FormControl('', [Validators.required]),
      direccion: new FormControl('', [Validators.required]),
    });

    this.esApp = environment.tauri;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      //Personalizacion
      this.formulario.get('color')?.setValue(this.parametroService.GetTema());
      this.formulario.get('dark')?.setValue(this.parametroService.EsDark());

      //Impresión
      this.formulario.get('nomLocal')?.setValue(this.parametroService.GetNombreLocal());
      this.formulario.get('impresora')?.setValue(this.parametroService.GetImpresora());
      this.formulario.get('papel')?.setValue(this.parametroService.GetPapel());

      //Permisos
      this.formulario.get('ventasYtotales')?.setValue(this.parametroService.PermitirVentasyTotales());
      this.formulario.get('resumenCaja')?.setValue(this.parametroService.PermitirResumenCaja());
      this.formulario.get('ventasCliente')?.setValue(this.parametroService.VerVentasCliente());
      this.formulario.get('cambioPrecio')?.setValue(this.parametroService.PermitirCambioPrecio());

      //Otros
      this.formulario.get('edicionResultadoUnico')?.setValue(this.parametroService.GetEdicionResultadoUnico());


      this.ObtenerParametrosFacturacion();
    }, 0.5);
  }

  ObtenerParametrosFacturacion(){
    this.parametroService.ObtenerParametrosFacturacion()
      .subscribe(async response => {
        this.formFacturacion.get('condicion')?.setValue(response.condicion);
        this.formFacturacion.get('puntoVta')?.setValue(response.puntoVta);
        this.formFacturacion.get('CUIL')?.setValue(response.cuil);
        this.formFacturacion.get('razon')?.setValue(response.razon);
        this.formFacturacion.get('direccion')?.setValue(response.direccion);
    });
  }

  GuardarFacturacion(){
    this.markFormTouched(this.formFacturacion)
    if(this.formFacturacion.invalid) return;

    const data:any = {
      condicion:this.formFacturacion.get("condicion")?.value,
      puntoVta:this.formFacturacion.get("puntoVta")?.value,
      cuil:this.formFacturacion.get("CUIL")?.value,
      razon:this.formFacturacion.get("razon")?.value,
      direccion:this.formFacturacion.get("direccion")?.value,
    }

    this.parametroService.GuardarParametrosFacturacion(data)
      .subscribe(async response => {
        if(response=="OK"){
          window.location.reload();
        }
    });
  }

  GuardarPreferencias(){

    //Guarda las preferencias de personalizacion en local Storage
    this.parametroService.SetTema(this.formulario.get('color')?.value);
    this.parametroService.SetDark(this.formulario.get('dark')?.value);

    //Guarda los parametros de impresion local
    this.parametroService.SetNombreLocal(this.formulario.get('nomLocal')?.value);
    this.parametroService.SetImpresora(this.formulario.get('impresora')?.value);
    this.parametroService.SetPapel(this.formulario.get('papel')?.value);

    //Guarda las preferencias de permisos
    localStorage.setItem('ventasYtotales', this.formulario.get('ventasYtotales')?.value);
    localStorage.setItem('resumenCaja', this.formulario.get('resumenCaja')?.value);
    localStorage.setItem('ventasCliente', this.formulario.get('ventasCliente')?.value);
    localStorage.setItem('cambioPrecio', this.formulario.get('cambioPrecio')?.value);

    //Otros
    this.parametroService.SetEdicionResultadoUnico(this.formulario.get('edicionResultadoUnico')?.value);

    window.location.reload();
  }

  markFormTouched(control: AbstractControl) {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach(c => this.markFormTouched(c));
    } else {
      control.markAsTouched();
      control.markAsDirty();
    }
  }
}
