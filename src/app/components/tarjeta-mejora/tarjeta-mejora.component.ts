import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tarjeta-mejora',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <button (click)="onComprar()" [disabled]="!puedeComprar" [class.can-afford]="puedeComprar" [class.comprando]="comprando"
      [style.color]="color" [style.--card-color]="color" class="upgrade-card group flex flex-col items-start p-3 pt-2 gap-2"
      [style.background-color]="puedeComprar ? (color + '15') : 'rgba(255,255,255,0.03)'">
      
      <div class="upgrade-shimmer"></div>

      <!-- Nivel Superior: Título con Indicador -->
      <div class="w-full flex items-center gap-2 border-b pb-1.5" [style.border-color]="color + '30'">
        <div class="title-indicator w-1 h-4 rounded-full" [style.background-color]="color"></div>
        <h4 class="font-black text-sm sm:text-base tracking-tight" [style.color]="color"
          [style.text-shadow]="'0 0 10px ' + color + '40'">
          {{nombre}}
        </h4>
      </div>

      <!-- Nivel Inferior: Icono, Descripción y Precio -->
      <div class="w-full flex items-center gap-3">
        <div class="upgrade-icon" [style.background-color]="color + '20'" [style.color]="color">
          <ion-icon [name]="icono"></ion-icon>
        </div>

        <div class="flex-1 text-left min-w-0">
          <p class="text-primary-50 text-[10px] sm:text-[11px] leading-snug">{{descripcion}}</p>
        </div>

        <div class="upgrade-price">
          <span class="effect-label" [style.color]="color">{{efectoTexto}}</span>
          <div
            class="flex items-center gap-1 text-white font-black text-xs bg-black/20 px-2 py-1 rounded-lg border border-white/5">
            <ion-icon name="leaf" class="text-emerald-400 text-[10px]"></ion-icon>
            {{formatearNumero(precio)}}
          </div>
          <span class="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter"
            [style.background-color]="color + '20'" [style.color]="color">
            LVL {{nivel}}
          </span>
        </div>
      </div>
    </button>
  `,
  styles: [`
    .upgrade-card {
      width: 100%;
      text-align: left;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      outline: none;
      font-family: inherit;
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.1);

      &:not(:disabled) {
        border-color: color-mix(in srgb, var(--card-color), transparent 80%) !important;
      }


      &:active:not(:disabled) {
        transform: scale(0.97) !important;
        background: color-mix(in srgb, var(--card-color), transparent 85%) !important;
        transition: none !important;
      }

      &:disabled {
        opacity: 0.3;
        filter: grayscale(1);
        cursor: not-allowed;
      }

      .upgrade-icon {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
        transition: all 0.3s;
        box-shadow: 0 0 20px -5px var(--card-color);
      }

      .upgrade-price {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
        width: 95px;
      }

      &.can-afford {
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.06);
        box-shadow: 0 15px 40px -15px var(--card-color);

        &::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 5%;
          right: 5%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--card-color) 50%, transparent);
          z-index: 10;
          filter: drop-shadow(0 0 5px var(--card-color));
        }

        &::after {
          content: '';
          display: block;
          position: absolute;
          bottom: 0;
          left: 5%;
          right: 5%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--card-color) 50%, transparent);
          z-index: 10;
          filter: drop-shadow(0 0 5px var(--card-color));
        }

        .upgrade-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: -150%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, var(--card-color), transparent);
            opacity: 0.15;
            transform: skewX(-25deg);
            animation: sweep-light 2.5s infinite;
          }
        }
      }
    }

    @keyframes sweep-light {
      0% { left: -150%; }
      35% { left: 150%; }
      100% { left: 150%; }
    }

    .title-indicator {
      box-shadow: 0 0 15px var(--card-color);
      animation: breathe 2s infinite ease-in-out;
    }

    @keyframes breathe {
      0%, 100% { opacity: 1; transform: scaleY(1); filter: brightness(1.5); }
      50% { opacity: 0.5; transform: scaleY(1.3); filter: brightness(0.8); }
    }

    .comprando {
      animation: flash-compra 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards !important;
      z-index: 50 !important;
    }

    @keyframes flash-compra {
      0% { 
        transform: scale(0.97) !important;
        box-shadow: 0 0 50px 10px var(--card-color) !important;
        background-color: color-mix(in srgb, var(--card-color), transparent 60%) !important;
      }
      100% { 
        transform: scale(1) !important;
        box-shadow: 0 15px 40px -15px var(--card-color) !important;
      }
    }

    .effect-label {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      filter: drop-shadow(0 0 8px currentColor);
    }
  `]
})
export class TarjetaMejoraComponent {
  @Input() nombre: string = '';
  @Input() descripcion: string = '';
  @Input() icono: string = '';
  @Input() color: string = '#10b981';
  @Input() nivel: number = 0;
  @Input() precio: number = 0;
  @Input() efectoTexto: string = '';
  @Input() puedeComprar: boolean = false;

  @Output() comprar = new EventEmitter<void>();

  comprando = false;

  onComprar() {
    if (this.puedeComprar) {
      this.comprando = true;
      this.comprar.emit();

      // Mantenemos el estado de "flash" un momento para que se vea el efecto
      setTimeout(() => {
        this.comprando = false;
      }, 300);
    }
  }

  formatearNumero(num: number): string {
    if (num < 1000) return Math.floor(num).toString();
    const unidades = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const orden = Math.floor(Math.log10(Math.abs(num)) / 3);
    const unidad = unidades[orden] || '??';
    const valorReducido = num / Math.pow(10, orden * 3);
    return valorReducido.toFixed(valorReducido >= 100 ? 0 : 1) + unidad;
  }
}
