import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
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
  eyeOffOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  toggleOutline,
  mailOutline,
  schoolOutline
} from 'ionicons/icons';

interface CursoAdmin {
  id: string;
  titulo: string;
  nivel?: string | null;
  estado: string;
  totalModulos: number;
  imagen_url?: string | null;
}

interface UsuarioAdmin {
  id: string;
  nombre: string;
  correo: string;
  estado: 'Activo' | 'Inactivo';
  cursosInscritos: { id: string; titulo: string }[];
  totalCursos: number;
}

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
  usuarioActualId: string = '';
  cargando: boolean = false;
  cargandoUsuarios: boolean = false;
  mostrandoUsuarios: boolean = false;
  accesoVerificado: boolean = false;

  estadisticas = {
    totalUsuarios: 0,
    totalCursos: 0,
    cursosPublicados: 0
  };

  cursos: CursoAdmin[] = [];
  usuarios: UsuarioAdmin[] = [];

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
      eyeOffOutline,
      createOutline,
      trashOutline,
      checkmarkCircleOutline,
      documentTextOutline,
      toggleOutline,
      mailOutline,
      schoolOutline
    });
  }

  async ngOnInit() {
    const { data: { user } } = await this.supabaseSvc.obtenerUsuario();

    if (!user) {
      this.router.navigate(['/ingreso']);
      return;
    }

    this.usuarioActualId = user.id;
    this.nombreUsuario =
      user.user_metadata?.['full_name'] ||
      user.user_metadata?.['name'] ||
      user.email ||
      'Admin';

    const { data: perfil } = await this.supabaseSvc.cliente
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const rol = String(
      perfil?.rol ??
      perfil?.role ??
      user.user_metadata?.['rol'] ??
      user.user_metadata?.['role'] ??
      user.app_metadata?.['role'] ??
      ''
    ).trim().toLowerCase();

    // Validación de acceso exclusivo para administrador
    if (rol && !['admin', 'administrador'].includes(rol)) {
      alert('No tienes permisos para acceder al panel de administrador.');
      this.router.navigate(['/ingreso']);
      return;
    }

    this.accesoVerificado = true;
  }

  async ionViewWillEnter() {
    // Esto se ejecuta cada vez que se ingrese a la pagina, lo añadí para que siempre que cargue traiga los datos actualizados
    if (this.accesoVerificado) {
      await this.cargarDatos();
    }
  }

  async cargarDatos() {
    this.cargando = true;

    try {
      const { data: cursosData } = await this.supabaseSvc.obtenerCursosAdmin();
      this.cursos = (cursosData || []).map((curso: any) => ({
        ...curso,
        totalModulos: 0
      }));

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

      const { data: perfiles } = await this.supabaseSvc.cliente
        .from('profiles')
        .select('*');

      const estudiantes = (perfiles || []).filter((perfil: any) => {
        const rol = String(perfil?.rol ?? perfil?.role ?? '').trim().toLowerCase();

        if (!rol) {
          return perfil.id !== this.usuarioActualId;
        }

        return ['estudiante', 'student', 'usuario', 'user'].includes(rol);
      });

      this.estadisticas.totalUsuarios = estudiantes.length;

      if (this.mostrandoUsuarios) {
        await this.cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al cargar datos admin:', error);
      alert('No se pudieron cargar los datos del panel administrador.');
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

  async toggleEstadoCurso(curso: CursoAdmin) {
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

  async eliminarCurso(curso: CursoAdmin) {
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

  async toggleVistaUsuarios() {
    this.mostrandoUsuarios = !this.mostrandoUsuarios;

    if (this.mostrandoUsuarios) {
      await this.cargarUsuarios();
    }
  }

  async cargarUsuarios() {
    this.cargandoUsuarios = true;

    try {
      const { data: perfiles, error } = await this.supabaseSvc.cliente
        .from('profiles')
        .select('*');

      if (error) throw error;

      const estudiantes = (perfiles || []).filter((perfil: any) => {
        const rol = String(perfil?.rol ?? perfil?.role ?? '').trim().toLowerCase();

        if (!rol) {
          return perfil.id !== this.usuarioActualId;
        }

        return ['estudiante', 'student', 'usuario', 'user'].includes(rol);
      });

      const inscripciones = await this.obtenerInscripciones();
      const mapaCursos = new Map<string, string>(
        this.cursos.map(curso => [String(curso.id), curso.titulo])
      );

      const cursosPorUsuario = new Map<string, { id: string; titulo: string }[]>();

      for (const item of inscripciones) {
        const listaActual = cursosPorUsuario.get(item.usuarioId) || [];
        const yaExiste = listaActual.some(curso => curso.id === item.cursoId);

        if (!yaExiste) {
          listaActual.push({
            id: item.cursoId,
            titulo: mapaCursos.get(item.cursoId) || 'Curso'
          });

          cursosPorUsuario.set(item.usuarioId, listaActual);
        }
      }

      this.usuarios = estudiantes.map((perfil: any) => {
        const estadoDB = String(perfil?.estado ?? perfil?.status ?? 'Activo').toLowerCase();
        const cursosInscritos = cursosPorUsuario.get(String(perfil.id)) || [];

        return {
          id: String(perfil.id),
          nombre:
            perfil.full_name ||
            perfil.nombre_completo ||
            perfil.nombre ||
            perfil.nombres ||
            perfil.email ||
            'Sin nombre',
          correo: perfil.email || perfil.correo || 'Sin correo',
          estado: estadoDB === 'inactivo' || estadoDB === 'inactive' ? 'Inactivo' : 'Activo',
          cursosInscritos,
          totalCursos: cursosInscritos.length
        };
      });
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('No se pudieron cargar los estudiantes.');
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  async cambiarEstadoUsuario(usuario: UsuarioAdmin) {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    const mensaje = nuevoEstado === 'Inactivo'
      ? `¿Deseas dejar inactivo a "${usuario.nombre}"? No podrá iniciar sesión.`
      : `¿Deseas activar a "${usuario.nombre}"? Podrá iniciar sesión nuevamente.`;

    if (!confirm(mensaje)) return;

    const { error } = await this.supabaseSvc.cliente
      .from('profiles')
      .update({ estado: nuevoEstado })
      .eq('id', usuario.id);

    if (error) {
      console.error('Error al cambiar estado del usuario:', error);
      alert('No se pudo actualizar el estado del estudiante.');
      return;
    }

    // Reflejar el cambio inmediatamente en la tabla sin recargar la página
    usuario.estado = nuevoEstado;
  }

  private async obtenerInscripciones(): Promise<Array<{ usuarioId: string; cursoId: string }>> {
    const intentos = [
      { tabla: 'inscripciones', colUsuario: 'usuario_id', colCurso: 'curso_id' },
      { tabla: 'inscripciones', colUsuario: 'user_id', colCurso: 'course_id' },
      { tabla: 'matriculas', colUsuario: 'usuario_id', colCurso: 'curso_id' },
      { tabla: 'matriculas', colUsuario: 'user_id', colCurso: 'course_id' }
    ];

    for (const intento of intentos) {
      try {
        const { data, error } = await this.supabaseSvc.cliente
          .from(intento.tabla)
          .select(`${intento.colUsuario}, ${intento.colCurso}`);

        if (!error && data) {
          return data
            .map((item: any) => ({
              usuarioId: String(item[intento.colUsuario] ?? ''),
              cursoId: String(item[intento.colCurso] ?? '')
            }))
            .filter((item: any) => item.usuarioId && item.cursoId);
        }
      } catch {
        // Si esta estructura no existe, probar con la siguiente
      }
    }

    return [];
  }

  trackByCursoId(index: number, curso: CursoAdmin): string {
    return curso.id;
  }

  trackByUsuarioId(index: number, usuario: UsuarioAdmin): string {
    return usuario.id;
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(u => u.estado === 'Activo').length;
  }
}