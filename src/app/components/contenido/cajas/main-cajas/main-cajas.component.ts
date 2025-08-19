import { Component, HostListener, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { EliminarComponent } from '../../../compartidos/eliminar/eliminar.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Caja } from 'src/app/models/Caja';
import { CajasService } from 'src/app/services/cajas.service';
import { FiltroCaja } from 'src/app/models/filtros/FiltroCaja';
import { FormControl, FormGroup } from '@angular/forms';
import { Usuario } from 'src/app/models/Usuario';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { MatDatepicker } from '@angular/material/datepicker';
import { AddmodCajasComponent } from '../addmod-cajas/addmod-cajas.component';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { invoke } from '@tauri-apps/api/tauri';
import { AuthService } from 'src/app/services/auth.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { forkJoin } from 'rxjs';
import { listen } from '@tauri-apps/api/event';

@Component({
    selector: 'app-cajas',
    templateUrl: './main-cajas.component.html',
    styleUrls: ['./main-cajas.component.scss'],
    standalone: false
})
export class MainCajasComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    cajas: Caja[] =[];
    responsables: Usuario[] =[];
    responsablesFiltrado: Usuario[] =[];

    filtros: FormGroup; //Formulario de filtros
    filtroActual: FiltroCaja;

    clickCount=0; //Para saber si se hace un solo click o dos sobre una celda

    displayedColumns: string[] = ['select', 'responsable', 'fecha', 'inicial', 'ventas', 'entradas', 'salidas', 'total', 'estado']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Caja>(this.cajas); //Data source de la tabla
    seleccionados = new SelectionModel<Caja>(true, []); //Data source de seleccionados

    verResumen:boolean;

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    @ViewChild(MatSort) sort: MatSort; //Para manejar el Reordenar del front
    @ViewChild(MatDatepicker) datepicker!: MatDatepicker<Date>; //Para manejar el Date Picker


    dialogConfig = new MatDialogConfig(); //Configuraciones para la ventana emergente
    pantalla: any = 0; //Para saber el tamaño de a pantalla

    esApp:boolean;
  //#endregion

  constructor( 
  private dialog: MatDialog, //Ventana emergente
  private Notificaciones:NotificacionesService, //Servicio de Notificaciones
  private router:Router, //Servicio para navegar en la aplicacion
  private cajasService:CajasService,
  private usuariosService:UsuariosService,
  private authService:AuthService,
  private parametrosService:ParametrosService
  ) {
    
    //Armamos el formulario de filtros
    this.filtros = new FormGroup({
      finalizada: new FormControl(false),
      responsable: new FormControl(''),
      fecha: new FormControl(''),
    });
  
    this.esApp = environment.tauri;
  }

  //Detecta el tamaño de la pantalla
  @HostListener('window:resize', ['$event'])
    onResize(event) {
    this.pantalla = window.innerWidth;
  }  

  ngOnInit(): void {
    //Configuraciones básicas de la ventana emergente 
    this.dialogConfig.disableClose = false;
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.maxHeight = "90vh";
    this.dialogConfig.width = "90vw";

    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla

    if(this.esApp){ //Actualiza la ventana de cajas si finalizó la caja
      listen('caja-finalizada', (event) => {
        window.location.reload();
      });
    }
  }

  ngAfterViewInit() { 
  this.paginator._intl.itemsPerPageLabel = 'Items por página';

  setTimeout(() => {
    this.ObtenerResponsables();

    //Obtenemos los datos de tabla
    this.Buscar();
  }, 0.5);
  }

  //#region GETS CONTROLS
  get finalizadaControl(): boolean {
    return  this.filtros.get('finalizada')?.value;
  }
  get responsableControl(): number {
    const result = this.filtros.get('responsable')?.value;
    if(result!='') return result;
    return 0;
  }
  get fechaControl(): Date | null {
    const result = this.filtros.get('fecha')?.value;
    if(result!='') return result;
    return null;
  }
  //#endregion

  //#region TABLA

  //#region VERIFICAR SI LOS REGISTROS ESTAN SELECCIONADOS
  //Selecciona todas las filas si no están todas seleccionadas; en caso contrario, borra la selección.
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.seleccionados.clear();
      return;
    }

    this.seleccionados.select(...this.dataSource.data);
  }
  // Verifica si el numero de filas es igual al numero de filas seleccionadas
  isAllSelected() {
    const numSelected = this.seleccionados.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  //#endregion

  Buscar(event?: PageEvent, recargaConFiltro = false){
    this.seleccionados.clear();

    //Eventos de la paginación
    if (!event) {
      event = new PageEvent();
      event.pageIndex = 0;
      event.pageSize = this.paginator.pageSize;
    }

    //#region FILTROS
    //Creamos el objeto para filtrar registros
    if(!recargaConFiltro){
      this.filtroActual = new FiltroCaja({
        pagina: event.pageIndex + 1,
        tamanioPagina: event.pageSize,
        
        finalizada: this.finalizadaControl,
        responsable: this.responsableControl,
        fecha: this.fechaControl,
      });
    }

    // let filtro: FiltroCaja;
    // var filtroGuardados = localStorage.getItem('filtros'); //Obtenemos los filtros guardados del local storage
    
    // if(filtroGuardados){ //Si existen filtros guardados los usamos, de lo contrario creamos y guardamos

    //   filtro = new FiltroCaja(JSON.parse(filtroGuardados));

    //   this.finalizadasControl.setValue(filtro.finalizada);
    //   this.filtros.get('responsable')?.setValue(filtro.responsable);
    //   this.filtros.get('fecha')?.setValue(filtro.fecha);

    // }else{
      
    //   filtro = new FiltroCaja();
    //   //Creamos un nuevo objeto para filtrar registros
    //   filtro.pagina= event.pageIndex + 1,
    //   filtro.tamanioPagina= event.pageSize,
      
    //   filtro.finalizada= this.finalizadaControl,
    //   filtro.responsable= this.responsableControl,
    //   filtro.fecha= this.fechaControl,
      
    //   //Guardamos el filtro en el local Storage
    //   localStorage.setItem('filtros', JSON.stringify(filtro));
    // }
    //#endregion

    // Obtiene listado de cajas y el total
    this.cajasService.ObtenerCajas(this.filtroActual)
        .subscribe(response => {
         
          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Ocultamos columnas si es empleado sin permiso de ver
          if(this.authService.GetCargo() == "EMPLEADO" && !this.parametrosService.PermitirVentasyTotales())
            this.displayedColumns = this.displayedColumns.filter(col => col !== 'ventas' && col !== 'entradas' && col !== 'salidas' && col !== 'total');
         
          this.cajas = [];
          this.cajas = response.registros;
          this.dataSource = new MatTableDataSource<Caja>(this.cajas);
          
          //DT de la tabla va a ser igual a lo que ordenamos con Sort
          this.dataSource.sort = this.sort;
        });
  }
  //#endregion

  //#region MODAL/ABM

  //Evento que sirve para saber si se hace un click o dos sobre una celda y realizar acción al respecto
  OnCellClick(row:any){
    if(row!=null||row!=undefined){

      this.clickCount++;
      setTimeout(() => {
          if (this.clickCount === 1) {
            this.seleccionados.toggle(row)
          } else if (this.clickCount === 2) {
            this.Modificar(row);
          }
          this.clickCount = 0;
      }, 250)
    }
  }

  Agregar(){
    this.dialogConfig.width = "400px";
    this.dialogConfig.data = {caja:null};
    this.dialog.open(AddmodCajasComponent, this.dialogConfig);
  }

  async Modificar(row?:any) { 
    
    let data: any;
    if(row==null){ //Si no hizo doble click sobre una celda y selecciono mas de una
      if(this.seleccionados.selected.length==0)return
      data = this.seleccionados.selected[0];
    }else{ //Si quiere editar solo un registro dando doble click
      data = row;
    }

    //Para tauri y web manejamos diferentes redireccionamientos
    if(environment.tauri){
      await this.openDetalleWindow(`index.html#/cajas/detalle/${data.id}`);
    }else{
      this.router.navigate([`/cajas/detalle/${data.id}`]);
    }
  }

  async openDetalleWindow(url:string) {
    try {
      await invoke('open_detail', {url});
    } catch (error) {
      console.error('Error al abrir Ventana de detalles de caja:', error);
    }
  }
 

  Eliminar() {
    if (this.authService.GetCargo() !== "ADMINISTRADOR") {
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
      return;
    }

    const nroSeleccionados = this.seleccionados.selected.length;

    if (nroSeleccionados === 0) return;

    this.dialogConfig.width = "500px";
    this.dialogConfig.data = { nroRegistros: nroSeleccionados };

    this.dialog.open(EliminarComponent, this.dialogConfig)
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) return;

        const eliminaciones$ = this.seleccionados.selected.map(elemento => {
          // Devolvemos el Observable de eliminación
          return this.cajasService.Eliminar(elemento.id!);
        });

        forkJoin(eliminaciones$).subscribe(responses => {
          // Contamos los que respondieron con 'OK'
          const contador = responses.filter(r => r === 'OK').length;

          if (contador === nroSeleccionados) {
            this.Notificaciones.success("Las cajas fueron eliminadas correctamente");
          } else {
            this.Notificaciones.warning(`Solo ${contador} de ${nroSeleccionados} se eliminaron correctamente.`);
          }

          // Recargar tabla y limpiar selección
          this.Buscar();
          this.seleccionados.clear();
        });
      });
  }
  //#endregion

  //#region OTROS
  VerResumen(){
    //Evalua que el empleado tenga permisos para ver esto
    if(this.authService.GetCargo() == "EMPLEADO"){
      if(!this.parametrosService.PermitirResumenCaja()){
        this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
        return;
      }
    }
     

    if(this.seleccionados.selected.length==0)return
    if(!this.seleccionados.selected[0].finalizada){
      this.Notificaciones.info('Asegurate de finalizar la caja antes.');
      return;
    }
    this.router.navigate([`/cajas/resumen/${this.seleccionados.selected[0].id}`]);
  }
  VerEstadisticas(){
    if(this.authService.GetCargo() == "ADMINISTRADOR"){
      if(this.seleccionados.selected.length==0)return
      this.router.navigate([`/cajas/estadisticas/${this.seleccionados.selected[0].id}`]);
    }else{
      this.Notificaciones.info(`Parece que no tienes permiso para realizar esta acción`);
    }
  }
  //#endregion

  //#region RESPONSABLES
  ObtenerResponsables(){
    this.usuariosService.SelectorUsuarios()
      .subscribe(response => {
        this.responsables = response;
        this.responsablesFiltrado = response;
      });
  }
  /*Filtra los responsables*/
  filtrarResponsable(event: any) {
    if (event.target.value == '') {
      this.responsablesFiltrado = this.responsables;
      return;
    }
    if (this.responsables) {
      this.responsablesFiltrado = this.responsables.filter(s =>
        s.nombre?.toUpperCase().includes(event.target.value.toUpperCase()));
    }
  }
  //#endregion

  //#region FILTROS
  BuscarCFiltros(){
    localStorage.removeItem('filtros');
    this.Buscar();
  }

  // LimpiarFiltros(){
  //   this.filtros.get("responsable")?.setValue('');
  //   this.filtros.get("fecha")?.setValue('');
  //   this.filtros.get("finalizada")?.setValue(false);
  //   localStorage.removeItem('filtros');

  //   this.Buscar();
  // }

  LimpiarResponsable(){
    this.filtros.get("responsable")?.setValue('');
    localStorage.removeItem('filtros');
    this.Buscar();
  }
  LimpiarFecha(){
    this.filtros.get("fecha")?.setValue('');
    localStorage.removeItem('filtros');
    this.Buscar();
  }

  //ventana para elegir la fecha
  toggleDatepicker(): void {
    this.datepicker.opened ? this.datepicker.close() : this.datepicker.open();
  }
  //#endregion
}
