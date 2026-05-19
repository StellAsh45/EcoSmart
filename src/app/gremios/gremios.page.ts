import { Component, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, Platform, ViewWillEnter } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase';
import { addIcons } from 'ionicons';
import { 
  leafOutline, leaf, sparklesOutline, arrowBackOutline, waterOutline, planetOutline, 
  cutOutline, storefrontOutline, closeOutline, thermometerOutline, bonfireOutline, 
  pawOutline, sunnyOutline, timeOutline, statsChartOutline, handRightOutline, 
  infiniteOutline, mapOutline, hammerOutline, gitBranchOutline, trophyOutline,
  lockClosedOutline, schoolOutline, checkmarkCircleOutline, alertCircleOutline,
  createOutline, peopleOutline, colorPaletteOutline, logOutOutline, playOutline,
  personOutline, searchOutline, flaskOutline,
  people, storefront, statsChart, trophy, school
} from 'ionicons/icons';

import { FondoVisualComponent } from '../components/fondo-visual/fondo-visual.component';
import { EcoSmartLogoComponent } from '../components/eco-smart-logo/eco-smart-logo.component';
import { TarjetaMejoraComponent } from '../components/tarjeta-mejora/tarjeta-mejora.component';
import { OverlayConfirmacionComponent } from '../components/overlay-confirmacion/overlay-confirmacion.component';

@Component({
  selector: 'app-gremios',
  templateUrl: './gremios.page.html',
  styleUrls: ['./gremios.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon,
    FondoVisualComponent, EcoSmartLogoComponent, TarjetaMejoraComponent,
    OverlayConfirmacionComponent
  ]
})
export class GremiosPage implements ViewWillEnter, OnDestroy {
  // Servicios
  private supabaseSvc = inject(SupabaseService);
  public router = inject(Router);
  private platform = inject(Platform);
  private zone = inject(NgZone);

  // Estados Generales
  cargando = true;
  usuarioId: string | null = null;
  nombreUsuario = '';
  ecoTokens = 0;
  superoCurso = false;
  
  // Estado de Gremio
  gremio: any = null;
  miembros: any[] = [];
  miembroActual: any = null;
  enGremio = false;

  // Listado de Gremios en Explorador
  listaGremios: any[] = [];
  filtroNombre = '';

