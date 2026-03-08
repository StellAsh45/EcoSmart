import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-campo-entrada',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonIcon],
  template: `
    <div class="space-y-2">
      <label class="block text-sm font-bold text-primary-500 ml-1">{{etiqueta}}</label>
      <div class="relative group/input">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-primary-400 transition-colors">
          <ion-icon [icon]="icono" class="text-xl text-primary-400"></ion-icon>
        </div>
        
        <input 
          [type]="mostrarContrasenaInterna ? 'text' : tipo"
          [formControl]="control"
          class="w-full pl-12 pr-14 py-4 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/5 text-white placeholder:text-primary-50/50 focus:bg-white/10"
          [class.border-red-500]="control.invalid && control.touched"
          [placeholder]="placeholder"
        />

        <button 
          *ngIf="tipo === 'password'"
          type="button"
          (click)="toggleContrasena()"
          class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-primary-400 transition-colors outline-none"
        >
          <ion-icon [icon]="mostrarContrasenaInterna ? iconosToggle.eyeOff : iconosToggle.eye" class="text-xl"></ion-icon>
        </button>
      </div>

      <!-- Errores -->
      <div *ngIf="control.invalid && control.touched" class="text-[10px] sm:text-xs text-red-500 ml-1 mt-1 font-medium bg-red-500/5 p-2 rounded-lg border border-red-500/10 animate-[fadeIn_0.3s_ease-out]">
        <ng-content select="[errores]"></ng-content>
        <p *ngIf="control.errors?.['required'] && !tieneErroresPersonalizados">Este campo es requerido.</p>
        <p *ngIf="control.errors?.['email']">Por favor, introduce un correo válido.</p>
      </div>
    </div>
  `
})
export class CampoEntradaComponent {
  @Input() etiqueta: string = '';
  @Input() icono: any;
  @Input() tipo: string = 'text';
  @Input() placeholder: string = '';
  @Input() control: FormControl = new FormControl();
  @Input() tieneErroresPersonalizados: boolean = false;

  mostrarContrasenaInterna: boolean = false;
  iconosToggle = {
    eye: eyeOutline,
    eyeOff: eyeOffOutline
  };

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  toggleContrasena() {
    this.mostrarContrasenaInterna = !this.mostrarContrasenaInterna;
  }
}
