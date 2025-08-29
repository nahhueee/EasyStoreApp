import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from 'src/app/models/Cliente';
import { Color, Genero, LineasTalle, Material, Proceso, SubtipoProducto, TalleSeleccionable, TallesProducto, TipoProducto } from 'src/app/models/Producto';
import { MiscService } from 'src/app/services/misc.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
  selector: 'app-administrar-productos',
  templateUrl: './administrar-productos.component.html',
  styleUrl: './administrar-productos.component.scss',
  standalone:false
})
export class AdministrarProductosComponent {
  formulario: FormGroup;
  talles: TallesProducto[] = [];

  empresas:string[] = ['SUCEDE', 'SERVICIOS'];
  clientes:Cliente[] = [];
  temporadas: string[] = ['VERANO', 'INVIERNO'];
  tiposProducto: TipoProducto[] = [];
  subtiposProducto: SubtipoProducto[] = [];
  generos: Genero[] = [];
  materiales: Material[] = [];
  
  coloresMaterial: Color[] = [];
  colorSeleccionado: number | null = null;
  
  lineasTalles: LineasTalle[] = [];
  tallesSeleccionables: TalleSeleccionable[] = [];

  constructor(
    private Notificaciones:NotificacionesService, //Servicio de notificaciones
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private miscService:MiscService
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
      codigo: new FormControl(''),
      nombre: new FormControl(''),
      moldeleria: new FormControl(''),
    });
  }

  get material() {return this.formulario.get('material')?.value;}
  get lineaTalle() {return this.formulario.get('lineaTalle')?.value;}
  
  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
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
      console.log(response)
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
  }

  MaterialChange(){
    const materialSeleccionado = this.materiales.find(m=> m.id == this.material);
    this.coloresMaterial = materialSeleccionado?.colores!;
  }
  SeleccionarColor(id: number) {
    this.colorSeleccionado = id;
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
  }


  Guardar(){

  }
  Cerrar(){
    this.router.navigate([`navegacion/inventario/`]);
  }

}
