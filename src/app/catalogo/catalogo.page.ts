import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import {
  arrowBackOutline,
  personOutline,
  logOutOutline,
  bookOutline,
  chevronDownOutline,
  chevronUpOutline,
  playCircleOutline,
  listOutline,
  arrowForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FondoVisualComponent],
})
export class CatalogoPage implements OnInit {

  usuario: any = null;
  nombreUsuario: string = 'Estudiante';
  cursos: any[] = [];
  cargando = true;

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
      arrowForwardOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarUsuario();
    await this.cargarCursos();
  }

  private async cargarUsuario(): Promise<void> {
    try {

      const { data, error } = await this.supabaseSvc.obtenerUsuario();

      if (error) {
        throw error;
      }

      this.usuario = data?.user ?? null;

      if (!this.usuario) {
        this.nombreUsuario = 'Estudiante';
        return;
      }

      this.nombreUsuario =
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
    try {
      const { data } = await this.supabaseSvc.cliente
        .from('cursos')
        .select('*')
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false });

      const cursosRaw = data || [];

      const userRes = await this.supabaseSvc.obtenerUsuario();
      const userId = userRes.data?.user?.id;

      for (const curso of cursosRaw) {
        // Inscripciones no están implementadas aún, se asume por ahora 'false'
        curso.inscrito = false;
        curso.expandido = false;

        const { data: modulos } = await this.supabaseSvc.cliente
          .from('modulos')
          .select('*')
          .eq('curso_id', curso.id)
          .order('orden', { ascending: true });

        curso.modulosDetalle = [];
        let totalLecciones = 0;

        for (const mod of modulos || []) {
          const { data: lecciones } = await this.supabaseSvc.cliente
            .from('lecciones')
            .select('*')
            .eq('modulo_id', mod.id)
            .order('orden', { ascending: true });
            
          mod.leccionesDetalle = lecciones || [];
          mod.expandido = false;
          curso.modulosDetalle.push(mod);
          totalLecciones += (lecciones || []).length;
        }
        curso.totalLecciones = totalLecciones;
      }

      this.cursos = cursosRaw;
    } catch (error) {
      console.error('Error al cargar cursos en catálogo:', error);
    } finally {
      this.cargando = false;
    }
  }

  async inscribirse(cursoId: string): Promise<void> {
    if (!this.usuario) {
      this.router.navigate(['/ingreso']);
      return;
    }
    // Lógica futura de inscripción
    console.log('Botón de inscripción presionado para el curso:', cursoId);
  }

  continuarCurso(cursoId: string): void {
    // Redirigir al dashboard estudiante donde debería estar el curso o a una vista específica del curso
    this.router.navigate(['/dashboard-estudiante'], { queryParams: { curso: cursoId } });
  }

  toggleExpandirCurso(curso: any): void {
    curso.expandido = !curso.expandido;
  }

  toggleExpandirModulo(modulo: any, event: Event): void {
    event.stopPropagation();
    modulo.expandido = !modulo.expandido;
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