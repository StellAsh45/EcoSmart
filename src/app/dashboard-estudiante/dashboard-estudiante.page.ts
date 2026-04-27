import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { GeneradorCertificadosService } from '../services/generador-certificados.service';
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
  checkmarkCircleOutline,
  documentTextOutline
} from 'ionicons/icons';

import { TarjetaEstadisticaComponent } from '../components/tarjeta-estadistica/tarjeta-estadistica.component';

@Component({
  selector: 'app-dashboard-estudiante',
  templateUrl: './dashboard-estudiante.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, RouterLink, FondoVisualComponent, EcoSmartLogoComponent, TarjetaEstadisticaComponent]
})
export class DashboardEstudiantePage implements OnInit, ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;

  usuario: any = null;
  nombreUsuario: string = '';
  cursosInscritos: any[] = [];
  cursosActivosCount = 0;
  cursosCompletadosCount = 0;
  cargando = true;
  descargandoCertificado = false;

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router,
    private generadorCertSvc: GeneradorCertificadosService
  ) {
    addIcons({
      'at-outline': atOutline,
      'person-outline': personOutline,
      'log-out-outline': logOutOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'book-outline': bookOutline,
      'play-circle-outline': playCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'document-text-outline': documentTextOutline
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

  async descargarCertificado(insc: any) {
    if (this.descargandoCertificado) return;
    this.descargandoCertificado = true;
    
    try {
      // 1. Buscar en la base de datos si ya existe el certificado
      const { data, error } = await this.supabaseSvc.cliente
        .from('certificados')
        .select('*')
        .eq('usuario_id', this.usuario.id)
        .eq('curso_id', insc.curso_id)
        .single();

      if (data) {
        // Generar a partir del snapshot
        const nombreUsado = data.usuario_nombre || this.nombreUsuario || 'Estudiante';
        await this.generadorCertSvc.generarYDescargar(data.curso_titulo, nombreUsado, data.fecha_emision);
      } else {
        // 2. Si no existe, lo creamos en este momento como fallback
        const nuevoCert = {
          usuario_id: this.usuario.id,
          curso_id: insc.curso_id,
          curso_titulo: insc.curso_metadata?.titulo || 'Curso completado',
          usuario_nombre: this.nombreUsuario || 'Estudiante',
          fecha_emision: new Date().toISOString()
        };

        const { error: insertErr } = await this.supabaseSvc.cliente
          .from('certificados')
          .insert(nuevoCert);

        if (insertErr) {
          console.error('Error creando certificado fallback:', insertErr);
        }

        // Generar de todas formas
        await this.generadorCertSvc.generarYDescargar(nuevoCert.curso_titulo, nuevoCert.usuario_nombre, nuevoCert.fecha_emision);
      }
    } catch (error) {
      console.error('Error al descargar certificado:', error);
      alert('Hubo un error al generar el certificado.');
    } finally {
      setTimeout(() => {
        this.descargandoCertificado = false;
      }, 3000);
    }
  }
}