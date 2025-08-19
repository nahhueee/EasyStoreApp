// src/app/max-length-number.directive.ts
import { Directive, HostListener, Input, ElementRef, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appMaxLengthNumber]',
    standalone: false
})
export class MaxLengthNumberDirective {
  @Input() appMaxLengthNumber!: number | any; // Recibe la longitud máxima desde el template

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;

    // Verifica y ajusta el valor si excede la longitud permitida
    if (input.value.length > this.appMaxLengthNumber) {
      // Corta el valor a la longitud máxima
      const truncatedValue = input.value.slice(0, this.appMaxLengthNumber);
      this.renderer.setProperty(input, 'value', truncatedValue);
      
      // Dispara un evento de entrada manualmente para sincronizar con Angular
      const newEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(newEvent);
    }
  }
}
