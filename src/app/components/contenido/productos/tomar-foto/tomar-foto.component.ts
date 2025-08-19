import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-tomar-foto',
    templateUrl: './tomar-foto.component.html',
    styleUrls: ['./tomar-foto.component.scss'],
    standalone: false
})
export class TomarFotoComponent implements AfterViewInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  private stream: MediaStream | null = null;

  constructor(private dialogRef: MatDialogRef<TomarFotoComponent>) {}

  async ngAfterViewInit() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.stream;
      this.videoElement.nativeElement.play();
    } catch (err) {
      console.error('Error al abrir la cámara:', err);
    }
  }

  tomarFoto() {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const fotoBase64 = canvas.toDataURL('image/png');
    this.cerrar(fotoBase64);
  }

  cerrar(data?: string) {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.dialogRef.close(data);
  }
}