  // Formulario Creación de Gremio
  nuevoNombre = '';
  nuevaDescripcion = '';
  nuevoIcono = 'leaf';
  iconosDisponibles = [
    { name: 'leaf', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', borderSelected: 'border-emerald-500' },
    { name: 'water', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', borderSelected: 'border-blue-500' },
    { name: 'bonfire', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', borderSelected: 'border-orange-500' },
    { name: 'planet', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40', borderSelected: 'border-purple-500' },
    { name: 'sunny', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', borderSelected: 'border-yellow-500' },
    { name: 'paw', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40', borderSelected: 'border-amber-500' },
    { name: 'trophy', color: 'text-amber-300', bg: 'bg-amber-300/10', border: 'border-amber-300/40', borderSelected: 'border-amber-300' },
    { name: 'school', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', borderSelected: 'border-cyan-500' },
    { name: 'sparkles', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/40', borderSelected: 'border-pink-500' },
    { name: 'infinite', color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/40', borderSelected: 'border-lime-500' },
    { name: 'map', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/40', borderSelected: 'border-rose-500' },
    { name: 'hammer', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', borderSelected: 'border-indigo-500' }
  ];
  mostrarFormularioCreacion = false;
  mostrarFormularioEdicion = false;
  mostrarExitoCreacion = false;
  mostrarExitoEdicion = false;
  editNombre = '';
  editDescripcion = '';
  editIcono = 'leaf';

  // Pestaña activa del Dashboard
  vistaActual: 'hub' | 'clicker' | 'competencia' | 'pregunta' | 'tienda' | 'estadisticas' = 'hub';

  // Configuración del Ciclo Competitivo
  competenciaActiva = false;
  tiempoRestante = '';
  diaResto = false; // Jueves (Reclutamiento/Rest)
  private timerInterval: any;

  // Lógica del Clicker Colectivo
  hojasColectivas = 0;
  mejorasColectivas: any = {
    fertilizante: 0, regadera: 0, ecosistema: 0, podaMaestra: 0,
    invernadero: 0, abono: 0, santuarios: 0, guantes: 0,
    potenciaEstelar: 0, abonoGalactico: 0, reservaNatural: 0,
    fotosintesis: 0, herramientasTitanio: 0, ecoPulso: 0
  };
  hojasAportadasHoy = 0;
  hojasClicsNuevos = 0;
  animacionArbol = false;
  hojasAnimadas: any[] = [];
  hojaIdCounter = 0;
  canalRealtime: any = null;

  // Paleta de colores permitidos (verdes diferenciables)
  paletaVerdes = [
    { hex: '#10b981', nombre: 'Verde Esmeralda' },
    { hex: '#84cc16', nombre: 'Verde Lima' },
    { hex: '#065f46', nombre: 'Verde Selva' },
    { hex: '#a7f3d0', nombre: 'Verde Menta' },
    { hex: '#047857', nombre: 'Verde Jade' }
  ];

  // Clasificaciones
  leaderboardGlobal: any[] = [];
  leaderboardInterno: any[] = [];

  // Lógica de Pregunta Diaria
  preguntaDiariaYaRespondida = false;
  preguntaDiaria: any = null;
  respuestasPregunta: string[] = [];
  preguntaCargando = false;
  respuestaSeleccionada: string | null = null;
  preguntaResultado: { correcta: boolean; mensaje: string } | null = null;
  tiempoRestantePregunta = '';

  // Upgrades
  readonly PRECIOS_BASE = {
    fertilizante: 30, regadera: 150, ecosistema: 2000, podaMaestra: 500,
    invernadero: 2500, abono: 3000, santuarios: 6000, guantes: 1500,
    potenciaEstelar: 5000, abonoGalactico: 15000, reservaNatural: 35000,
    fotosintesis: 7500, herramientasTitanio: 1200, ecoPulso: 10000
  };
  readonly FACTOR_CRECIMIENTO = 1.4;

  listaMejorasToque = [
    { id: 'fertilizante', nombre: 'Fertilizante', desc: 'Hojas extra por cada toque manual.', icono: 'flask-outline', color: '#10b981' },
    { id: 'podaMaestra', nombre: 'Poda maestra', desc: 'Aumenta la probabilidad de realizar críticos.', icono: 'cut-outline', color: '#eab308' },
    { id: 'herramientasTitanio', nombre: 'Herramientas de titanio', desc: 'Potencia cada toque.', icono: 'hammer-outline', color: '#94a3b8' },
    { id: 'guantes', nombre: 'Guantes', desc: 'Multiplicador directo al poder de toque.', icono: 'hand-right-outline', color: '#6366f1' },
    { id: 'abono', nombre: 'Nutrientes', desc: 'Aumenta el multiplicador de críticos.', icono: 'bonfire-outline', color: '#ef4444' },
    { id: 'potenciaEstelar', nombre: 'Potencia estelar', desc: 'Probabilidad de realizar supercríticos.', icono: 'sparkles-outline', color: '#c084fc' },
    { id: 'fotosintesis', nombre: 'Fotosíntesis', desc: 'Las H/S potencian cada toque.', icono: 'sunny-outline', color: '#fde047' },
    { id: 'abonoGalactico', nombre: 'Abono galáctico', desc: 'Aumenta la potencia de los supercríticos.', icono: 'infinite-outline', color: '#22d3ee' }
  ];

  listaMejorasPasivo = [
    { id: 'regadera', nombre: 'Regadera', desc: 'Genera hojas automáticamente.', icono: 'water-outline', color: '#3b82f6' },
    { id: 'ecosistema', nombre: 'Ecosistema', desc: 'Mejora la producción natural base de hojas.', icono: 'planet-outline', color: '#10b981' },
    { id: 'invernadero', nombre: 'Invernadero', desc: 'Bono multiplicador a toda tu producción de hojas.', icono: 'thermometer-outline', color: '#f97316' },
    { id: 'santuarios', nombre: 'Santuario', desc: 'Animales recolectores de alta eficiencia.', icono: 'paw-outline', color: '#ec4899' },
    { id: 'ecoPulso', nombre: 'Eco-Pulso', desc: 'Cada toque envía un impulso que acelera la producción pasiva.', icono: 'git-branch-outline', color: '#a855f7' },
    { id: 'reservaNatural', nombre: 'Reserva natural', desc: 'Zona de conservación masiva, produce aún mas hojas.', icono: 'map-outline', color: '#059669' }
  ];

  hojasPasivasAcumuladas = 0;
  private passiveInterval: any;
  private resumeSub: any;
  private pauseSub: any;
  private visibilityHandler: any;
  private lastForegroundTime = 0;
  
  // Variables para recolección Offline
  hojasGanadasOffline: number = 0;
  segundosOffline: number = 0;
  mostrarAvisoOffline: boolean = false;

  // Audios
  private audioCtx: AudioContext | null = null;
  private unloadHandler: any = null;

  constructor() {
    addIcons({
      'leaf-outline': leafOutline,
      'leaf': leaf,
      'flask-outline': flaskOutline,
      'sparkles-outline': sparklesOutline,
      'sparkles': sparklesOutline,
      'arrow-back-outline': arrowBackOutline,
      'water-outline': waterOutline,
      'water': waterOutline,
      'planet-outline': planetOutline,
      'planet': planetOutline,
      'cut-outline': cutOutline,
      'storefront-outline': storefrontOutline,
      'storefront': storefront,
      'close-outline': closeOutline,
      'thermometer-outline': thermometerOutline,
      'bonfire-outline': bonfireOutline,
      'bonfire': bonfireOutline,
      'paw-outline': pawOutline,
      'paw': pawOutline,
      'sunny-outline': sunnyOutline,
      'sunny': sunnyOutline,
      'time-outline': timeOutline,
      'stats-chart-outline': statsChartOutline,
      'stats-chart': statsChart,
      'hand-right-outline': handRightOutline,
      'infinite-outline': infiniteOutline,
      'infinite': infiniteOutline,
      'map-outline': mapOutline,
      'map': mapOutline,
      'hammer-outline': hammerOutline,
      'hammer': hammerOutline,
      'git-branch-outline': gitBranchOutline,
      'trophy-outline': trophyOutline,
      'trophy': trophy,
      'lock-closed-outline': lockClosedOutline,
      'school-outline': schoolOutline,
      'school': school,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'alert-circle-outline': alertCircleOutline,
      'create-outline': createOutline,
      'people-outline': peopleOutline,
      'people': people,
      'color-palette-outline': colorPaletteOutline,
      'log-out-outline': logOutOutline,
      'play-outline': playOutline,
      'person-outline': personOutline,
      'search-outline': searchOutline
    });
  }

  async ionViewWillEnter() {
    this.cargando = true;
    this.hojasAnimadas = [];
    this.preguntaResultado = null;
    this.respuestaSeleccionada = null;
    this.mostrarFormularioCreacion = false;
    this.mostrarFormularioEdicion = false;
    this.editNombre = '';
    this.editDescripcion = '';
    this.editIcono = 'leaf';
    this.hojasClicsNuevos = 0;
    this.filtroNombre = '';
    this.vistaActual = 'hub';

    try {
      const { data: { user } } = await this.supabaseSvc.obtenerUsuario();
      if (!user) {
        this.router.navigate(['/ingreso']);
        return;
      }
      this.usuarioId = user.id;

      // Registrar handler para recarga de página / cerrar pestaña
      if (this.unloadHandler) {
        window.removeEventListener('beforeunload', this.unloadHandler);
      }
      this.unloadHandler = () => {
        this.forzarSincronizacionInmediata();
      };
      window.addEventListener('beforeunload', this.unloadHandler);

      // Cargar Perfil para Nombre
      const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuarioId);
      this.nombreUsuario = perfil?.nombre || user.email?.split('@')[0] || 'Estudiante';
      this.ecoTokens = perfil?.eco_tokens || 0;

      // 1. Validar si superó al menos un curso
      const { data: certificados } = await this.supabaseSvc.cliente
        .from('certificados')
        .select('id')
        .eq('usuario_id', this.usuarioId)
        .limit(1);

      this.superoCurso = !!(certificados && certificados.length > 0);

      if (!this.superoCurso) {
        this.cargando = false;
        return;
      }

      // 2. Calcular Ciclo Competitivo
      this.calcularCiclo();

      // 3. Cargar estado de Gremio
      await this.cargarEstadoGremio();

      if (!this.enGremio) {
        // Cargar explorador si no está en un gremio
        await this.cargarExploradorGremios();
      } else {
        // Cargar pregunta diaria
        await this.verificarPreguntaDiaria();
        // Conectar canal Supabase Realtime
        this.conectarRealtime();
        // Cargar tablas de clasificación
        await this.cargarTablasClasificacion();
        // Cargar cualquier hoja pendiente de sincronización previa
        await this.cargarYForzarSincronizacionPendiente();
        // Iniciar producción pasiva cooperativa
        this.iniciarGeneracionPasivaGremio();
        // Procesar ganancias offline
        await this.procesarGananciasOfflineGremio();
        // Iniciar monitoreo de segundo plano / foreground
        this.iniciarMonitoreoSegundoPlano();
      }

    } catch (error) {
      console.error('Error al iniciar Gremios:', error);
    } finally {
      this.cargarAudioBase();
      this.cargando = false;
    }
  }

  cargarAudioBase() {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API no disponible.');
    }
  }

  ngOnDestroy() {
    this.desconectarRealtime();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.passiveInterval) clearInterval(this.passiveInterval);
    this.desactivarMonitoreoSegundoPlano();
    if (this.unloadHandler) {
      window.removeEventListener('beforeunload', this.unloadHandler);
    }
  }

  // ==========================================
  // LÓGICA DE CICLO COMPETITIVO (3 DÍAS)
  // ==========================================
  calcularCiclo() {
    const pad = (n: number) => String(n).padStart(2, '0');
    const calcular = () => {
      const ahora = new Date();
      const diaSemana = ahora.getDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves, ..., 6 = Sábado
      const horas = ahora.getHours();
      const minutos = ahora.getMinutes();
      const segundos = ahora.getSeconds();

      let proximoCambio = new Date(ahora);

      // Jueves es Día de Descanso/Reclutamiento
      if (diaSemana === 4) {
        this.competenciaActiva = false;
        this.diaResto = true;
        this.vistaActual = 'hub'; // Bloquear vista en clicker
        
        // Finaliza el Jueves a las 23:59:59 (inicia competencia el Viernes)
        proximoCambio.setHours(23, 59, 59, 999);
      } else {
        this.competenciaActiva = true;
        this.diaResto = false;

        if (diaSemana >= 1 && diaSemana <= 3) {
          // Lunes-Miércoles activa. Termina Miércoles 23:59:59
          const diasFaltantes = 3 - diaSemana;
          proximoCambio.setDate(ahora.getDate() + diasFaltantes);
          proximoCambio.setHours(23, 59, 59, 999);
        } else {
          // Viernes-Domingo activa (Viernes=5, Sábado=6, Domingo=0)
          let diasFaltantes = 0;
          if (diaSemana === 5) diasFaltantes = 2;
          else if (diaSemana === 6) diasFaltantes = 1;
          else if (diaSemana === 0) diasFaltantes = 0;

          proximoCambio.setDate(ahora.getDate() + diasFaltantes);
          proximoCambio.setHours(23, 59, 59, 999);
        }
      }

      const diffMs = proximoCambio.getTime() - ahora.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      this.tiempoRestante = `${pad(diffHrs)}h ${pad(diffMins)}m ${pad(diffSecs)}s`;

      // Calcular tiempo restante para el final del día actual (reinicio a medianoche)
      const medianoche = new Date(ahora);
      medianoche.setHours(23, 59, 59, 999);
      const diffPreguntaMs = medianoche.getTime() - ahora.getTime();

      const diffPregHrs = Math.floor(diffPreguntaMs / (1000 * 60 * 60));
      const diffPregMins = Math.floor((diffPreguntaMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffPregSecs = Math.floor((diffPreguntaMs % (1000 * 60)) / 1000);

      this.tiempoRestantePregunta = `${pad(diffPregHrs)}h ${pad(diffPregMins)}m ${pad(diffPregSecs)}s`;
    };

    calcular();
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(calcular, 1000);
  }

  // ==========================================
  // OPERACIONES CON GREMIOS (SOPORTE DB)
  // ==========================================
  async cargarEstadoGremio() {
    if (!this.usuarioId) return;

    // Buscar si el usuario pertenece a un gremio
    const { data: miembroData, error } = await this.supabaseSvc.cliente
      .from('gremio_miembros')
      .select('*, gremios(*)')
      .eq('usuario_id', this.usuarioId)
      .maybeSingle();

    if (miembroData) {
      this.enGremio = true;
      this.miembroActual = miembroData;
      this.gremio = miembroData.gremios;

      // Cargar lista de todos los miembros del gremio
      const { data: todosMiembros } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .select('*, profiles(nombre)')
        .eq('gremio_id', this.gremio.id)
        .order('joined_at', { ascending: true });

      this.miembros = todosMiembros || [];
      this.hojasColectivas = Number(this.gremio.hojas_globales || 0);
      this.mejorasColectivas = this.gremio.mejoras || this.mejorasColectivas;

      // Inicializar recolección offline local si no existe
      const key = `gremio_ultima_recoleccion_${this.gremio.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, new Date().toISOString());
      }
    } else {
      this.enGremio = false;
      this.gremio = null;
      this.miembros = [];
    }
  }

  async cargarExploradorGremios() {
    const { data } = await this.supabaseSvc.cliente
      .from('gremios')
      .select('*, gremio_miembros(count)');

    this.listaGremios = data?.map((g: any) => ({
      ...g,
      miembrosCount: g['gremio_miembros']?.[0]?.['count'] || 0
    })) || [];
  }

  async crearGremio() {
    if (!this.usuarioId) return;

    const nombreLargo = this.nuevoNombre.trim();
    const descLarga = this.nuevaDescripcion.trim();

    if (nombreLargo.length < 5 || nombreLargo.length > 50) {
      alert('El nombre del gremio debe tener entre 5 y 50 caracteres.');
      return;
    }
    if (descLarga.length < 20 || descLarga.length > 200) {
      alert('El manifiesto ecológico debe tener entre 20 y 200 caracteres.');
      return;
    }

    try {
      this.cargando = true;
      const { data: nuevoG, error: errG } = await this.supabaseSvc.cliente
        .from('gremios')
        .insert({
          nombre: this.nuevoNombre.trim(),
          descripcion: this.nuevaDescripcion.trim(),
          icono: this.nuevoIcono,
          creador_id: this.usuarioId
        })
        .select()
        .single();

      if (errG) throw errG;

      // Unir al creador como Líder
      const { error: errM } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .insert({
          usuario_id: this.usuarioId,
          gremio_id: nuevoG.id,
          rol: 'lider',
          color_hoja: '#10b981' // Verde esmeralda inicial
        });

      if (errM) throw errM;

      this.mostrarFormularioCreacion = false;
      this.nuevoNombre = '';
      this.nuevaDescripcion = '';
      this.mostrarExitoCreacion = true;
      setTimeout(() => this.mostrarExitoCreacion = false, 1000);
      
      await this.cargarEstadoGremio();
      this.conectarRealtime();
      await this.cargarTablasClasificacion();
    } catch (e: any) {
      alert(e.message || 'Error al crear el gremio. Intenta con otro nombre.');
    } finally {
      this.cargando = false;
    }
  }

  async unirseAGremio(gremioId: string) {
    if (!this.usuarioId) return;

    let advertencia24h = false;
    if (this.competenciaActiva) {
      const ahora = new Date();
      const diaSemana = ahora.getDay();
      let proximoCambio = new Date(ahora);
      if (diaSemana >= 1 && diaSemana <= 3) {
        const diasFaltantes = 3 - diaSemana;
        proximoCambio.setDate(ahora.getDate() + diasFaltantes);
        proximoCambio.setHours(23, 59, 59, 999);
      } else {
        let diasFaltantes = 0;
        if (diaSemana === 5) diasFaltantes = 2;
        else if (diaSemana === 6) diasFaltantes = 1;
        else if (diaSemana === 0) diasFaltantes = 0;
        proximoCambio.setDate(ahora.getDate() + diasFaltantes);
        proximoCambio.setHours(23, 59, 59, 999);
      }
      const diffMs = proximoCambio.getTime() - ahora.getTime();
      if (diffMs < 24 * 60 * 60 * 1000) {
        advertencia24h = true;
      }
    }

    if (advertencia24h) {
      const confirmar = confirm('Advertencia: Te estás uniendo a un gremio faltando menos de 24 horas para finalizar la competencia actual. No recibirás recompensas de esta competencia, sino hasta la siguiente. ¿Deseas continuar?');
      if (!confirmar) return;
    }

    try {
      this.cargando = true;

      // Buscar qué color de verde está disponible
      const { data: miembrosActivos } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .select('color_hoja')
        .eq('gremio_id', gremioId);

      const coloresOcupados = miembrosActivos?.map(m => m.color_hoja) || [];
      const colorDisponible = this.paletaVerdes.find(c => !coloresOcupados.includes(c.hex))?.hex || '#10b981';

      const { error } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .insert({
          usuario_id: this.usuarioId,
          gremio_id: gremioId,
          rol: 'miembro',
          color_hoja: colorDisponible
        });

      if (error) throw error;

      await this.cargarEstadoGremio();
      this.conectarRealtime();
      await this.cargarTablasClasificacion();
    } catch (e: any) {
      alert(e.message || 'No pudiste unirte al gremio. Es posible que esté lleno.');
    } finally {
      this.cargando = false;
    }
  }

  async abandonarGremio() {
    if (!this.usuarioId || !this.miembroActual) return;

    if (this.diaResto === false) {
      alert('No puedes abandonar el gremio mientras hay una competencia activa. Espera al jueves.');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que quieres abandonar tu gremio actual?');
    if (!confirmar) return;

    try {
      this.cargando = true;
      this.desconectarRealtime();
      if (this.passiveInterval) clearInterval(this.passiveInterval);

      const { error } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .delete()
        .eq('usuario_id', this.usuarioId);

      if (error) throw error;

      // Resetear estados locales
      this.enGremio = false;
      this.gremio = null;
      this.miembros = [];
      this.miembroActual = null;

      await this.cargarExploradorGremios();
    } catch (e: any) {
      alert(e.message || 'Error al salir del gremio.');
    } finally {
      this.cargando = false;
    }
  }

  async cambiarColorHoja(colorHex: string) {
    if (!this.usuarioId || !this.miembroActual) return;

    try {
      const { error } = await this.supabaseSvc.cliente
        .from('gremio_miembros')
        .update({ color_hoja: colorHex })
        .eq('usuario_id', this.usuarioId);

      if (error) throw error;

      this.miembroActual.color_hoja = colorHex;
      
      const mHub = this.miembros.find(m => m.usuario_id === this.usuarioId);
      if (mHub) mHub.color_hoja = colorHex;

      const mLeader = this.leaderboardInterno.find(m => m.usuario_id === this.usuarioId);
      if (mLeader) mLeader.color_hoja = colorHex;
    } catch (e: any) {
      alert(e.message || 'Este color ya fue elegido por otro miembro de tu gremio.');
    }
  }

  // ==========================================
  // REALTIME SYNCHRONIZATION
  // ==========================================
  conectarRealtime() {
    if (!this.gremio) return;
    this.desconectarRealtime();

    const canalId = `gremio-${this.gremio.id}`;
    this.canalRealtime = this.supabaseSvc.cliente
      .channel(canalId)
      // Escuchar clics remotos via Broadcast
      .on('broadcast', { event: 'click-compartido' }, ({ payload }) => {
        this.recibirClickCompanero(payload);
      })
      // Escuchar cambios de mejoras o resets estacionales en la DB de nuestro gremio y del leaderboard global
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'gremios'
      }, (payload: any) => {
        const updatedGuild = payload.new || {};
        
        // 1. Si es nuestro gremio, actualizar
        if (this.gremio && updatedGuild.id === this.gremio.id) {
          this.hojasColectivas = Number(updatedGuild.hojas_globales || 0);
          this.mejorasColectivas = updatedGuild.mejoras || this.mejorasColectivas;
          
          this.gremio.hojas_competencia = updatedGuild.hojas_competencia;
          this.gremio.hojas_globales = updatedGuild.hojas_globales;
          this.gremio.mejoras = updatedGuild.mejoras;
        }

        // 2. Si está en el leaderboardGlobal, actualizar y reordenar
        const guildL = this.leaderboardGlobal.find(g => g.id === updatedGuild.id);
        if (guildL) {
          guildL.hojas_competencia = updatedGuild.hojas_competencia;
          guildL.hojas_globales = updatedGuild.hojas_globales;
          this.leaderboardGlobal.sort((a, b) => (b.hojas_competencia || 0) - (a.hojas_competencia || 0));
        }
      })
      // Escuchar cambios en miembros del gremio (aportes de otros miembros)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'gremio_miembros',
        filter: `gremio_id=eq.${this.gremio.id}`
      }, (payload: any) => {
        const updated = payload.new || {};
        
        // 1. Actualizar en la lista local de miembros (hub)
        const miembro = this.miembros.find(m => m.usuario_id === updated.usuario_id);
        if (miembro) {
          miembro.hojas_aportadas = updated.hojas_aportadas;
          miembro.color_hoja = updated.color_hoja;
          miembro.rol = updated.rol;
        }

        // 2. Si es el usuario actual, actualizar miembroActual
        if (updated.usuario_id === this.usuarioId) {
          if (this.miembroActual) {
            this.miembroActual.hojas_aportadas = updated.hojas_aportadas;
            this.miembroActual.color_hoja = updated.color_hoja;
            this.miembroActual.rol = updated.rol;
          }
        }

        // 3. Actualizar en leaderboardInterno y reordenar
        const miembroL = this.leaderboardInterno.find(m => m.usuario_id === updated.usuario_id);
        if (miembroL) {
          miembroL.hojas_aportadas = updated.hojas_aportadas;
          miembroL.color_hoja = updated.color_hoja;
          miembroL.rol = updated.rol;
          this.leaderboardInterno.sort((a, b) => (b.hojas_aportadas || 0) - (a.hojas_aportadas || 0));
        }
      })
      .subscribe();
  }

  desconectarRealtime() {
    if (this.canalRealtime) {
      this.supabaseSvc.cliente.removeChannel(this.canalRealtime);
      this.canalRealtime = null;
    }
  }

  // ==========================================
  // LÓGICA DEL CLICKER COOPERATIVO
  // ==========================================
  hacerClickArbol(event: any) {
    if (this.diaResto) return; // Bloqueado en jueves
    if (this.animacionArbol) return;

    this.reproducirSonidoHojas();

    this.animacionArbol = true;
    setTimeout(() => this.animacionArbol = false, 100);

    // Calcular el poder de toque con críticos
    const { incremento, esCritico, esSuperCritico } = this.obtenerValorToqueReal();

    // Actualizar hojas colectivas localmente
    this.hojasColectivas += incremento;
    this.hojasAportadasHoy += incremento;
    this.hojasClicsNuevos += incremento;
    this.guardarPendientesLocalStorage();

    // Actualizaciones optimistas en tiempo real
    if (this.gremio) {
      this.gremio.hojas_competencia = (this.gremio.hojas_competencia || 0) + incremento;
      this.gremio.hojas_globales = (this.gremio.hojas_globales || 0) + incremento;
    }
    if (this.miembroActual) {
      this.miembroActual.hojas_aportadas = (this.miembroActual.hojas_aportadas || 0) + incremento;
    }
    const localMember = this.miembros.find(m => m.usuario_id === this.usuarioId);
    if (localMember) {
      localMember.hojas_aportadas = (localMember.hojas_aportadas || 0) + incremento;
    }

    // Actualización optimista de leaderboards
    const internalMember = this.leaderboardInterno.find(m => m.usuario_id === this.usuarioId);
    if (internalMember) {
      internalMember.hojas_aportadas = (internalMember.hojas_aportadas || 0) + incremento;
      this.leaderboardInterno.sort((a, b) => (b.hojas_aportadas || 0) - (a.hojas_aportadas || 0));
    }
    const globalGuild = this.leaderboardGlobal.find(g => g.id === this.gremio?.id);
    if (globalGuild) {
      globalGuild.hojas_competencia = (globalGuild.hojas_competencia || 0) + incremento;
      this.leaderboardGlobal.sort((a, b) => (b.hojas_competencia || 0) - (a.hojas_competencia || 0));
    }

    // Generar partículas locales
    const x = event?.clientX || window.innerWidth / 2;
    const y = event?.clientY || window.innerHeight / 2;
    this.generarHojaFlotante(x, y, incremento, this.miembroActual?.color_hoja || '#10b981', this.nombreUsuario, esCritico, esSuperCritico);

    // Enviar click por broadcast a los compañeros
    if (this.canalRealtime) {
      this.canalRealtime.send({
        type: 'broadcast',
        event: 'click-compartido',
        payload: {
          usuario: this.nombreUsuario,
          color: this.miembroActual?.color_hoja || '#10b981',
          incremento,
          x,
          y,
          esCritico,
          esSuperCritico
        }
      });
    }

    // Persistir throttled en Supabase
    this.sincronizarHojasColectivas(incremento);
  }

  recibirClickCompanero(payload: any) {
    // Aumentar hojas colectivas en la UI
    this.hojasColectivas += payload.incremento;

    // Actualizaciones optimistas en tiempo real para compañeros
    if (this.gremio) {
      this.gremio.hojas_competencia = (this.gremio.hojas_competencia || 0) + payload.incremento;
    }
    if (payload.color) {
      const compañero = this.miembros.find(m => m.color_hoja === payload.color);
      if (compañero) {
        compañero.hojas_aportadas = (compañero.hojas_aportadas || 0) + payload.incremento;
      }
      const compañeroLeader = this.leaderboardInterno.find(m => m.color_hoja === payload.color);
      if (compañeroLeader) {
        compañeroLeader.hojas_aportadas = (compañeroLeader.hojas_aportadas || 0) + payload.incremento;
        this.leaderboardInterno.sort((a, b) => (b.hojas_aportadas || 0) - (a.hojas_aportadas || 0));
      }
    }
    const globalGuild = this.leaderboardGlobal.find(g => g.id === this.gremio?.id);
    if (globalGuild) {
      globalGuild.hojas_competencia = (globalGuild.hojas_competencia || 0) + payload.incremento;
      this.leaderboardGlobal.sort((a, b) => (b.hojas_competencia || 0) - (a.hojas_competencia || 0));
    }
    
    // Generar hojas flotantes de compañeros en pantalla
    this.generarHojaFlotante(payload.x, payload.y, payload.incremento, payload.color, payload.usuario, payload.esCritico, payload.esSuperCritico);
  }

  generarHojaFlotante(x: number, y: number, valor: number, color: string, usuario: string, esCritico: boolean = false, esSuperCritico: boolean = false) {
    const id = this.hojaIdCounter++;
    this.hojasAnimadas.push({
      id,
      valor: `+${this.formatearNumero(Math.floor(valor))}`,
      color,
      usuario,
      esCritico,
      esSuperCritico,
      x: x + (Math.random() * 80 - 40),
      y: y + (Math.random() * 40 - 20),
      rotacion: Math.random() * 360,
      escala: (esSuperCritico ? 1.5 : 1) * (0.7 + Math.random() * 0.8),
      drift: Math.random() * 100 - 50,
      duracion: 1.5 + Math.random() * 1
    });

    setTimeout(() => {
      this.hojasAnimadas = this.hojasAnimadas.filter(h => h.id !== id);
    }, 2500);
  }

  guardarPendientesLocalStorage() {
    if (!this.usuarioId || !this.gremio) return;
    const key = `gremio_pendientes_${this.usuarioId}_${this.gremio.id}`;
    localStorage.setItem(key, JSON.stringify({
      hojasAportadasHoy: this.hojasAportadasHoy,
      hojasClicsNuevos: this.hojasClicsNuevos
    }));
  }

  limpiarPendientesLocalStorage() {
    if (!this.usuarioId || !this.gremio) return;
    const key = `gremio_pendientes_${this.usuarioId}_${this.gremio.id}`;
    localStorage.removeItem(key);
  }

  async cargarYForzarSincronizacionPendiente() {
    if (!this.usuarioId || !this.gremio) return;
    const key = `gremio_pendientes_${this.usuarioId}_${this.gremio.id}`;
    const pendientesStr = localStorage.getItem(key);
    if (pendientesStr) {
      try {
        const pendientes = JSON.parse(pendientesStr);
        const aportadas = Number(pendientes.hojasAportadasHoy || 0);
        const clics = Number(pendientes.hojasClicsNuevos || 0);
        if (aportadas > 0 || clics > 0) {
          this.hojasAportadasHoy += aportadas;
          this.hojasClicsNuevos += clics;
          await this.forzarSincronizacionInmediata();
        }
      } catch (e) {
        console.error('Error al cargar hojas pendientes:', e);
      } finally {
        localStorage.removeItem(key);
      }
    }
  }

  private syncTimeout: any;
  sincronizarHojasColectivas(incremento: number) {
    if (this.syncTimeout) return;

    this.syncTimeout = setTimeout(async () => {
      await this.forzarSincronizacionInmediata();
    }, 3000); // Sincroniza cada 3 segundos
  }

  async forzarSincronizacionInmediata() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    if (!this.gremio || !this.usuarioId) return;

    const totalAEnviar = Math.floor(this.hojasAportadasHoy);
    const clicsAEnviar = Math.floor(this.hojasClicsNuevos);

    if (totalAEnviar <= 0) {
      this.hojasAportadasHoy = 0;
      this.hojasClicsNuevos = 0;
      this.limpiarPendientesLocalStorage();
      return;
    }

    try {
      this.hojasAportadasHoy = 0;
      this.hojasClicsNuevos = 0;
      this.limpiarPendientesLocalStorage();

      const soloGremio = totalAEnviar - clicsAEnviar;

      // 1. Enviar los clics (suman a las hojas del gremio y a las hojas aportadas del usuario)
      if (clicsAEnviar > 0) {
        const { error: err1 } = await this.supabaseSvc.cliente.rpc('sumar_hojas_gremio', {
          gremio_id_param: this.gremio.id,
          usuario_id_param: this.usuarioId,
          hojas_param: clicsAEnviar
        });
        if (err1) throw err1;
      }

      // 2. Enviar la generación pasiva / offline (suman SOLO a las hojas del gremio)
      if (soloGremio > 0) {
        const { error: err2 } = await this.supabaseSvc.cliente.rpc('sumar_hojas_gremio', {
          gremio_id_param: this.gremio.id,
          usuario_id_param: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          hojas_param: soloGremio
        });
        if (err2) throw err2;
      }
    } catch (err) {
      console.error('Error al sincronizar hojas colectivas:', err);
      // Restauramos los valores no enviados para reintentar más tarde o al recargar
      this.hojasAportadasHoy += totalAEnviar;
      this.hojasClicsNuevos += clicsAEnviar;
      this.guardarPendientesLocalStorage();
    }
  }

  obtenerValorToqueReal(): { incremento: number, esCritico: boolean, esSuperCritico: boolean } {
    const podaMaestra = this.mejorasColectivas.podaMaestra || 0;
    const potenciaEstelar = this.mejorasColectivas.potenciaEstelar || 0;
    const abono = this.mejorasColectivas.abono || 0;
    const abonoGalactico = this.mejorasColectivas.abonoGalactico || 0;

    let incremento = this.obtenerValorToqueBase();
    let esCritico = false;
    let esSuperCritico = false;

    // Probabilidades (mismas que clicker.page.ts)
    const chanceNormal = 0.01 + (podaMaestra * 0.01);
    const chanceSuper = potenciaEstelar * 0.001;
    const multiNormal = 2 + (abono * 0.2);
    const multiSuper = 2 + (abonoGalactico * 0.05);

    if (Math.random() < chanceNormal) {
      esCritico = true;
      if (Math.random() < chanceSuper) {
        incremento *= (multiNormal * multiSuper);
        esSuperCritico = true;
      } else {
        incremento *= multiNormal;
      }
    }

    return { incremento: Math.floor(incremento), esCritico, esSuperCritico };
  }

  // ==========================================
  // LEADERBOARDS & CLASIFICACIÓN DUAL
  // ==========================================
  async cargarTablasClasificacion() {
    try {
      // 1. Clasificación Global (Gremios ordenados por hojas_competencia)
      const { data: globalData } = await this.supabaseSvc.cliente
        .from('gremios')
        .select('*, gremio_miembros(count)')
        .order('hojas_competencia', { ascending: false })
        .limit(10);

      this.leaderboardGlobal = globalData?.map((g: any) => ({
        ...g,
        miembrosCount: g['gremio_miembros']?.[0]?.['count'] || 0
      })) || [];

      // 2. Clasificación Interna (Miembros del gremio ordenados por hojas_aportadas)
      if (this.gremio) {
        const { data: internoData } = await this.supabaseSvc.cliente
          .from('gremio_miembros')
          .select('*, profiles(nombre)')
          .eq('gremio_id', this.gremio.id)
          .order('hojas_aportadas', { ascending: false });

        this.leaderboardInterno = internoData || [];
      }
    } catch (e) {
      console.error('Error al cargar clasificaciones:', e);
    }
  }

  // ==========================================
  // PREGUNTA DIARIA (ECOTOKENS)
  // ==========================================
  async verificarPreguntaDiaria() {
    if (!this.usuarioId) return;

    const fechaHoy = new Date().toISOString().split('T')[0];
    const { data } = await this.supabaseSvc.cliente
      .from('gremio_pregunta_diaria')
      .select('*')
      .eq('usuario_id', this.usuarioId)
      .eq('fecha', fechaHoy)
      .maybeSingle();

    this.preguntaDiariaYaRespondida = !!data;
    if (!this.preguntaDiariaYaRespondida) {
      try {
        await this.supabaseSvc.cliente
          .from('gremio_pregunta_diaria')
          .delete()
          .eq('usuario_id', this.usuarioId)
          .neq('fecha', fechaHoy);
      } catch (err) {
        console.error('Error al borrar registros antiguos de pregunta diaria:', err);
      }
      await this.cargarPreguntaDiaria();
    }
  }

  async cargarPreguntaDiaria() {
    if (!this.usuarioId || this.preguntaDiariaYaRespondida) return;
    this.preguntaCargando = true;
    this.preguntaResultado = null;

    try {
      // 1. Obtener los IDs de los cursos que el usuario ha superado
      const { data: certificados } = await this.supabaseSvc.cliente
        .from('certificados')
        .select('curso_id')
        .eq('usuario_id', this.usuarioId);

      const cursoIds = certificados?.map(c => c.curso_id) || [];

      if (cursoIds.length === 0) {
        await this.cargarPreguntaDiariaFallback();
        return;
      }

      // 2. Obtener módulos de esos cursos
      const { data: modulos } = await this.supabaseSvc.cliente
        .from('modulos')
        .select('id')
        .in('curso_id', cursoIds);

      const moduloIds = modulos?.map(m => m.id) || [];

      if (moduloIds.length === 0) {
        await this.cargarPreguntaDiariaFallback();
        return;
      }

      // 3. Obtener exámenes de esos módulos
      const { data: examenes } = await this.supabaseSvc.cliente
        .from('examenes')
        .select('id')
        .in('modulo_id', moduloIds);

      const examenIds = examenes?.map(e => e.id) || [];

      if (examenIds.length === 0) {
        await this.cargarPreguntaDiariaFallback();
        return;
      }

      // 4. Obtener preguntas de esos exámenes
      const { data: preguntas } = await this.supabaseSvc.cliente
        .from('preguntas')
        .select('*')
        .in('examen_id', examenIds);

      if (preguntas && preguntas.length > 0) {
        // Elegir una pregunta aleatoriamente
        const index = Math.floor(Math.random() * preguntas.length);
        this.preguntaDiaria = preguntas[index];

        // Construir opciones de respuesta desde el array de la BD y barajarlas
        const todas = [...(this.preguntaDiaria.opciones || [])];
        
        // Mezclar aleatoriamente
        this.respuestasPregunta = todas.sort(() => Math.random() - 0.5);
      } else {
        await this.cargarPreguntaDiariaFallback();
      }
    } catch (e) {
      console.error('Error cargando pregunta diaria:', e);
      await this.cargarPreguntaDiariaFallback();
    } finally {
      this.preguntaCargando = false;
    }
  }

  async responderPreguntaDiaria(opcion: string) {
    if (!this.usuarioId || !this.preguntaDiaria || this.preguntaDiariaYaRespondida) return;
    this.respuestaSeleccionada = opcion;

    const correctIndex = this.preguntaDiaria.respuesta_correcta;
    const correctText = this.preguntaDiaria.opciones?.[correctIndex] || '';
    const esCorrecta = opcion === correctText;
    const fechaHoy = new Date().toISOString().split('T')[0];

    try {
      this.preguntaCargando = true;

      // 1. Guardar respuesta en gremio_pregunta_diaria
      const { error: insertErr } = await this.supabaseSvc.cliente
        .from('gremio_pregunta_diaria')
        .insert({
          usuario_id: this.usuarioId,
          fecha: fechaHoy,
          correcta: esCorrecta,
          pregunta_id: this.preguntaDiaria.id
        });

      if (insertErr) throw insertErr;

      // 2. Si es correcta, premiar con EcoTokens en la tabla profiles
      if (esCorrecta) {
        // Cargar tokens actuales
        const { data: perfil } = await this.supabaseSvc.obtenerPerfil(this.usuarioId);
        const tokensActuales = perfil?.eco_tokens || 0;
        
        await this.supabaseSvc.actualizarPerfil(this.usuarioId, {
          eco_tokens: tokensActuales + 5 // Sumar 5 tokens
        });
        this.ecoTokens = tokensActuales + 5; // Actualizar localmente en tiempo real

        this.preguntaResultado = {
          correcta: true,
          mensaje: '¡Excelente respuesta! Has ganado +5 EcoTokens para tu cuenta.'
        };
      } else {
        this.preguntaResultado = {
          correcta: false,
          mensaje: `Incorrecto. La respuesta correcta era: "${correctText}". ¡Inténtalo mañana de nuevo!`
        };
      }

      this.preguntaDiariaYaRespondida = true;
    } catch (e) {
      console.error('Error al procesar respuesta diaria:', e);
    } finally {
      this.preguntaCargando = false;
    }
  }

  // ==========================================
  // GESTIÓN DE TIENDA Y MEJORAS COLECTIVAS
  // ==========================================
  calcularPrecioMejora(tipo: string): number {
    const nivel = this.mejorasColectivas[tipo] || 0;
    const base = (this.PRECIOS_BASE as any)[tipo];
    return Math.floor(base * Math.pow(this.FACTOR_CRECIMIENTO, nivel));
  }

  async comprarMejoraColectiva(tipo: string) {
    if (!this.gremio || this.diaResto) return;

    const precio = this.calcularPrecioMejora(tipo);
    if (this.hojasColectivas >= precio) {
      // Respaldar estados previos para rollback en caso de fallo de red
      const hojasAnteriores = this.hojasColectivas;
      const mejorasAnteriores = { ...this.mejorasColectivas };

      // Actualización optimista instantánea (0ms de retraso visual)
      const nuevasMejoras = { ...this.mejorasColectivas };
      nuevasMejoras[tipo] = (nuevasMejoras[tipo] || 0) + 1;

      this.hojasColectivas -= precio;
      this.mejorasColectivas = nuevasMejoras;

      if (this.gremio) {
        this.gremio.mejoras = nuevasMejoras;
        this.gremio.hojas_globales = this.hojasColectivas;
      }

      try {
        // Guardar cambios en Supabase en segundo plano
        const { error } = await this.supabaseSvc.cliente
          .from('gremios')
          .update({
            hojas_globales: Math.floor(hojasAnteriores - precio),
            mejoras: nuevasMejoras
          })
          .eq('id', this.gremio.id);

        if (error) throw error;
      } catch (err) {
        console.error('Error al comprar mejora colectiva (Reversando actualización optimista):', err);
        
        // ROLLBACK: Revertir al estado anterior en caso de fallo de conexión
        this.hojasColectivas = hojasAnteriores;
        this.mejorasColectivas = mejorasAnteriores;
        if (this.gremio) {
          this.gremio.mejoras = mejorasAnteriores;
          this.gremio.hojas_globales = hojasAnteriores;
        }
        alert('Hubo un problema de conexión al comprar la mejora. Tu saldo ha sido restaurado.');
      }
    } else {
      alert('No tienes suficientes hojas en el pozo del gremio para comprar esta mejora.');
    }
  }

  obtenerTextoMejora(id: string): string {
    switch (id) {
      case 'fertilizante': return 'Hojas extra por toque';
      case 'regadera': return 'Generación pasiva constante';
      case 'ecosistema': return 'Producción natural base';
      case 'invernadero': return 'Multiplicador pasivo total';
      case 'guantes': return 'Multiplicador directo al clic';
      case 'herramientasTitanio': return 'Potente bono por toque';
      default: return 'Mejora ecológica';
    }
  }

  obtenerMiembroPorColor(colorHex: string) {
    return this.miembros.find(m => m.color_hoja === colorHex);
  }

  formatearNumero(num: number): string {
    if (num < 1000) return Math.floor(num).toString();

    const unidades = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    const orden = Math.floor(Math.log10(Math.abs(num)) / 3);
    const unidad = unidades[orden] || '??';
    const valorReducido = num / Math.pow(10, orden * 3);

    return valorReducido.toFixed(valorReducido >= 100 ? 0 : 1) + unidad;
  }

  calcularLPSColectivo(): number {
    const fertilizante = this.mejorasColectivas.fertilizante || 0;
    const regadera = this.mejorasColectivas.regadera || 0;
    const ecosistema = this.mejorasColectivas.ecosistema || 0;
    const podaMaestra = this.mejorasColectivas.podaMaestra || 0;
    const invernadero = this.mejorasColectivas.invernadero || 0;
    const abono = this.mejorasColectivas.abono || 0;
    const santuarios = this.mejorasColectivas.santuarios || 0;
    const guantes = this.mejorasColectivas.guantes || 0;
    const potenciaEstelar = this.mejorasColectivas.potenciaEstelar || 0;
    const abonoGalactico = this.mejorasColectivas.abonoGalactico || 0;
    const reservaNatural = this.mejorasColectivas.reservaNatural || 0;
    const fotosintesis = this.mejorasColectivas.fotosintesis || 0;
    const herramientasTitanio = this.mejorasColectivas.herramientasTitanio || 0;
    const ecoPulso = this.mejorasColectivas.ecoPulso || 0;

    const baseToque = 1 + (fertilizante * 3) + (herramientasTitanio * 20);
    const basePasivo = (regadera * 5) + (ecosistema * 20) + (santuarios * 50) + (reservaNatural * 200);
    
    const multiG = 1 + (guantes * 0.05);
    const multiI = 1 + (invernadero * 0.10);

    const kF = fotosintesis * 0.05;
    const kM = ecoPulso * 0.02;

    const toquePotenciado = (baseToque + (kF * basePasivo)) * multiG;
    return (basePasivo + (kM * toquePotenciado)) * multiI;
  }

  iniciarGeneracionPasivaGremio() {
    if (this.passiveInterval) clearInterval(this.passiveInterval);
    this.passiveInterval = setInterval(() => {
      if (this.diaResto || !this.enGremio || !this.gremio) return;
      let lps = this.calcularLPSColectivo();
      if (lps <= 0) return;

      const podaMaestra = this.mejorasColectivas.podaMaestra || 0;
      const potenciaEstelar = this.mejorasColectivas.potenciaEstelar || 0;
      const abono = this.mejorasColectivas.abono || 0;
      const abonoGalactico = this.mejorasColectivas.abonoGalactico || 0;

      const chanceNormal = 0.01 + (podaMaestra * 0.01);
      const chanceSuper = potenciaEstelar * 0.001;
      const multiNormal = 2 + (abono * 0.2);
      const multiSuper = 2 + (abonoGalactico * 0.05);

      let esCritico = false;
      let esSuperCritico = false;

      if (Math.random() < chanceNormal) {
        esCritico = true;
        if (Math.random() < chanceSuper) {
          lps *= (multiNormal * multiSuper);
          esSuperCritico = true;
        } else {
          lps *= multiNormal;
        }
      }

      const increment = lps;
      this.hojasColectivas += increment;
      this.hojasAportadasHoy += increment;
      this.guardarPendientesLocalStorage();

      // Actualizaciones optimistas de generación pasiva
      if (this.gremio) {
        this.gremio.hojas_competencia = (this.gremio.hojas_competencia || 0) + increment;
        this.gremio.hojas_globales = (this.gremio.hojas_globales || 0) + increment;
      }

      // Mostrar visualmente la hoja pasiva
      if (this.vistaActual === 'clicker') {
        const arbolElement = document.querySelector('.contenedor-arbol-juego');
        let xBase = window.innerWidth / 2;
        let yBase = window.innerHeight / 2;
        if (arbolElement) {
          const rect = arbolElement.getBoundingClientRect();
          xBase = rect.left + rect.width / 2;
          yBase = rect.top + rect.height / 3;
        }
        this.generarHojaFlotante(xBase, yBase, increment, this.miembroActual?.color_hoja || '#10b981', this.nombreUsuario, esCritico, esSuperCritico);
      }

      // Guardar última recolección localmente para tracking offline
      localStorage.setItem(`gremio_ultima_recoleccion_${this.gremio.id}`, new Date().toISOString());

      this.sincronizarHojasColectivas(0);
    }, 1000);
  }

  async procesarGananciasOfflineGremio() {
    if (!this.gremio || !this.enGremio || this.diaResto) return;
    
    const key = `gremio_ultima_recoleccion_${this.gremio.id}`;
    const ultimaStr = localStorage.getItem(key);
    
    // Al abrir, actualizamos para que no se duplique al recargar rápido
    localStorage.setItem(key, new Date().toISOString());

    if (!ultimaStr) return;

    const ultima = new Date(ultimaStr).getTime();
    const ahora = new Date().getTime();
    const segundosTranscurridos = Math.floor((ahora - ultima) / 1000);

    // Solo mostrar aviso si pasaron más de 5 segundos de inactividad
    if (segundosTranscurridos > 5) { 
      const lps = this.calcularLPSColectivo();
      if (lps <= 0) return;

      const podaMaestra = this.mejorasColectivas.podaMaestra || 0;
      const potenciaEstelar = this.mejorasColectivas.potenciaEstelar || 0;
      const abono = this.mejorasColectivas.abono || 0;
      const abonoGalactico = this.mejorasColectivas.abonoGalactico || 0;

      const chanceNormal = 0.01 + (podaMaestra * 0.01);
      const chanceSuper = potenciaEstelar * 0.001;
      const multiNormal = 2 + (abono * 0.2);
      const multiSuper = 2 + (abonoGalactico * 0.05);

      const factorPromedio = 1 + chanceNormal * ((multiNormal - 1) + chanceSuper * multiNormal * (multiSuper - 1));
      const ganadas = segundosTranscurridos * lps * factorPromedio;

      if (ganadas > 0) {
        this.hojasGanadasOffline = Math.floor(ganadas);
        this.segundosOffline = segundosTranscurridos;
        
        this.hojasColectivas += this.hojasGanadasOffline;
        this.hojasAportadasHoy += this.hojasGanadasOffline;
        this.guardarPendientesLocalStorage();

        if (this.gremio) {
          this.gremio.hojas_competencia = (this.gremio.hojas_competencia || 0) + this.hojasGanadasOffline;
        }


        this.mostrarAvisoOffline = true;
        this.sincronizarHojasColectivas(0); // Guardar en base de datos al instante
      }
    }
  }

  cerrarAvisoOffline() {
    this.mostrarAvisoOffline = false;
  }

  formatearTiempo(segundos: number): string {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos}m ${segundos % 60}s`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h ${minutos % 60}m`;
    const dias = Math.floor(horas / 24);
    return `${dias}d ${horas % 24}h`;
  }

  obtenerEfectoTextoColectiva(id: string): string {
    switch (id) {
      case 'fertilizante': return `+3 Hojas/Toque`;
      case 'podaMaestra': return `+1% Prob. Crit`;
      case 'herramientasTitanio': return `+20 Hojas/Toque`;
      case 'guantes': return `+5% Poder Clic`;
      case 'abono': return `+x0.2 Daño Crit`;
      case 'potenciaEstelar': return `+0.1% Prob. Super`;
      case 'fotosintesis': return `+5% Bonus Toque`;
      case 'abonoGalactico': return `+x0.05 Multi. Super`;
      case 'regadera': return `+5 Hojas/Seg`;
      case 'ecosistema': return `+20 Hojas/Seg`;
      case 'invernadero': return `+10% Prod. Total`;
      case 'santuarios': return `+50 Hojas/Seg`;
      case 'ecoPulso': return `+2% Toque a H/S`;
      case 'reservaNatural': return `+200 Hojas/Seg`;
      default: return '';
    }
  }

  async cargarPreguntaDiariaFallback() {
    try {
      const { data: fallbackPreguntas } = await this.supabaseSvc.cliente
        .from('preguntas')
        .select('*')
        .limit(50);

      if (fallbackPreguntas && fallbackPreguntas.length > 0) {
        const index = Math.floor(Math.random() * fallbackPreguntas.length);
        this.preguntaDiaria = fallbackPreguntas[index];

        const todas = [...(this.preguntaDiaria.opciones || [])];
        this.respuestasPregunta = todas.sort(() => Math.random() - 0.5);
      } else {
        this.preguntaDiaria = null;
      }
    } catch (e) {
      console.error('Error cargando pregunta diaria fallback:', e);
      this.preguntaDiaria = null;
    } finally {
      this.preguntaCargando = false;
    }
  }

  // ==========================================
  // NAVEGACIÓN
  // ==========================================
  async cambiarVista(vista: 'hub' | 'clicker' | 'competencia' | 'pregunta' | 'tienda' | 'estadisticas') {
    if ((vista === 'clicker' || vista === 'tienda') && this.diaResto) {
      alert('Esta sección cooperativa está cerrada los jueves de descanso/reclutamiento.');
      return;
    }

    // Si salimos del clicker o entramos a clasificaciones/estadísticas/hub, sincronizamos primero
    if (this.vistaActual === 'clicker' || vista === 'competencia' || vista === 'estadisticas' || vista === 'hub') {
      await this.forzarSincronizacionInmediata();
    }

    this.vistaActual = vista;
    
    if (vista === 'competencia') {
      await this.cargarTablasClasificacion();
    }

    if (vista === 'hub') {
      await this.cargarEstadoGremio();
    }
    
    // Al entrar al árbol cooperativo calculamos sus ganancias offline
    if (vista === 'clicker') {
      this.procesarGananciasOfflineGremio();
    }
  }

  cambiarVistaSegmento(event: any) {
    const vista = event.detail.value;
    this.cambiarVista(vista);
  }

  get listaGremiosFiltrada() {
    if (!this.filtroNombre.trim()) return this.listaGremios;
    return this.listaGremios.filter(g => g.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()));
  }

  obtenerNombreColor(hex: string | null | undefined): string {
    if (!hex) return 'Personalizado';
    const c = this.paletaVerdes.find(item => item.hex === hex);
    return c ? c.nombre : 'Personalizado';
  }

  obtenerConfigIcono(iconName: string) {
    return this.iconosDisponibles.find(i => i.name === iconName) || this.iconosDisponibles[0];
  }

  volverAlPanel() {
    this.router.navigate(['/dashboard-estudiante']);
  }

  // ==========================================
  // ESTADÍSTICAS MATEMÁTICAS
  // ==========================================
  obtenerValorToqueBase(): number {
    const fertilizante = this.mejorasColectivas?.fertilizante || 0;
    const guantes = this.mejorasColectivas?.guantes || 0;
    const titanio = this.mejorasColectivas?.herramientasTitanio || 0;
    const regadera = this.mejorasColectivas?.regadera || 0;
    const ecosistema = this.mejorasColectivas?.ecosistema || 0;
    const santuarios = this.mejorasColectivas?.santuarios || 0;
    const reservaNatural = this.mejorasColectivas?.reservaNatural || 0;
    const invernadero = this.mejorasColectivas?.invernadero || 0;
    const fotosintesis = this.mejorasColectivas?.fotosintesis || 0;
    const ecoPulso = this.mejorasColectivas?.ecoPulso || 0;

    const baseToque = 1 + (fertilizante * 3) + (titanio * 20);
    const basePasivo = (regadera * 5) + (ecosistema * 20) + (santuarios * 50) + (reservaNatural * 200);

    const multiG = 1 + (guantes * 0.05);
    const multiI = 1 + (invernadero * 0.10);

    const kF = fotosintesis * 0.05;
    const kM = ecoPulso * 0.02;

    const pasivoPotenciado = (basePasivo + (kM * baseToque)) * multiI;
    return (baseToque + (kF * pasivoPotenciado)) * multiG;
  }

  obtenerChanceCritico(): number {
    const podaMaestra = this.mejorasColectivas?.podaMaestra || 0;
    return (0.01 + (podaMaestra * 0.01)) * 100;
  }

  obtenerMultiplicadorCritico(): number {
    const abono = this.mejorasColectivas?.abono || 0;
    return 2 + (abono * 0.2);
  }

  obtenerChanceSuperCritico(): number {
    const potenciaEstelar = this.mejorasColectivas?.potenciaEstelar || 0;
    return (potenciaEstelar * 0.001) * 100;
  }

  obtenerMultiplicadorSuperCritico(): number {
    const abonoGalactico = this.mejorasColectivas?.abonoGalactico || 0;
    return 2 + (abonoGalactico * 0.05);
  }

  obtenerTotalNiveles(): number {
    if (!this.mejorasColectivas) return 0;
    return Object.values(this.mejorasColectivas).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number;
  }

  // ==========================================
  // OPERACIONES DE EDICIÓN Y ELEGIBILIDAD
  // ==========================================
  abrirEditarGremio() {
    if (!this.gremio) return;
    this.editNombre = this.gremio.nombre;
    this.editDescripcion = this.gremio.descripcion || '';
    this.editIcono = this.gremio.icono || 'leaf';
    this.mostrarFormularioEdicion = true;
  }

  async guardarEdicionGremio() {
    if (!this.gremio || !this.usuarioId) return;

    const nombreLargo = this.editNombre.trim();
    const descLarga = this.editDescripcion.trim();

    if (nombreLargo.length < 5 || nombreLargo.length > 50) {
      alert('El nombre del gremio debe tener entre 5 y 50 caracteres.');
      return;
    }
    if (descLarga.length < 20 || descLarga.length > 200) {
      alert('El manifiesto ecológico debe tener entre 20 y 200 caracteres.');
      return;
    }

    try {
      this.cargando = true;
      const { error } = await this.supabaseSvc.cliente
        .from('gremios')
        .update({
          nombre: nombreLargo,
          descripcion: descLarga,
          icono: this.editIcono
        })
        .eq('id', this.gremio.id);

      if (error) throw error;

      this.gremio.nombre = nombreLargo;
      this.gremio.descripcion = descLarga;
      this.gremio.icono = this.editIcono;

      this.mostrarFormularioEdicion = false;
      this.mostrarExitoEdicion = true;
      setTimeout(() => this.mostrarExitoEdicion = false, 1000);
    } catch (e: any) {
      alert(e.message || 'Error al actualizar el gremio. Intenta con otro nombre.');
    } finally {
      this.cargando = false;
    }
  }

  esElegibleRecompensa(miembro: any): boolean {
    if (!miembro || !miembro.joined_at) return true;
    
    const joinedDate = new Date(miembro.joined_at);
    const ahora = new Date();
    const diaSemana = ahora.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    let inicioComp: Date;
    let finComp: Date;
    
    if (diaSemana >= 1 && diaSemana <= 3) {
      // Lunes a Miércoles
      inicioComp = new Date(ahora);
      inicioComp.setDate(ahora.getDate() - (diaSemana - 1));
      inicioComp.setHours(0, 0, 0, 0);
      
      finComp = new Date(inicioComp);
      finComp.setDate(inicioComp.getDate() + 2);
      finComp.setHours(23, 59, 59, 999);
    } else if (diaSemana >= 5 && diaSemana <= 6 || diaSemana === 0) {
      // Viernes a Domingo
      inicioComp = new Date(ahora);
      let diff = diaSemana === 0 ? 2 : (diaSemana - 5);
      inicioComp.setDate(ahora.getDate() - diff);
      inicioComp.setHours(0, 0, 0, 0);
      
      finComp = new Date(inicioComp);
      finComp.setDate(inicioComp.getDate() + 2);
      finComp.setHours(23, 59, 59, 999);
    } else {
      // Jueves (Descanso)
      return true;
    }
    
    // Si se unió antes de que empezara esta competencia, es elegible
    if (joinedDate < inicioComp) {
      return true;
    }
    
    // Si se unió durante la competencia, verificar si fue faltando menos de 24 horas para terminar
    const limite24h = new Date(finComp.getTime() - 24 * 60 * 60 * 1000);
    if (joinedDate >= limite24h) {
      return false;
    }
    
    return true;
  }

  // ==========================================
  // SONIDO
  // ==========================================
  reproducirSonidoHojas() {
    this.sintetizarSonidoHojas();
  }

  sintetizarSonidoHojas() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      const duration = 0.4;
      const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * duration, this.audioCtx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
      const source = this.audioCtx.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.Q.value = 1;
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      source.start(now);
    } catch (e) { }
  }

  // ==========================================
  // MONITOREO DE INACTIVIDAD / SEGUNDO PLANO
  // ==========================================
  iniciarMonitoreoSegundoPlano() {
    this.desactivarMonitoreoSegundoPlano(); // Evitar duplicaciones

    // 1. Visibilidad del Documento (Navegadores y WebViews)
    this.visibilityHandler = () => {
      this.zone.run(() => {
        if (document.hidden) {
          this.manejadorSegundoPlano();
        } else {
          this.manejadorVolverPrimerPlano();
        }
      });
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // 2. Eventos nativos de Ionic Platform (Android / iOS)
    this.resumeSub = this.platform.resume.subscribe(() => {
      this.zone.run(() => {
        this.manejadorVolverPrimerPlano();
      });
    });
    this.pauseSub = this.platform.pause.subscribe(() => {
      this.zone.run(() => {
        this.manejadorSegundoPlano();
      });
    });
  }

  desactivarMonitoreoSegundoPlano() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.resumeSub) {
      this.resumeSub.unsubscribe();
      this.resumeSub = null;
    }
    if (this.pauseSub) {
      this.pauseSub.unsubscribe();
      this.pauseSub = null;
    }
  }

  manejadorSegundoPlano() {
    if (!this.gremio || !this.enGremio || this.diaResto) return;
    
    // Guardar la hora de inactividad de forma segura en LocalStorage
    const key = `gremio_ultima_recoleccion_${this.gremio.id}`;
    localStorage.setItem(key, new Date().toISOString());

    // Detener la generación pasiva local
    if (this.passiveInterval) {
      clearInterval(this.passiveInterval);
      this.passiveInterval = null;
    }

    // Guardar hojas acumuladas de inmediato
    this.forzarSincronizacionInmediata();
  }

  async manejadorVolverPrimerPlano() {
    if (!this.gremio || !this.enGremio || this.diaResto) return;

    const ahora = Date.now();
    // Prevenir ejecución doble inmediata (ej: Platform.resume + visibilitychange al mismo tiempo)
    if (ahora - this.lastForegroundTime < 1500) return;
    this.lastForegroundTime = ahora;

    // Calcular y mostrar ganancias offline acumuladas
    await this.procesarGananciasOfflineGremio();

    // Re-iniciar el loop de generación pasiva local
    if (!this.passiveInterval) {
      this.iniciarGeneracionPasivaGremio();
    }
  }
}
