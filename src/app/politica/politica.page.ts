import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';

@Component({
  selector: 'app-politica',
  templateUrl: './politica.page.html',
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, RouterLink, FondoVisualComponent, EcoSmartLogoComponent]
})
export class PoliticaPage {
  constructor() {
    addIcons({ arrowBackOutline });
  }
}
