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
  radioButtonOffOutline
} from 'ionicons/icons';

export interface Pregunta {
  id?: string;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number; // Índice de la opción correcta
}

@Component({
  selector: 'app-editor-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  template: `
    <div class="space-y-8">
      <div class="flex items-center justify-between px-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <ion-icon name="school-outline" class="text-xl"></ion-icon>
          </div>
          <div>
            <h3 class="text-xl font-black text-white tracking-tight">Preguntas del Quiz</h3>
            <p class="text-xs text-primary-50 font-bold uppercase tracking-widest">Añade al menos una pregunta para el examen</p>
          </div>
        </div>
        <button (click)="agregarPregunta()" class="flex items-center gap-2 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-xl transition-all border border-primary-500/20 cursor-pointer text-xs font-black uppercase tracking-wider group">
          <ion-icon name="add-outline" class="text-lg group-hover:scale-110 transition-transform"></ion-icon>
          Añadir Pregunta
        </button>
      </div>

      <div class="space-y-6">
        <div *ngFor="let p of preguntas; let i = index; trackBy: trackByPregunta" class="bg-white/[0.03] border border-white/10 rounded-3xl p-6 relative animate-[fadeIn_0.3s_ease-out]">
          
          <div class="space-y-4">
            <!-- Cabecera de pregunta -->
            <div class="flex items-center justify-between mb-2">
              <label class="text-[10px] font-black text-primary-50 uppercase tracking-widest flex items-center gap-2">
                <ion-icon name="help-circle-outline" class="text-primary-400 text-2xl"></ion-icon>
                Pregunta #{{ i + 1 }}
              </label>
              <button (click)="eliminarPregunta(i)" class="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                <ion-icon name="trash-outline"></ion-icon>
                Eliminar
              </button>
            </div>

            <!-- Texto de la Pregunta -->
            <input [(ngModel)]="p.pregunta" (ngModelChange)="notificarCambio()" placeholder="¿Cuál es el concepto clave de...?" 
                   class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-primary-500/50 transition-all">

            <!-- Opciones -->
            <div class="space-y-3 pl-4">
              <label class="text-[10px] font-black text-primary-50 uppercase tracking-widest block">Opciones de Respuesta</label>
              
              <div *ngFor="let opt of p.opciones; let optIdx = index; trackBy: trackByOpcion" class="flex items-center gap-3 group/opt">
                <!-- Selector de Correcta -->
                <button (click)="marcarCorrecta(i, optIdx)" 
                        class="p-2 rounded-lg transition-all border-none cursor-pointer"
                        [ngClass]="p.respuesta_correcta === optIdx ? 'text-primary-400 bg-primary-500/20' : 'text-slate-600 hover:text-slate-400 bg-white/5'">
                  <ion-icon [name]="p.respuesta_correcta === optIdx ? 'radio-button-on-outline' : 'radio-button-off-outline'"></ion-icon>
                </button>

                <!-- Input Opción -->
                <input [(ngModel)]="p.opciones[optIdx]" (ngModelChange)="notificarCambio()" [placeholder]="'Opción ' + (optIdx + 1)"
                       class="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-primary-500/30 transition-all"
                       [class.border-primary-500/30]="p.respuesta_correcta === optIdx">

                <!-- Eliminar Opción -->
                <button *ngIf="p.opciones.length > 2" (click)="eliminarOpcion(i, optIdx)" class="opacity-0 group-hover/opt:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all bg-transparent border-none cursor-pointer">
                  <ion-icon name="trash-outline"></ion-icon>
                </button>
              </div>

              <button (click)="agregarOpcion(i)" *ngIf="p.opciones.length < 5" class="ml-11 text-[10px] font-black text-primary-400/60 hover:text-primary-400 uppercase tracking-widest transition-colors cursor-pointer bg-transparent border-none">
                    + Añadir Opción
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="preguntas.length === 0" class="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
          <div class="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-slate-700 mb-4 font-bold text-2xl">?</div>
          <p class="text-slate-500 font-bold italic">No hay preguntas en este examen.<br>Añade una para evaluar a tus estudiantes.</p>
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
      radioButtonOffOutline
    });
  }

  agregarPregunta() {
    this.preguntas.push({
      pregunta: '',
      opciones: ['', ''],
      respuesta_correcta: 0
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
