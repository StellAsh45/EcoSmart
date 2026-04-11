import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  textOutline, 
  imageOutline, 
  videocamOutline, 
  trashOutline, 
  reorderTwoOutline,
  listOutline
} from 'ionicons/icons';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

export interface BloqueContenido {
  id: string;
  tipo: 'titulo' | 'subtitulo' | 'texto' | 'imagen' | 'video';
  valor: string;
}

@Component({
  selector: 'app-editor-leccion',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, DragDropModule],
  template: `
    <div class="space-y-6">
      <!-- Toolbar de Bloques -->
      <div class="flex flex-wrap gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 sticky top-0 z-20 backdrop-blur-md">
        <button (click)="agregarBloque('titulo')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-primary-500/20 text-slate-300 hover:text-primary-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider">
          <ion-icon name="text-outline"></ion-icon> Título
        </button>
        <button (click)="agregarBloque('subtitulo')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider">
          <ion-icon name="text-outline"></ion-icon> Subtítulo
        </button>
        <button (click)="agregarBloque('texto')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider">
          <ion-icon name="list-outline"></ion-icon> Párrafo
        </button>
        <button (click)="agregarBloque('imagen')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider">
          <ion-icon name="image-outline"></ion-icon> Imagen
        </button>
        <button (click)="agregarBloque('video')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider">
          <ion-icon name="videocam-outline"></ion-icon> Video
        </button>
      </div>

      <!-- Área de Contenido -->
      <div class="space-y-4 min-h-[300px]">
        <div cdkDropList (cdkDropListDropped)="onDrop($event)">
          <div *ngFor="let bloque of bloques; let i = index" cdkDrag class="group relative bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/5 transition-all">
            <!-- Controles de Bloque -->
            <div class="absolute -right-2 top-1/3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
              <button (click)="eliminarBloque(i)" class="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-all border-none cursor-pointer shadow-lg shadow-black/40">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
              <button cdkDragHandle class="p-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/40 transition-all border-none cursor-pointer shadow-lg shadow-black/40 mt-2" title="Mover bloque">
                <ion-icon name="reorder-two-outline"></ion-icon>
              </button>
            </div>
            <!-- Campos según tipo -->
            <ng-container [ngSwitch]="bloque.tipo">
              <div *ngSwitchCase="'titulo'" class="space-y-1">
                <span class="text-[8px] font-black text-primary-500 uppercase tracking-widest pl-2">Título de Sección</span>
                <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Escribe un título llamativo..." 
                       [class.border-red-500/50]="!bloque.valor"
                       class="w-full bg-transparent border-b border-transparent focus:border-primary-500/50 text-2xl font-black text-white focus:outline-none placeholder:text-slate-700 p-2">
              </div>
              <div *ngSwitchCase="'subtitulo'" class="space-y-1">
                <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest pl-2">Subtítulo</span>
                <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Sube el nivel con un subtítulo..." 
                       [class.border-red-500/50]="!bloque.valor"
                       class="w-full bg-transparent border-b border-transparent focus:border-emerald-500/50 text-xl font-bold text-slate-200 focus:outline-none placeholder:text-slate-700 p-2">
              </div>
              <div *ngSwitchCase="'texto'" class="space-y-1">
                <span class="text-[8px] font-black text-blue-500 uppercase tracking-widest pl-2">Cuerpo del Texto</span>
                <textarea [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Explica el concepto aquí..." 
                          [class.border-red-500/50]="!bloque.valor"
                          rows="4" class="w-full bg-white/5 rounded-xl border border-transparent focus:border-blue-500/50 p-3 text-slate-400 leading-relaxed focus:outline-none resize-none placeholder:text-slate-700 font-medium"></textarea>
              </div>
              <div *ngSwitchCase="'imagen'" class="space-y-3">
                <span class="text-[8px] font-black text-amber-500 uppercase tracking-widest pl-2">URL de Imagen / Asset</span>
                <div class="flex gap-3">
                  <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="https://ejemplo.com/imagen.jpg" 
                         class="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500/50">
                </div>
                <div *ngIf="bloque.valor" class="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-48 group-hover:scale-[1.01] transition-transform">
                  <img [src]="bloque.valor" class="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity">
                </div>
              </div>
              <div *ngSwitchCase="'video'" class="space-y-2">
                <span class="text-[8px] font-black text-red-500 uppercase tracking-widest pl-2">ID de Video (YouTube/Vimeo)</span>
                <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Ej. dQw4w9WgXcQ" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-red-500/50">
              </div>
            </ng-container>
          </div>
        </div>
        <!-- Empty State -->
        <div *ngIf="bloques.length === 0" class="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
          <div class="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-slate-700 mb-4">
            <ion-icon name="text-outline" class="text-3xl"></ion-icon>
          </div>
          <p class="text-slate-500 font-bold italic">La lección está vacía.<br>Añade un bloque para empezar a crear.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    textarea::placeholder, input::placeholder {
      font-style: italic;
    }
  `]
})
export class EditorLeccionComponent {
  @Input() bloques: BloqueContenido[] = [];
  @Output() cambios = new EventEmitter<BloqueContenido[]>();

  constructor() {
    addIcons({
      textOutline,
      imageOutline,
      videocamOutline,
      trashOutline,
      reorderTwoOutline,
      listOutline
    });
  }

  agregarBloque(tipo: BloqueContenido['tipo']) {
    const nuevoBloque: BloqueContenido = {
      id: Math.random().toString(36).substr(2, 9),
      tipo,
      valor: ''
    };
    this.bloques.push(nuevoBloque);
    this.notificarCambio();
  }

  eliminarBloque(index: number) {
    this.bloques.splice(index, 1);
    this.notificarCambio();
  }

  notificarCambio() {
    this.cambios.emit(this.bloques);
  }

  onDrop(event: CdkDragDrop<BloqueContenido[]>) {
    moveItemInArray(this.bloques, event.previousIndex, event.currentIndex);
    this.notificarCambio();
  }
}
