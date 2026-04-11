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
    <div class="space-y-4 -mt-8">
      <div class="px-2 space-y-0.5 animate-[fadeIn_0.5s_ease-out] opacity-80 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2">
          <div class="w-1 h-3 bg-primary-500 rounded-full"></div>
          <h6 class="text-[12px] font-black text-primary-400 uppercase tracking-[0.2em]">Configuración de Lección</h6>
        </div>
        <p class="text-[10px] text-primary-50 font-medium leading-tight pl-2 italic">
          Añade bloques, edita su contenido y <span class="text-primary-400 font-bold">arrástralos</span> para ordenar la secuencia.
        </p>
      </div>

      <!-- Toolbar de Bloques -->
      <div class="flex flex-wrap gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 sticky top-0 z-20 backdrop-blur-md">
        <button (click)="agregarBloque('titulo')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-primary-500/20 text-slate-300 hover:text-primary-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group/btn">
          <ion-icon name="text-outline" class="group-hover/btn:scale-110 transition-transform"></ion-icon> Título
        </button>
        <button (click)="agregarBloque('subtitulo')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group/btn">
          <ion-icon name="text-outline" class="group-hover/btn:scale-110 transition-transform"></ion-icon> Subtítulo
        </button>
        <button (click)="agregarBloque('texto')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group/btn">
          <ion-icon name="list-outline" class="group-hover/btn:scale-110 transition-transform"></ion-icon> Párrafo
        </button>
        <button (click)="agregarBloque('imagen')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group/btn">
          <ion-icon name="image-outline" class="group-hover/btn:scale-110 transition-transform"></ion-icon> Imagen
        </button>
        <button (click)="agregarBloque('video')" class="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group/btn">
          <ion-icon name="videocam-outline" class="group-hover/btn:scale-110 transition-transform"></ion-icon> Video
        </button>
      </div>

      <!-- Área de Contenido -->
      <div class="space-y-4 min-h-[300px]">
        <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="cdk-list">
          <div *ngFor="let bloque of bloques; let i = index; trackBy: trackByBloque" 
               cdkDrag 
               [ngClass]="{
                 'hover:border-primary-500/30 hover:shadow-primary-500/5': bloque.tipo === 'titulo',
                 'hover:border-emerald-500/30 hover:shadow-emerald-500/5': bloque.tipo === 'subtitulo',
                 'hover:border-blue-500/30 hover:shadow-blue-500/5': bloque.tipo === 'texto',
                 'hover:border-amber-500/30 hover:shadow-amber-500/5': bloque.tipo === 'imagen',
                 'hover:border-red-500/30 hover:shadow-red-500/5': bloque.tipo === 'video'
               }"
               class="group relative bg-white/[0.02] hover:bg-white/[0.04] p-6 rounded-[2.5rem] border border-white/5 transition-all cursor-grab active:cursor-grabbing shadow-sm mb-4">
            
            <!-- Indicador de arrastre lateral - Color Dinámico -->
            <div class="absolute left-0 top-8 bottom-8 w-1 rounded-r-full transition-all duration-300"
                 [ngClass]="{
                   'group-hover:bg-primary-500/50 group-active:bg-primary-500': bloque.tipo === 'titulo',
                   'group-hover:bg-emerald-500/50 group-active:bg-emerald-500': bloque.tipo === 'subtitulo',
                   'group-hover:bg-blue-500/50 group-active:bg-blue-500': bloque.tipo === 'texto',
                   'group-hover:bg-amber-500/50 group-active:bg-amber-500': bloque.tipo === 'imagen',
                   'group-hover:bg-red-500/50 group-active:bg-red-500': bloque.tipo === 'video'
                 }"></div>
            
            <!-- Controles de Bloque - Solo Basura -->
            <div class="absolute -right-2 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
              <button (click)="solicitarConfirmacionBorrado(i)" class="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/20 cursor-pointer backdrop-blur-md shadow-xl" title="Eliminar bloque">
                <ion-icon name="trash-outline" class="text-lg"></ion-icon>
              </button>
            </div>

            <!-- Campos según tipo -->
            <div class="pr-8">
              <ng-container [ngSwitch]="bloque.tipo">
                <div *ngSwitchCase="'titulo'" class="space-y-1">
                  <span class="text-[9px] font-black text-primary-400 uppercase tracking-widest pl-2">Título de Sección</span>
                  <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Escribe un título llamativo..." 
                         [class.border-red-500/50]="!bloque.valor"
                         class="w-full bg-transparent border-none text-2xl font-black text-white focus:outline-none placeholder:text-slate-700 p-2">
                </div>
                <div *ngSwitchCase="'subtitulo'" class="space-y-1">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest pl-2">Subtítulo Informativo</span>
                  <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Sube el nivel con un subtítulo..." 
                         [class.border-red-500/50]="!bloque.valor"
                         class="w-full bg-transparent border-none text-xl font-bold text-slate-200 focus:outline-none placeholder:text-slate-700 p-2">
                </div>
                <div *ngSwitchCase="'texto'" class="space-y-2">
                  <span class="text-[9px] font-black text-blue-400 uppercase tracking-widest pl-2">Cuerpo del Contenido</span>
                  <textarea [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Explica el concepto aquí..." 
                            [class.border-red-500/50]="!bloque.valor"
                            rows="4" class="w-full bg-white/5 rounded-2xl border border-white/10 focus:border-blue-500/30 p-4 text-slate-300 leading-relaxed focus:outline-none resize-none placeholder:text-slate-700 font-medium transition-all"></textarea>
                </div>
                <div *ngSwitchCase="'imagen'" class="space-y-3">
                  <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest pl-2">URL de la Imagen</span>
                  <div class="flex gap-3">
                    <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="https://ejemplo.com/imagen.jpg" 
                           class="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500/30">
                  </div>
                  <div *ngIf="bloque.valor" class="mt-4 rounded-2xl overflow-hidden border border-white/10 aspect-video group-hover:scale-[1.02] transition-all duration-500">
                    <img [src]="bloque.valor" class="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity">
                  </div>
                </div>
                <div *ngSwitchCase="'video'" class="space-y-2">
                  <span class="text-[9px] font-black text-red-400 uppercase tracking-widest pl-2">ID de Video (YouTube/Vimeo)</span>
                  <div class="relative">
                    <input [(ngModel)]="bloque.valor" (ngModelChange)="notificarCambio()" placeholder="Ej. dQw4w9WgXcQ" 
                           class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-red-500/30">
                    <ion-icon name="play-circle" class="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/40 text-xl"></ion-icon>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
        <!-- Empty State -->
        <div *ngIf="bloques.length === 0" class="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
          <div class="w-20 h-20 bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center text-slate-700 mb-6">
            <ion-icon name="text-outline" class="text-4xl"></ion-icon>
          </div>
          <p class="text-slate-500 font-bold italic text-lg">La lección está vacía.<br><span class="text-sm not-italic font-medium text-slate-600">Comienza añadiendo bloques desde la barra superior.</span></p>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación Premium -->
    <div *ngIf="mostrarConfirmacion" class="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-[fadeIn_0.3s_all]">
      <div (click)="cancelarBorrado()" class="absolute inset-0 bg-slate-950/60 backdrop-blur-md"></div>
      
      <div class="relative bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-[320px] text-center space-y-6 transform animate-[scaleIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-3xl mx-auto flex items-center justify-center border border-red-500/30">
          <ion-icon name="trash" class="text-3xl"></ion-icon>
        </div>
        
        <div class="space-y-2">
          <h3 class="text-white font-black text-xl italic uppercase tracking-tighter">¿Eliminar bloque?</h3>
          <p class="text-slate-400 text-xs font-bold leading-relaxed">Esta acción no se puede deshacer y el contenido se perderá.</p>
        </div>
        
        <div class="flex flex-col gap-2">
          <button (click)="confirmarBorrado()" class="w-full py-3 bg-red-500 hover:bg-red-400 text-slate-950 font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/20">
            SÍ, BORRAR
          </button>
          <button (click)="cancelarBorrado()" class="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border-none">
            Mantener bloque
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    textarea::placeholder, input::placeholder {
      font-style: italic;
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 40px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 40px rgba(16, 249, 129, 0.2);
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(16, 249, 129, 0.4);
      transform: scale(1.03);
    }

    .cdk-drag-placeholder {
      opacity: 0.1;
      border: 3px dashed rgba(16, 249, 129, 0.5);
      background: rgba(16, 249, 129, 0.08);
      border-radius: 40px;
      margin-bottom: 30px;
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-list.cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class EditorLeccionComponent {
  @Input() bloques: BloqueContenido[] = [];
  @Output() cambios = new EventEmitter<BloqueContenido[]>();

  mostrarConfirmacion = false;
  indiceABorrar: number | null = null;

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

  solicitarConfirmacionBorrado(index: number) {
    this.indiceABorrar = index;
    this.mostrarConfirmacion = true;
  }

  cancelarBorrado() {
    this.mostrarConfirmacion = false;
    this.indiceABorrar = null;
  }

  confirmarBorrado() {
    if (this.indiceABorrar !== null) {
      this.eliminarBloque(this.indiceABorrar);
    }
    this.cancelarBorrado();
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

  trackByBloque(index: number, bloque: BloqueContenido) {
    return bloque.id;
  }
}
