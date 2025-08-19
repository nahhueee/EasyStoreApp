import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto } from 'src/app/models/Producto';
import { FiltroGral } from '../models/filtros/FiltroGral';
import { ApiService } from './api.service';
import { FiltroProducto } from '../models/filtros/FiltroProducto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  constructor(private apiService:ApiService) {}

  //#region OBTENER
  ObtenerProductos(filtro:FiltroProducto): Observable<any> {
    return this.apiService.post('productos/obtener', filtro)
  }

  BuscarProductos(metodo:string, valor:string): Observable<any>{
    return this.apiService.post('productos/buscar-productos', {metodo, valor})
  }
  
  ObtenerProductosSoloPrecio(): Observable<any> {
    return this.apiService.get('productos/productos-soloPrecio')
  }
  //#endregion


  //#region ABM
  VerificarYObtener(cod:string): Observable<any>{
    return this.apiService.get(`productos/verificar/${cod}`)
  }

  Agregar(prod:Producto): Observable<any>{
    return this.apiService.post('productos/agregar', prod)
  }

  GuardarDesdeExcel(productos:Producto[], accion:string): Observable<any>{
    return this.apiService.post('productos/actualizar-varios', {productos, accion})
  }

  Modificar(prod:Producto): Observable<any>{
    return this.apiService.put('productos/modificar', prod)
  }

  AniadirCantidad(prod:Producto): Observable<any>{
    return this.apiService.put('productos/aniadir', {idProducto:prod.id, cant:prod.cantidad})
  }

  ActualizarFaltante(prod:Producto): Observable<any>{
    return this.apiService.put('productos/actualizar-faltante', {idProducto:prod.id, faltante:prod.faltante})
  }
  ActualizarVencimiento(prod:Producto): Observable<any>{
    return this.apiService.put('productos/actualizar-vencimiento', {idProducto:prod.id, vencimiento:prod.vencimiento})
  }

  Eliminar(id:number): Observable<any>{
    return this.apiService.delete(`productos/eliminar/${id}`)
  }

  ActualizarPrecios(prod:Producto): Observable<any>{
    return this.apiService.put('productos/actualizar-precio', prod)
  }

  ActualizarImagen(imagen:string, idProducto:number){
    return this.apiService.put('productos/actualizar-imagen', {imagen, idProducto})
  }
  //#endregion
}
