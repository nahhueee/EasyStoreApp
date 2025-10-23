
import { Injectable } from '@angular/core';
import { Etiqueta } from '../models/Etiqueta';
import JsBarcode from 'jsbarcode';
import { TamaniosEtiqueta } from '../models/EtiquetaTamanios';
import { ProductoImprimir } from '../models/ProductoImprimir';

@Injectable({
  providedIn: 'root'
})
export class ImpresionEtiquetaService {
  private pdfMake: any;

  constructor() { }

  // Método para inicializar pdfMake
  async init() {
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts.js');

    this.pdfMake = pdfMakeModule.default;
    this.pdfMake.vfs = pdfFontsModule.default ? pdfFontsModule.default.pdfMake.vfs : pdfFontsModule.pdfMake.vfs;
  }

  //#region PDF
    async GenerarEtiquetas(etiqueta:Etiqueta, productos:ProductoImprimir[]) {
      if (!this.pdfMake) {
        await this.init();
      }
      const documentDefinition = await this.ArmarArchivo(etiqueta, productos);
      this.pdfMake.createPdf(documentDefinition).open();
    }
  
    private async ArmarArchivo(etiqueta:Etiqueta, productos:ProductoImprimir[]) {
      let tarjetasFila = 0;
      const tamanios: TamaniosEtiqueta = new TamaniosEtiqueta();

      switch (etiqueta.tamanio) {
        case "GRANDE":
          tarjetasFila = 1;
          tamanios.tarjetaTamanio = 573;
          tamanios.tituloTamanio = 15;
          tamanios.ofertaTamanio = 30;
          tamanios.precioTamanio = 55;
          tamanios.nombreTamanio = 14;
          tamanios.vencimientoTamanio = 12;
          tamanios.codigoTamanio = 250;
          tamanios.codigoTextTamanio = 12;
          tamanios.caracteresNombre = 80;
          break;
        case "MEDIANA":
          tarjetasFila = 2;
          tamanios.tarjetaTamanio = 282;
          tamanios.tituloTamanio = 13;
          tamanios.ofertaTamanio = 22;
          tamanios.precioTamanio = 32;
          tamanios.nombreTamanio = 12;
          tamanios.vencimientoTamanio = 11;
          tamanios.codigoTamanio = 220;
          tamanios.codigoTextTamanio = 11;
          tamanios.caracteresNombre = 35;
          break;
        case "PEQUEÑA":
          tarjetasFila = 3;
          tamanios.tarjetaTamanio = 182;
          tamanios.tituloTamanio = 12;
          tamanios.ofertaTamanio = 18;
          tamanios.precioTamanio = 23;
          tamanios.nombreTamanio = 10;
          tamanios.vencimientoTamanio = 9;
          tamanios.codigoTamanio = 160;
          tamanios.codigoTextTamanio = 10;
          tamanios.caracteresNombre = 25;
          break;
      }

      const cuadritos: any[] = [];

      for (const producto of productos) {
        const codigoBarrasBase64 = etiqueta.mCodigo 
        ? await this.GenerarCodigoBarras(producto.codigo!) 
        : null;

        //Generamos cuadritos segun la cantidad que el usuario definió
        for (let index = 0; index < producto.cantidad!; index++) {
          const cuadrito = this.GenerarCuadrito(etiqueta, tamanios, producto, codigoBarrasBase64);
          cuadritos.push(cuadrito);
        }
       
      }

      const contenido = this.AgruparEnFilas(cuadritos, tarjetasFila);
      const docDefinition = {
        pageSize: 'A4',
        content: contenido,
        pageMargins: [8, 10, 8, 0]
      };

      return docDefinition;
    }

    //Se encarga de posicionar a los cuadritos en fila
    //El parametro "porFila" define cuantos pueden existir en una fila
    private AgruparEnFilas(array: any[], porFila){
      const filas: any[] = [];

      for (let i = 0; i < array.length; i += porFila) {
        filas.push({
          columns: array.slice(i, i + porFila)
        });
      }

      return filas;
    }


