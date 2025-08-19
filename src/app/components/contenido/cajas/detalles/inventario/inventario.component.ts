import { Component, HostListener, Input, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FiltroGral } from 'src/app/models/filtros/FiltroGral';
import { FiltroProducto } from 'src/app/models/filtros/FiltroProducto';
import { Producto } from 'src/app/models/Producto';
import { Rubro } from 'src/app/models/Rubro';
import { ProductosService } from 'src/app/services/productos.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-inventario',
    templateUrl: './inventario.component.html',
    styleUrls: ['./inventario.component.scss'],
    standalone: false
})
export class InventarioComponent implements OnInit, AfterViewInit {
  //#region VARIABLES
    productoSeleccionado: Producto;
    seleccionoProducto: boolean;

    productos: Producto[] =[];
    pathImgProd = "";

    rubros: Rubro[] =[];
    rubrosFiltrado: Rubro[] =[];
    rubroSeleccionado=0
    rubroControl = new FormControl('')
    
    displayedColumns: string[] = ['codigo', 'nombre', 'cantidad', 'unidad', 'precio']; //Columnas a mostrar
    dataSource = new MatTableDataSource<Producto>(this.productos); //Data source de la tabla

    @ViewChild(MatPaginator) paginator: MatPaginator; //Para manejar el Paginador del front
    pantalla: any = 0;
  //#endregion

  constructor(private productosService:ProductosService) {}

  //Obtiene el tamaño actual de la pantalla 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
  this.pantalla = window.innerWidth;
  }
  
  ngOnInit(): void {
    this.pantalla = window.innerWidth;//Obtiene el tamaño actual de la pantalla
  }

  ngAfterViewInit() {
    this.paginator._intl.itemsPerPageLabel = 'Items por página';

    setTimeout(() => {
      //Obtenemos los datos de tabla
      this.Buscar();
    }, 0.5);
  }
  
  //#region TABLA
    Buscar(event?: PageEvent, busqueda?:string){
     
      //Eventos de la paginación
      if (!event) {
        event = new PageEvent();
        event.pageIndex = 0;
        event.pageSize = this.paginator.pageSize;
      }

      //Creamos el objeto para filtrar registros
      const filtro: FiltroProducto = new FiltroProducto({
        pagina: event.pageIndex + 1,
        total: event.length,
        tamanioPagina: event.pageSize,
        busqueda: busqueda,
        categoria: this.rubroSeleccionado
      });

      
      // Obtiene listado de productos y el total
      this.productosService.ObtenerProductos(filtro)
          .subscribe(response => {
            
            //Llenamos el total del paginador
            this.paginator.length = response.total;

            //Llenamos la tabla con los resultados
            this.productos = [];
            this.productos = response.registros;
            this.dataSource = new MatTableDataSource<Producto>(this.productos);
          });
    }
  //#endregion

  MostrarDetalle(index:number){
    this.seleccionoProducto = true;
    this.productoSeleccionado = new Producto();
    this.productoSeleccionado = this.productos[index];

    this.pathImgProd = '';
    if(this.productoSeleccionado.imagen)
      this.pathImgProd = environment.apiUrl + `imagenes/obtener/${this.productoSeleccionado.imagen!}`;
    
    //Desmarcamos todas las ventas, y marcamos la seleccionada
    this.productos.forEach(producto => producto.activo = false);
    this.productos[index].activo = true;
  }
}
