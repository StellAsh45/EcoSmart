import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, ViewWillEnter } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { GeneradorCertificadosService } from '../services/generador-certificados.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  schoolOutline,
  ribbonOutline,
  downloadOutline,
  documentTextOutline,
  logOutOutline
} from 'ionicons/icons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaCertificadoComponent } from '../components/tarjeta-certificado/tarjeta-certificado.component';

@Component({
  selector: 'app-certificados',
  templateUrl: './certificados.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, FondoVisualComponent, EcoSmartLogoComponent, TarjetaCertificadoComponent]
})
export class CertificadosPage implements OnInit, ViewWillEnter {

  certificados: any[] = [];
  cargando = true;
  usuario: any = null;
  nombreUsuario = '';
  descargando = false;

  private supabaseSvc = inject(SupabaseService);
  private generadorCertSvc = inject(GeneradorCertificadosService);
  private router = inject(Router);

  constructor() {
    addIcons({
      arrowBackOutline,
      schoolOutline,
      ribbonOutline,
      downloadOutline,
      documentTextOutline,
      logOutOutline
    });
  }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const { data: userData } = await this.supabaseSvc.obtenerUsuario();
      this.usuario = userData?.user;

      if (this.usuario) {
        // Cargar el nombre del usuario
        const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);
        this.nombreUsuario = perfil?.nombre || this.usuario.email?.split('@')[0] || 'Estudiante';

        const { data, error } = await this.supabaseSvc.cliente
          .from('certificados')
          .select('*, curso:cursos(titulo)')
          .eq('usuario_id', this.usuario.id)
          .order('fecha_emision', { ascending: false });

        if (data && data.length > 0) {
          this.certificados = data;
        } else {
          this.certificados = [];
        }
      }
    } catch (err) {
      console.error('Error al cargar certificados:', err);
      this.certificados = [];
    } finally {
      this.cargando = false;
    }
  }

  formatearFecha(fecha: string | Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  volver(): void {
    this.router.navigate(['/perfil']);
  }

  async descargarCertificado(cert: any) {
    if (this.descargando) return;
    this.descargando = true;

    try {
      if (cert.pdf_url) {
        window.open(cert.pdf_url, '_blank');
      } else {
        await this.generadorCertSvc.generarYDescargar(
          cert.curso_titulo,
          cert.usuario_nombre,
          cert.fecha_emision
        );
      }
    } catch (error) {
      console.error('Error al descargar:', error);
    } finally {
      setTimeout(() => {
        this.descargando = false;
      }, 3000);
    }
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }
}
