import { Component, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, bookOutline, globeOutline, shieldCheckmarkOutline, sparklesOutline, star, timeOutline } from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaCursoComponent } from '../components/tarjeta-curso/tarjeta-curso.component';
import { SupabaseService } from '../services/supabase';

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

  cursos: any[] = [];
  cargando = true;

  constructor(private supabaseSvc: SupabaseService) {
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

  async ngOnInit() { }

  async ionViewWillEnter() {
    await this.cargarCursos();
  }

  async cargarCursos() {
    this.cargando = true;
    try {
      // Solo cursos publicados
      const { data } = await this.supabaseSvc.cliente
        .from('cursos')
        .select('*')
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false });

      const cursosRaw = data || [];

      // Contar lecciones totales por curso (a través de módulos)
      for (const curso of cursosRaw) {
        const { data: modulos } = await this.supabaseSvc.cliente
          .from('modulos')
          .select('id')
          .eq('curso_id', curso.id);

        let totalLecciones = 0;
        for (const mod of modulos || []) {
          const { count } = await this.supabaseSvc.cliente
            .from('lecciones')
            .select('*', { count: 'exact', head: true })
            .eq('modulo_id', mod.id);
          totalLecciones += count || 0;
        }
        curso.totalLecciones = totalLecciones;
      }

      this.cursos = cursosRaw;
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      this.cargando = false;
    }
  }

  scrollACatalogo() {
    const el = document.getElementById('catalogo');
    if (el && this.content) {
      this.content.scrollToPoint(0, el.offsetTop - 10, 800);
    }
  }
}