import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { themeConfig } from 'src/theme.config';
import {
  ApexChart,
  ApexAxisChartSeries,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexGrid,
  ApexTheme,
  ApexTitleSubtitle,
  ApexStroke,
  ApexTooltip
} from "ng-apexcharts";
import { Grafico } from 'src/app/models/estadisticas/Grafico';
import { GraficosService } from 'src/app/services/graficos.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { VentasCaja } from 'src/app/models/estadisticas/ventasCaja';
import { Caja } from 'src/app/models/Caja';
import { ActivatedRoute, Router } from '@angular/router';
import { CajasService } from 'src/app/services/cajas.service';
import { MatTableDataSource } from '@angular/material/table';
import { TotalAcumulado } from 'src/app/models/estadisticas/TotalAcumulado';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FiltroAcumulado } from 'src/app/models/filtros/FiltroAcumulados';
import { FormControl } from '@angular/forms';

interface ApexXAxis {
  type?: "category" | "datetime" | "numeric";
  categories?: any;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
}

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
  theme: ApexTheme;
  title: ApexTitleSubtitle,
  stroke: ApexStroke,
  tooltip: ApexTooltip
}

@Component({
    selector: 'app-estadisticas-cajas',
    templateUrl: './estadisticas-cajas.component.html',
    styleUrls: ['./estadisticas-cajas.component.scss'],
    standalone: false
})
export class EstadisticasCajasComponent implements OnInit, AfterViewInit {
  public chartProductosOptions?: Partial<ChartOptions>;
  public chartGananciasOptions?: Partial<ChartOptions>;

  idCaja: number;
  caja: Caja = new Caja();
  datosVentaCaja: VentasCaja = new VentasCaja;

  isDark: boolean;
  coloresTema: string[];

  productosReady:boolean;
  gananciasReady:boolean;

  totalesAcumulado:TotalAcumulado[] = [];
  filtro:FormControl;

  displayedColumn: string[] = ['nombre', 'total']; //Columnas a mostrar
  dtacumulados = new MatTableDataSource<TotalAcumulado>(this.totalesAcumulado); //Data source de la tabla
  @ViewChild('paginator') paginator!: MatPaginator;

  constructor(
    private rutaActiva: ActivatedRoute, //Para manejar la ruta actual
    private router:Router, //Servicio para navegar en la aplicacion
    private graficosService: GraficosService,
    private parametroService:ParametrosService,
    private cajasService: CajasService,
  ) {
    this.filtro = new FormControl('');
  }

  ngOnInit(){
    this.isDark = this.parametroService.EsDark();

    const color = this.parametroService.GetTema();
    this.coloresTema = themeConfig.getThemeColors(color.replace('-theme', ''));

    //Obtenemos el id de la caja desde la url
    this.idCaja = this.rutaActiva.snapshot.params['idCaja']
    this.ObtenerCaja();

    //Obtenemos los datos de venta de la caja
    this.graficosService.ObtenerDatosVentaCaja(this.idCaja)
    .subscribe(response => {
      this.datosVentaCaja = response;
    });

    //Generamos el grafico de ganancias de cajas
    this.graficosService.ObtenerGraficoGanancias(this.idCaja)
    .subscribe(response => {
      this.GenerarGraficoGanancias(response);
      this.gananciasReady = true;
    });

    //Generamos el grafico de productos populares
    // this.graficosService.ObtenerGraficoProductos(this.idCaja)
    // .subscribe(response => {
    //   this.GenerarGraficoProductos(response);
    //   this.productosReady = true;
    // });
  }

  ngAfterViewInit(){
    setTimeout(() => {
      this.BuscarProductosRubrosAcumulados();
    })
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  ObtenerCaja(){
    this.cajasService.ObtenerCaja(this.idCaja)
    .subscribe(response => {
      this.caja = new Caja(response);
    });
  }

  BuscarProductosRubrosAcumulados(event?: PageEvent){
    //Eventos de la paginación
    if (!event) {
      event = new PageEvent();
      event.pageIndex = 0;
      event.pageSize = this.paginator.pageSize;
    }

    //Creamos el objeto para filtrar registros
    const filtro: FiltroAcumulado = new FiltroAcumulado({
      pagina: event.pageIndex + 1,
      total: event.length,
      tamanioPagina: event.pageSize,
      caja: this.idCaja,
      tipo: "Producto",
      nombre: this.filtro.value
    });

      // Obtiene listado de ventas y el total
    this.graficosService.ObtenerTotalesAcumulados(filtro)
        .subscribe(response => {

          //Llenamos el total del paginador
          this.paginator.length = response.total;

          //Llenamos la tabla con los resultados
          this.totalesAcumulado = [];
          this.totalesAcumulado = response.registros;
          this.dtacumulados = new MatTableDataSource<TotalAcumulado>(this.totalesAcumulado);
        });
  }
  Cerrar(){
    this.router.navigate([`navegacion/cajas/`]);
  }

  GenerarGraficoProductos(datos:Grafico){
    this.chartProductosOptions = {
      chart: {
        height: 350, //Altura del grafico
        type: "bar", //Tipo de grafico
        background: this.isDark ? "#424242" : "#ffffff"
      },
      title: {
        text: "Productos más populares",
        align: 'left',
        margin: 15,
        style: {
          fontSize:  '16px',
          fontFamily:  'Roboto-Bold',
        },
      },
      series: [
        {
          name: "Nro Ventas", //Nombre del dato
          data: datos.ejeY //Datos
        }
      ],
      xaxis: {
        categories: datos.ejeX.map((elemento: string) => { //Convierto cada string en un array con las primeras 3 palabras para que se vean mejor los productos largos 
          const arrayString = elemento.split(' ');
          return arrayString.slice(0, 3); }
        ),
        labels: {
          style: {
            fontSize: "12px"
          }
        }
      },
      colors: this.coloresTema,
      theme: {
        mode: this.isDark ? "dark" : "light", 
      },
      plotOptions: { //Opciones del grafico, en este caso las barras
        bar: {
          columnWidth: "80%",
          distributed: true
        }
      },
      dataLabels: { //Label de datos
        enabled: true
      },
      legend: { //Cuadro de informacion
        show: false
      },
      grid: { //Grilla
        show: true,
        borderColor: this.isDark ? "#4f4f4f" : "#e5e5e5", 
      }
    };
  }

  GenerarGraficoGanancias(datos:Grafico){
    this.chartGananciasOptions = {
      chart: {
        height: 350,
        type: "line",
        background: this.isDark ? "#424242" : "#ffffff",

        zoom: {
          enabled: false
        }
      },
      title: {
        text: "Ganancias con cajas anteriores",
        align: 'left',
        margin: 15,
        style: {
          fontSize:  '16px',
          fontFamily:  'Roboto-Bold',
        },
      },
      series: [
        {
          name: "Ganancia", //Nombre del dato
          data: datos.ejeY //Datos
        }
      ],
      xaxis: {
        categories: datos.ejeX.map((elemento: string, indice, array) => { 
          if (indice === array.length - 1) {
            return "Caja Actual";
          } else {
              return "Caja Nro: " + elemento;
          }
        }
        ),
        labels: {
          style: {
            fontSize: "12px"
          }
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "straight"
      },
      theme: {
        mode: this.isDark ? "dark" : "light", 
      },
      grid: {
        show: true,
        borderColor: this.isDark ? "#4f4f4f" : "#e5e5e5", 
      },
    };
  }
}
