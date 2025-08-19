import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { ParametrosService } from '../services/parametros.service';

@Directive({
    selector: '[siComputadorHabilitado]',
    standalone: false
})
export class ComputadorHabilitadoDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private parametrosService: ParametrosService
  ) {
    const datos = this.parametrosService.GetDatosComputadorHabilitado();
    const habilitado = datos?.habilitado ?? false;
    if (habilitado) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
