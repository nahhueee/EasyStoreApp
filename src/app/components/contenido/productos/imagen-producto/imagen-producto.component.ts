import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TomarFotoComponent } from '../tomar-foto/tomar-foto.component';
import { GlobalesService } from 'src/app/services/globales.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { environment } from 'src/environments/environment';
import { ProductosService } from 'src/app/services/productos.service';

@Component({
    selector: 'app-imagen-producto',
    templateUrl: './imagen-producto.component.html',
    styleUrls: ['./imagen-producto.component.scss'],
    standalone: false
})
export class ImagenProductoComponent {
  pathImagen = "";
  selectedFile: File;
  actualizarVista:boolean;

  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, //Datos que envia la pantalla anterior
    public dialogRef: MatDialogRef<ImagenProductoComponent>, //Ventana emergente actual
    private Globales:GlobalesService,
    private Notificaciones:NotificacionesService,
    private productosService:ProductosService
  ){
    this.pathImagen = data.pathImagen;
  }

  //#region DesdeGaleria
  async onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
    //Espero a subir la imagen al servidor y obtengo su path
    if(this.selectedFile){
      await this.SubirImagen();
    }
  }

  SeleccionarImagen(): void {
    const fileInput = document.getElementById('imageInput');
    if (fileInput) {
      fileInput.click(); // Simula un clic en el input de tipo file al hacer clic en el botón personalizado
    }
  }
  async SubirImagen(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.Globales.SubirImagen(this.selectedFile)
      .subscribe(resp => {
        this.ProcesarSubida(resp);
        resolve();
      });
    });
  }
  //#endregion

  //#region DesdeCamara
  async AbrirCamara() {
    const dialogRef = this.dialog.open(TomarFotoComponent, {
      width: '600px',
      disableClose: true
    });

    const foto = await dialogRef.afterClosed().toPromise();
    if (foto) {
      const fotoFile = this.base64ToFile(foto, 'foto.png');

      this.Globales.SubirImagen(fotoFile)
      .subscribe(resp => {
        this.ProcesarSubida(resp);
      });
    }
  }

  //convierta a base64 la foto tomada
  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
  //#endregion

  ProcesarSubida(resp:any){
    if(resp == "Error"){
      this.Notificaciones.warning("No se logró subir la imagen, intenta nuevamente");
    }else{
      this.pathImagen = environment.apiUrl + `imagenes/obtener/${resp}`;

      //Asociamos la imagen al producto
      this.productosService.ActualizarImagen(resp, this.data.idProducto)
      .subscribe((response:any) => {
        if(response=='OK'){
          this.Notificaciones.success("Imagen actualizada correctamente");
          this.actualizarVista = true;
        }else{
          this.Notificaciones.warning(response);
        }
      });
    }
  }

  Cerrar(){
    this.dialogRef.close(this.actualizarVista);
  }
}
