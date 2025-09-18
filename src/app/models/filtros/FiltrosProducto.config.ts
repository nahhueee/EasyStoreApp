import { FormControl } from '@angular/forms';

export type PropKey = 'procesos' | 'codigo' | 'tipos' | 'subtipos' | 'generos' | 'materiales' | 'colores' | 'temporadas' ;

export interface FiltroConfig {
  data: any[];
  filtrado: any[];
  seleccionado: number;
  control: FormControl;
  placeholder: string;
}

export const crearFiltros = (): Record<PropKey, FiltroConfig> => ({
  procesos: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Proceso',
  },
  codigo:{
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Codigo',
  },
  tipos: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Producto',
  },
  subtipos: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Tipo',
  },
  generos: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Género',
  },
  materiales: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Material',
  },
  colores: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Color',
  },
  temporadas: {
    data: [],
    filtrado: [],
    seleccionado: 0,
    control: new FormControl(''),
    placeholder: 'Temporada',
  },
});
