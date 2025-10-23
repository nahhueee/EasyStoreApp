import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalesService } from 'src/app/services/globales.service';
import { ActualizacionComponent } from '../herramientas/actualizacion/actualizacion.component';
import { Actualizacion } from 'src/app/models/Actualizacion';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-navegacion',
    templateUrl: './navegacion.component.html',
    styleUrls: ['./navegacion.component.scss'],
    standalone: false,
    animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, position: 'absolute' }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class NavegacionComponent implements OnInit {
  pantalla: any = 0;
  componente = "inicio";
  version:string;
  ultimaVersion:Actualizacion;
  versionDisponible:boolean;
  dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
  esApp:boolean;
  produccion:boolean;
  esEmpleado:boolean;
  computadorHabilitado:boolean;

  menuPlegado = false;
  mostrarTextoChico = true;

  openedId: string | null = null;
  isCollapsed: Record<string, boolean> = {};
  tipoProducto: string = '';


  componentes = [
    { id: 'ventas', titulo: 'Ventas', icon: 'shopping_cart', submenu: [
      { id: 'nueva-factura', titulo: 'Registrar', icon: 'add_shopping_cart' },
      { id: 'ventas', titulo: 'Listado', icon: 'description' }
    ]},
    { id: 'inventario', titulo: 'Inventario', icon: 'inventory', submenu: [
      { id: 'nuevo-producto', titulo: 'Registrar', icon: 'add_circle' },
      { id: 'inventario', titulo: 'Inventario', icon: 'description' }
    ]},
    { id: 'clientes', titulo: 'Clientes', icon: 'groups', submenu: [
        { id: 'nuevo-cliente', titulo: 'Registrar', icon: 'person_add' },
        { id: 'clientes', titulo: 'Listado', icon: 'description' }
    ]},
    { id: 'usuarios', titulo: 'Usuarios', icon: 'group' }
  ];


  //Obtiene el tamaño actual de la pantalla 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
  this.pantalla = window.innerWidth;
  }

  constructor(
    private rutaActiva: ActivatedRoute,
    private router:Router,
    private titlepage:Title,
    private Globales:GlobalesService,
    private parametrosService:ParametrosService,
    private authService:AuthService,
    private dialog: MatDialog, //Ventana emergente
    ) {
      this.esApp = environment.tauri;
      this.produccion = environment.production;
    }

  ngOnInit(): void {
    if(this.authService.GetCargo() === "EMPLEADO")
      this.esEmpleado = true;

    //Nos suscribimos al parametro menu, para actualizar la vista de la pantalla segun el menu seleccionado
    this.rutaActiva.paramMap.subscribe(params => {
      const menu = params.get('menu');
      
      this.componente = menu!;
      this.titlepage.setTitle(menu?.toLocaleUpperCase() + ' | EasySales App')
    });

    // Buscar qué opción contiene el componente actual
    const opcionActiva = this.componentes.find(opcion =>
      opcion.submenu?.some(sub => sub.id === this.componente)
    );

    if (opcionActiva) {
      this.openedId = opcionActiva.id; 
    }

    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla
    this.VerificarComputadorHabilitado(false);

    this.ObtenerVersiones()
  }  

  Navegar(parametro:string){
    if(parametro == "nueva-factura"){
      this.router.navigateByUrl(parametro);
    }else{
      this.router.navigateByUrl("navegacion/" + parametro);
    }
  }
  NavegarAdmProducto(){
    this.router.navigateByUrl("administrar-producto/0");
  }

  toggleAccordion(id: string) {
    this.openedId = this.openedId === id ? null : id;
  }

  isExpanded(opcion: any): boolean {
    return this.openedId === opcion.id;
  }


  AccionarMenu(valor:boolean) {
    this.menuPlegado = valor;

    if (this.menuPlegado) {
      // Espera 300ms para mostrar E.S
      setTimeout(() => this.mostrarTextoChico = true, 300);
    } else {
      
      // Ocultar E.S inmediatamente y esperar para Easy Sales
      setTimeout(() => this.mostrarTextoChico = false, 300);
    }
  }

  //Verifica que el usuario tenga la terminal validada y habilitada
  async VerificarComputadorHabilitado(forzar:boolean){
    const hoy = new Date().toISOString().slice(0, 10); 

    const datosComputador = this.parametrosService.GetDatosComputadorHabilitado();
    
    // Si ya se verificó hoy, usar valor cacheado
    if(!forzar){
      if (datosComputador?.fechaVerificacion === hoy) {
        this.computadorHabilitado = datosComputador.habilitado;
        return;
      }
    }

    //Verificamos que este conectado a internet
    if (!navigator.onLine) {
      return;
    }
    
    // Validamos en el servidor adminServer si es una terminal habilitada
    await this.ValidarPermiso();
    
    // Guardar localmente la fecha y el permiso
    const nuevosDatos = {
      fechaVerificacion: hoy,
      habilitado: this.computadorHabilitado
    };

    localStorage.setItem('datosComputador', JSON.stringify(nuevosDatos));
  }

  async ValidarPermiso(){
    const dni = await firstValueFrom(this.parametrosService.ObtenerParametro('dni'));
    if(dni){ //Si no hay DNI aun no hizo la verificacion
      const permiso = await firstValueFrom(this.Globales.VerificarPermiso(dni));

      if(permiso){
        this.computadorHabilitado = true;
        return;
      }
    }

    this.computadorHabilitado = false;
  }

  async ObtenerVersiones(){
    if(this.parametrosService.GetDatosServidor().modo == "red") return;

    this.version = await firstValueFrom(this.parametrosService.ObtenerParametro('version'));
    if(!this.esApp) return; //Solo comparamos version si no esta en web

    //Verifica si se esta abriendo el programa luego de actualizarse
    const recienActualizado = await firstValueFrom(this.parametrosService.ObtenerParametro('actualizado'));

    if(recienActualizado=='false'){ //Si no esta recien actualizado comparamos versiones
      //Verificamos que este conectado a internet
      if (!navigator.onLine) {
        return;
      }

      const actualizacion = await firstValueFrom(this.Globales.ObtenerUltimaVersion());
      if(actualizacion && (actualizacion.estado === actualizacion.serverStatus)){
        const resultado = this.CompararVersiones(actualizacion.version, this.version);
        if(resultado === 1){
          this.versionDisponible = true;
          this.ultimaVersion = new Actualizacion();
          this.ultimaVersion = actualizacion;
  
          const aviso = await firstValueFrom(this.parametrosService.ObtenerParametro('avisoNvaVersion'));
          if(aviso=='true' && this.componente == "inicio")
            this.AbrirModalActualizar('info');
        }
      }
    }else if(recienActualizado=='true'){ //Informamos que el sistema se acaba de actualizar
      this.AbrirModalActualizar('actualizado');
    }
    
  }

  private CompararVersiones(web: string, local: string): number {
    const v1 = web.split('.').map(Number);
    const v2 = local.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0; // Si no hay más números en v1, usa 0
        const num2 = v2[i] || 0; // Si no hay más números en v2, usa 0

        if (num1 > num2) return 1;  // v1 es mayor
        if (num1 < num2) return -1; // v2 es mayor
    }

    return 0; // Las versiones son iguales
}


  AbrirModalActualizar(ventana:string){
    if(ventana=='info')      
      this.dialogConfig.disableClose = false;
    else      
      this.dialogConfig.disableClose = true;

    
    this.dialogConfig.width = "500px";
    this.dialogConfig.data = {ultimaVersion: this.ultimaVersion, ventana} 
    this.dialog.open(ActualizacionComponent, this.dialogConfig)
  }
}
