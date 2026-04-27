import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import {
  arrowBackOutline,
  personOutline,
  logOutOutline,
  bookOutline,
  chevronDownOutline,
  chevronUpOutline,
  playCircleOutline,
  listOutline,
  arrowForwardOutline,
  leafOutline
} from 'ionicons/icons';

interface LeccionDetalle {
  id: string;
  titulo: string;
  orden: number;
}

interface ModuloDetalle {
  id: string;
  titulo: string;
  orden: number;
  expandido: boolean;
  leccionesDetalle: LeccionDetalle[];
}

interface CursoCatalogo {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: string;
  imagen_url: string | null;
  estado: string;
  inscrito: boolean;
  expandido: boolean;
  mostrarDescripcionCompleta: boolean;
  totalLecciones: number;
  modulosDetalle: ModuloDetalle[];
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FondoVisualComponent, EcoSmartLogoComponent],
})
export class CatalogoPage implements OnInit {
  usuario: any = null;
  nombreUsuario = '';
  cursos: CursoCatalogo[] = [];
  cargando = true;
  mensajeError = '';
  procesandoCursoId: string | null = null;

  constructor(
    private router: Router,
    private supabaseSvc: SupabaseService
  ) {
    addIcons({
      arrowBackOutline,
      personOutline,
      logOutOutline,
      bookOutline,
      chevronDownOutline,
      chevronUpOutline,
      playCircleOutline,
      listOutline,
      arrowForwardOutline,
      leafOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarUsuario();
    await this.cargarCursos();
  }

  private async cargarUsuario(): Promise<void> {
    try {
      const { data, error } = await this.supabaseSvc.obtenerUsuario();

      if (error) throw error;

      this.usuario = data?.user ?? null;

      if (!this.usuario) {
        this.nombreUsuario = 'Estudiante';
        return;
      }

      const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuario.id);

      this.nombreUsuario =
        perfil?.nombre ||
        this.usuario.user_metadata?.['full_name'] ||
        this.usuario.user_metadata?.['name'] ||
        this.usuario.user_metadata?.['nombre'] ||
        this.usuario.email?.split('@')[0] ||
        'Estudiante';
    } catch (err) {
      console.error('Error cargando usuario en catálogo:', err);
      this.nombreUsuario = 'Estudiante';
    }
  }

  async cargarCursos(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const { data, error } = await this.supabaseSvc.obtenerCursosPublicos();

      if (error) throw error;

      const cursosRaw = (data || []).filter((c: any) => c.estado === 'publicado');
      let cursosInscritos = new Set<string>();

      if (this.usuario?.id) {
        const { data: inscripciones, error: inscError } =
          await this.supabaseSvc.obtenerInscripcionesUsuario(this.usuario.id);

        if (!inscError) {
          cursosInscritos = new Set(
            (inscripciones || []).map((i: any) => i.curso_id)
          );
        }
      }

      for (const curso of cursosRaw) {
        curso.inscrito = cursosInscritos.has(curso.id);
        curso.expandido = false;
        curso.mostrarDescripcionCompleta = false;
        curso.modulosDetalle = [];
        curso.totalLecciones = 0;

        const { data: modulos, error: modulosError } = await this.supabaseSvc.cliente
          .from('modulos')
          .select('id, titulo, orden')
          .eq('curso_id', curso.id)
          .order('orden', { ascending: true });

        if (modulosError) throw modulosError;

        for (const mod of modulos || []) {
          const { data: lecciones, error: leccionesError } = await this.supabaseSvc.cliente
            .from('lecciones')
            .select('id, titulo, orden')
            .eq('modulo_id', mod.id)
            .order('orden', { ascending: true });

          if (leccionesError) throw leccionesError;

          curso.modulosDetalle.push({
            id: mod.id,
            titulo: mod.titulo,
            orden: mod.orden,
            expandido: false,
            leccionesDetalle: lecciones || []
          });

          curso.totalLecciones += (lecciones || []).length;
        }
      }

      this.cursos = cursosRaw;
    } catch (error) {
      console.error('Error al cargar cursos en catálogo:', error);
      this.mensajeError = 'No fue posible cargar el catálogo.';
      this.cursos = [];
    } finally {
      this.cargando = false;
    }
  }

  async inscribirse(cursoId: string): Promise<void> {
    if (!this.usuario?.id) {
      this.router.navigate(['/ingreso']);
      return;
    }

    this.procesandoCursoId = cursoId;

    try {
      const { data: existente, error: errorExistente } =
        await this.supabaseSvc.obtenerInscripcion(this.usuario.id, cursoId);

      if (errorExistente) throw errorExistente;

      if (!existente) {
        const { error: insertError } =
          await this.supabaseSvc.inscribirUsuarioEnCurso(this.usuario.id, cursoId);

        if (insertError) throw insertError;
      }

      // Recargar todo el catálogo para sincronizar estados
      await this.cargarCursos();
    } catch (error) {
      console.error('Error al inscribirse en el curso:', error);
      this.mensajeError = 'No fue posible completar la inscripción.';
    } finally {
      this.procesandoCursoId = null;
    }
  }

  continuarCurso(cursoId: string): void {
    this.router.navigate(['/curso', cursoId]);
  }

  toggleExpandirCurso(curso: CursoCatalogo): void {
    curso.expandido = !curso.expandido;
  }

  toggleExpandirModulo(modulo: ModuloDetalle, event: Event): void {
    event.stopPropagation();
    modulo.expandido = !modulo.expandido;
  }

  async irAPerfil(): Promise<void> {
    await this.router.navigate(['/perfil']);
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard-estudiante']);
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.supabaseSvc.cerrarSesion();
      this.router.navigate(['/ingreso']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }
}