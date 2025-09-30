import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { debounceTime, map, Observable, of, startWith, switchMap } from 'rxjs';
import { DireccionesService } from 'src/app/services/direcciones.service';

@Component({
  selector: 'app-direccion-clientes',
  standalone: false,
  templateUrl: './direccion-clientes.component.html',
  styleUrl: './direccion-clientes.component.scss'
})
export class DireccionClientesComponent {
  formulario: FormGroup;

  provincias : any[] = [];
  provinciasFiltradas$: Observable<any[]> = of([]);

  ciudades: any[] = [];
  calles: any[] = [];

  constructor(
    private direccionesService: DireccionesService,
    public dialogRef: MatDialogRef<DireccionClientesComponent>
  ) {
    this.formulario = new FormGroup({
      calle: new FormControl('', [Validators.required]),
      numero: new FormControl('',[Validators.required]),
      ciudad: new FormControl('', [Validators.required]),
      provincia: new FormControl('', [Validators.required]),
      pais: new FormControl('Argentina', [Validators.required]),
      codPostal: new FormControl('', [Validators.required]),
    });
  }

  get calleControl() {return this.formulario.get('calle');}
  get ciudadControl() {return this.formulario.get('ciudad');}
  get provinciaControl() {return this.formulario.get('provincia');}
  get nroControl() {return this.formulario.get('numero');}
  get codPostalControl() {return this.formulario.get('codPostal');}

  ngOnInit() {
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

  ObtenerProvincias(){
    this.direccionesService.ObtenerProvincias()
      .subscribe(response => {
        this.provincias = response;
      });
  }

  _filterProvincias(value: string) {
    if (!value) return this.provincias;
    const filterValue = value.toLowerCase();
    return this.provincias.filter(p =>
      p.nombre.toLowerCase().includes(filterValue)
    );
  }


  ngAfterViewInit(): void {
    // this.map = L.map('map').setView([-31.73125, -65.00512], 13);

    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution: '© OpenStreetMap contributors'
    // }).addTo(this.map);
  }

  seleccionarDireccion(direccion: any) {
    // this.direccionCtrl.setValue(direccion.display_name, { emitEvent: false });
    // this.sugerencias = [];

    const lat = parseFloat(direccion.lat);
    const lon = parseFloat(direccion.lon);

    // if (this.marker) {
    //   this.map.removeLayer(this.marker);
    // }

    // this.marker = L.marker([lat, lon]).addTo(this.map)
    //   .bindPopup(direccion.display_name)
    //   .openPopup();

    // this.map.setView([lat, lon], 15);
  }
}


