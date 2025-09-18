import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorHandlerService } from 'src/app/services/http-error-handler.service';

//Idioma
import localEsAR from '@angular/common/locales/es-AR';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
registerLocaleData(localEsAR);

// Material
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatDialogModule} from '@angular/material/dialog';
import {MatRadioModule} from '@angular/material/radio';
import {MatTabsModule} from '@angular/material/tabs';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatBadgeModule} from '@angular/material/badge';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatStepperModule} from '@angular/material/stepper';

//Otros
import { ToastrModule } from 'ngx-toastr';
import { IMaskModule } from 'angular-imask';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgApexchartsModule } from 'ng-apexcharts';
import { InterceptorService } from 'src/app/services/interceptor.service';
import { NgxCollapseAnimatedDirective } from 'ngx-collapse-animated';

//Componentes
import { NavegacionComponent } from './components/navegacion/navegacion.component';
import { InicioComponent } from './components/contenido/inicio/inicio.component';
import { MainUsuariosComponent } from './components/contenido/usuarios/main-usuarios/main-usuarios.component';
import { HerramientasBarComponent } from './components/herramientas/herramientas-bar/herramientas-bar.component';
import { AddmodUsuariosComponent } from './components/contenido/usuarios/addmod-usuarios/addmod-usuarios.component';
import { EliminarComponent } from './components/compartidos/eliminar/eliminar.component';
import { CustomDividerComponent } from './components/compartidos/custom-divider/custom-divider.component';
import { BusquedaComponent } from './components/compartidos/busqueda/busqueda.component';
import { GlobalErrorHandlerService } from 'src/app/services/global-error-handler.service';
import { MainClientesComponent } from './components/contenido/clientes/main-clientes/main-clientes.component';
import { LoginComponent } from './components/login/login.component';
import { AddmodClientesComponent } from './components/contenido/clientes/addmod-clientes/addmod-clientes.component';
import { PreferenciasComponent } from './components/herramientas/preferencias/preferencias.component';
import { MainProductosComponent } from './components/contenido/productos/main-productos/main-productos.component';
import { AddmodProductosComponent } from './components/contenido/productos/addmod-productos/addmod-productos.component';
import { MainCajasComponent } from './components/contenido/cajas/main-cajas/main-cajas.component';
import { AddmodCajasComponent } from './components/contenido/cajas/addmod-cajas/addmod-cajas.component';
import { NewVentaComponent } from './components/contenido/cajas/detalles/new-venta/new-venta.component';
import { VentasComponent } from './components/contenido/cajas/detalles/ventas/ventas.component';
import { MainMovimientosComponent } from './components/contenido/cajas/detalles/movimientos/main-movimientos/main-movimientos.component';
import { RegistrarVentaComponent } from './components/contenido/cajas/detalles/registrar-venta/registrar-venta.component';
import { AddMovimientosComponent } from './components/contenido/cajas/detalles/movimientos/add-movimientos/add-movimientos.component';
import { InventarioComponent } from './components/contenido/cajas/detalles/inventario/inventario.component';
import { ConfirmacionComponent } from './components/compartidos/confirmacion/confirmacion.component';
import { VentasClientesComponent } from './components/contenido/clientes/ventas-clientes/ventas-clientes.component';
import { EntregaVentasComponent } from './components/contenido/clientes/entrega-ventas/entrega-ventas.component';
import { ResumenCajasComponent } from './components/contenido/cajas/resumen-cajas/resumen-cajas.component';
import { EstadisticasCajasComponent } from './components/contenido/cajas/estadisticas-cajas/estadisticas-cajas.component';
import { DecimalFormatPipe } from './pipes/decimal-format.pipe';
import { MaxLengthNumberDirective } from './others/max-length-number.directive';
import { RespaldosComponent } from './components/herramientas/respaldos/respaldos.component';
import { ActualizacionComponent } from './components/herramientas/actualizacion/actualizacion.component';
import { IdentidadComponent } from './components/herramientas/identidad/identidad.component';
import { DetCajasComponent } from './components/contenido/cajas/det-cajas/det-cajas.component';
import { ErroresComponent } from './components/herramientas/errores/errores.component';
import { ImagenProductoComponent } from './components/contenido/productos/imagen-producto/imagen-producto.component';
import { DatosFacturacionComponent } from './components/contenido/cajas/detalles/datos-facturacion/datos-facturacion.component';
import { ServidorComponent } from './components/herramientas/servidor/servidor.component';
import { ComputadorHabilitadoDirective } from './directives/computadorHabilitado.directive';
import { ModoTrabajoComponent } from './components/herramientas/modo-trabajo/modo-trabajo.component';
import { EstadoComponent } from './components/contenido/cajas/detalles/estado/estado.component';
import { RegistroEntregasComponent } from './components/contenido/clientes/registro-entregas/registro-entregas.component';
import { TomarFotoComponent } from './components/contenido/productos/tomar-foto/tomar-foto.component';
import { MainEtiquetasComponent } from './components/contenido/etiquetas/main-etiquetas/main-etiquetas.component';
import { AddmodEtiquetasComponent } from './components/contenido/etiquetas/addmod-etiquetas/addmod-etiquetas.component';
import { ImpimirEtiquetasComponent } from './components/contenido/productos/impimir-etiquetas/impimir-etiquetas.component';
import { AdministrarProductosComponent } from './components/contenido/productos/administrar-productos/administrar-productos.component';

