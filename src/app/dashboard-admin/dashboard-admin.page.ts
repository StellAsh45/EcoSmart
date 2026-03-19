import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  bookOutline,
  addOutline,
  logOutOutline,
  statsChartOutline,
  settingsOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  documentTextOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.page.html',
  styleUrls: ['./dashboard-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    RouterLink,
    FondoVisualComponent,
    EcoSmartLogoComponent
  ]
})
export class DashboardAdminPage implements OnInit {
  nombreUsuario: string = 'Administrador';
  cargando: boolean = false;
  estadisticas = {
    totalUsuarios: 0,
    totalCursos: 0,
    cursosPublicados: 0
  };

  cursos: any[] = [];
  usuarios: any[] = [];

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    addIcons({
      peopleOutline,
      bookOutline,
      addOutline,
      logOutOutline,
      statsChartOutline,
      settingsOutline,
      eyeOutline,
      createOutline,
      trashOutline,
      checkmarkCircleOutline,
      documentTextOutline
    });
  }

  async ngOnInit() {
    const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
    if (user) {
      this.nombreUsuario = user.user_metadata?.['full_name'] || 'Admin';
    }
  }

  async ionViewWillEnter() {
    // Esto se ejecuta cada vez que se ingrese a la pagina, lo añadí para que siempre que cargue traiga los datos actualizados
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const { data: cursosData } = await this.supabaseSvc.obtenerCursosAdmin();
      this.cursos = cursosData || [];

      // Contar módulos reales por cada curso
      for (const curso of this.cursos) {
        const { count } = await this.supabaseSvc.cliente
          .from('modulos')
          .select('*', { count: 'exact', head: true })
          .eq('curso_id', curso.id);
        curso.totalModulos = count || 0;
      }

      this.estadisticas.totalCursos = this.cursos.length;
      this.estadisticas.cursosPublicados = this.cursos.filter(c => c.estado === 'publicado').length;

      const { count } = await this.supabaseSvc.cliente.from('profiles').select('*', { count: 'exact', head: true });
      this.estadisticas.totalUsuarios = count || 0;
    } catch (error) {
      console.error('Error al cargar datos admin:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }

  crearNuevoCurso() {
    this.router.navigate(['/constructor-curso', 'nuevo']);
  }

  async toggleEstadoCurso(curso: any) {
    const nuevoEstado = curso.estado === 'publicado' ? 'borrador' : 'publicado';
    const accion = nuevoEstado === 'publicado' ? 'publicar' : 'despublicar';

    if (confirm(`¿Quieres ${accion} el curso "${curso.titulo}"?`)) {
      const { error } = await this.supabaseSvc.cliente
        .from('cursos')
        .update({ estado: nuevoEstado })
        .eq('id', curso.id);

      if (error) {
        console.error('Error al cambiar estado:', error);
        alert('No se pudo cambiar el estado del curso.');
      } else {
        // Actualizar el estado local inmediatamente sin recargar todo
        curso.estado = nuevoEstado;
        this.estadisticas.cursosPublicados = this.cursos.filter(c => c.estado === 'publicado').length;
      }
    }
  }

  async eliminarCurso(curso: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar el curso "${curso.titulo}"? Esta acción no se puede deshacer y borrará TODO el contenido asociado (módulos, lecciones, quizzes).`)) {
      this.cargando = true;
      try {
        // 1. Borrar imagen de Storage si existe
        if (curso.imagen_url && curso.imagen_url.includes('/object/public/cursos/')) {
          const rutaRelativa = curso.imagen_url.split('/object/public/cursos/')[1];
          if (rutaRelativa) {
            await this.supabaseSvc.eliminarImagenCurso(rutaRelativa);
          }
        }

        // 2. Borrar de la DB (cascada se encarga del resto)
        const { error } = await this.supabaseSvc.eliminarCurso(curso.id);

        if (error) throw error;

        alert('Curso eliminado exitosamente');
        await this.cargarDatos(); // Recargar la lista
      } catch (error) {
        console.error('Error al eliminar curso:', error);
        alert('No se pudo eliminar el curso. Revisa la consola.');
      } finally {
        this.cargando = false;
      }
    }
  }
}
