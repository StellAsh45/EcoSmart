import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  checkmarkCircleOutline,
  peopleOutline,
  statsChartOutline,
  closeCircleOutline,
  chatbubblesOutline,
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tarjeta-estadistica',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div
      class="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 flex items-center gap-6 transition-all border-b-4 border-b-transparent h-full"
      [ngClass]="'tarjeta-pulso-' + variante"
      [style.animation-delay]="retraso + 's'">
      
      <div
        class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 transition-all icono-pulso"
        [style.animation-delay]="retraso + 's'">
        <ion-icon [name]="icono" class="text-3xl"></ion-icon>
      </div>

      <div class="flex-1">
        <p
          class="text-xs font-black text-primary-50 uppercase tracking-widest mb-1 transition-all texto-pulso"
          [style.animation-delay]="retraso + 's'">
          {{titulo}}
        </p>
        
        <div class="flex items-baseline gap-2">
          <p class="text-3xl font-black text-white" *ngIf="!cargando">
            {{valor}}
          </p>
          <div *ngIf="cargando" class="w-16 h-8 bg-white/10 animate-pulse rounded-lg"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulso-tarjeta {
      0%, 100% {
        background-color: rgba(255, 255, 255, 0.05);
        border-bottom-color: transparent;
        box-shadow: 0 0 0 rgba(0, 0, 0, 0);
      }
      50% {
        background-color: rgba(255, 255, 255, 0.08);
        border-bottom-color: var(--color-pulso);
        box-shadow: 0 10px 30px -10px var(--color-sombra);
      }
    }

    @keyframes pulso-contenido {
      0%, 100% {
        filter: brightness(1);
      }
      50% {
        filter: brightness(1.3);
        color: var(--color-pulso);
      }
    }

    .tarjeta-pulso-primario {
      --color-pulso: #10f981;
      --color-sombra: rgba(16, 249, 129, 0.15);
      animation: pulso-tarjeta 6s ease-in-out infinite;
      .icono-pulso, .texto-pulso { animation: pulso-contenido 6s ease-in-out infinite; }
    }

    .tarjeta-pulso-azul {
      --color-pulso: #3b82f6;
      --color-sombra: rgba(59, 130, 246, 0.15);
      animation: pulso-tarjeta 6s ease-in-out infinite;
      .icono-pulso, .texto-pulso { animation: pulso-contenido 6s ease-in-out infinite; }
    }

    .tarjeta-pulso-esmeralda {
      --color-pulso: #10b981;
      --color-sombra: rgba(16, 185, 129, 0.15);
      animation: pulso-tarjeta 6s ease-in-out infinite;
      .icono-pulso, .texto-pulso { animation: pulso-contenido 6s ease-in-out infinite; }
    }

    .tarjeta-pulso-rojo {
      --color-pulso: #ef4444;
      --color-sombra: rgba(239, 68, 68, 0.15);
      animation: pulso-tarjeta 6s ease-in-out infinite;
      .icono-pulso, .texto-pulso { animation: pulso-contenido 6s ease-in-out infinite; }
    }

    .tarjeta-pulso-dorado {
      --color-pulso: #fde047;
      --color-sombra: rgba(253, 224, 71, 0.15);
      animation: pulso-tarjeta 6s ease-in-out infinite;
      .icono-pulso, .texto-pulso { animation: pulso-contenido 6s ease-in-out infinite; }
    }
  `]
})
export class TarjetaEstadisticaComponent {
  @Input() titulo: string = '';
  @Input() valor: string | number = 0;
  @Input() icono: string = '';
  @Input() variante: 'primario' | 'azul' | 'esmeralda' | 'rojo' | 'dorado' = 'primario';
  @Input() cargando: boolean = false;
  @Input() retraso: number = 0;

  constructor() {
    addIcons({
      'book-outline': bookOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'people-outline': peopleOutline,
      'stats-chart-outline': statsChartOutline,
      'close-circle-outline': closeCircleOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'alert-circle-outline': alertCircleOutline
    });
  }
}
