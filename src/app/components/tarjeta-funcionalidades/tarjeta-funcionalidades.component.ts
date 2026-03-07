import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tarjeta-funcionalidades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
        class="p-6 md:p-8 rounded-[2rem] bg-slate-900/50 backdrop-blur-sm border border-white/5 transition-all duration-300 group relative overflow-hidden hover:border-white/20 hover:bg-slate-900/80"
    >
        <div class="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
             [ngClass]="color + ' ' + shadow + ' ' + (darkIcon ? 'text-slate-900' : 'text-white')">
            <ng-content></ng-content>
        </div>
        <h3 class="text-xl font-black text-primary-400 mb-3 tracking-tight">{{title}}</h3>
        <p class="text-primary-50 leading-relaxed font-medium">{{description}}</p>

        <div class="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300"
             [ngClass]="color"></div>
    </div>
  `
})
export class TarjetaFuncionalidadesComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() color: string = '';
  @Input() shadow: string = '';
  @Input() darkIcon: boolean = false;
}
