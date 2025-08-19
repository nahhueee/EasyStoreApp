import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmiterService {
  cajasEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  //Dispara un evento que indica que las cajas deben actualizarse
  ActualizarCajas() {
    this.cajasEmitter.emit(true);
  }
}
