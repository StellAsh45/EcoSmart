import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { FondoVisualComponent } from '../fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../eco-smart-logo/eco-smart-logo.component';

@Component({
    selector: 'app-contenedor-autenticacion',
    standalone: true,
    imports: [CommonModule, RouterLink, IonIcon, FondoVisualComponent, EcoSmartLogoComponent],
    template: `
    <div class="min-h-screen relative flex items-center justify-center p-6 selection:bg-primary-500/30 selection:text-white overflow-hidden">
        <app-fondo-visual [variante]="varianteFondo"></app-fondo-visual>

        <div class="w-full max-w-xl z-10 animate-[slideUp_0.8s_ease-out]">
            <!-- Botón Volver -->
            <div *ngIf="mostrarVolver" class="mb-6 flex animate-[fadeIn_0.5s_ease-out_0.2s_both]">
                <a [routerLink]="rutaVolver" class="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all no-underline font-bold group text-sm backdrop-blur-md">
                    <ion-icon name="arrow-back-outline" class="group-hover:-translate-x-1 transition-transform"></ion-icon>
                    Volver al Inicio
                </a>
            </div>

            <div class="bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] border border-white/20 shadow-[0_48px_100px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                <div class="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -ml-32 -mb-32 rounded-full group-hover:bg-emerald-500/20 transition-colors duration-1000"></div>

                <div class="relative">
                    <div class="flex flex-col items-center mb-10">
                        <a routerLink="/" class="flex flex-col items-center gap-4 group/logo cursor-pointer mb-6 no-underline">
                            <div class="relative">
                                <div class="absolute inset-0 bg-primary-400 blur-2xl opacity-30 group-hover/logo:opacity-60 transition-opacity"></div>
                                <app-eco-smart-logo [clasePersonalizada]="claseLogo"></app-eco-smart-logo>
                            </div>
                        </a>
                        <h2 class="text-3xl font-black text-white mb-2 text-center font-heading">{{titulo}}</h2>
                        <p class="text-primary-50 font-medium text-center">{{subtitulo}}</p>
                    </div>

                    <ng-content></ng-content>
                </div>
            </div>

            <div class="mt-8 text-center animate-[fadeIn_1s_ease-out_1s_both]">
                <p class="text-primary-50 text-sm font-medium">© 2026 EcoSmart. Comprometidos con el planeta.</p>
            </div>
        </div>
    </div>
  `
})
export class ContenedorAutenticacionComponent {
    @Input() titulo: string = '';
    @Input() subtitulo: string = '';
    @Input() claseLogo: string = 'w-24 h-24 relative group-hover/logo:scale-110 transition-transform duration-500 ease-out drop-shadow-2xl';
    @Input() varianteFondo: any = 'misty';
    @Input() mostrarVolver: boolean = false;
    @Input() rutaVolver: string = '/';

    constructor() {
        addIcons({ arrowBackOutline });
    }
}
