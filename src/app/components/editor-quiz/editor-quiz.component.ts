import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  helpCircleOutline,
  checkmarkCircleOutline,
  radioButtonOnOutline,
  radioButtonOffOutline,
  chatbubbleEllipsesOutline
} from 'ionicons/icons';

export interface Pregunta {
  id?: string;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number; // Índice de la opción correcta
  retroalimentacion?: string;
}

@Component({
  selector: 'app-editor-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  template: `
    <div class="space-y-4 -mt-8">
      <!-- Encabezado consistente con el editor de lecciones -->
      <div class="px-2 space-y-0.5 animate-[fadeIn_0.5s_ease-out] opacity-80 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2">
          <div class="w-1 h-3 bg-emerald-500 rounded-full"></div>
          <h6 class="text-[14px] font-black text-emerald-400 uppercase tracking-[0.2em]">Configuración de Examen</h6>
        </div>
        <p class="text-[12px] text-primary-50 font-medium leading-tight pl-2 italic">
          Añade preguntas, marca la respuesta correcta y brinda <span class="text-emerald-400 font-bold">retroalimentación</span> para guiar al estudiante.
        </p>
      </div>

      <div class="flex items-center justify-between px-2 -mt-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <ion-icon name="school-outline" class="text-xl"></ion-icon>
          </div>
          <div>
            <h3 class="text-lg font-black text-white tracking-tight">Preguntas del Quiz</h3>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ preguntas.length }} preguntas configuradas</p>
          </div>
        </div>
        <button (click)="agregarPregunta()" class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all border-none cursor-pointer text-xs font-black uppercase tracking-wider group active:scale-95 shadow-lg shadow-emerald-500/20">
          <ion-icon name="add-outline" class="text-lg"></ion-icon>
          Añadir Pregunta
        </button>
      </div>

      <div class="space-y-6">
        <div *ngFor="let p of preguntas; let i = index; trackBy: trackByPregunta" class="bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 sm:p-7 relative animate-[fadeIn_0.3s_ease-out] overflow-hidden">
          
          <div class="space-y-6">
            <!-- Cabecera de pregunta corregida -->
            <div class="flex items-center justify-between gap-4">
              <label class="text-[11px] font-black text-primary-50 uppercase tracking-widest flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-primary-400">
                  <ion-icon name="help-circle-outline" class="text-xl"></ion-icon>
                </div>
                Pregunta #{{ i + 1 }}
              </label>
              <button (click)="eliminarPregunta(i)" class="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shrink-0">
                <ion-icon name="trash-outline"></ion-icon>
                Eliminar
              </button>
            </div>

            <!-- Texto de la Pregunta -->
            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Enunciado de la Pregunta</label>
              <input [(ngModel)]="p.pregunta" (ngModelChange)="notificarCambio()" placeholder="¿Cuál es el concepto clave de...?" 
                     class="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-700">
            </div>

            <!-- Opciones -->
            <div class="space-y-4">
              <label class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">Opciones de Respuesta</label>
              
              <div class="grid grid-cols-1 gap-3">
                <div *ngFor="let opt of p.opciones; let optIdx = index; trackBy: trackByOpcion" class="flex items-center gap-2 sm:gap-3 group/opt w-full min-w-0">
                  <!-- Selector de Correcta (Corregido iconos kebab-case) -->
                  <button (click)="marcarCorrecta(i, optIdx)" 
                          class="shrink-0 w-10 h-10 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center"
                          [ngClass]="p.respuesta_correcta === optIdx ? 'text-emerald-400 bg-emerald-500/20 shadow-inner' : 'text-slate-600 hover:text-slate-400 bg-white/5'">
                    <ion-icon [name]="p.respuesta_correcta === optIdx ? 'checkmark-circle-outline' : 'radio-button-off-outline'" class="text-xl"></ion-icon>
                  </button>

                  <!-- Input Opción -->
                  <div class="flex-1 min-w-0 relative">
                    <input [(ngModel)]="p.opciones[optIdx]" (ngModelChange)="notificarCambio()" [placeholder]="'Opción ' + (optIdx + 1)"
                           class="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/30 transition-all pr-10"
                           [class.border-emerald-500/30]="p.respuesta_correcta === optIdx"
                           [class.bg-emerald-500/[0.02]]="p.respuesta_correcta === optIdx">
                    
                    <!-- Eliminar Opción -->
                    <button *ngIf="p.opciones.length > 2" (click)="eliminarOpcion(i, optIdx)" 
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 transition-all bg-transparent border-none cursor-pointer sm:opacity-0 sm:group-hover/opt:opacity-100">
                      <ion-icon name="trash-outline" class="text-lg"></ion-icon>
                    </button>
                  </div>
                </div>
              </div>

              <button (click)="agregarOpcion(i)" *ngIf="p.opciones.length < 5" class="ml-1 text-[10px] font-black text-emerald-400/60 hover:text-emerald-400 uppercase tracking-widest transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1">
                    <ion-icon name="add-outline"></ion-icon> Añadir Opción
              </button>
            </div>

            <!-- Retroalimentación -->
            <div class="pt-6 border-t border-white/5">
              <label class="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                <ion-icon name="chatbubble-ellipses-outline" class="text-lg"></ion-icon>
                Retroalimentación (opcional)
              </label>
              <textarea [(ngModel)]="p.retroalimentacion" (ngModelChange)="notificarCambio()" 
                        placeholder="Explica brevemente por qué la respuesta es correcta para ayudar al estudiante a aprender." 
                        rows="2"
                        class="w-full bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/30 transition-all resize-none placeholder:text-slate-700"></textarea>
            </div>
          </div>
        </div>

        <div *ngIf="preguntas.length === 0" class="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
          <div class="w-20 h-20 bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center text-slate-700 mb-6 font-bold text-3xl">?</div>
          <p class="text-slate-500 font-bold italic text-lg">No hay preguntas en este examen.<br><span class="text-sm not-italic font-medium text-slate-600">Añade una para evaluar a tus estudiantes.</span></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class EditorQuizComponent {
  @Input() preguntas: Pregunta[] = [];
  @Output() cambios = new EventEmitter<Pregunta[]>();

  constructor() {
    addIcons({
      addOutline,
      trashOutline,
      helpCircleOutline,
      checkmarkCircleOutline,
      radioButtonOnOutline,
      radioButtonOffOutline,
      chatbubbleEllipsesOutline
    });
  }

  agregarPregunta() {
    this.preguntas.push({
      pregunta: '',
      opciones: ['', ''],
      respuesta_correcta: 0,
      retroalimentacion: ''
    });
    this.notificarCambio();
  }

  eliminarPregunta(index: number) {
    this.preguntas.splice(index, 1);
    this.notificarCambio();
  }

  agregarOpcion(pIdx: number) {
    this.preguntas[pIdx].opciones.push('');
    this.notificarCambio();
  }

  eliminarOpcion(pIdx: number, optIdx: number) {
    if (this.preguntas[pIdx].opciones.length > 2) {
      this.preguntas[pIdx].opciones.splice(optIdx, 1);
      if (this.preguntas[pIdx].respuesta_correcta >= this.preguntas[pIdx].opciones.length) {
        this.preguntas[pIdx].respuesta_correcta = 0;
      }
      this.notificarCambio();
    }
  }

  marcarCorrecta(pIdx: number, optIdx: number) {
    this.preguntas[pIdx].respuesta_correcta = optIdx;
    this.notificarCambio();
  }

  notificarCambio() {
    this.cambios.emit(this.preguntas);
  }

  // Funciones de rastreo para evitar pérdida de foco al escribir
  trackByPregunta(index: number) {
    return index;
  }

  trackByOpcion(index: number) {
    return index;
  }
}
