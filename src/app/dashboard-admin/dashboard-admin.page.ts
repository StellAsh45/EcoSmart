import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { OverlayConfirmacionComponent } from '../components/overlay-confirmacion/overlay-confirmacion.component';
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
  schoolOutline,
  alertCircleOutline,
  helpCircleOutline,
  radioButtonOnOutline,
  radioButtonOffOutline,
  syncOutline,
  closeCircleOutline,
  personRemoveOutline,
  rocketOutline,
  searchOutline,
  filterOutline,
  chevronDownOutline,
  refreshOutline,
  arrowForwardOutline,
  chatbubblesOutline
} from 'ionicons/icons';
import { TarjetaEstadisticaComponent } from '../components/tarjeta-estadistica/tarjeta-estadistica.component';

interface CursoAdmin {
  id: string;
  titulo: string;
  nivel?: string | null;
  estado: string;
  totalModulos: number;
  totalEstudiantes: number;
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
    EcoSmartLogoComponent,
    OverlayConfirmacionComponent,
    TarjetaEstadisticaComponent
  ]
})
export class DashboardAdminPage implements OnInit, ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;

  nombreUsuario: string = '';
  usuarioActualId: string = '';
  cargando: boolean = true;
  cargandoUsuarios: boolean = false;
  mostrandoUsuarios: boolean = false;
  accesoVerificado: boolean = false;
  inicializandoDashboard: boolean = false;

  filtroNombre: string = '';
  filtroEstado: 'Todos' | 'Activo' | 'Inactivo' = 'Todos';

  // Estado Overlay Confirmación Premium
  mostrarOverlayConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  textoBotonConfirmar = '';
  claseBotonConfirmar = '';
  iconoConfirmacion = '';
  accionConfirmacion: () => void = () => { };

  estadisticas = {
    totalUsuarios: 0,
    totalCursos: 0,
    cursosPublicados: 0,
    ticketsPendientes: 0
  };

  cursos: CursoAdmin[] = [];
  usuarios: UsuarioAdmin[] = [];

  constructor(
    private supabaseSvc: SupabaseService,
    private router: Router
  ) {
    addIcons({
      'people-outline': peopleOutline,
      'book-outline': bookOutline,
      'add-outline': addOutline,
      'log-out-outline': logOutOutline,
      'stats-chart-outline': statsChartOutline,
      'settings-outline': settingsOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'radio-button-on-outline': radioButtonOnOutline,
      'radio-button-off-outline': radioButtonOffOutline,
      'sync-outline': syncOutline,
      'document-text-outline': documentTextOutline,
      'toggle-outline': toggleOutline,
      'mail-outline': mailOutline,
      'school-outline': schoolOutline,
      'alert-circle-outline': alertCircleOutline,
      'help-circle-outline': helpCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'person-remove-outline': personRemoveOutline,
      'rocket-outline': rocketOutline,
      'search-outline': searchOutline,
      'filter-outline': filterOutline,
      'chevron-down-outline': chevronDownOutline,
      'refresh-outline': refreshOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'chatbubbles-outline': chatbubblesOutline
    });
  }

  async ngOnInit() {
    await this.inicializarDashboard();
  }

  async ionViewWillEnter() {
    this.content?.scrollToTop(0);
    if (this.inicializandoDashboard) return;
    if (!this.accesoVerificado) {
      await this.inicializarDashboard();
      return;
    }
    await this.cargarDatos();
  }

  private async inicializarDashboard() {
    if (this.inicializandoDashboard) return;
    this.inicializandoDashboard = true;

    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) {
        this.router.navigate(['/ingreso']);
        return;
      }

      this.usuarioActualId = user.id;
      this.nombreUsuario = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email || 'Admin';
      this.accesoVerificado = true;
      await this.cargarDatos();
    } catch (error) {
      console.error('Error al inicializar dashboard admin:', error);
      this.router.navigate(['/ingreso']);
    } finally {
      this.inicializandoDashboard = false;
    }
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const { data: cursosData, error: cursosError } = await this.supabaseSvc.obtenerCursosAdmin();
      if (cursosError) throw cursosError;

      this.cursos = (cursosData || []).map((curso: any) => ({
        ...curso,
        totalModulos: 0,
        totalEstudiantes: 0
      }));

      const inscripcionesTotales = await this.obtenerInscripciones();

      for (const curso of this.cursos) {
        const { count: modulosCount } = await this.supabaseSvc.cliente
          .from('modulos')
          .select('*', { count: 'exact', head: true })
          .eq('curso_id', curso.id);

        curso.totalModulos = modulosCount || 0;
        curso.totalEstudiantes = inscripcionesTotales.filter(ins => ins.cursoId === String(curso.id)).length;
      }

      this.estadisticas.totalCursos = this.cursos.length;
      this.estadisticas.cursosPublicados = this.cursos.filter(c => c.estado === 'publicado').length;

      const { count } = await this.supabaseSvc.cliente
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'estudiante');

      this.estadisticas.totalUsuarios = count || 0;

      // Cargar mensajes de soporte pendientes
      const { count: ticketsCount } = await this.supabaseSvc.cliente
        .from('mensajes_ticket')
        .select('*', { count: 'exact', head: true })
        .eq('rol_remitente', 'estudiante')
        .eq('leido', false);

      this.estadisticas.ticketsPendientes = ticketsCount || 0;

    } catch (error) {
      console.error('Error al cargar datos admin:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarUsuarios() {
    this.cargandoUsuarios = true;
    try {
      const { data: perfiles, error } = await this.supabaseSvc.cliente.from('profiles').select('*');
      if (error) throw error;

      const estudiantes = (perfiles || []).filter((perfil: any) => {
        const rol = String(perfil?.rol ?? '').trim().toLowerCase();
        return rol === 'estudiante' || (!rol && perfil.id !== this.usuarioActualId);
      });

      const inscripciones = await this.obtenerInscripciones();
      const mapaCursos = new Map<string, string>(this.cursos.map(curso => [String(curso.id), curso.titulo]));
      const cursosPorUsuario = new Map<string, { id: string; titulo: string }[]>();

      for (const item of inscripciones) {
        const listaActual = cursosPorUsuario.get(item.usuarioId) || [];
        if (!listaActual.some(curso => curso.id === item.cursoId)) {
          listaActual.push({ id: item.cursoId, titulo: mapaCursos.get(item.cursoId) || 'Curso' });
          cursosPorUsuario.set(item.usuarioId, listaActual);
        }
      }

      this.usuarios = estudiantes.map((perfil: any) => {
        const { estado } = this.resolverEstadoUsuario(perfil);
        const cursosInscritos = cursosPorUsuario.get(String(perfil.id)) || [];
        return {
          id: String(perfil.id),
          nombre: perfil.full_name || perfil.nombre_completo || perfil.nombre || perfil.email || 'Sin nombre',
          correo: perfil.email || perfil.correo || 'Sin correo',
          estado,
          cursosInscritos,
          totalCursos: cursosInscritos.length
        };
      });
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  // --- ACCIONES CON OVERLAY DE CONFIRMACIÓN ---

  abrirConfirmacion(titulo: string, mensaje: string, textoBoton: string, claseBoton: string, icono: string, accion: () => void) {
    this.tituloConfirmacion = titulo;
    this.mensajeConfirmacion = mensaje;
    this.textoBotonConfirmar = textoBoton;
    this.claseBotonConfirmar = claseBoton;
    this.iconoConfirmacion = icono;
    this.accionConfirmacion = accion;
    this.mostrarOverlayConfirmacion = true;
  }

  confirmarAccion() {
    this.accionConfirmacion();
    this.cerrarConfirmacion();
  }

  cerrarConfirmacion() {
    this.mostrarOverlayConfirmacion = false;
  }

  async toggleEstadoCurso(curso: CursoAdmin) {
    const nuevoEstado = curso.estado === 'publicado' ? 'borrador' : 'publicado';
    const accionStr = nuevoEstado === 'publicado' ? 'publicar' : 'despublicar';

    this.abrirConfirmacion(
      '¿Cambiar estado?',
      `¿Quieres ${accionStr} el curso "${curso.titulo}"?`,
      nuevoEstado === 'publicado' ? 'Publicar curso' : 'Mover a borrador',
      nuevoEstado === 'publicado' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40' : 'bg-primary-500 hover:bg-primary-400 shadow-primary-500/40',
      nuevoEstado === 'publicado' ? 'rocket-outline' : 'document-text-outline',
      async () => {
        const { error } = await this.supabaseSvc.cliente.from('cursos').update({ estado: nuevoEstado }).eq('id', curso.id);
        if (error) {
          console.error('Error al cambiar estado:', error);
        } else {
          curso.estado = nuevoEstado;
          this.estadisticas.cursosPublicados = this.cursos.filter(c => c.estado === 'publicado').length;
        }
      }
    );
  }

  async eliminarCurso(curso: CursoAdmin) {
    this.abrirConfirmacion(
      'Eliminar curso',
      `¿Deseas eliminar "${curso.titulo}"? Esta acción borrará todo el contenido asociado y no se puede deshacer.`,
      'Eliminar definitivamente',
      'bg-red-500 hover:bg-red-400 shadow-red-500/40',
      'trash-outline',
      async () => {
        this.cargando = true;
        try {
          if (curso.imagen_url?.includes('/object/public/cursos/')) {
            const rutaRelativa = curso.imagen_url.split('/object/public/cursos/')[1];
            if (rutaRelativa) await this.supabaseSvc.eliminarImagenCurso(rutaRelativa);
          }
          const { error } = await this.supabaseSvc.eliminarCurso(curso.id);
          if (error) throw error;
          await this.cargarDatos();
        } catch (error) {
          console.error('Error al eliminar curso:', error);
        } finally {
          this.cargando = false;
        }
      }
    );
  }

  async cambiarEstadoUsuario(usuario: UsuarioAdmin) {
    const nuevoEstado: 'Activo' | 'Inactivo' = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const mensaje = nuevoEstado === 'Inactivo'
      ? `¿Deseas dejar inactivo a "${usuario.nombre}"? No podrá acceder a la plataforma.`
      : `¿Deseas activar a "${usuario.nombre}"? Podrá acceder nuevamente a sus cursos.`;

    this.abrirConfirmacion(
      'Estado del estudiante',
      mensaje,
      nuevoEstado === 'Inactivo' ? 'Desactivar estudiante' : 'Activar estudiante',
      nuevoEstado === 'Inactivo' ? 'bg-red-500 hover:bg-red-400 shadow-red-500/40' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40',
      nuevoEstado === 'Inactivo' ? 'close-circle-outline' : 'checkmark-circle-outline',
      async () => {
        const estadoBool = nuevoEstado === 'Activo';
        let actualizado = false;

        try {
          const { data, error } = await this.supabaseSvc.cliente
            .from('profiles')
            .update({ activo: estadoBool })
            .eq('id', usuario.id)
            .select('id')
            .maybeSingle();

          if (!error && data?.id) {
            actualizado = true;
          }
        } catch (err) {
          console.error(err);
        }

        if (actualizado) {
          usuario.estado = nuevoEstado;
          this.usuarios = this.usuarios.map(u => u.id === usuario.id ? { ...u, estado: nuevoEstado } : u);
          await this.cargarUsuarios();
        }
      }
    );
  }

  // --- MÉTODOS AUXILIARES ---

  // Cierra la sesión del usuario
  async cerrarSesion() {
    await this.supabaseSvc.cerrarSesion();
    this.router.navigate(['/ingreso']);
  }

  // Crea un nuevo curso
  crearNuevoCurso() {
    this.router.navigate(['/constructor-curso', 'nuevo']);
  }

  // Alterna la vista de usuarios
  async toggleVistaUsuarios() {
    this.mostrandoUsuarios = !this.mostrandoUsuarios;
    if (this.mostrandoUsuarios) await this.cargarUsuarios();
  }

  // Resuelve el estado del usuario
  private resolverEstadoUsuario(perfil: any): { estado: 'Activo' | 'Inactivo' } {
    return { estado: perfil.activo === false ? 'Inactivo' : 'Activo' };
  }

  // Obtiene las inscripciones de los usuarios
  private async obtenerInscripciones(): Promise<Array<{ usuarioId: string; cursoId: string }>> {
    const intentos = [
      { tabla: 'inscripciones', colUsuario: 'usuario_id', colCurso: 'curso_id' },
      { tabla: 'matriculas', colUsuario: 'usuario_id', colCurso: 'curso_id' }
    ];
    for (const i of intentos) {
      try {
        const { data, error } = await this.supabaseSvc.cliente.from(i.tabla).select(`${i.colUsuario}, ${i.colCurso}`);
        if (!error && data) return data.map((item: any) => ({ usuarioId: String(item[i.colUsuario] || ''), cursoId: String(item[i.colCurso] || '') })).filter((x: any) => x.usuarioId && x.cursoId);
      } catch { }
    }
    return [];
  }

  // Rastrea el curso por ID
  rastrearCursoPorId(index: number, curso: CursoAdmin): string { return curso.id; }
  // Rastrea el usuario por ID
  rastrearUsuarioPorId(index: number, usuario: UsuarioAdmin): string { return usuario.id; }
  // Obtiene el número de usuarios activos
  get usuariosActivos(): number { return this.usuarios.filter(u => u.estado === 'Activo').length; }
  // Obtiene el número de usuarios inactivos
  get usuariosInactivos(): number { return this.usuarios.filter(u => u.estado === 'Inactivo').length; }

  // --- MÉTODOS DE FILTRADO ---
  actualizarFiltroNombre(event: any) {
    this.filtroNombre = event.target.value;
  }

  actualizarFiltroEstado(event: any) {
    this.filtroEstado = event.target.value;
  }

  get usuariosFiltrados(): UsuarioAdmin[] {
    return this.usuarios.filter(u => {
      const termino = this.filtroNombre.toLowerCase().trim();
      const cumpleNombre = !termino ||
        u.nombre.toLowerCase().includes(termino) ||
        u.correo.toLowerCase().includes(termino);
      const cumpleEstado = this.filtroEstado === 'Todos' || u.estado === this.filtroEstado;
      return cumpleNombre && cumpleEstado;
    });
  }
}