@NgModule({ declarations: [
        AppComponent,
        NavegacionComponent,
        InicioComponent,
        MainUsuariosComponent,
        HerramientasBarComponent,
        AddmodUsuariosComponent,
        AddmodClientesComponent,
        EliminarComponent,
        CustomDividerComponent,
        BusquedaComponent,
        MainClientesComponent,
        LoginComponent,
        PreferenciasComponent,
        MainProductosComponent,
        AddmodProductosComponent,
        MainCajasComponent,
        AddmodCajasComponent,
        DetCajasComponent,
        NewVentaComponent,
        VentasComponent,
        MainMovimientosComponent,
        RegistrarVentaComponent,
        AddMovimientosComponent,
        InventarioComponent,
        ConfirmacionComponent,
        VentasClientesComponent,
        EntregaVentasComponent,
        ResumenCajasComponent,
        EstadisticasCajasComponent,
        DecimalFormatPipe,
        MaxLengthNumberDirective,
        RespaldosComponent,
        ActualizacionComponent,
        IdentidadComponent,
        ErroresComponent,
        ImagenProductoComponent,
        DatosFacturacionComponent,
        ServidorComponent,
        ComputadorHabilitadoDirective,
        ModoTrabajoComponent,
        EstadoComponent,
        RegistroEntregasComponent,
        TomarFotoComponent,
        MainEtiquetasComponent,
        AddmodEtiquetasComponent,
        ImpimirEtiquetasComponent,
        AdministrarProductosComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatSelectModule,
        MatSliderModule,
        MatDividerModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSidenavModule,
        MatCardModule,
        MatTooltipModule,
        MatInputModule,
        MatSnackBarModule,
        MatTableModule,
        MatCheckboxModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatRadioModule,
        MatTabsModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatBadgeModule,
        MatMenuModule,
        MatButtonToggleModule,
        MatStepperModule,
        ToastrModule.forRoot(),
        IMaskModule,
        NgxSpinnerModule,
        NgApexchartsModule,
        NgxCollapseAnimatedDirective
    ], providers: [
        provideAnimations(),

        //Configuracion regional fechas
        MatDatepickerModule, { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        {
            // Maneja errores tipo http globales de la app
            provide: HTTP_INTERCEPTORS,
            useClass: HttpErrorHandlerService,
            multi: true
        },
        //Se encarga de atrapar los pedidos al back y mostrar el spinner
        { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
        //Aplica la estrategia # para las recargas, error 404
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        //Captura los errores globales de la aplicacion
        { provide: ErrorHandler, useClass: GlobalErrorHandlerService } // Proveer el manejador personalizado
        ,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
