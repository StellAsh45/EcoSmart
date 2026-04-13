import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-overlay-confirmacion',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div *ngIf="mostrar"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fadeIn">
      <div class="absolute inset-0 bg-slate-950 backdrop-blur-2xl" (click)="onCancelar()"></div>

      <div class="relative flex flex-col items-center text-center space-y-8 max-w-md w-full">
        <!-- Icono Circular con Glow -->
        <div
          class="w-28 h-28 rounded-full flex items-center justify-center animate-scaleIn"
          [ngClass]="{
            'bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]': claseConfirmar.includes('red'),
            'bg-emerald-500 shadow-[0_0_60px_rgba(16,249,129,0.4)]': claseConfirmar.includes('emerald'),
            'bg-primary-500 shadow-[0_0_60px_rgba(16,249,129,0.4)]': !claseConfirmar.includes('red') && !claseConfirmar.includes('emerald')
          }">
          <ion-icon [name]="icono" class="text-6xl text-slate-950">
          </ion-icon>
        </div>

        <div class="space-y-3 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
          <h2 class="text-3xl font-black text-white tracking-tight font-heading uppercase leading-none">
            {{titulo}}
          </h2>
          <p class="text-primary-50 font-bold uppercase tracking-[0.2em] text-[10px] max-w-xs mx-auto leading-relaxed">
            {{mensaje}}
          </p>
        </div>

        <!-- Botones Verticales de Acción -->
        <div class="flex flex-col gap-4 w-full px-6 animate-[fadeIn_0.5s_ease-out_0.4s_both]">
          <button *ngIf="textoConfirmar" (click)="onConfirmar()"
            class="w-full text-slate-950 font-black py-2 px-8 rounded-2xl transition-all active:scale-95 text-lg border-none cursor-pointer shadow-2xl"
            [ngClass]="claseConfirmar">
            {{textoConfirmar}}
          </button>

          <button *ngIf="textoCancelar" (click)="onCancelar()"
            class="w-full bg-white/5 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:bg-white/10 active:scale-95 text-[10px] border border-white/10 border-solid cursor-pointer uppercase tracking-[0.2em]">
            {{textoCancelar}}
          </button>
        </div>
      </div>
    </div>
  `
})
export class OverlayConfirmacionComponent {
  @Input() mostrar: boolean = false;
  @Input() titulo: string = '';
  @Input() mensaje: string = '';
  @Input() icono: string = 'help-circle-outline';
  @Input() textoConfirmar: string = 'Confirmar';
  @Input() claseConfirmar: string = 'bg-primary-500';
  @Input() textoCancelar: string = 'Volver atrás';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }
}
