import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ribbonOutline, downloadOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tarjeta-certificado',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div
      class="bg-black/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-500 group flex flex-col h-full relative overflow-hidden tarjeta-borde-animado">
      <div class="animacion-borde"></div>

      <div class="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-500">
      </div>

      <div class="relative z-10 flex-1 flex flex-col">
          <div
              class="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <ion-icon name="ribbon-outline" class="text-3xl"></ion-icon>
          </div>

          <h4 class="text-xl font-black text-primary-500 mb-3 leading-tight font-heading">
              {{cert.curso_titulo}}</h4>
          <p class="text-sm font-medium text-slate-400 mb-8 flex-1">
              Expedido a nombre de: <br>
              <strong class="text-slate-200">{{cert.usuario_nombre}}</strong>
          </p>

          <div class="flex items-center justify-between border-t border-white/5 pt-4 mb-6">
              <span class="text-[10px] font-black text-primary-400 uppercase tracking-widest">Fecha</span>
              <span class="text-xs font-bold text-white">{{formatearFecha(cert.fecha_emision)}}</span>
          </div>

          <button (click)="onDescargar()" [disabled]="descargando"
              class="w-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-emerald-500/30 hover:border-emerald-500 hover:-translate-y-1 shadow-lg shadow-emerald-500/0 hover:shadow-emerald-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              <ion-icon [name]="descargando ? 'time-outline' : 'download-outline'" class="text-xl"></ion-icon>
              {{ descargando ? 'Espera un momento...' : 'Descargar PDF' }}
          </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes rotar-borde {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .tarjeta-borde-animado {
      z-index: 0;
    }

    .animacion-borde {
      position: absolute;
      inset: 0;
      padding: 1.5px; /* Grosor del haz de luz */
      border-radius: inherit;
      pointer-events: none;
      z-index: 20;
      /* Mascara para que solo se vea el borde */
      -webkit-mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .animacion-borde::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 150%;
      height: 150%;
      background: conic-gradient(
        from 0deg,
        transparent 0%,
        transparent 75%,
        #10f981 85%,
        #bef264 95%,
        #10f981 100%
      );
      animation: rotar-borde 4s linear infinite;
    }
  `]
})
export class TarjetaCertificadoComponent {
  @Input() cert: any;
  @Output() descargar = new EventEmitter<any>();

  descargando = false;

  constructor() {
    addIcons({
      'ribbon-outline': ribbonOutline,
      'download-outline': downloadOutline,
      'time-outline': timeOutline
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  onDescargar() {
    if (this.descargando) return;

    this.descargando = true;
    this.descargar.emit(this.cert);

    setTimeout(() => {
      this.descargando = false;
    }, 3000);
  }
}
