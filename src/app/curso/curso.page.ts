import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  playCircleOutline,
  chevronForwardOutline,
  menuOutline,
  closeOutline,
  personOutline,
  logOutOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  helpCircleOutline,
  documentTextOutline,
  chevronDownOutline,
  chevronUpOutline,
  arrowForwardOutline
} from 'ionicons/icons';

interface Leccion {
  id: string;
  titulo: string;
  orden: number;
  contenido_tipo: string;
  contenido_html: string;
  completada?: boolean;
}

interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
  expandido?: boolean;
}

export interface BloqueContenido {
  id: string;
  tipo: 'titulo' | 'subtitulo' | 'texto' | 'imagen' | 'video';
  valor: string;
}


@Component({
  selector: 'app-curso',
  templateUrl: './curso.page.html',
  styleUrls: ['./curso.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FondoVisualComponent, EcoSmartLogoComponent]

})
export class CursoPage implements OnInit {
  cursoId: string | null = null;
  curso: any = null;
  modulos: Modulo[] = [];
  leccionActiva: Leccion | null = null;
  cargando = true;
  sidebarAbierto = false;
  usuario: any = null;
  nombreUsuario = '';
  progresoGeneral = 0;
  bloquesActivos: BloqueContenido[] = [];
  inscripcionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      bookOutline, playCircleOutline, chevronForwardOutline,
      menuOutline, closeOutline, personOutline, logOutOutline,
      arrowBackOutline, checkmarkCircleOutline, helpCircleOutline,
      documentTextOutline, chevronDownOutline, chevronUpOutline,
      arrowForwardOutline
    });
  }

  async ngOnInit() {
    this.cursoId = this.route.snapshot.paramMap.get('id');
    if (this.cursoId) {
      await this.cargarTodo();
    } else {
      this.router.navigate(['/dashboard-estudiante']);
    }
  }

  async cargarTodo() {
    this.cargando = true;
    try {
      await this.cargarUsuario();
      await this.cargarCurso();
      await this.cargarModulosLecciones();
      await this.cargarInscripcion(); // Obtener el ID de la matrícula
      await this.cargarProgreso();

      // Activar la primera lección por defecto si no hay una activa
      if (this.modulos.length > 0 && this.modulos[0].lecciones.length > 0) {
        this.seleccionarLeccion(this.modulos[0].lecciones[0]);
        this.modulos[0].expandido = true;
      }
    } catch (error) {
      console.error('Error al cargar datos del curso:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarUsuario() {
    const { data } = await this.supabaseSvc.obtenerUsuario();
    this.usuario = data?.user;
    if (this.usuario) {
      const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);
      this.nombreUsuario = perfil?.nombre || this.usuario.email?.split('@')[0] || 'Estudiante';
    }
  }

  async cargarCurso() {
    const { data, error } = await this.supabaseSvc.obtenerCursoPorId(this.cursoId!);
    if (error) throw error;
    this.curso = data;
    if (this.curso && this.curso.estado !== 'publicado') {
      this.router.navigate(['/dashboard-estudiante']);
    }
  }

  async cargarInscripcion() {
    if (!this.usuario || !this.cursoId) return;
    const { data: insc, error } = await this.supabaseSvc.obtenerInscripcion(this.usuario.id, this.cursoId);
    if (error) {
      console.error('Error al cargar inscripción:', error);
      return;
    }
    if (insc) {
      this.inscripcionId = insc.id;
    }
  }

  async cargarModulosLecciones() {
    const { data: mods, error } = await this.supabaseSvc.obtenerModulosCurso(this.cursoId!);
    if (error) throw error;

    this.modulos = [];
    for (const m of mods || []) {
      const { data: lecs } = await this.supabaseSvc.obtenerLeccionesModulo(m.id);
      this.modulos.push({
        ...m,
        lecciones: lecs || [],
        expandido: false
      });
    }
  }

  async cargarProgreso() {
    if (!this.inscripcionId) return;

    try {
      const { data: completadas, error } = await this.supabaseSvc.obtenerLeccionesCompletadas(this.inscripcionId);
      if (error) throw error;

      // Convertir a un set de IDs de lecciones completadas para búsqueda rápida
      const completadasSet = new Set(
        completadas?.map((p: any) => p.leccion_id)
      );

      let totalLecs = 0;
      let totalCompletadas = 0;

      for (const mod of this.modulos) {
        for (const lec of mod.lecciones) {
          totalLecs++;
          // Sincronizar el estado local con la base de datos
          if (completadasSet.has(lec.id)) {
            lec.completada = true;
          }

          if (lec.completada) {
            totalCompletadas++;
          }
        }
      }

      this.progresoGeneral = totalLecs > 0 ? Math.round((totalCompletadas / totalLecs) * 100) : 0;
      console.log(`Progreso cargado desde DB: ${this.progresoGeneral}% (${totalCompletadas}/${totalLecs})`);
    } catch (error) {
      console.error('Error al cargar progreso:', error);
    }
  }

  private recalcularProgresoLocal() {
    let totalLecs = 0;
    let totalCompletadas = 0;

    for (const mod of this.modulos) {
      for (const lec of mod.lecciones) {
        totalLecs++;
        if (lec.completada) {
          totalCompletadas++;
        }
      }
    }

    this.progresoGeneral = totalLecs > 0 ? Math.round((totalCompletadas / totalLecs) * 100) : 0;
    console.log(`Progreso recalculado localmente: ${this.progresoGeneral}% (${totalCompletadas}/${totalLecs})`);
  }

  seleccionarLeccion(leccion: Leccion) {
    this.leccionActiva = leccion;
    this.sidebarAbierto = false; // Cerrar sidebar en móvil al seleccionar

    // Parsear bloques
    try {
      this.bloquesActivos = JSON.parse(leccion.contenido_html || '[]');
    } catch {
      this.bloquesActivos = [];
    }
  }

  toggleModulo(mod: Modulo) {
    mod.expandido = !mod.expandido;
  }

  toggleSidebar() {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  async marcarCompletada() {
    if (!this.leccionActiva || !this.inscripcionId) return;

    try {
      // 1. Marcar localmente para respuesta inmediata en la UI
      this.leccionActiva.completada = true;
      this.recalcularProgresoLocal();

      // 2. Guardar progreso de la lección en Supabase (lecciones_completadas)
      const { error: saveError } = await this.supabaseSvc.guardarLeccionCompletada(
        this.inscripcionId,
        this.leccionActiva.id
      );

      if (saveError) throw saveError;

      // 3. Actualizar el progreso general en la tabla de inscripciones
      const { error: updateError } = await this.supabaseSvc.actualizarProgresoInscripcion(
        this.usuario.id,
        this.cursoId!,
        this.progresoGeneral
      );

      if (updateError) throw updateError;

      console.log('Progreso guardado exitosamente en lecciones_completadas');

    } catch (error) {
      console.error('Error al marcar lección como completada:', error);
    }
  }

  async irASiguienteLeccion() {
    // 1. Marcar como completada
    await this.marcarCompletada();

    // 2. Buscar la siguiente lección
    let encontradaActiva = false;
    let siguienteLec: Leccion | null = null;
    let siguienteModulo: Modulo | null = null;

    for (const mod of this.modulos) {
      for (const lec of mod.lecciones) {
        if (encontradaActiva) {
          siguienteLec = lec;
          siguienteModulo = mod;
          break;
        }
        if (lec.id === this.leccionActiva?.id) {
          encontradaActiva = true;
        }
      }
      if (siguienteLec) break;
    }

    if (siguienteLec) {
      if (siguienteModulo) siguienteModulo.expandido = true;
      this.seleccionarLeccion(siguienteLec);
      // Scroll to top
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTop = 0;
    } else {
      // Si no hay más lecciones, volver al dashboard o mostrar mensaje
      this.volverAlDashboard();
    }
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard-estudiante']);
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }
}
