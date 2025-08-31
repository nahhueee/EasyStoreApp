import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-busqueda',
    templateUrl: './busqueda.component.html',
    styleUrls: ['./busqueda.component.scss'],
    standalone: false
})
export class BusquedaComponent {
  txtBusqueda="";
  @Output() busqueda = new EventEmitter<string>();
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef<HTMLInputElement>;

  LimpiarBusqueda(){
    this.txtBusqueda = "";
    this.Buscar();
  }

  SelectContent(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  FocusInput() {
    this.inputBusqueda?.nativeElement.focus();
  }

  keyDown() {
    if(this.txtBusqueda == ""){
      this.Buscar();
    }
  }

  Buscar(){
    this.busqueda.emit(this.txtBusqueda);
  }
}
