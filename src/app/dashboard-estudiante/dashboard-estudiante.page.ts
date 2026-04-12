import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import {
  atOutline,
  personOutline,
  logOutOutline,
  arrowForwardOutline,
  bookOutline,
  timeOutline,
  playCircleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard-estudiante',
  templateUrl: './dashboard-estudiante.page.html',
  styleUrls: ['./dashboard-estudiante.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, RouterLink, FondoVisualComponent, EcoSmartLogoComponent]
})
export class DashboardEstudiantePage implements OnInit, ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;

  usuario: any = null;
  nombreUsuario: string = '';
  cursosInscritos: any[] = [];
  cursosActivosCount = 0;
  cursosCompletadosCount = 0;
  cargando = true;

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    addIcons({
      'at-outline': atOutline,
      'person-outline': personOutline,
      'log-out-outline': logOutOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'book-outline': bookOutline,
      'play-circle-outline': playCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  async ngOnInit() {
  }

  async ionViewWillEnter() {
    this.content?.scrollToTop(0);
    this.cargando = true;
    try {
      const { data, error } = await this.supabaseSvc.obtenerUsuario();
      if (error) throw error;
      this.usuario = data?.user;

      if (this.usuario) {
        const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);
        this.nombreUsuario = perfil?.nombre || this.usuario.user_metadata?.['full_name'] || this.usuario.email?.split('@')[0] || 'Estudiante';

        await this.cargarInscripciones();
      }
    } catch (err) {
      console.error('Error dashboard:', err);
    } finally {
      this.cargando = false;
    }
  }

  async cargarInscripciones() {
    const { data: inscripciones, error } = await this.supabaseSvc.obtenerInscripcionesUsuario(this.usuario.id);
    if (error) throw error;

    const listadoCursos = [];
    this.cursosActivosCount = 0;
    this.cursosCompletadosCount = 0;

    for (const insc of inscripciones || []) {
      const { data: curso } = await this.supabaseSvc.obtenerCursoPorId(insc.curso_id);
      if (curso && curso.estado === 'publicado') {
        listadoCursos.push({
          ...insc,
          curso_metadata: curso
        });

        if (insc.progreso >= 100) {
          this.cursosCompletadosCount++;
        } else {
          this.cursosActivosCount++;
        }
      }
    }

    this.cursosInscritos = listadoCursos;
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }
}