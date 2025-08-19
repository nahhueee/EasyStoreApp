import { Component, Input, OnInit } from '@angular/core';
import { ParametrosService } from 'src/app/services/parametros.service';


@Component({
    selector: 'app-custom-divider',
    templateUrl: './custom-divider.component.html',
    styleUrls: ['./custom-divider.component.scss'],
    standalone: false
})
export class CustomDividerComponent implements OnInit {
  propP:any;
  propHR:any;

  @Input() texto = 'texto';
  @Input() icono = 'star_half';


  constructor(private parametroService:ParametrosService) { }

  ngOnInit(): void {
    // Revisa si el tema es white o dark, luego cambia los colores de el texto y los HR segun el tema
    if(this.parametroService.EsDark()){
      this.propP = {color:'#adadad'}
      this.propHR = {borderTopColor:'#747474'}
    }else{
      this.propP = {color:'#696969'}
      this.propHR = {borderTopColor:'#BDBDBD'}
    }
  }

}
