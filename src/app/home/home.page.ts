import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, bookOutline, globeOutline, shieldCheckmarkOutline, sparklesOutline } from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaFuncionalidadesComponent } from '../components/tarjeta-funcionalidades/tarjeta-funcionalidades.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    CommonModule,
    FondoVisualComponent,
    EcoSmartLogoComponent,
    TarjetaFuncionalidadesComponent
  ],
})
export class HomePage {
  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'book-outline': bookOutline,
      'globe-outline': globeOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'sparkles-outline': sparklesOutline,
    });
  }
}
