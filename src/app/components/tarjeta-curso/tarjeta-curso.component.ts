import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tarjeta-curso',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div
      class="bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group shadow-2xl relative"
    >
      <div class="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div class="relative h-60 overflow-hidden m-3 rounded-[2rem]">
        <img
          [src]="imagen"
          [alt]="titulo"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[0.85] group-hover:brightness-100"
        />
      </div>

      <div class="p-8 pt-4">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border"
                [ngClass]="{
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': nivel === 'Principiante',
                    'bg-blue-500/10 text-blue-400 border-blue-500/20': nivel === 'Intermedio',
                    'bg-purple-500/10 text-purple-400 border-purple-500/20': nivel === 'Avanzado',
                    'bg-white/10 text-slate-300 border-white/20': !nivel || (nivel !== 'Principiante' && nivel !== 'Intermedio' && nivel !== 'Avanzado')
                }">
              {{ nivel || 'Sin Nivel' }}
          </span>
        </div>

        <h3 class="text-2xl font-black text-primary-400 mb-3 drop-shadow-sm leading-tight group-hover:text-primary-300 transition-colors">
          {{titulo}}
        </h3>
        <p class="text-primary-50 text-sm font-medium line-clamp-2 mb-8 leading-relaxed">
          {{descripcion}}
        </p>

        <div class="flex items-center text-primary-50 text-[10px] font-black uppercase tracking-widest mb-6 py-4 border-y border-white/5">
          <div class="flex items-center gap-2">
            <ion-icon name="book-outline" class="text-primary-500 text-sm"></ion-icon>
            <span>{{lecciones}} lecciones</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class TarjetaCursoComponent {
  @Input() id: string = '';
  @Input() titulo: string = '';
  @Input() descripcion: string = '';
  @Input() imagen: string = '';
  @Input() nivel: string = '';
  @Input() lecciones: number = 0;
  @Input() duracion: string = '';
}
