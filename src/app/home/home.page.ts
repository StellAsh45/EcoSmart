import { Component, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, bookOutline, globeOutline, shieldCheckmarkOutline, sparklesOutline, star, timeOutline } from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaCursoComponent } from '../components/tarjeta-curso/tarjeta-curso.component';

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
    TarjetaCursoComponent
  ],
})
export class HomePage {
  @ViewChild(IonContent) content?: IonContent;

  cursos = [
    {
      id: '1',
      titulo: 'Introducción a la Economía Circular',
      descripcion: 'Aprende los principios fundamentales de la economía circular y cómo aplicarlos en la vida diaria.',
      imagen: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
      progreso: 45,
      lecciones: 12,
      duracion: '6h 30m',
      nivel: 'Principiante',
      puntuacion: 4.8,
      categoria: 'Sostenibilidad'
    },
    {
      id: '2',
      titulo: 'Energías Renovables para el Hogar',
      descripcion: 'Descubre cómo implementar soluciones de energía solar y eólica a pequeña escala para tu vivienda.',
      imagen: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800',
      progreso: 0,
      lecciones: 8,
      duracion: '4h 15m',
      nivel: 'Intermedio',
      puntuacion: 4.9,
      categoria: 'Energía'
    },
    {
      id: '3',
      titulo: 'Gestión Avanzada de Residuos',
      descripcion: 'Técnicas profesionales para el manejo de residuos orgánicos e inorgánicos en entornos urbanos.',
      imagen: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
      progreso: 0,
      lecciones: 15,
      duracion: '10h',
      nivel: 'Avanzado',
      puntuacion: 4.7,
      categoria: 'Residuos'
    }
  ];

  constructor() {
    addIcons({
      'arrow-forward-outline': arrowForwardOutline,
      'book-outline': bookOutline,
      'globe-outline': globeOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'sparkles-outline': sparklesOutline,
      'star': star,
      'time-outline': timeOutline
    });
  }

  scrollACatalogo() {
    const el = document.getElementById('catalogo');
    if (el && this.content) {
      this.content.scrollToPoint(0, el.offsetTop - 10, 800);
    }
  }
}