    private GenerarCuadrito(plantilla:Etiqueta, tamanios:TamaniosEtiqueta, producto:ProductoImprimir, codigoBarra) {
      return {
          table: {
            widths: [tamanios.tarjetaTamanio],
            body: [[
              {
                stack: [
                  ...(plantilla.titulo != '' ? [{
                    text: plantilla.titulo,
                    color: plantilla.tituloColor,
                    alignment: plantilla.tituloAlineacion,
                    fontFamily: "Poppins-Regular",
                    fontSize: tamanios.tituloTamanio,
                    margin: [0, 5, 0, 5]
                  }] : []),

                  ...(plantilla.mOferta ? [ {
                    table: {
                      widths: ['*'],
                      body: [[
                        {
                          text: 'OFERTA',
                          color: '#1b1b1b',
                          fillColor: plantilla.ofertaFondo,
                          fontSize: tamanios.ofertaTamanio,
                          alignment: 'center',
                          margin: [0, 2, 0, 2]
                        }
                      ]]
                    },
                    layout: 'noBorders',
                    margin: [0, 0, 0, 5]
                  } ] : []),

                  ...(plantilla.mCodigo && codigoBarra ? [{
                    image: codigoBarra,
                    height: 40, 
                    width: tamanios.codigoTamanio,                   
                    alignment: 'center',
                    margin: [0, -2, 0, -3]
                  }] : []),
                  ...(plantilla.mCodigo ? [{
                    text: producto.codigo,
                    alignment: "center",
                    fontSize: tamanios.codigoTextTamanio,
                    margin: [0, 0, 0, 5]
                  }] : []),

                  ...(plantilla.mPrecio ? [{
                    text: "$" + this.FormatearPrecio(producto.precio),
                    alignment: plantilla.precioAlineacion,
                    color: plantilla.precioColor,
                    fontSize: tamanios.precioTamanio,
                    fontFamily: 'Roboto-Bold',
                    bold: true,
                    margin: [0, 0, 0, 5]
                  } ] : []),

                  ...(plantilla.mNombre ? [{
                    text: this.CortarNombreProducto(producto.nombre, tamanios.caracteresNombre),
                    alignment: plantilla.nombreAlineacion,
                    fontSize: tamanios.nombreTamanio,
                    margin: [0, 0, 0, 5]
                  } ] : []),

                  ...(plantilla.mVencimiento ? [{
                    text: "Vto: " + producto.vencimiento,
                    alignment: plantilla.nombreAlineacion,
                    fontSize: tamanios.vencimientoTamanio,
                    margin: [0, 0, 0, 5]
                  } ] : []),
                ],
              }
            ]]
          },
          layout: {
            hLineWidth: () => parseFloat(plantilla.bordeAncho.replace('px','')) || 1,
            vLineWidth: () => parseFloat(plantilla.bordeAncho.replace('px','')) || 1,
            hLineColor: () => plantilla.bordeColor || 'black',
            vLineColor: () => plantilla.bordeColor || 'black',
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 3,
            paddingBottom: () => 0
          },
          margin: [0, 0, 0, 5]
        };

    }

    private CortarNombreProducto = (nombreProd, tamanio) => {
      return nombreProd.length > tamanio ? nombreProd.substring(0, tamanio) + '...' : nombreProd;
    };

    private FormatearPrecio = (precio) => {
      const pNumero = parseFloat(precio);
      return pNumero.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    private GenerarCodigoBarras(texto: string) {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, texto, {
        format: 'CODE39',
        displayValue: false,
        height: 50,      // fijás la altura en píxeles (por ejemplo 50px)
        width: 2,
      });
      return canvas.toDataURL('image/png');
    }

    async GenerarImagen(url: string) {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

  
}