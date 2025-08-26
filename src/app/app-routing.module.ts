import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavegacionComponent } from './components/navegacion/navegacion.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ResumenCajasComponent } from './components/contenido/cajas/resumen-cajas/resumen-cajas.component';
import { EstadisticasCajasComponent } from './components/contenido/cajas/estadisticas-cajas/estadisticas-cajas.component';
import { VentasClientesComponent } from './components/contenido/clientes/ventas-clientes/ventas-clientes.component';
import { DetCajasComponent } from './components/contenido/cajas/det-cajas/det-cajas.component';
import { AddmodEtiquetasComponent } from './components/contenido/etiquetas/addmod-etiquetas/addmod-etiquetas.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/navegacion/inicio',
    pathMatch: 'full'
  },
  {
    path: 'navegacion',
    redirectTo: '/navegacion/inicio',
    pathMatch: 'full'
  },
  {
    path: 'navegacion/:menu',
    component:NavegacionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'ingresar',
    component:LoginComponent,
  },
  {
    path:"cajas/detalle/:idCaja",
    component:DetCajasComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"cajas/resumen/:idCaja",
    component:ResumenCajasComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"cajas/estadisticas/:idCaja",
    component:EstadisticasCajasComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"clientes/ventas/:idCliente",
    component:VentasClientesComponent,
    canActivate: [AuthGuard]
  },
{
    path:"administrar-etiqueta/:idEtiqueta",
    component:AddmodEtiquetasComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
